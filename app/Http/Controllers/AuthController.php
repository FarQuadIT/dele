<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public static function home(string $role): string
    {
        return match ($role) {
            'ADMIN' => '/admin', 'CONTRACTOR' => '/app/contractor', default => '/app/customer'
        };
    }

    public function register(Request $request)
    {
        $request->merge(['email' => mb_strtolower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email', 'max:254', Rule::unique('User', 'email')],
            'phone' => ['nullable', 'regex:/^\+?[0-9\s\-()]{10,18}$/', Rule::unique('User', 'phone')],
            'password' => ['required', 'string', 'min:8', 'max:72', function ($attribute, $value, $fail) {
                if (strlen($value) > 72 || str_contains($value, "\0")) {
                    $fail('Пароль должен занимать не более 72 байт и не содержать нулевых символов.');
                }
            }],
            'role' => ['required', Rule::in(['CUSTOMER', 'CONTRACTOR'])],
        ]);
        DB::transaction(function () use ($data) {
            $user = User::create(['name' => $data['name'], 'email' => $data['email'], 'phone' => $data['phone'] ?? null,
                'passwordHash' => Hash::make($data['password']), 'role' => $data['role']]);
            AuditEvent::create(['actorId' => $user->id, 'action' => 'user.register', 'entity' => 'User', 'entityId' => $user->id, 'meta' => ['role' => $user->role]]);
        });

        return response()->json(['ok' => true], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        if (! Auth::attempt(['email' => mb_strtolower(trim($data['email'])), 'password' => $data['password']])) {
            throw ValidationException::withMessages(['email' => 'Неверная почта или пароль']);
        }
        $request->session()->regenerate();

        return response()->json(['ok' => true, 'data' => ['home' => self::home($request->user()->role)]]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true]);
    }
}
