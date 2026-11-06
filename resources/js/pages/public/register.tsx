import Link from "@/compat/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";


export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-card">
        <Link href="/" className="text-sm font-bold tracking-widest text-primary">
          DELE
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Создать аккаунт
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Бесплатная регистрация. Профиль можно заполнять постепенно.
        </p>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
