<?php

namespace Tests\Feature;

use Tests\TestCase;

class PaymentWebhookTest extends TestCase
{
    public function test_unconfigured_webhook_is_disabled(): void
    {
        config(['services.payment_webhook.secret' => null]);
        $this->postJson('/api/payments/webhook', [])->assertServiceUnavailable();
    }

    public function test_invalid_token_cannot_confirm_payments(): void
    {
        config(['services.payment_webhook.secret' => str_repeat('x', 40)]);
        $this->postJson('/api/payments/webhook', [])->assertUnauthorized();
        $this->withToken('wrong')->postJson('/api/payments/webhook', [])->assertUnauthorized();
    }
}
