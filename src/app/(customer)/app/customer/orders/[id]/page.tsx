import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Camera,
  FileSignature,
  FileText,
  Landmark,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StageTracker } from "@/components/shared/stage-tracker";
import { OrderAcceptance } from "@/components/customer/orders/order-acceptance";
import { OrderChat } from "@/components/customer/orders/order-chat";
import { orderStatusLabels } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Заказ" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("CUSTOMER");
  const { id } = await params;

  const order = await db.order.findFirst({
    where: { id, customerId: user.id },
    include: {
      request: { select: { title: true, type: true } },
      organization: { select: { name: true, phone: true, email: true } },
      facility: { select: { title: true, address: true } },
      stages: {
        orderBy: { index: "asc" },
        include: {
          evidence: {
            orderBy: { createdAt: "asc" },
            include: { createdBy: { select: { name: true } } },
          },
        },
      },
      payments: { orderBy: { createdAt: "asc" } },
      contract: true,
      reviews: true,
      threads: {
        where: { kind: "ORDER" },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const hasReview = order.reviews.some(
    (r) => r.direction === "CUSTOMER_TO_CONTRACTOR",
  );

  const trackerStages = order.stages.map((s) => ({
    name: s.name,
    status: (s.status === "FAILED" ? "PENDING" : s.status) as
      | "DONE"
      | "IN_PROGRESS"
      | "PENDING",
    meta:
      [
        s.completedAt
          ? `завершён ${format(s.completedAt, "d MMM", { locale: ru })}`
          : s.startedAt
            ? `начат ${format(s.startedAt, "d MMM", { locale: ru })}`
            : s.plannedAt
              ? `план: ${format(s.plannedAt, "d MMM", { locale: ru })}`
              : "",
        s.evidence.length > 0
          ? `отчётов: ${s.evidence.length}`
          : "",
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
  }));

  const evidence = order.stages.flatMap((s) =>
    s.evidence.map((e) => ({ ...e, stageName: s.name })),
  );

  const messages = (order.threads[0]?.messages ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt,
    authorId: m.author.id,
    authorName: m.author.name ?? "Пользователь",
  }));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/app/customer/orders">
          <ArrowLeft className="size-4" />
          Все заказы
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {order.request.title}
            </h1>
            <Badge variant="secondary">{orderStatusLabels[order.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.number} · {order.organization.name}
            {order.scheduledStartAt &&
              ` · ${format(order.scheduledStartAt, "d MMM", { locale: ru })}`}
            {order.scheduledEndAt &&
              ` — ${format(order.scheduledEndAt, "d MMM yyyy", { locale: ru })}`}
          </p>
        </div>
        <p className="text-2xl font-bold tracking-tight tabular-nums">
          {formatMoney(order.priceTotal)}
        </p>
      </div>

      <OrderAcceptance
        orderId={order.id}
        status={order.status}
        hasReview={hasReview}
        finalAmount={
          order.payments.find((p) => p.kind === "FINAL")?.amount ?? 0
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Этапы работ</CardTitle>
            </CardHeader>
            <CardContent>
              {trackerStages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Исполнитель ещё не составил план этапов.
                </p>
              ) : (
                <StageTracker stages={trackerStages} />
              )}
            </CardContent>
          </Card>

          {evidence.length > 0 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Camera className="size-4 text-primary" />
                  Отчёты исполнителя
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {evidence.map((e) => (
                  <div key={e.id} className="rounded-xl border p-3">
                    <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-secondary to-muted">
                      <Camera className="size-6 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-sm font-medium">{e.note}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {e.stageName} ·{" "}
                      {format(e.createdAt, "d MMM, HH:mm", { locale: ru })}
                      {e.createdBy.name ? ` · ${e.createdBy.name}` : ""}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <OrderChat
            orderId={order.id}
            currentUserId={user.id}
            messages={messages}
          />
        </div>

        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4 text-primary" />
                Объект
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{order.facility.title}</p>
              <p className="mt-0.5 text-muted-foreground">
                {order.facility.address}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="size-4 text-primary" />
                Платежи
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {order.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {p.kind === "PREPAYMENT"
                        ? "Предоплата"
                        : p.kind === "FINAL"
                          ? "Финальный платёж"
                          : "Доплата"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.paidAt
                        ? `оплачен ${format(p.paidAt, "d MMM yyyy", { locale: ru })}`
                        : "ожидает оплаты"}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "font-semibold tabular-nums",
                      p.status === "SUCCEEDED"
                        ? "text-success"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatMoney(p.amount)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {order.contract && (
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSignature className="size-4 text-primary" />
                  Договор
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="size-3.5" />
                  Подписан{" "}
                  {order.contract.signedByCustomerAt
                    ? format(order.contract.signedByCustomerAt, "d MMMM yyyy", {
                        locale: ru,
                      })
                    : "—"}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  Гарантия:{" "}
                  {order.contract.terms &&
                  typeof order.contract.terms === "object" &&
                  "warrantyMonths" in order.contract.terms &&
                  order.contract.terms.warrantyMonths
                    ? `${order.contract.terms.warrantyMonths} мес.`
                    : "по договору"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
