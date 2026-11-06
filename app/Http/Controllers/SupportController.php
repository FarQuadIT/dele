<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\Dispute;
use App\Models\Equipment;
use App\Models\EquipmentVersion;
use App\Models\Inspection;
use App\Models\Notification;
use App\Models\Order;
use App\Models\ProfileChangeProposal;
use App\Models\ServiceRecommendation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SupportController extends Controller
{
    private function notify(Order $order, string $title, string $body): void
    {
        foreach (array_unique([$order->customerId, ...$order->participants()->pluck('userId')->all()]) as $userId) {
            Notification::create(['userId' => $userId, 'kind' => 'ORDER', 'title' => $title, 'body' => $body, 'href' => $userId === $order->customerId ? '/app/customer/orders/'.$order->id : '/app/contractor/orders/'.$order->id]);
        }
    }

    private function audit(Request $http, string $action, Order $order): void
    {
        AuditEvent::create(['actorId' => $http->user()->id, 'action' => $action, 'entity' => 'Order', 'entityId' => $order->id]);
    }

    public function inspection(Request $http)
    {
        $data = $http->validate(['orderId' => 'required|string']);
        DB::transaction(function () use ($http, $data) {
            $o = Order::where('customerId', $http->user()->id)->lockForUpdate()->findOrFail($data['orderId']);
            abort_unless($o->status === 'AWAITING_ACCEPTANCE', 409);
            abort_if($o->inspections()->whereIn('status', ['REQUESTED', 'IN_PROGRESS'])->exists(), 409, 'Технадзор уже запрошен');
            Inspection::create(['orderId' => $o->id, 'requestedById' => $http->user()->id, 'status' => 'REQUESTED']);
            $o->update(['status' => 'INSPECTION']);
            $this->notify($o, 'Запрошен технадзор', $o->number);
            $this->audit($http, 'inspection.request', $o);
        });

        return response()->json(['ok' => true]);
    }

    public function conclude(Request $http)
    {
        $data = $http->validate(['inspectionId' => 'required|string', 'passed' => 'required|boolean', 'conclusion' => 'required|string|min:5|max:4000']);
        DB::transaction(function () use ($http, $data) {
            $i = Inspection::findOrFail($data['inspectionId']);
            $o = Order::lockForUpdate()->findOrFail($i->orderId);
            $i = Inspection::lockForUpdate()->findOrFail($i->id);
            abort_unless(in_array($i->status, ['REQUESTED', 'IN_PROGRESS']) && $o->status === 'INSPECTION', 409);
            $i->update(['status' => $data['passed'] ? 'PASSED' : 'ISSUES_FOUND', 'conclusion' => $data['conclusion'], 'inspectorName' => 'Независимый инженер DELE']);
            $o->update(['status' => $data['passed'] ? 'AWAITING_ACCEPTANCE' : 'REWORK']);
            $this->notify($o, $data['passed'] ? 'Технадзор пройден' : 'Технадзор выявил замечания', $data['conclusion']);
            $this->audit($http, 'inspection.conclude', $o);
        });

        return response()->json(['ok' => true]);
    }

    public function dispute(Request $http)
    {
        $data = $http->validate(['orderId' => 'required|string', 'subject' => 'required|string|min:5|max:160', 'description' => 'nullable|string|max:2000']);
        DB::transaction(function () use ($http, $data) {
            $o = Order::where('customerId', $http->user()->id)->lockForUpdate()->findOrFail($data['orderId']);
            abort_if(in_array($o->status, ['COMPLETED', 'CANCELLED']), 409);
            abort_if($o->disputes()->whereIn('status', ['OPEN', 'UNDER_REVIEW'])->exists(), 409, 'Спор уже открыт');
            Dispute::create([...$data, 'openedById' => $http->user()->id, 'status' => 'OPEN']);
            $o->update(['status' => 'DISPUTE']);
            $this->notify($o, 'Открыт спор по заказу', $data['subject']);
            $this->audit($http, 'dispute.open', $o);
        });

        return response()->json(['ok' => true]);
    }

    public function resolve(Request $http)
    {
        $data = $http->validate(['disputeId' => 'required|string', 'outcome' => ['required', Rule::in(['RESOLVED_CUSTOMER', 'RESOLVED_CONTRACTOR', 'RESOLVED_COMPROMISE'])], 'resolution' => 'required|string|min:5|max:2000']);
        DB::transaction(function () use ($http, $data) {
            $d = Dispute::findOrFail($data['disputeId']);
            $o = Order::lockForUpdate()->findOrFail($d->orderId);
            $d = Dispute::lockForUpdate()->findOrFail($d->id);
            abort_unless(in_array($d->status, ['OPEN', 'UNDER_REVIEW']), 409);
            $d->update(['status' => $data['outcome'], 'resolution' => $data['resolution'], 'resolvedAt' => now()]);
            $o->update(['status' => 'AWAITING_ACCEPTANCE']);
            $this->notify($o, 'Спор решён', $data['resolution']);
            $this->audit($http, 'dispute.resolve', $o);
        });

        return response()->json(['ok' => true]);
    }

    public function propose(Request $http)
    {
        $data = $http->validate(['orderId' => 'required|string', 'equipmentId' => 'required|string', 'comment' => 'nullable|string|max:1000', 'changes' => 'required|array:name,brand,model,serialNumber,notes,serviceIntervalDays', 'changes.name' => 'sometimes|required|string|max:200', 'changes.brand' => 'nullable|string|max:120', 'changes.model' => 'nullable|string|max:120', 'changes.serialNumber' => 'nullable|string|max:120', 'changes.notes' => 'nullable|string|max:2000', 'changes.serviceIntervalDays' => 'nullable|integer|min:1']);
        $proposal = DB::transaction(function () use ($http, $data) {
            $o = ContractorController::ownOrder($http, $data['orderId']);
            abort_unless(in_array($o->status, ['IN_PROGRESS', 'AWAITING_ACCEPTANCE', 'COMPLETED', 'REWORK']), 409);
            $eq = Equipment::where('facilityId', $o->facilityId)->findOrFail($data['equipmentId']);
            $proposal = ProfileChangeProposal::create(['orderId' => $o->id, 'facilityId' => $o->facilityId, 'equipmentId' => $eq->id, 'authorId' => $http->user()->id, 'authorOrgId' => $o->organizationId, 'changes' => $data['changes'], 'comment' => $data['comment'] ?? null, 'status' => 'PENDING']);
            Notification::create(['userId' => $o->facility->ownerId, 'kind' => 'ORDER', 'title' => 'Предложены изменения профиля', 'body' => $eq->name, 'href' => '/app/customer/objects/'.$o->facilityId.'?tab=proposals']);
            $this->audit($http, 'profile.propose', $o);

            return $proposal;
        });

        return response()->json(['ok' => true, 'data' => ['proposalId' => $proposal->id]]);
    }

    public function decide(Request $http)
    {
        $data = $http->validate(['proposalId' => 'required|string', 'decision' => ['required', Rule::in(['APPROVED', 'REJECTED', 'CLARIFICATION'])], 'decisionComment' => 'nullable|string|max:1000']);
        DB::transaction(function () use ($http, $data) {
            $p = ProfileChangeProposal::whereHas('facility', fn ($q) => $q->where('ownerId', $http->user()->id))->where('status', 'PENDING')->lockForUpdate()->findOrFail($data['proposalId']);
            if ($data['decision'] === 'APPROVED' && $p->equipmentId) {
                $eq = Equipment::where('facilityId', $p->facilityId)->lockForUpdate()->findOrFail($p->equipmentId);
                $fields = ['name', 'brand', 'model', 'serialNumber', 'notes', 'serviceIntervalDays'];
                $before = $eq->only($fields);
                $eq->update(array_intersect_key($p->changes, array_flip($fields)));
                EquipmentVersion::create(['equipmentId' => $eq->id, 'version' => (EquipmentVersion::where('equipmentId', $eq->id)->max('version') ?? 0) + 1, 'data' => ['before' => $before, 'after' => $eq->only($fields)], 'authorId' => $p->authorId, 'orderId' => $p->orderId, 'comment' => $p->comment]);
            }
            $p->update(['status' => $data['decision'], 'decisionComment' => $data['decisionComment'] ?? null, 'decidedById' => $http->user()->id, 'decidedAt' => now()]);
            Notification::create(['userId' => $p->authorId, 'kind' => 'ORDER', 'title' => 'Решение по изменениям профиля: '.$data['decision'], 'body' => $data['decisionComment'] ?? null, 'href' => $p->orderId ? '/app/contractor/orders/'.$p->orderId : '/app/contractor/orders']);
            AuditEvent::create(['actorId' => $http->user()->id, 'action' => 'profile.'.strtolower($data['decision']), 'entity' => 'ProfileChangeProposal', 'entityId' => $p->id]);
        });

        return response()->json(['ok' => true]);
    }

    public function recommendation(Request $http, string $operation)
    {
        $data = $http->validate(['recommendationId' => 'required|string']);
        $r = ServiceRecommendation::whereHas('facility', fn ($q) => $q->where('ownerId', $http->user()->id))->findOrFail($data['recommendationId']);
        $r->update($operation === 'dismiss' ? ['status' => 'DISMISSED'] : ['status' => 'POSTPONED', 'dueAt' => now()->addDays(30)]);

        return response()->json(['ok' => true]);
    }
}
