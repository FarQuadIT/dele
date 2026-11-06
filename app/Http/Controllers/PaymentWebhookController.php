<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PaymentWebhookController extends Controller
{
    public function __invoke(Request $http)
    {
        // The original endpoint had no provider authentication. Keep the demo
        // contract, but require the independently configured integration token.
        $secret = config('services.payment_webhook.secret');
        abort_unless(is_string($secret) && strlen($secret) >= 32, 503, 'Webhook integration is not configured');
        abort_unless(is_string($http->bearerToken()) && hash_equals($secret, $http->bearerToken()), 401);
        $data = $http->validate(['event' => ['required', Rule::in(['payment.succeeded', 'payment.failed', 'payment.cancelled'])], 'externalId' => 'required|string|max:200', 'idempotencyKey' => 'nullable|string|max:200', 'paymentId' => 'nullable|string|max:200', 'amount' => 'nullable|integer|min:1', 'failReason' => 'nullable|string|max:500']);

        return DB::transaction(function () use ($data) {
            if ($duplicate = Payment::where('externalId', $data['externalId'])->first()) {
                return response()->json(['ok' => true, 'duplicate' => true, 'paymentId' => $duplicate->id, 'status' => $duplicate->status]);
            }
            abort_unless(! empty($data['paymentId']) || ! empty($data['idempotencyKey']), 422);
            $payment = Payment::when(! empty($data['paymentId']), fn ($q) => $q->whereKey($data['paymentId']), fn ($q) => $q->where('idempotencyKey', $data['idempotencyKey']))->firstOrFail();
            $order = Order::lockForUpdate()->findOrFail($payment->orderId);
            $payment = Payment::lockForUpdate()->findOrFail($payment->id);
            if (in_array($payment->status, ['SUCCEEDED', 'REFUNDED', 'CANCELLED'])) {
                return response()->json(['ok' => true, 'duplicate' => true, 'paymentId' => $payment->id, 'status' => $payment->status]);
            }
            if ($data['event'] === 'payment.succeeded') {
                abort_if(isset($data['amount']) && $data['amount'] !== $payment->amount, 409, 'Amount mismatch');
                $payment->update(['status' => 'SUCCEEDED', 'externalId' => $data['externalId'], 'paidAt' => now(), 'failReason' => null]);
                if ($payment->kind === 'FINAL' && $order->status === 'AWAITING_FINAL_PAYMENT') {
                    $order->update(['status' => 'COMPLETED', 'completedAt' => now()]);
                }
            } else {
                $payment->update(['status' => $data['event'] === 'payment.failed' ? 'FAILED' : 'CANCELLED', 'externalId' => $data['externalId'], 'failReason' => $data['failReason'] ?? null]);
            }
            AuditEvent::create(['action' => $data['event'], 'entity' => 'Payment', 'entityId' => $payment->id, 'meta' => ['externalId' => $data['externalId']]]);

            return response()->json(['ok' => true, 'paymentId' => $payment->id, 'status' => $payment->status]);
        });
    }
}
