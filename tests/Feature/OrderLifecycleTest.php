<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\OrderStage;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role): User
    {
        return User::create(['name' => $role, 'email' => uniqid().'@example.com', 'passwordHash' => 'unused', 'role' => $role]);
    }

    public function test_customer_request_offer_order_stages_payment_and_review(): void
    {
        $customer = $this->user('CUSTOMER');
        $contractor = $this->user('CONTRACTOR');
        $org = Organization::create(['name' => 'Компания', 'slug' => 'company', 'verificationStatus' => 'VERIFIED']);
        OrganizationMember::create(['userId' => $contractor->id, 'organizationId' => $org->id, 'role' => 'OWNER']);
        $f = Facility::create(['ownerId' => $customer->id, 'title' => 'Дом', 'address' => 'Москва, секретный адрес', 'type' => 'HOUSE']);
        $r = $this->actingAs($customer)->postJson('/actions/requests/create', ['facilityId' => $f->id, 'type' => 'REPAIR', 'urgency' => 'NORMAL', 'title' => 'Починить отопление', 'needsEstimate' => true, 'needsContract' => true, 'needsWarranty' => true, 'mode' => 'publish'])->assertOk()->json('data.id');
        $this->actingAs($contractor)->get('/app/contractor/requests/'.$r)->assertOk()->assertDontSee('секретный адрес');
        $offer = $this->postJson('/actions/contractor/offers/create', ['requestId' => $r, 'priceTotal' => 10000, 'isEstimate' => false, 'stagesPlan' => "Монтаж\nПроверка"])->assertOk()->json('data.id');
        $this->actingAs($customer)->postJson('/actions/offers/accept', ['offerId' => $offer])->assertOk();
        $id = $this->postJson('/actions/orders/create', ['id' => $r])->assertOk()->json('data.orderId');
        $this->postJson('/actions/orders/create', ['id' => $r])->assertConflict();
        $this->assertDatabaseHas('Order', ['id' => $id, 'priceTotal' => 1000000, 'status' => 'PLANNING']);
        $this->assertDatabaseHas('Payment', ['orderId' => $id, 'kind' => 'PREPAYMENT', 'amount' => 300000]);
        $this->actingAs($contractor)->postJson('/actions/contractor/orders/submit', ['orderId' => $id])->assertConflict();
        foreach (OrderStage::where('orderId', $id)->orderBy('index')->get() as $stage) {
            $this->postJson('/actions/contractor/stages/start', ['orderId' => $id, 'stageId' => $stage->id])->assertOk();
            $this->postJson('/actions/contractor/stages/complete', ['orderId' => $id, 'stageId' => $stage->id, 'note' => 'Готово'])->assertOk();
        }
        $this->postJson('/actions/contractor/orders/submit', ['orderId' => $id])->assertOk();
        $this->actingAs($customer)->postJson('/actions/orders/accept', ['orderId' => $id])->assertOk();
        $this->assertDatabaseHas('Order', ['id' => $id, 'status' => 'AWAITING_FINAL_PAYMENT']);
        $this->postJson('/actions/orders/pay', ['orderId' => $id])->assertOk();
        $this->assertDatabaseHas('Order', ['id' => $id, 'status' => 'COMPLETED']);
        $this->postJson('/actions/orders/review', ['orderId' => $id, 'rating' => 5, 'text' => 'Отлично'])->assertOk();
        $this->postJson('/actions/orders/review', ['orderId' => $id, 'rating' => 4])->assertConflict();
        $this->assertDatabaseHas('Organization', ['id' => $org->id, 'ratingCount' => 1, 'ratingAvg' => 5]);
    }

    public function test_unverified_company_cannot_offer(): void
    {
        $contractor = $this->user('CONTRACTOR');
        $org = Organization::create(['name' => 'Новая', 'slug' => 'new', 'verificationStatus' => 'PENDING']);
        OrganizationMember::create(['userId' => $contractor->id, 'organizationId' => $org->id, 'role' => 'OWNER']);
        $this->actingAs($contractor)->postJson('/actions/contractor/offers/create', ['requestId' => 'any', 'priceTotal' => 1000, 'isEstimate' => false])->assertForbidden();
    }

    public function test_all_dashboard_roles_have_access_only_to_own_area(): void
    {
        foreach (['CUSTOMER' => '/app/customer', 'CONTRACTOR' => '/app/contractor', 'ADMIN' => '/admin'] as $role => $url) {
            $this->actingAs($this->user($role))->get($url)->assertOk();
        }
        $this->actingAs($this->user('CUSTOMER'))->get('/admin')->assertForbidden();
        $this->get('/app/contractor')->assertForbidden();
    }
}
