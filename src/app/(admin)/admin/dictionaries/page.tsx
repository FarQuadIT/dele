import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  requestTypeLabels,
  systemTypeLabels,
  systemTypeTone,
  urgencyLabels,
  documentCategoryLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import type {
  RequestType,
  SystemType,
  UrgencyLevel,
  DocumentCategory,
} from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Справочники" };

export default async function AdminDictionariesPage() {
  await requireRole("ADMIN");

  const [systemsCount, equipmentCount, requestsByType] = await Promise.all([
    db.engineeringSystem.groupBy({ by: ["type"], _count: { _all: true } }),
    db.equipment.count(),
    db.request.groupBy({ by: ["type"], _count: { _all: true } }),
  ]);

  const systemUsage = new Map(
    systemsCount.map((s) => [s.type, s._count._all]),
  );
  const requestUsage = new Map(
    requestsByType.map((r) => [r.type, r._count._all]),
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Справочники и шаблоны
      </h1>
      <p className="text-sm text-muted-foreground">
        Системные перечни платформы. Редактирование справочников — на этапе
        интеграций, сейчас они фиксированы в коде и схеме данных.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Типы инженерных систем</CardTitle>
            <CardDescription>
              Используются в цифровом профиле объекта. Всего оборудования:{" "}
              {equipmentCount}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.keys(systemTypeLabels) as SystemType[]).map((t) => (
              <div
                key={t}
                className="flex items-center justify-between rounded-lg border p-2.5 text-sm"
              >
                <span className="flex items-center gap-2.5 font-medium">
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      systemTypeTone[t].dot,
                    )}
                  />
                  {systemTypeLabels[t]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {systemUsage.get(t) ?? 0} на объектах
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Сценарии заявок</CardTitle>
            <CardDescription>
              Шаблоны мастера создания заявки у заказчика.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.keys(requestTypeLabels) as RequestType[]).map((t) => (
              <div
                key={t}
                className="flex items-center justify-between rounded-lg border p-2.5 text-sm"
              >
                <span className="font-medium">{requestTypeLabels[t]}</span>
                <span className="text-xs text-muted-foreground">
                  {requestUsage.get(t) ?? 0} заявок
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Уровни срочности</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(Object.keys(urgencyLabels) as UrgencyLevel[]).map((u) => (
              <Badge key={u} variant="secondary">
                {urgencyLabels[u]}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Категории документов</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(Object.keys(documentCategoryLabels) as DocumentCategory[]).map(
              (c) => (
                <Badge key={c} variant="secondary">
                  {documentCategoryLabels[c]}
                </Badge>
              ),
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
