<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\Dispute;
use App\Models\EngineeringSystem;
use App\Models\Equipment;
use App\Models\Inspection;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Request as ServiceRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminReadController extends Controller
{
    public function users(Request $http)
    {
        $role = $http->query('role');
        if (! in_array($role, config('dele.enums.UserRole'))) {
            $role = null;
        }
        $users = User::when($role, fn ($q) => $q->where('role', $role))->withCount(['facilitiesOwned', 'requests'])->with('memberships.organization:id,name')->latest('createdAt')->get()->map(function ($u) {
            $d = $u->toArray();
            $d['_count'] = ['facilitiesOwned' => $u->facilitiesOwned_count, 'requests' => $u->requests_count];

            return $d;
        });

        return Inertia::render('admin/users', ['users' => $users, 'role' => $role, 'total' => User::count()]);
    }

    public function requests(Request $http)
    {
        $f = $http->query('f');
        $filters = ['open' => ['PUBLISHED', 'HAS_OFFERS'], 'converted' => ['CONVERTED'], 'draft' => ['DRAFT'], 'closed' => ['CANCELLED', 'EXPIRED']];
        $requests = ServiceRequest::when(isset($filters[$f]), fn ($q) => $q->whereIn('status', $filters[$f]))->with(['customer:id,name', 'facility:id,title'])->withCount('offers')->latest('createdAt')->get()->map(function ($r) {
            $d = $r->toArray();
            $d['_count'] = ['offers' => $r->offers_count];

            return $d;
        });

        return Inertia::render('admin/requests', ['requests' => $requests, 'f' => $f]);
    }

    public function orders(Request $http)
    {
        $f = $http->query('f');
        $filters = ['active' => ['AWAITING_CONTRACT', 'AWAITING_PREPAYMENT', 'PLANNING', 'IN_PROGRESS', 'PAUSED', 'AWAITING_ACCEPTANCE', 'REWORK', 'AWAITING_FINAL_PAYMENT'], 'attention' => ['DISPUTE', 'INSPECTION', 'REWORK'], 'done' => ['COMPLETED', 'CANCELLED']];

        return Inertia::render('admin/orders', ['f' => $f, 'orders' => Order::when(isset($filters[$f]), fn ($q) => $q->whereIn('status', $filters[$f]))->with(['request.customer:id,name', 'organization:id,name', 'stages'])->latest('createdAt')->get()]);
    }

    public function payments()
    {
        return Inertia::render('admin/payments', ['payments' => Payment::with(['order.request.customer:id,name', 'order.organization:id,name'])->latest('createdAt')->get()]);
    }

    public function audit()
    {
        return Inertia::render('admin/audit', ['events' => AuditEvent::with('actor:id,name,email')->latest('createdAt')->limit(100)->get()]);
    }

    public function control()
    {
        return Inertia::render('admin/control', ['inspections' => Inspection::with(['order.request:id,title', 'order.organization:id,name', 'requestedBy:id,name'])->latest('createdAt')->get(), 'disputes' => Dispute::with(['order.request:id,title', 'order.organization:id,name', 'openedBy:id,name'])->latest('createdAt')->get()]);
    }

    private function counts(string $model)
    {
        return $model::query()->select('type')->selectRaw('COUNT(*) as total')->groupBy('type')->get()->map(fn ($r) => ['type' => $r->type, '_count' => ['_all' => (int) $r->total]]);
    }

    public function dictionaries()
    {
        return Inertia::render('admin/dictionaries', ['systemsCount' => $this->counts(EngineeringSystem::class), 'requestsByType' => $this->counts(ServiceRequest::class), 'equipmentCount' => Equipment::count()]);
    }

    public function services()
    {
        return Inertia::render('admin/services', ['byType' => $this->counts(ServiceRequest::class), 'inspectionsOpen' => Inspection::whereIn('status', ['REQUESTED', 'IN_PROGRESS'])->count(), 'disputesOpen' => Dispute::whereIn('status', ['OPEN', 'UNDER_REVIEW'])->count()]);
    }

    public function settings()
    {
        return Inertia::render('admin/settings');
    }
}
