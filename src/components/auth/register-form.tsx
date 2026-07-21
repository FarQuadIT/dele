"use client";

import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Building2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { loginUser, registerUser } from "@/lib/actions/auth-actions";

const schema = z.object({
  name: z.string().min(2, "Укажите имя"),
  email: z.string().email("Некорректная почта"),
  phone: z.string().optional(),
  password: z.string().min(8, "Минимум 8 символов"),
  role: z.enum(["CUSTOMER", "CONTRACTOR"]),
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole =
    searchParams.get("role") === "contractor" ? "CONTRACTOR" : "CUSTOMER";
  const [pending, setPending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: initialRole,
    },
  });

  const role = form.watch("role");

  async function onSubmit(values: FormValues) {
    setPending(true);
    const result = await registerUser(values);

    if (!result.ok) {
      setPending(false);
      toast.error(result.error);
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof FormValues, {
            message: messages[0],
          });
        }
      }
      return;
    }

    // Автовход после регистрации
    const login = await loginUser({
      email: values.email,
      password: values.password,
    });
    setPending(false);

    if (!login.ok) {
      toast.success("Аккаунт создан. Войдите с вашими данными.");
      window.location.href = "/login";
      return;
    }

    toast.success("Аккаунт создан. Добро пожаловать!");
    const next = searchParams.get("next");
    window.location.href =
      next && next.startsWith("/") ? next : (login.data?.home ?? "/");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => form.setValue("role", "CUSTOMER")}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors",
            role === "CUSTOMER"
              ? "border-primary bg-secondary text-secondary-foreground"
              : "hover:bg-muted",
          )}
        >
          <Home className="size-5" />
          Я владелец объекта
        </button>
        <button
          type="button"
          onClick={() => form.setValue("role", "CONTRACTOR")}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors",
            role === "CONTRACTOR"
              ? "border-primary bg-secondary text-secondary-foreground"
              : "hover:bg-muted",
          )}
        >
          <Building2 className="size-5" />
          Я представляю компанию
        </button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">
          {role === "CONTRACTOR" ? "Контактное лицо" : "Имя"}
        </Label>
        <Input id="name" placeholder="Иван Иванов" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Электронная почта</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.ru"
          autoComplete="email"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Телефон (необязательно)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+7 999 000-00-00"
          autoComplete="tel"
          {...form.register("phone")}
        />
        {form.formState.errors.phone && (
          <p className="text-sm text-destructive">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Создаём аккаунт..." : "Создать аккаунт"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Войти
        </Link>
      </p>
    </form>
  );
}
