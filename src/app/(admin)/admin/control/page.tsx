import type { Metadata } from "next";
import { Scale, ShieldQuestion } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
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
import {
  ConcludeInspection,
  ResolveDispute,
} from "@/components/admin/control-actions";

export const metadata: Metadata = { title: "Контроль качества" };

const DISPUTE_STATUS_LABEL: Record<string, string> = {
  OPEN: "Открыт",
  UNDER_REVIEW: "На рассмотрении",
  RESOLVED_CUSTOMER: "В пользу заказчика",
  RESOLVED_CONTRACTOR: "В пользу исполнителя",
  RESOLVED_COMPROMISE: "Компромисс",
  CLOSED: "Закрыт",
};

const INSPECTION_STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Запрошен",
  IN_PROGRESS: "Идёт проверка",
  PASSED: "Пройден",
  ISSUES_FOUND: "Есть замечания",
  CANCELLED: "Отменён",
};

export default async function AdminControlPage() {
  await requireRole("ADMIN");

  const [inspections, disputes] = await Promise.all([
    db.inspection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            number: true,
            request: { select: { title: true } },
            organization: { select: { name: true } },
          },
        },
        requestedBy: { select: { name: true } },
      },
    }),
    db.dispute.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            number: true,
            request: { select: { title: true } },
            organization: { select: { name: true } },
          },
        },
        openedBy: { select: { name: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Контроль качества</h1>
      <p className="text-sm text-muted-foreground">
        Технадзор и споры: платформа выступает арбитром между сторонами.
      </p>

      <Card className="mt-6 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldQuestion className="size-4 text-primary" />
            Технадзор
          </CardTitle>
          <CardDescription>
            Независимая проверка работ по запросу заказчика.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {inspections.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Запросов технадзора нет.
            </p>
          ) : (
            inspections.map((i) => (
              <div key={i.id} className="rounded-xl border p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {i.order.number} · {i.order.request.title}
                  </p>
                  <Badge
                    variant={
                      ["REQUESTED", "IN_PROGRESS"].includes(i.status)
                        ? "default"
                        : "secondary"
                    }
                  >
                    {INSPECTION_STATUS_LABEL[i.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Запросил {i.requestedBy.name} ·{" "}
                  {format(i.createdAt, "d MMM yyyy", { locale: ru })} ·
                  исполнитель: {i.order.organization.name}
                </p>
                {i.conclusion && (
                  <p className="mt-2 rounded-lg bg-muted/60 p-2.5 text-sm">
                    {i.conclusion}
                  </p>
                )}
                {["REQUESTED", "IN_PROGRESS"].includes(i.status) && (
                  <ConcludeInspection inspectionId={i.id} />
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="size-4 text-primary" />
            Споры
          </CardTitle>
          <CardDescription>
            Решение фиксируется и отправляется обеим сторонам.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {disputes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Открытых споров нет.
            </p>
          ) : (
            disputes.map((d) => (
              <div key={d.id} className="rounded-xl border p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {d.order.number} · {d.subject}
                  </p>
                  <Badge
                    variant={
                      ["OPEN", "UNDER_REVIEW"].includes(d.status)
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {DISPUTE_STATUS_LABEL[d.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Открыл {d.openedBy.name} ·{" "}
                  {format(d.createdAt, "d MMM yyyy", { locale: ru })} ·
                  исполнитель: {d.order.organization.name}
                </p>
                {d.description && (
                  <p className="mt-2 text-sm">{d.description}</p>
                )}
                {d.resolution && (
                  <p className="mt-2 rounded-lg bg-muted/60 p-2.5 text-sm">
                    Решение: {d.resolution}
                  </p>
                )}
                {["OPEN", "UNDER_REVIEW"].includes(d.status) && (
                  <ResolveDispute disputeId={d.id} />
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
