import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Настройки платформы" };

const SETTINGS: {
  group: string;
  items: { name: string; value: string; note?: string }[];
}[] = [
  {
    group: "Финансы",
    items: [
      { name: "Комиссия платформы", value: "7%", note: "с успешного заказа" },
      { name: "Предоплата по умолчанию", value: "40%" },
      { name: "Валюта", value: "RUB" },
    ],
  },
  {
    group: "Модерация",
    items: [
      {
        name: "Проверка компаний",
        value: "Ручная",
        note: "автопроверка ИНН — Phase 6",
      },
      { name: "Модерация заявок", value: "Автопубликация" },
    ],
  },
  {
    group: "Уведомления",
    items: [
      { name: "Внутренние (колокольчик)", value: "Включены" },
      { name: "E-mail", value: "Phase 6" },
      { name: "Push", value: "Phase 6" },
    ],
  },
];

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Настройки платформы
      </h1>
      <p className="text-sm text-muted-foreground">
        Ключевые параметры сервиса. Редактирование появится вместе с реальными
        платежами — сейчас значения фиксированы.
      </p>

      <div className="mt-6 space-y-4">
        {SETTINGS.map((g) => (
          <Card key={g.group} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{g.group}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {g.items.map((it) => (
                <div
                  key={it.name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{it.name}</p>
                    {it.note && (
                      <p className="text-xs text-muted-foreground">
                        {it.note}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">{it.value}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Демо-режим</CardTitle>
            <CardDescription>
              Платформа работает на локальной SQLite с мок-платежами. Миграция
              на PostgreSQL и реальный эквайринг запланированы в Phase 6.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}
