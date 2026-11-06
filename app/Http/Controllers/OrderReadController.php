<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderReadController extends Controller
{
    private function query(Request $http)
    {
        if ($http->user()->role === 'CUSTOMER') {
            return Order::where('customerId', $http->user()->id);
        }
        $org = ContractorController::organization($http);

        return Order::where('organizationId', $org?->id ?? '__no_org__');
    }

    public function index(Request $http)
    {
        $role = $http->user()->role === 'CUSTOMER' ? 'customer' : 'contractor';

        return Inertia::render($role.'/orders', ['orders' => $this->query($http)->with(['request.customer', 'organization', 'facility', 'stages' => fn ($q) => $q->orderBy('index')])->latest('updatedAt')->get()]);
    }

    public function show(Request $http, string $id)
    {
        $role = $http->user()->role === 'CUSTOMER' ? 'customer' : 'contractor';
        $order = $this->query($http)->with(['request.customer', 'organization', 'facility.equipment', 'stages' => fn ($q) => $q->orderBy('index')->with(['evidence' => fn ($q) => $q->oldest('createdAt')->with('createdBy')]), 'payments' => fn ($q) => $q->oldest('createdAt'), 'contract', 'reviews', 'threads' => fn ($q) => $q->where('kind', 'ORDER')->with(['messages' => fn ($q) => $q->oldest('createdAt')->with('author')])])->findOrFail($id);

        return Inertia::render($role.'/order-detail', ['order' => $order, 'user' => $http->user()->only(['id', 'name'])]);
    }
}
