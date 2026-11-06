<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\ChatThread;
use App\Models\EngineeringSystem;
use App\Models\Equipment;
use App\Models\Facility;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Offer;
use App\Models\OfferVersion;
use App\Models\Request as ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class RequestController extends Controller
{
    private const GROUPS = [['MODERATION', 'PUBLISHED', 'HAS_OFFERS', 'CONTRACTOR_SELECTED'], ['DRAFT'], ['CONVERTED', 'EXPIRED', 'CANCELLED']];

    public function index(Request $http)
    {
        $view = $http->query('view', 'active');
        $index = array_search($view, ['active', 'drafts', 'archive']);
        if ($index === false) {
            $view = 'active';
            $index = 0;
        }
        $query = ServiceRequest::where('customerId', $http->user()->id);
        $requests = (clone $query)->whereIn('status', self::GROUPS[$index])->with('facility')->withCount('offers')->latest('updatedAt')->get()->map(function ($r) {
            $d = $r->toArray();
            $d['_count'] = ['offers' => $r->offers_count];

            return $d;
        });

        return Inertia::render('customer/requests', ['requests' => $requests, 'view' => $view, 'counts' => array_map(fn ($statuses) => (clone $query)->whereIn('status', $statuses)->count(), self::GROUPS)]);
    }

    public function create(Request $http)
    {
        return Inertia::render('customer/request-new', ['user' => $http->user()->only(['id', 'name']), 'params' => $http->only(['facility', 'equipment', 'type']),
            'facilities' => Facility::where('ownerId', $http->user()->id)->with(['systems' => fn ($q) => $q->oldest('createdAt'), 'equipment' => fn ($q) => $q->oldest('createdAt')])->oldest('createdAt')->get()]);
    }

    public function show(Request $http, string $id)
    {
        $request = ServiceRequest::where('customerId', $http->user()->id)->with(['facility', 'system', 'equipment', 'order', 'offers' => fn ($q) => $q->oldest('createdAt')->with(['organization', 'threads.messages.author'])])->findOrFail($id);

        return Inertia::render('customer/request-detail', ['request' => $request, 'user' => $http->user()->only(['id', 'name'])]);
    }

    public function store(Request $http)
    {
        $data = $http->validate([
            'mode' => ['required', Rule::in(['draft', 'publish'])], 'facilityId' => 'required|string', 'systemId' => 'nullable|string', 'equipmentId' => 'nullable|string',
            'type' => ['required', Rule::in(config('dele.enums.RequestType'))], 'urgency' => ['required', Rule::in(config('dele.enums.UrgencyLevel'))],
            'title' => 'required|string|min:5|max:140', 'description' => 'nullable|string|max:4000',
            'desiredDateFrom' => 'nullable|date', 'desiredDateTo' => 'nullable|date|after_or_equal:desiredDateFrom', 'visitTimeNote' => 'nullable|string|max:200',
            'budgetMin' => 'nullable|integer|min:0|max:1000000000', 'budgetMax' => 'nullable|integer|min:0|max:1000000000',
            'needsEstimate' => 'required|boolean', 'needsContract' => 'required|boolean', 'needsWarranty' => 'required|boolean',
            'contactName' => 'nullable|string|max:120', 'contactPhone' => 'nullable|string|max:30',
        ]);
        $facility = Facility::where('ownerId', $http->user()->id)->findOrFail($data['facilityId']);
        if (! empty($data['systemId'])) {
            EngineeringSystem::where('facilityId', $facility->id)->findOrFail($data['systemId']);
        }
        if (! empty($data['equipmentId'])) {
            Equipment::where('facilityId', $facility->id)->findOrFail($data['equipmentId']);
        }
        if (isset($data['budgetMin'],$data['budgetMax']) && $data['budgetMin'] > $data['budgetMax']) {
            throw ValidationException::withMessages(['budgetMax' => 'Максимум бюджета меньше минимума']);
        }
        $mode = $data['mode'];
        unset($data['mode']);
        $data['urgency'] = $data['type'] === 'EMERGENCY' ? 'EMERGENCY' : $data['urgency'];
        $request = DB::transaction(function () use ($http, $data, $mode) {
            $request = ServiceRequest::create([...$data, 'customerId' => $http->user()->id, 'status' => $mode === 'publish' ? 'PUBLISHED' : 'DRAFT', 'publishedAt' => $mode === 'publish' ? now() : null, 'expiresAt' => $mode === 'publish' ? now()->addDays(14) : null]);
            AuditEvent::create(['actorId' => $http->user()->id, 'action' => $mode === 'publish' ? 'request.publish' : 'request.draft', 'entity' => 'Request', 'entityId' => $request->id, 'meta' => ['title' => $request->title, 'type' => $request->type]]);

            return $request;
        });

        return response()->json(['ok' => true, 'data' => ['id' => $request->id]]);
    }

    public function publish(Request $http)
    {
        $data = $http->validate(['id' => 'required|string']);
        DB::transaction(function () use ($http, $data) {
            $r = ServiceRequest::where('customerId', $http->user()->id)->lockForUpdate()->findOrFail($data['id']);
            abort_unless($r->status === 'DRAFT', 409, 'Опубликовать можно только черновик');
            $r->update(['status' => 'PUBLISHED', 'publishedAt' => now(), 'expiresAt' => now()->addDays(14)]);
        });

        return response()->json(['ok' => true]);
    }

    public function cancel(Request $http)
    {
        $data = $http->validate(['id' => 'required|string']);
        DB::transaction(function () use ($http, $data) {
            $r = ServiceRequest::where('customerId', $http->user()->id)->lockForUpdate()->findOrFail($data['id']);
            abort_if($r->status === 'CONVERTED', 409, 'Заявка уже переведена в заказ');
            $r->update(['status' => 'CANCELLED', 'cancelledAt' => now()]);
        });

        return response()->json(['ok' => true]);
    }

    public function accept(Request $http)
    {
        $data = $http->validate(['offerId' => 'required|string']);
        DB::transaction(function () use ($http, $data) {
            $offer = Offer::whereHas('request', fn ($q) => $q->where('customerId', $http->user()->id))->findOrFail($data['offerId']);
            $r = ServiceRequest::lockForUpdate()->findOrFail($offer->requestId);
            $offer->refresh();
            abort_unless(in_array($r->status, ['PUBLISHED', 'HAS_OFFERS']) && ! $r->acceptedOfferId && $offer->status === 'SENT', 409, 'Исполнитель уже выбран или отклик недоступен');
            OfferVersion::create(['offerId' => $offer->id, 'version' => $offer->currentVersion, 'data' => $offer->toArray()]);
            $offer->update(['status' => 'ACCEPTED']);
            Offer::where('requestId', $r->id)->whereKeyNot($offer->id)->where('status', 'SENT')->update(['status' => 'DECLINED']);
            $r->update(['acceptedOfferId' => $offer->id, 'status' => 'CONTRACTOR_SELECTED']);
            Notification::create(['userId' => $offer->authorId, 'kind' => 'OFFER', 'title' => 'Ваш отклик принят', 'body' => $r->title, 'href' => '/app/contractor/offers']);
        });

        return response()->json(['ok' => true]);
    }

    public function decline(Request $http)
    {
        $data = $http->validate(['offerId' => 'required|string']);
        DB::transaction(function () use ($http, $data) {
            $offer = Offer::whereHas('request', fn ($q) => $q->where('customerId', $http->user()->id))->lockForUpdate()->findOrFail($data['offerId']);
            abort_unless($offer->status === 'SENT', 409);
            $offer->update(['status' => 'DECLINED']);
        });

        return response()->json(['ok' => true]);
    }

    public function message(Request $http)
    {
        $data = $http->validate(['offerId' => 'required|string', 'body' => 'required|string|min:1|max:4000']);
        DB::transaction(function () use ($http, $data) {
            $offer = Offer::whereHas('request', fn ($q) => $q->where('customerId', $http->user()->id))->lockForUpdate()->findOrFail($data['offerId']);
            $thread = ChatThread::firstOrCreate(['offerId' => $offer->id, 'kind' => 'OFFER'], ['requestId' => $offer->requestId]);
            Message::create(['threadId' => $thread->id, 'authorId' => $http->user()->id, 'body' => trim($data['body'])]);
            Notification::create(['userId' => $offer->authorId, 'kind' => 'CHAT', 'title' => 'Новое сообщение по заявке', 'body' => $offer->request->title, 'href' => '/app/contractor/offers']);
        });

        return response()->json(['ok' => true]);
    }
}
