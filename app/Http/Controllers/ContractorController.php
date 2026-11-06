<?php

namespace App\Http\Controllers;

use App\Models\ChatThread;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Offer;
use App\Models\Order;
use App\Models\OrderStage;
use App\Models\OrganizationMember;
use App\Models\Request as ServiceRequest;
use App\Models\StageEvidence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ContractorController extends Controller
{
    public static function organization(Request $http)
    {
        return OrganizationMember::where('userId', $http->user()->id)->with('organization')->oldest('createdAt')->first()?->organization;
    }

    private function anonymize($r): array
    {
        $d = $r->only(['id', 'type', 'status', 'title', 'description', 'urgency', 'budgetMin', 'budgetMax', 'desiredDateFrom', 'desiredDateTo', 'visitTimeNote', 'publishedAt', 'needsEstimate', 'needsContract', 'needsWarranty']);
        $d['facility'] = $r->facility->only(['type', 'region', 'area', 'buildYear']);
        $d['system'] = $r->system?->only(['type', 'name']);
        $d['equipment'] = $r->equipment?->only(['name', 'brand', 'model']);
        $d['_count'] = ['offers' => $r->offers_count];

        return $d;
    }

    public function requests(Request $http)
    {
        $org = self::organization($http);
        $params = $http->only(['type', 'urgency', 'sort']);
        $query = ServiceRequest::whereIn('status', ['PUBLISHED', 'HAS_OFFERS']);
        foreach (['type' => 'RequestType', 'urgency' => 'UrgencyLevel'] as $field => $enum) {
            if (in_array($params[$field] ?? null, config('dele.enums.'.$enum))) {
                $query->where($field, $params[$field]);
            }
        }
        $sort = ($params['sort'] ?? null) === 'budget' ? 'budget' : 'fresh';
        if ($sort === 'budget') {
            $query->orderByRaw('"budgetMax" IS NULL')->orderByDesc('budgetMax');
        } else {
            $query->orderByDesc('publishedAt');
        }
        $requests = $query->with(['facility', 'system', 'equipment'])->withCount('offers')->get()->map(function ($r) use ($org) {
            $d = $this->anonymize($r);
            $d['offers'] = $org ? $r->offers()->where('organizationId', $org->id)->get(['id']) : [];

            return $d;
        });

        return Inertia::render('contractor/requests', ['requests' => $requests, 'params' => $params, 'sort' => $sort]);
    }

    public function request(Request $http, string $id)
    {
        $org = self::organization($http);
        $r = ServiceRequest::whereIn('status', ['PUBLISHED', 'HAS_OFFERS'])->with(['facility', 'system', 'equipment'])->withCount('offers')->findOrFail($id);
        $myOffer = $org ? Offer::where('organizationId', $org->id)->where('requestId', $r->id)->first() : null;

        return Inertia::render('contractor/request-detail', ['request' => $this->anonymize($r), 'org' => $org, 'myOffer' => $myOffer]);
    }

    public function offers(Request $http)
    {
        $org = self::organization($http);
        $offers = $org ? Offer::where('organizationId', $org->id)->with(['request' => fn ($q) => $q->select(['id', 'title', 'status', 'type'])->with('order:id,requestId'), 'threads.messages.author:id,name'])->latest('updatedAt')->get() : [];

        return Inertia::render('contractor/offers', ['user' => $http->user()->only(['id']), 'offers' => $offers]);
    }

    public function submitOffer(Request $http)
    {
        $org = self::organization($http);
        abort_unless($org && $org->verificationStatus === 'VERIFIED', 403, 'Откликаться могут только проверенные компании');
        $data = $http->validate(['requestId' => 'required|string', 'priceTotal' => 'required|integer|min:100|max:1000000000', 'priceMaterials' => 'nullable|integer|min:0|max:1000000000', 'isEstimate' => 'required|boolean', 'durationDays' => 'nullable|integer|min:1|max:365', 'warrantyMonths' => 'nullable|integer|min:0|max:120', 'comment' => 'nullable|string|max:2000', 'stagesPlan' => 'nullable|string|max:2000']);
        // PostgreSQL Int and the original schema store minor units in signed int32.
        abort_if((int) $data['priceTotal'] > 21474836 || (int) ($data['priceMaterials'] ?? 0) > 21474836, 422, 'Сумма превышает допустимый предел');
        $offer = DB::transaction(function () use ($http, $org, $data) {
            $r = ServiceRequest::lockForUpdate()->findOrFail($data['requestId']);
            abort_unless(in_array($r->status, ['PUBLISHED', 'HAS_OFFERS']), 409, 'Заявка недоступна для откликов');
            abort_if($r->offers()->where('organizationId', $org->id)->exists(), 409, 'Вы уже откликнулись');
            $data['priceTotal'] = (int) $data['priceTotal'] * 100;
            $data['priceMaterials'] = isset($data['priceMaterials']) ? (int) $data['priceMaterials'] * 100 : null;
            $data['stagesPlan'] = ! empty($data['stagesPlan']) ? array_values(array_filter(array_map('trim', explode("\n", $data['stagesPlan'])))) : null;
            $offer = Offer::create([...$data, 'organizationId' => $org->id, 'authorId' => $http->user()->id, 'status' => 'SENT', 'validUntil' => now()->addDays(7)]);
            $r->update(['status' => 'HAS_OFFERS']);
            Notification::create(['userId' => $r->customerId, 'kind' => 'OFFER', 'title' => 'Новый отклик на заявку', 'body' => $org->name, 'href' => '/app/customer/requests/'.$r->id]);

            return $offer;
        });

        return response()->json(['ok' => true, 'data' => ['id' => $offer->id]]);
    }

    public function withdraw(Request $http)
    {
        $data = $http->validate(['offerId' => 'required|string']);
        $org = self::organization($http);
        abort_unless($org, 403);
        DB::transaction(function () use ($org, $data) {
            $offer = Offer::where('organizationId', $org->id)->lockForUpdate()->findOrFail($data['offerId']);
            abort_unless($offer->status === 'SENT', 409);
            $offer->update(['status' => 'WITHDRAWN']);
        });

        return response()->json(['ok' => true]);
    }

    public static function ownOrder(Request $http, string $id)
    {
        $org = self::organization($http);
        abort_unless($org, 403);

        return Order::where('organizationId', $org->id)->lockForUpdate()->findOrFail($id);
    }

    public function stage(Request $http, string $operation)
    {
        $data = $http->validate(['orderId' => 'required|string', 'stageId' => 'required|string', 'note' => 'nullable|string|max:4000']);
        DB::transaction(function () use ($http, $data, $operation) {
            $o = self::ownOrder($http, $data['orderId']);
            abort_unless(in_array($o->status, ['PLANNING', 'IN_PROGRESS', 'REWORK', 'PAUSED']), 409);
            $stage = OrderStage::where('orderId', $o->id)->lockForUpdate()->findOrFail($data['stageId']);
            if ($operation === 'start') {
                abort_unless($stage->status === 'PENDING', 409);
                $stage->update(['status' => 'IN_PROGRESS', 'startedAt' => now()]);
                $o->update(['status' => 'IN_PROGRESS', 'startedAt' => $o->startedAt ?? now()]);
            } else {
                abort_unless($stage->status === 'IN_PROGRESS', 409);
                $stage->update(['status' => 'DONE', 'completedAt' => now()]);
                if (! empty($data['note'])) {
                    StageEvidence::create(['stageId' => $stage->id, 'type' => 'NOTE', 'note' => trim($data['note']), 'createdById' => $http->user()->id]);
                }Notification::create(['userId' => $o->customerId, 'kind' => 'ORDER', 'title' => 'Этап завершён: '.$stage->name, 'body' => $o->number, 'href' => '/app/customer/orders/'.$o->id]);
            }
        });

        return response()->json(['ok' => true]);
    }

    public function submitAcceptance(Request $http)
    {
        $data = $http->validate(['orderId' => 'required|string']);
        DB::transaction(function () use ($http, $data) {
            $o = self::ownOrder($http, $data['orderId']);
            abort_unless(in_array($o->status, ['IN_PROGRESS', 'REWORK']), 409);
            abort_if($o->stages()->where('status', '!=', 'DONE')->exists(), 409, 'Сначала завершите все этапы');
            $o->update(['status' => 'AWAITING_ACCEPTANCE']);
            Notification::create(['userId' => $o->customerId, 'kind' => 'ORDER', 'title' => 'Работы готовы к приёмке', 'body' => $o->number, 'href' => '/app/customer/orders/'.$o->id]);
        });

        return response()->json(['ok' => true]);
    }

    public function offerMessage(Request $http)
    {
        $data = $http->validate(['offerId' => 'required|string', 'body' => 'required|string|min:1|max:4000']);
        $org = self::organization($http);
        abort_unless($org, 403);
        DB::transaction(function () use ($http, $data, $org) {
            $offer = Offer::where('organizationId', $org->id)->lockForUpdate()->findOrFail($data['offerId']);
            $thread = ChatThread::firstOrCreate(['offerId' => $offer->id, 'kind' => 'OFFER'], ['requestId' => $offer->requestId]);
            Message::create(['threadId' => $thread->id, 'authorId' => $http->user()->id, 'body' => trim($data['body'])]);
            Notification::create(['userId' => $offer->request->customerId, 'kind' => 'CHAT', 'title' => 'Новое сообщение по заявке', 'body' => $offer->request->title, 'href' => '/app/customer/requests/'.$offer->requestId]);
        });

        return response()->json(['ok' => true]);
    }

    public function orderMessage(Request $http)
    {
        $data = $http->validate(['orderId' => 'required|string', 'body' => 'required|string|min:1|max:4000']);
        DB::transaction(function () use ($http, $data) {
            $o = self::ownOrder($http, $data['orderId']);
            $thread = ChatThread::firstOrCreate(['orderId' => $o->id, 'kind' => 'ORDER']);
            Message::create(['threadId' => $thread->id, 'authorId' => $http->user()->id, 'body' => trim($data['body'])]);
            Notification::create(['userId' => $o->customerId, 'kind' => 'CHAT', 'title' => 'Сообщение по заказу '.$o->number, 'body' => mb_substr($data['body'],0,120), 'href' => '/app/customer/orders/'.$o->id]);
        });

        return response()->json(['ok' => true]);
    }
}
