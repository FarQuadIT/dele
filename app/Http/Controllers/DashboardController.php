<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\Payment;
use App\Models\Request as ServiceRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function contractor(Request $request)
    {
        $member = OrganizationMember::where('userId', $request->user()->id)->with('organization')->orderBy('createdAt')->first();
        $org = $member?->organization;

        return Inertia::render('contractor/overview', [
            'org' => $org,
            'openRequests' => $org ? ServiceRequest::whereIn('status', ['PUBLISHED', 'HAS_OFFERS'])->whereDoesntHave('offers', fn ($q) => $q->where('organizationId', $org->id))->count() : 0,
            'myOffers' => $org ? Offer::where('organizationId', $org->id)->where('status', 'SENT')->count() : 0,
            'activeOrders' => $org ? Order::where('organizationId', $org->id)->whereNotIn('status', ['COMPLETED', 'CANCELLED'])->count() : 0,
            'lastOrders' => $org ? Order::where('organizationId', $org->id)->with('request')->orderByDesc('updatedAt')->limit(4)->get() : [],
        ]);
    }

    public function admin()
    {
        return Inertia::render('admin/overview', [
            'usersCount' => User::count(), 'customersCount' => User::where('role', 'CUSTOMER')->count(), 'contractorsCount' => User::where('role', 'CONTRACTOR')->count(),
            'orgsCount' => Organization::count(), 'orgsPending' => Organization::where('verificationStatus', 'PENDING')->count(),
            'requestsCount' => ServiceRequest::count(), 'requestsOpen' => ServiceRequest::whereIn('status', ['PUBLISHED', 'HAS_OFFERS'])->count(),
            'offersCount' => Offer::count(), 'ordersCount' => Order::count(), 'ordersActive' => Order::whereNotIn('status', ['COMPLETED', 'CANCELLED'])->count(),
            'paymentsSucceeded' => ['_sum' => ['amount' => (int) Payment::where('status', 'SUCCEEDED')->sum('amount')]],
            'recentRequests' => ServiceRequest::with('customer')->latest('createdAt')->limit(5)->get(),
            'recentOrders' => Order::with(['request', 'organization'])->latest('createdAt')->limit(5)->get(),
            'recentAudit' => AuditEvent::with('actor')->latest('createdAt')->limit(6)->get(),
        ]);
    }
}
