<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\Facility;
use App\Models\Order;
use App\Models\Request as ServiceRequest;
use App\Models\ServiceRecommendation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function overview(Request $request)
    {
        $id = $request->user()->id;

        return Inertia::render('customer/overview', [
            'user' => $request->user()->only(['id', 'name']),
            'facilities' => Facility::where('ownerId', $id)->count(),
            'activeRequests' => ServiceRequest::where('customerId', $id)->whereIn('status', ['MODERATION', 'PUBLISHED', 'HAS_OFFERS', 'CONTRACTOR_SELECTED'])->count(),
            'activeOrders' => Order::where('customerId', $id)->whereNotIn('status', ['COMPLETED', 'CANCELLED'])->count(),
            'recommendations' => ServiceRecommendation::whereHas('facility', fn ($q) => $q->where('ownerId', $id))->where('status', 'ACTIVE')->with(['facility', 'equipment'])->orderByDesc('severity')->orderBy('dueAt')->limit(4)->get(),
            'orders' => Order::where('customerId', $id)->with(['facility', 'request', 'organization'])->orderByDesc('updatedAt')->limit(4)->get(),
            'recentRequests' => ServiceRequest::where('customerId', $id)->with('facility')->orderByDesc('updatedAt')->limit(4)->get(),
        ]);
    }

    public function objects(Request $request)
    {
        $facilities = Facility::where('ownerId', $request->user()->id)->with('systems')->withCount(['requests', 'orders'])->orderByDesc('createdAt')->get();

        return Inertia::render('customer/objects', ['facilities' => $facilities->map(function ($f) {
            $data = $f->toArray();
            $data['_count'] = ['requests' => $f->requests_count, 'orders' => $f->orders_count];

            return $data;
        })]);
    }

    public function createFacility(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|min:2|max:120', 'type' => ['required', Rule::in(config('dele.enums.FacilityType'))],
            'address' => 'required|string|min:5|max:300', 'region' => 'nullable|string|max:120',
            'area' => 'nullable|numeric|gt:0|max:1000000', 'floorsCount' => 'nullable|integer|min:1|max:200',
            'buildYear' => 'nullable|integer|min:1800|max:'.(date('Y') + 1), 'description' => 'nullable|string|max:2000',
        ]);
        $facility = DB::transaction(function () use ($request, $data) {
            $facility = Facility::create([...$data, 'ownerId' => $request->user()->id]);
            AuditEvent::create(['actorId' => $request->user()->id, 'action' => 'facility.create', 'entity' => 'Facility', 'entityId' => $facility->id, 'meta' => ['title' => $facility->title]]);

            return $facility;
        });

        return response()->json(['ok' => true, 'data' => ['id' => $facility->id]]);
    }

    public function deleteFacility(Request $request)
    {
        $data = $request->validate(['id' => 'required|string']);
        DB::transaction(function () use ($request, $data) {
            $facility = Facility::where('ownerId', $request->user()->id)->lockForUpdate()->findOrFail($data['id']);
            abort_if($facility->orders()->exists(), 409, 'Нельзя удалить объект, по которому есть заказы');
            $facility->delete();
            AuditEvent::create(['actorId' => $request->user()->id, 'action' => 'facility.delete', 'entity' => 'Facility', 'entityId' => $facility->id, 'meta' => ['title' => $facility->title]]);
        });

        return response()->json(['ok' => true]);
    }
}
