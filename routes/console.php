<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

Artisan::command('dele:admin {email} {--name=Администратор DELE}', function () {
    $email = mb_strtolower(trim($this->argument('email')));
    if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $this->error('Некорректный email');

        return 1;
    }
    if (User::where('email', $email)->exists()) {
        $this->error('Пользователь уже существует; его роль не изменена.');

        return 1;
    }
    $password = $this->secret('Пароль (минимум 12 символов)');
    if (! is_string($password) || mb_strlen($password) < 12 || strlen($password) > 72) {
        $this->error('Пароль должен содержать от 12 символов и до 72 байт.');

        return 1;
    }
    if ($password !== $this->secret('Повторите пароль')) {
        $this->error('Пароли не совпадают');

        return 1;
    }
    User::create(['email' => $email, 'name' => $this->option('name'), 'role' => 'ADMIN', 'passwordHash' => Hash::make($password)]);
    $this->info('Администратор создан');
});

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
