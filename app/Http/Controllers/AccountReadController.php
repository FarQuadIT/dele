<?php

namespace App\Http\Controllers;

use App\Models\ChatThread;
use App\Models\Equipment;
use App\Models\Facility;
use App\Models\Order;
use App\Models\OrganizationMember;
use App\Models\Payment;
use App\Models\Review;
use App\Models\ServiceRecommendation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AccountReadController extends Controller
{
    public function messages(Request $http)
    {
        $id = $http->user()->id;
        $threads = ChatThread::where(fn ($q) => $q->whereHas('request', fn ($q) => $q->where('customerId', $id))->orWhereHas('order', fn ($q) => $q->where('customerId', $id))->orWhereHas('offer.request', fn ($q) => $q->where('customerId', $id)))
            ->with(['request:id,title', 'order.request:id,title', 'order.organization:id,name', 'offer.request:id,title', 'offer.organization:id,name', 'messages' => fn ($q) => $q->latest('createdAt')->limit(1)->with('author:id,name')])->get();

        return Inertia::render('customer/messages', ['threads' => $threads, 'user' => $http->user()->only(['id'])]);
    }

    public function payments(Request $http)
    {
        return Inertia::render('customer/payments', ['payments' => Payment::whereHas('order', fn ($q) => $q->where('customerId', $http->user()->id))->with(['order.request:id,title', 'order.organization:id,name'])->latest('createdAt')->get()]);
    }

    public function finance(Request $http)
    {
        $org = ContractorController::organization($http);

        return Inertia::render('contractor/finance', ['payments' => $org ? Payment::whereHas('order', fn ($q) => $q->where('organizationId', $org->id))->with('order.request:id,title')->latest('createdAt')->get() : []]);
    }

    public function calendar(Request $http)
    {
        $org = ContractorController::organization($http);

        return Inertia::render('contractor/calendar', ['orders' => $org ? Order::where('organizationId', $org->id)->whereNotNull('scheduledStartAt')->with('request:id,title')->orderBy('scheduledStartAt')->get() : []]);
    }

    public function team(Request $http)
    {
        $org = ContractorController::organization($http);

        return Inertia::render('contractor/team', ['members' => $org ? OrganizationMember::where('organizationId', $org->id)->with('user:id,name,email')->oldest('createdAt')->get() : []]);
    }

    public function reviews(Request $http)
    {
        $org = ContractorController::organization($http);

        return Inertia::render('contractor/reviews', ['org' => $org, 'reviews' => $org ? Review::where('targetOrgId', $org->id)->where('direction', 'CUSTOMER_TO_CONTRACTOR')->with(['author:id,name', 'order.request:id,title'])->latest('createdAt')->get() : []]);
    }

    public function facility(Request $http, string $id)
    {
        // Authorization precedes any automatic recommendation writes.
        $f = Facility::where('ownerId', $http->user()->id)->findOrFail($id);
        DB::transaction(function () use ($f) {
            $f = Facility::lockForUpdate()->findOrFail($f->id);
            foreach (Equipment::where('facilityId', $f->id)->whereNotNull('serviceIntervalDays')->get() as $eq) {
                if ($eq->recommendations()->where('status', 'ACTIVE')->whereNull('createdByUserId')->whereNull('createdByOrgId')->exists()) {
                    continue;
                }
                $due = ($eq->lastServiceAt ?? $eq->installedAt ?? $eq->createdAt)->copy()->addDays($eq->serviceIntervalDays);
                if ($due->gt(now()->addDays(30))) {
                    continue;
                }
                ServiceRecommendation::create(['facilityId' => $f->id, 'equipmentId' => $eq->id, 'systemId' => $eq->systemId, 'title' => 'Плановое обслуживание: '.$eq->name, 'reason' => 'Автоматически по регламенту — раз в '.$eq->serviceIntervalDays.' дн.', 'severity' => $due->lt(now()) ? 'IMPORTANT' : 'ADVISORY', 'status' => 'ACTIVE', 'dueAt' => $due, 'lastServiceAt' => $eq->lastServiceAt]);
            }
        });
        $f->load([
            'buildings' => fn ($q) => $q->oldest('createdAt')->with(['floors' => fn ($q) => $q->orderBy('number')->with('zones')]),
            'systems' => fn ($q) => $q->oldest('createdAt')->with('subsystems'),
            'equipment' => fn ($q) => $q->oldest('createdAt')->with(['system', 'subsystem', 'zone.floor.building', 'versions' => fn ($q) => $q->orderByDesc('version')->with('author:id,name'), 'documents.versions' => fn ($q) => $q->orderByDesc('version'), 'recommendations' => fn ($q) => $q->where('status', 'ACTIVE')]),
            'documents' => fn ($q) => $q->latest('updatedAt')->with(['versions' => fn ($q) => $q->orderByDesc('version'), 'equipment:id,name']),
            'recommendations' => fn ($q) => $q->orderByDesc('severity')->orderBy('dueAt')->with(['equipment:id,name', 'system']),
            'proposals' => fn ($q) => $q->latest('createdAt')->with(['equipment:id,name', 'author:id,name', 'authorOrg:id,name']),
            'orders' => fn ($q) => $q->latest('updatedAt')->limit(5)->with(['request:id,title', 'organization:id,name']),
        ]);

        return Inertia::render('customer/facility', ['facility' => $f, 'tab' => $http->query('tab'), 'eq' => $http->query('eq')]);
    }
}
