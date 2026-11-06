<!DOCTYPE html>
<html lang="ru" class="h-full antialiased">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title inertia>DELE — все инженерные системы дома под контролем</title>
    @viteReactRefresh
    @vite(['resources/js/app.tsx'])
    @inertiaHead
</head>
<body class="min-h-full flex flex-col">
@inertia
</body>
</html>
