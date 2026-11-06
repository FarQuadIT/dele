<?php

namespace Tests\Feature;

use App\Models\Dispute;
use App\Models\Equipment;
use App\Models\Facility;
use App\Models\Inspection;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\Request as ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupportWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_inspection_dispute_and_profile_approval_are_role_scoped(): void
    {
        $users = [];
        foreach (['CUSTOMER', 'CONTRACTOR', 'ADMIN'] as $role) {
            $users[$role] = User::create(['name' => $role, 'email' => $role.'@example.com', 'passwordHash' => 'unused', 'role' => $role]);
        }
        $f = Facility::create(['ownerId' => $users['CUSTOMER']->id, 'title' => 'Дом', 'address' => 'Москва', 'type' => 'HOUSE']);
        $org = Organization::create(['name' => 'Компания', 'slug' => 'org', 'verificationStatus' => 'VERIFIED']);
        OrganizationMember::create(['userId' => $users['CONTRACTOR']->id, 'organizationId' => $org->id, 'role' => 'OWNER']);
        $r = ServiceRequest::create(['facilityId' => $f->id, 'customerId' => $users['CUSTOMER']->id, 'type' => 'REPAIR', 'title' => 'Ремонт', 'status' => 'CONVERTED']);
        $offer = Offer::create(['requestId' => $r->id, 'organizationId' => $org->id, 'authorId' => $users['CONTRACTOR']->id, 'priceTotal' => 100000, 'status' => 'ACCEPTED']);
        $o = Order::create(['number' => 'TEST-1', 'requestId' => $r->id, 'offerId' => $offer->id, 'customerId' => $users['CUSTOMER']->id, 'facilityId' => $f->id, 'organizationId' => $org->id, 'status' => 'AWAITING_ACCEPTANCE', 'priceTotal' => 100000]);
        $this->actingAs($users['CUSTOMER'])->postJson('/actions/inspections/request', ['orderId' => $o->id])->assertOk();
        $inspection = Inspection::firstOrFail();
        $this->postJson('/actions/inspections/conclude', ['inspectionId' => $inspection->id, 'passed' => false, 'conclusion' => 'Нужно устранить замечания'])->assertForbidden();
        $this->actingAs($users['ADMIN'])->postJson('/actions/inspections/conclude', ['inspectionId' => $inspection->id, 'passed' => false, 'conclusion' => 'Нужно устранить замечания'])->assertOk();
        $this->assertDatabaseHas('Order', ['id' => $o->id, 'status' => 'REWORK']);
        $this->actingAs($users['CUSTOMER'])->postJson('/actions/disputes/open', ['orderId' => $o->id, 'subject' => 'Нужно исправить работу'])->assertOk();
        $dispute = Dispute::firstOrFail();
        $this->actingAs($users['ADMIN'])->postJson('/actions/disputes/resolve', ['disputeId' => $dispute->id, 'outcome' => 'RESOLVED_COMPROMISE', 'resolution' => 'Работы будут исправлены'])->assertOk();
        $equipment = Equipment::create(['facilityId' => $f->id, 'name' => 'Насос']);
        $proposal = $this->actingAs($users['CONTRACTOR'])->postJson('/actions/proposals/create', ['orderId' => $o->id, 'equipmentId' => $equipment->id, 'changes' => ['name' => 'Новый насос'], 'comment' => 'Замена'])->assertOk()->json('data.proposalId');
        $this->assertDatabaseHas('Equipment', ['id' => $equipment->id, 'name' => 'Насос']);
        $this->postJson('/actions/proposals/decide', ['proposalId' => $proposal, 'decision' => 'APPROVED'])->assertForbidden();
        $this->actingAs($users['CUSTOMER'])->postJson('/actions/proposals/decide', ['proposalId' => $proposal, 'decision' => 'APPROVED'])->assertOk();
        $this->assertDatabaseHas('Equipment', ['id' => $equipment->id, 'name' => 'Новый насос']);
        $this->assertDatabaseHas('EquipmentVersion', ['equipmentId' => $equipment->id, 'version' => 1]);
        $this->postJson('/actions/proposals/decide', ['proposalId' => $proposal, 'decision' => 'APPROVED'])->assertNotFound();
    }
}
