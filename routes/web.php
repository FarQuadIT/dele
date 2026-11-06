<?php

use App\Http\Controllers\AccountReadController;
use App\Http\Controllers\AdminReadController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ContractorController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderReadController;
use App\Http\Controllers\PaymentWebhookController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RequestController;
use App\Http\Controllers\SupportController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::post('/api/payments/webhook', PaymentWebhookController::class)->middleware('throttle:60,1');
Route::middleware(['auth', 'role:ADMIN'])->group(function () {
    foreach (['users', 'requests', 'orders', 'payments', 'audit', 'control', 'dictionaries', 'services', 'settings'] as $page) {
        Route::get('/admin/'.$page, [AdminReadController::class, $page]);
    }
});
Route::get('/styleguide', fn () => Inertia::render('public/styleguide'));
Route::middleware(['auth', 'role:CUSTOMER'])->group(function () {
    Route::get('/app/customer/objects/{id}', [AccountReadController::class, 'facility']);
    Route::get('/app/customer/messages', [AccountReadController::class, 'messages']);
    Route::get('/app/customer/payments', [AccountReadController::class, 'payments']);
});
Route::middleware(['auth', 'role:CONTRACTOR'])->group(function () {
    Route::get('/app/contractor/calendar', [AccountReadController::class, 'calendar']);
    Route::get('/app/contractor/finance', [AccountReadController::class, 'finance']);
    Route::get('/app/contractor/team', [AccountReadController::class, 'team']);
    Route::get('/app/contractor/reviews', [AccountReadController::class, 'reviews']);
});
Route::middleware(['auth', 'role:CUSTOMER'])->group(function () {
    Route::post('/actions/inspections/request', [SupportController::class, 'inspection']);
    Route::post('/actions/disputes/open', [SupportController::class, 'dispute']);
    Route::post('/actions/proposals/decide', [SupportController::class, 'decide']);
    Route::post('/actions/recommendations/{operation}', [SupportController::class, 'recommendation'])->whereIn('operation', ['dismiss', 'postpone']);
});
Route::post('/actions/proposals/create', [SupportController::class, 'propose'])->middleware(['auth', 'role:CONTRACTOR']);
Route::post('/actions/inspections/conclude', [SupportController::class, 'conclude'])->middleware(['auth', 'role:ADMIN']);
Route::post('/actions/disputes/resolve', [SupportController::class, 'resolve'])->middleware(['auth', 'role:ADMIN']);
Route::middleware(['auth', 'role:CUSTOMER'])->group(function () {
    Route::get('/app/customer/orders', [OrderReadController::class, 'index']);
    Route::get('/app/customer/orders/{id}', [OrderReadController::class, 'show']);
});
Route::middleware(['auth', 'role:CONTRACTOR'])->group(function () {
    Route::get('/app/contractor/orders', [OrderReadController::class, 'index']);
    Route::get('/app/contractor/orders/{id}', [OrderReadController::class, 'show']);
});
Route::middleware(['auth', 'role:CONTRACTOR'])->group(function () {
    Route::get('/app/contractor/requests', [ContractorController::class, 'requests']);
    Route::get('/app/contractor/requests/{id}', [ContractorController::class, 'request']);
    Route::get('/app/contractor/offers', [ContractorController::class, 'offers']);
    Route::post('/actions/contractor/offers/create', [ContractorController::class, 'submitOffer']);
    Route::post('/actions/contractor/offers/withdraw', [ContractorController::class, 'withdraw']);
    Route::post('/actions/contractor/offers/message', [ContractorController::class, 'offerMessage']);
    Route::post('/actions/contractor/orders/message', [ContractorController::class, 'orderMessage']);
    Route::post('/actions/contractor/orders/submit', [ContractorController::class, 'submitAcceptance']);
    Route::post('/actions/contractor/stages/{operation}', [ContractorController::class, 'stage'])->whereIn('operation', ['start', 'complete']);
});
Route::middleware(['auth', 'role:CUSTOMER'])->group(function () {
    Route::post('/actions/orders/create', [OrderController::class, 'create']);
    Route::post('/actions/orders/accept', [OrderController::class, 'accept']);
    Route::post('/actions/orders/rework', [OrderController::class, 'rework']);
    Route::post('/actions/orders/pay', [OrderController::class, 'pay']);
    Route::post('/actions/orders/review', [OrderController::class, 'review']);
    Route::post('/actions/orders/message', [OrderController::class, 'message']);
});
Route::middleware(['auth', 'role:CUSTOMER'])->group(function () {
    Route::get('/app/customer/requests', [RequestController::class, 'index']);
    Route::get('/app/customer/requests/new', [RequestController::class, 'create']);
    Route::get('/app/customer/requests/{id}', [RequestController::class, 'show']);
    Route::post('/actions/requests/create', [RequestController::class, 'store']);
    Route::post('/actions/requests/publish', [RequestController::class, 'publish']);
    Route::post('/actions/requests/cancel', [RequestController::class, 'cancel']);
    Route::post('/actions/offers/accept', [RequestController::class, 'accept']);
    Route::post('/actions/offers/decline', [RequestController::class, 'decline']);
    Route::post('/actions/offers/message', [RequestController::class, 'message']);
});
Route::get('/app/contractor/company', [CompanyController::class, 'show'])->middleware(['auth', 'role:CONTRACTOR']);
Route::post('/actions/company', [CompanyController::class, 'store'])->middleware(['auth', 'role:CONTRACTOR']);
Route::get('/admin/companies', [CompanyController::class, 'index'])->middleware(['auth', 'role:ADMIN']);
Route::post('/actions/company/moderate', [CompanyController::class, 'moderate'])->middleware(['auth', 'role:ADMIN']);
Route::get('/app/contractor', [DashboardController::class, 'contractor'])->middleware(['auth', 'role:CONTRACTOR']);
Route::get('/admin', [DashboardController::class, 'admin'])->middleware(['auth', 'role:ADMIN']);
Route::middleware(['auth', 'role:CUSTOMER'])->group(function () {
    Route::get('/app/customer', [CustomerController::class, 'overview']);
    Route::get('/app/customer/objects', [CustomerController::class, 'objects']);
    Route::post('/actions/facilities/create', [CustomerController::class, 'createFacility']);
    Route::post('/actions/facilities/delete', [CustomerController::class, 'deleteFacility']);
});
Route::middleware('auth')->group(function () {
    Route::get('/app/customer/settings', [ProfileController::class, 'settings'])->middleware('role:CUSTOMER');
    Route::get('/app/contractor/settings', [ProfileController::class, 'settings'])->middleware('role:CONTRACTOR');
    Route::post('/actions/profile', [ProfileController::class, 'update']);
    Route::post('/actions/notifications/read', [ProfileController::class, 'readNotifications']);
});
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth');
Route::get('/for-business', fn () => Inertia::render('public/for-business'));
Route::get('/help', fn () => Inertia::render('public/help'));
Route::get('/how-it-works', fn () => Inertia::render('public/how-it-works'));
Route::get('/login', fn () => auth()->check() ? redirect(AuthController::home(auth()->user()->role)) : Inertia::render('public/login'))->name('login');
Route::get('/', fn () => Inertia::render('public/home'));
Route::get('/pricing', fn () => Inertia::render('public/pricing'));
Route::get('/register', fn () => Inertia::render('public/register'));
Route::get('/requirements', fn () => Inertia::render('public/requirements'));
Route::get('/security', fn () => Inertia::render('public/security'));
Route::get('/services', fn () => Inertia::render('public/services'));
