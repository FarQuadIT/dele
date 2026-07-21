import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orderStatusLabels } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import { OrdersCalendar } from "@/components/customer/orders/orders-calendar";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Заказы" };

const STATUS_TONE: Partial<Record<OrderStatus, string>> = {
  IN_PROGRESS: "bg-primary/12 text-primary",
  PLANNING: "bg-secondary text-secondary-foreground",
  AWAITING_ACCEPTANCE: "bg-warning/15 text-warning",
  AWAITING_FINAL_PAYMENT: "bg-warning/15 text-warning",
  REWORK: "bg-destructive/12 text-destructive",
  COMPLETED: "bg-success/15 text-success",
  CANCELLED: "bg-muted text-muted-foreground",
};

export default async function OrdersPage() {
  const user = await requireRole("CUSTOMER");

  const orders = await db.order.findMany({
    where: { customerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      request: { select: { title: true } },
      organization: { select: { name: true } },
      facility: { select: { title: true } },
      stages: { orderBy: { index: "asc" } },
    },
  });

  const active = orders.filter(
    (o) => !["COMPLETED", "CANCELLED"].includes(o.status),
  );
  const finished = orders.filter((o) =>
    ["COMPLETED", "CANCELLED"].includes(o.status),
  );

  const calendarItems = orders
    .filter((o) => o.scheduledStartAt)
    .map((o) => ({
      id: o.id,
      title: o.request.title,
      start: o.scheduledStartAt!.toISOString(),
      end: (o.scheduledEndAt ?? o.scheduledStartAt!).toISOString(),
      active: !["COMPLETED", "CANCELLED"].includes(o.status),
    }));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Заказы</h1>
        <p className="text-sm text-muted-foreground">
          Работы по договору: этапы, оплаты и приёмка.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
              <Package className="size-10 text-muted-foreground" />
              <p className="font-medium">Заказов пока нет</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Заказ появится после выбора исполнителя и подписания договора.
              </p>
            </div>
          ) : (
            <>
              {active.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                    В работе
                  </h2>
                  {active.map((o) => (
                    <OrderRow key={o.id} order={o} />
                  ))}
                </section>
              )}
              {finished.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                    Завершённые
                  </h2>
                  {finished.map((o) => (
                    <OrderRow key={o.id} order={o} />
                  ))}
                </section>
              )}
            </>
          )}
        </div>

        <Card className="h-fit shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Календарь работ</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersCalendar items={calendarItems} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function OrderRow({
  order: o,
}: {
  order: {
    id: string;
    number: string;
    status: OrderStatus;
    priceTotal: number;
    scheduledStartAt: Date | null;
    scheduledEndAt: Date | null;
    request: { title: string };
    organization: { name: string };
    facility: { title: string };
    stages: { status: string }[];
  };
}) {
  const done = o.stages.filter((s) => s.status === "DONE").length;
  const progress = o.stages.length > 0 ? done / o.stages.length : 0;

  return (
    <Link href={`/app/customer/orders/${o.id}`} className="block">
      <Card className="shadow-card transition-shadow hover:shadow-lg">
        <CardContent className="space-y-3 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <p className="truncate font-semibold">{o.request.title}</p>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  STATUS_TONE[o.status] ?? "bg-muted",
                )}
              >
                {orderStatusLabels[o.status]}
              </span>
            </div>
            <p className="text-sm font-semibold tabular-nums">
              {formatMoney(o.priceTotal)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {o.number} · {o.organization.name} · {o.facility.title}
            {o.scheduledStartAt &&
              ` · ${format(o.scheduledStartAt, "d MMM", { locale: ru })}${
                o.scheduledEndAt
                  ? ` — ${format(o.scheduledEndAt, "d MMM", { locale: ru })}`
                  : ""
              }`}
          </p>
          {o.stages.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {done}/{o.stages.length} этапов
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
