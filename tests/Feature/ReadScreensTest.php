<?php

namespace Tests\Feature;

use App\Models\EngineeringSystem;
use App\Models\Equipment;
use App\Models\Facility;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReadScreensTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role): User
    {
        return User::create(['name' => 'Проверка', 'email' => uniqid().'@example.com', 'passwordHash' => 'unused', 'role' => $role]);
    }

    public function test_all_original_pages_are_routed_and_scoped(): void
    {
        foreach (['/', '/login', '/register', '/services', '/how-it-works', '/for-business', '/security', '/requirements', '/pricing', '/help', '/styleguide'] as $url) {
            $this->get($url)->assertOk();
        }
        $customer = $this->user('CUSTOMER');
        $contractor = $this->user('CONTRACTOR');
        $admin = $this->user('ADMIN');
        $f = Facility::create(['ownerId' => $customer->id, 'title' => 'Дом', 'address' => 'Москва', 'type' => 'HOUSE']);
        foreach (['', '/objects', '/objects/'.$f->id, '/requests', '/requests?view=drafts', '/requests/new', '/orders', '/messages', '/payments', '/settings'] as $url) {
            $this->actingAs($customer)->get('/app/customer'.$url)->assertOk();
        }
        $org = Organization::create(['name' => 'Компания', 'slug' => 'test-company', 'verificationStatus' => 'VERIFIED']);
        OrganizationMember::create(['userId' => $contractor->id, 'organizationId' => $org->id, 'role' => 'OWNER']);
        foreach (['', '/company', '/requests', '/offers', '/orders', '/calendar', '/finance', '/reviews', '/team', '/settings'] as $url) {
            $this->actingAs($contractor)->get('/app/contractor'.$url)->assertOk();
        }
        foreach (['', '/users', '/companies', '/requests', '/orders', '/payments', '/audit', '/control', '/dictionaries', '/services', '/settings'] as $url) {
            $this->actingAs($admin)->get('/admin'.$url)->assertOk();
        }
        $this->actingAs($contractor)->get('/app/customer/objects/'.$f->id)->assertForbidden();
        $this->actingAs($this->user('CUSTOMER'))->get('/app/customer/objects/'.$f->id)->assertNotFound();
    }

    public function test_regulation_recommendation_is_created_once_after_authorization(): void
    {
        $owner = $this->user('CUSTOMER');
        $stranger = $this->user('CUSTOMER');
        $f = Facility::create(['ownerId' => $owner->id, 'title' => 'Дом', 'address' => 'Москва', 'type' => 'HOUSE']);
        $s = EngineeringSystem::create(['facilityId' => $f->id, 'name' => 'Вода', 'type' => 'WATER']);
        Equipment::create(['facilityId' => $f->id, 'systemId' => $s->id, 'name' => 'Насос', 'serviceIntervalDays' => 30, 'installedAt' => now()->subDays(60)]);
        $this->actingAs($stranger)->get('/app/customer/objects/'.$f->id)->assertNotFound();
        $this->assertDatabaseCount('ServiceRecommendation', 0);
        $this->actingAs($owner)->get('/app/customer/objects/'.$f->id)->assertOk();
        $this->get('/app/customer/objects/'.$f->id)->assertOk();
        $this->assertDatabaseCount('ServiceRecommendation', 1);
    }
}
