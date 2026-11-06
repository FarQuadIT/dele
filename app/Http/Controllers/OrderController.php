<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\ChatThread;
use App\Models\Contract;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderParticipant;
use App\Models\OrderStage;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\Request as ServiceRequest;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function create(Request $http)
    {
        $data = $http->validate(['id' => 'required|string']);
        $order = DB::transaction(function () use ($http, $data) {
            $r = ServiceRequest::where('customerId', $http->user()->id)->with('acceptedOffer.organization')->lockForUpdate()->findOrFail($data['id']);
            abort_unless($r->status === 'CONTRACTOR_SELECTED' && $r->acceptedOffer, 409, 'Сначала выберите исполнителя');
            $offer = $r->acceptedOffer;
            $share = is_array($offer->paymentSchedule) ? ($offer->paymentSchedule['prepayment'] ?? 0.3) : 0.3;
            $prepayment = (int) round($offer->priceTotal * max(0, min(1, (float) $share)));
            $stages = is_array($offer->stagesPlan) && count($offer->stagesPlan) ? $offer->stagesPlan : ['Выезд и диагностика', 'Выполнение работ', 'Проверка и сдача'];
            $order = Order::create(['number' => 'DELE-'.date('Y').'-'.substr((string) Str::ulid(), -10), 'requestId' => $r->id, 'offerId' => $offer->id, 'customerId' => $http->user()->id, 'organizationId' => $offer->organizationId, 'facilityId' => $r->facilityId, 'status' => 'PLANNING', 'priceTotal' => $offer->priceTotal, 'prepaymentAmount' => $prepayment, 'scheduledStartAt' => $r->desiredDateFrom, 'scheduledEndAt' => $r->desiredDateTo, 'addressRevealed' => true]);
            OrderParticipant::create(['orderId' => $order->id, 'userId' => $offer->authorId, 'roleNote' => 'Ответственный']);
            foreach ($stages as $i => $name) {
                OrderStage::create(['orderId' => $order->id, 'index' => $i + 1, 'name' => $name, 'status' => 'PENDING']);
            }
            Contract::create(['orderId' => $order->id, 'terms' => ['subject' => $r->title, 'totalRub' => round($offer->priceTotal / 100), 'warrantyMonths' => $offer->warrantyMonths, 'contractor' => $offer->organization->name], 'signedByCustomerAt' => now(), 'signedByContractorAt' => now()]);
            Payment::create(['orderId' => $order->id, 'kind' => 'PREPAYMENT', 'status' => 'SUCCEEDED', 'amount' => $prepayment, 'externalId' => 'pay_mock_'.Str::ulid(), 'idempotencyKey' => $r->id.'-prepayment', 'paidAt' => now()]);
            Payment::create(['orderId' => $order->id, 'kind' => 'FINAL', 'status' => 'PENDING', 'amount' => $offer->priceTotal - $prepayment, 'idempotencyKey' => $r->id.'-final']);
            $r->update(['status' => 'CONVERTED']);
            Notification::create(['userId' => $offer->authorId, 'kind' => 'ORDER', 'title' => 'Договор подписан — заказ создан', 'body' => $order->number, 'href' => '/app/contractor/orders']);
            AuditEvent::create(['actorId' => $http->user()->id, 'action' => 'order.create', 'entity' => 'Order', 'entityId' => $order->id, 'meta' => ['number' => $order->number, 'requestId' => $r->id]]);

            return $order;
        });

        return response()->json(['ok' => true, 'data' => ['orderId' => $order->id]]);
    }

    public function accept(Request $http)
    {
        $data = $http->validate(['orderId' => 'required|string']);
        DB::transaction(function () use ($http, $data) {
            $o = Order::where('customerId', $http->user()->id)->lockForUpdate()->findOrFail($data['orderId']);
            abort_unless($o->status === 'AWAITING_ACCEPTANCE', 409, 'Работы ещё не переданы на приёмку');
            $pending = $o->payments()->where('kind', 'FINAL')->where('status', 'PENDING')->where('amount', '>', 0)->exists();
            $o->update($pending ? ['status' => 'AWAITING_FINAL_PAYMENT'] : ['status' => 'COMPLETED', 'completedAt' => now()]);
        });

        return response()->json(['ok' => true]);
    }

    public function rework(Request $http)
    {
        $data = $http->validate(['orderId' => 'required|string', 'reason' => 'required|string|min:5|max:2000']);
        DB::transaction(function () use ($http, $data) {
            $o = Order::where('customerId', $http->user()->id)->lockForUpdate()->findOrFail($data['orderId']);
            abort_unless($o->status === 'AWAITING_ACCEPTANCE', 409);
            $o->update(['status' => 'REWORK']);
            foreach ($o->participants as $p) {
                Notification::create(['userId' => $p->userId, 'kind' => 'ORDER', 'title' => 'Работы возвращены на доработку', 'body' => $data['reason'], 'href' => '/app/contractor/orders']);
            }
        });

        return response()->json(['ok' => true]);
    }

    public function pay(Request $http)
    {
        $data = $http->validate(['orderId' => 'required|string']);
        DB::transaction(function () use ($http, $data) {
            $o = Order::where('customerId', $http->user()->id)->lockForUpdate()->findOrFail($data['orderId']);
            abort_unless($o->status === 'AWAITING_FINAL_PAYMENT', 409);
            $o->payments()->where('kind', 'FINAL')->where('status', 'PENDING')->update(['status' => 'SUCCEEDED', 'paidAt' => now(), 'externalId' => 'pay_mock_'.Str::ulid()]);
            $o->update(['status' => 'COMPLETED', 'completedAt' => now()]);
        });

        return response()->json(['ok' => true]);
    }

    public function review(Request $http)
    {
        $data = $http->validate(['orderId' => 'required|string', 'rating' => 'required|integer|min:1|max:5', 'text' => 'nullable|string|max:2000']);
        DB::transaction(function () use ($http, $data) {
            $o = Order::where('customerId', $http->user()->id)->lockForUpdate()->findOrFail($data['orderId']);
            abort_unless($o->status === 'COMPLETED', 409);
            abort_if($o->reviews()->where('direction', 'CUSTOMER_TO_CONTRACTOR')->exists(), 409, 'Отзыв уже оставлен');
            $org = Organization::lockForUpdate()->findOrFail($o->organizationId);
            Review::create(['orderId' => $o->id, 'direction' => 'CUSTOMER_TO_CONTRACTOR', 'authorId' => $http->user()->id, 'targetOrgId' => $org->id, 'rating' => $data['rating'], 'text' => $data['text'] ?? null]);
            $q = Review::where('targetOrgId', $org->id)->where('direction', 'CUSTOMER_TO_CONTRACTOR');
            $org->update(['ratingCount' => $q->count(), 'ratingAvg' => $q->avg('rating') ?? 0]);
        });

        return response()->json(['ok' => true]);
    }

    public function message(Request $http)
    {
        $data = $http->validate(['orderId' => 'required|string', 'body' => 'required|string|min:1|max:4000']);
        DB::transaction(function () use ($http, $data) {
            $o = Order::where('customerId', $http->user()->id)->lockForUpdate()->findOrFail($data['orderId']);
            $thread = ChatThread::firstOrCreate(['orderId' => $o->id, 'kind' => 'ORDER']);
            Message::create(['threadId' => $thread->id, 'authorId' => $http->user()->id, 'body' => trim($data['body'])]);
            foreach ($o->participants as $p) {
                Notification::create(['userId' => $p->userId, 'kind' => 'CHAT', 'title' => 'Новое сообщение по заказу '.$o->number, 'body' => mb_substr($data['body'], 0, 120), 'href' => '/app/contractor/orders']);
            }
        });

        return response()->json(['ok' => true]);
    }
}
