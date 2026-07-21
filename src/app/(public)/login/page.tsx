import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-card">
        <Link href="/" className="text-sm font-bold tracking-widest text-primary">
          DELE
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Вход в аккаунт
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Объекты, заявки и заказы — в вашем кабинете.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
