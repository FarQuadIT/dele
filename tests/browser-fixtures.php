<?php

use App\Models\EngineeringSystem;
use App\Models\Equipment;
use App\Models\Facility;
use App\Models\Offer;
use App\Models\Order;
use App\Models\OrderParticipant;
use App\Models\OrderStage;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\Payment;
use App\Models\Request as ServiceRequest;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Hash;

// Explicitly test-only. Never invoke against the live database.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! app()->environment('testing') || config('database.connections.pgsql.database') !== 'dele_test') {
    throw new RuntimeException('Browser fixtures require testing environment and dele_test');
}

$password = 'BrowserTest-'.bin2hex(random_bytes(12));
$users = [];
foreach (['CUSTOMER', 'CONTRACTOR', 'ADMIN'] as $role) {
    $u = User::firstOrNew(['email' => 'browser-'.strtolower($role).'@example.invalid']);
    $u->fill(['name' => 'Проверка '.$role, 'role' => $role, 'passwordHash' => Hash::make($password)])->save();
    $users[$role] = $u;
}
$customer = $users['CUSTOMER'];
$contractor = $users['CONTRACTOR'];
$f = Facility::create(['ownerId' => $customer->id, 'title' => 'Тестовый дом', 'type' => 'HOUSE', 'address' => 'Москва, тестовая улица', 'region' => 'Москва', 'area' => 150, 'floorsCount' => 2]);
$s = EngineeringSystem::create(['facilityId' => $f->id, 'type' => 'WATER', 'name' => 'Водоснабжение']);
Equipment::create(['facilityId' => $f->id, 'systemId' => $s->id, 'name' => 'Насос', 'brand' => 'Тест', 'serviceIntervalDays' => 30, 'installedAt' => now()->subDays(60)]);
$org = Organization::create(['name' => 'Тестовая компания', 'slug' => 'browser-'.bin2hex(random_bytes(4)), 'verificationStatus' => 'VERIFIED']);
OrganizationMember::create(['userId' => $contractor->id, 'organizationId' => $org->id, 'role' => 'OWNER']);
$request = ServiceRequest::create(['facilityId' => $f->id, 'customerId' => $customer->id, 'title' => 'Тестовая заявка', 'description' => 'Проверить работу интерфейса', 'type' => 'REPAIR', 'status' => 'PUBLISHED', 'publishedAt' => now()]);
$offer = Offer::create(['requestId' => $request->id, 'organizationId' => $org->id, 'authorId' => $contractor->id, 'status' => 'SENT', 'priceTotal' => 100000]);
$orderRequest = ServiceRequest::create(['facilityId' => $f->id, 'customerId' => $customer->id, 'title' => 'Тестовый заказ', 'type' => 'REPAIR', 'status' => 'CONVERTED']);
$orderOffer = Offer::create(['requestId' => $orderRequest->id, 'organizationId' => $org->id, 'authorId' => $contractor->id, 'status' => 'ACCEPTED', 'priceTotal' => 100000]);
$order = Order::create(['number' => 'BROWSER-'.bin2hex(random_bytes(4)), 'requestId' => $orderRequest->id, 'offerId' => $orderOffer->id, 'facilityId' => $f->id, 'customerId' => $customer->id, 'organizationId' => $org->id, 'status' => 'IN_PROGRESS', 'priceTotal' => 100000, 'scheduledStartAt' => now(), 'scheduledEndAt' => now()->addDays(3)]);
OrderStage::create(['orderId' => $order->id, 'name' => 'Проверка', 'index' => 1, 'status' => 'IN_PROGRESS']);
OrderParticipant::create(['orderId' => $order->id, 'userId' => $contractor->id]);
Payment::create(['orderId' => $order->id, 'kind' => 'FINAL', 'status' => 'PENDING', 'amount' => 100000]);
echo json_encode(['password' => $password, 'facilityId' => $f->id, 'requestId' => $request->id, 'orderId' => $order->id]);
