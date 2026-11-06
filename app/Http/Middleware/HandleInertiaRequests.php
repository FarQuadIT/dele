<?php

namespace App\Http\Middleware;

use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [...parent::share($request), 'auth' => ['user' => $request->user()?->only(['id', 'name', 'email', 'phone', 'role'])],
            'notifications' => fn () => $request->user() ? Notification::where('userId', $request->user()->id)->orderByDesc('createdAt')->limit(15)->get() : []];
    }
}
