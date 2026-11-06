<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacilityAccessTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role = 'CUSTOMER'): User
    {
        return User::create(['name' => 'Тест', 'email' => uniqid().'@example.com', 'passwordHash' => 'unused', 'role' => $role]);
    }

    public function test_customer_creates_and_deletes_own_facility(): void
    {
        $user = $this->user();
        $response = $this->actingAs($user)->postJson('/actions/facilities/create', ['title' => 'Мой дом', 'type' => 'HOUSE', 'address' => 'Москва, улица Домовая, 1']);
        $response->assertOk();
        $id = $response->json('data.id');
        $this->assertDatabaseHas('Facility', ['id' => $id, 'ownerId' => $user->id]);
        $this->postJson('/actions/facilities/delete', ['id' => $id])->assertOk();
        $this->assertDatabaseMissing('Facility', ['id' => $id]);
    }

    public function test_foreign_facility_cannot_be_deleted(): void
    {
        $owner = $this->user();
        $stranger = $this->user();
        $facility = Facility::create(['ownerId' => $owner->id, 'title' => 'Чужой дом', 'address' => 'Москва', 'type' => 'HOUSE']);
        $this->actingAs($stranger)->postJson('/actions/facilities/delete', ['id' => $facility->id])->assertNotFound();
        $this->assertDatabaseHas('Facility', ['id' => $facility->id]);
    }

    public function test_contractor_cannot_create_customer_facility(): void
    {
        $this->actingAs($this->user('CONTRACTOR'))->postJson('/actions/facilities/create', ['title' => 'Дом', 'type' => 'HOUSE', 'address' => 'Москва'])->assertForbidden();
    }

    public function test_anonymous_write_is_rejected(): void
    {
        $this->postJson('/actions/facilities/create', ['title' => 'Дом'])->assertUnauthorized();
    }

    public function test_customer_overview_and_objects_render(): void
    {
        $this->actingAs($this->user())->get('/app/customer')->assertOk();
        $this->get('/app/customer/objects')->assertOk();
        $this->get('/app/customer/settings')->assertOk();
    }
}
