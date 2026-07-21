import type { Metadata } from "next";
import { Briefcase, Scale, Wrench } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requestTypeLabels } from "@/lib/labels";
import type { RequestType } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Услуги платформы" };

/** Типы заявок, которые оказывает / курирует сама платформа DELE. */
const PLATFORM_TYPES: RequestType[] = [
  "PROFILE_FILL",
  "MATERIALS",
  "SERVICE_RECURRING",
];

export default async function AdminServicesPage() {
  await requireRole("ADMIN");

  const [byType, inspectionsOpen, disputesOpen] = await Promise.all([
    db.request.groupBy({
      by: ["type"],
      _count: { _all: true },
      where: { type: { in: PLATFORM_TYPES } },
    }),
    db.inspection.count({
      where: { status: { in: ["REQUESTED", "IN_PROGRESS"] } },
    }),
    db.dispute.count({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
    }),
  ]);

  const counts = new Map(byType.map((r) => [r.type, r._count._all]));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Услуги платформы</h1>
      <p className="text-sm text-muted-foreground">
        Внутренние услуги DELE: заполнение профиля, расходники, абонентское
        обслуживание, технадзор и юридические консультации. Отделены от рынка
        исполнителей (Concept.txt §9.12).
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Открытый технадзор</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              <Wrench className="size-5 text-muted-foreground" />
              {inspectionsOpen}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Открытые споры</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              <Scale className="size-5 text-muted-foreground" />
              {disputesOpen}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Платформенные заявки</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              <Briefcase className="size-5 text-muted-foreground" />
              {[...counts.values()].reduce((a, b) => a + b, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="mt-6 shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Каталог внутренних услуг</CardTitle>
          <CardDescription>
            Маркетинг на лендинге уже есть; операционный флоу ведётся через
            заявки соответствующих типов и раздел «Контроль».
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(
            [
              {
                type: "PROFILE_FILL" as const,
                note: "Выезд специалиста для инвентаризации инженерки",
              },
              {
                type: "MATERIALS" as const,
                note: "Комплекты фильтров и расходников для самостоятельного ТО",
              },
              {
                type: "SERVICE_RECURRING" as const,
                note: "Абонентские программы обслуживания от DELE / партнёров",
              },
            ] as const
          ).map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{requestTypeLabels[item.type]}</p>
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
              <Badge variant="secondary">
                {counts.get(item.type) ?? 0} заявок
              </Badge>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <div>
              <p className="font-medium">Технический надзор</p>
              <p className="text-xs text-muted-foreground">
                Независимая проверка на приёмке — раздел «Контроль»
              </p>
            </div>
            <Badge variant="outline">{inspectionsOpen} активных</Badge>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <div>
              <p className="font-medium">Юридическая консультация</p>
              <p className="text-xs text-muted-foreground">
                Разбор договоров и споров; назначение через «Контроль»
              </p>
            </div>
            <Badge variant="outline">{disputesOpen} споров</Badge>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
