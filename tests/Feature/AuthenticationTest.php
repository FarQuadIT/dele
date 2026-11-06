<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_creates_customer_and_audit_event(): void
    {
        $this->postJson('/auth/register', ['email' => 'TEST@example.com', 'name' => 'Тест', 'password' => 'TestPassword123!', 'role' => 'CUSTOMER'])
            ->assertCreated()->assertJson(['ok' => true]);
        $this->assertDatabaseHas('User', ['email' => 'test@example.com', 'role' => 'CUSTOMER']);
        $this->assertDatabaseHas('AuditEvent', ['action' => 'user.register']);
        $this->assertTrue(Hash::check('TestPassword123!', User::first()->passwordHash));
    }

    public function test_registration_cannot_create_admin(): void
    {
        $this->postJson('/auth/register', ['email' => 'admin@example.com', 'name' => 'Test', 'password' => 'TestPassword123!', 'role' => 'ADMIN'])
            ->assertUnprocessable()->assertJsonValidationErrors('role');
        $this->assertDatabaseCount('User', 0);
    }

    public function test_registration_rejects_passwords_bcrypt_cannot_hash(): void
    {
        foreach ([str_repeat('я', 40), "password\0hidden"] as $password) {
            $this->postJson('/auth/register', ['email' => 'invalid@example.com', 'name' => 'Test', 'password' => $password, 'role' => 'CUSTOMER'])
                ->assertUnprocessable()->assertJsonValidationErrors('password');
        }
        $this->assertDatabaseCount('User', 0);
    }

    public function test_credentials_log_in_and_log_out(): void
    {
        $user = User::create(['name' => 'Исполнитель', 'email' => 'test@example.com', 'passwordHash' => Hash::make('TestPassword123!'), 'role' => 'CONTRACTOR']);
        $this->postJson('/auth/login', ['email' => 'TEST@example.com', 'password' => 'incorrect'])->assertUnprocessable();
        $this->assertGuest();
        $this->postJson('/auth/login', ['email' => 'TEST@example.com', 'password' => 'TestPassword123!'])->assertOk()->assertJsonPath('data.home', '/app/contractor');
        $this->assertAuthenticatedAs($user);
        $this->postJson('/auth/logout')->assertOk();
        $this->assertGuest();
    }

    public function test_schema_contains_all_domain_tables(): void
    {
        $this->assertDatabaseCount('Facility', 0);
        $this->assertDatabaseCount('Order', 0);
        $this->assertDatabaseCount('Payment', 0);
        $this->assertDatabaseCount('Inspection', 0);
        $this->assertDatabaseCount('ProfileChangeProposal', 0);
    }
}
