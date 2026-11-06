<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function settings(Request $request)
    {
        $role = $request->user()->role === 'CONTRACTOR' ? 'contractor' : 'customer';

        return Inertia::render($role.'/settings', ['user' => $request->user()->only(['name', 'email', 'phone'])]);
    }

    public function update(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|min:2|max:120', 'phone' => ['nullable', 'string', 'max:30', Rule::unique('User', 'phone')->ignore($request->user()->id)]]);
        $request->user()->update($data);

        return response()->json(['ok' => true]);
    }

    public function readNotifications(Request $request)
    {
        Notification::where('userId', $request->user()->id)->whereNull('readAt')->update(['readAt' => now()]);

        return response()->json(['ok' => true]);
    }
}
