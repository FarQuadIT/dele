import type { Metadata } from "next";
import Link from "next/link";
import { Package, User } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { getContractorOrg } from "@/lib/contractor";
import { Card, CardContent } from "@/components/ui/card";
import { orderStatusLabels } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
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
};

export default async function ContractorOrdersPage() {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);

  const orders = org
    ? await db.order.findMany({
        where: { organizationId: org.id },
        orderBy: { updatedAt: "desc" },
        include: {
          request: {
            select: {
              title: true,
              customer: { select: { name: true } },
            },
          },
          facility: { select: { title: true, address: true } },
          stages: { orderBy: { index: "asc" }, select: { status: true } },
        },
      })
    : [];

  const active = orders.filter(
    (o) => !["COMPLETED", "CANCELLED"].includes(o.status),
  );
  const finished = orders.filter((o) =>
    ["COMPLETED", "CANCELLED"].includes(o.status),
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Заказы и клиенты</h1>
      <p className="text-sm text-muted-foreground">
        Ведите этапы — заказчик видит прогресс в реальном времени.
      </p>

      {orders.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Package className="size-10 text-muted-foreground" />
          <p className="font-medium">Заказов пока нет</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Заказ появится, когда заказчик примет ваш отклик и подпишет
            договор.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {[
            { label: "Активные", list: active },
            { label: "Завершённые", list: finished },
          ]
            .filter((g) => g.list.length > 0)
            .map((g) => (
              <section key={g.label} className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                  {g.label}
                </h2>
                {g.list.map((o) => {
                  const done = o.stages.filter(
                    (s) => s.status === "DONE",
                  ).length;
                  return (
                    <Link
                      key={o.id}
                      href={`/app/contractor/orders/${o.id}`}
                      className="block"
                    >
                      <Card className="shadow-card transition-shadow hover:shadow-lg">
                        <CardContent className="space-y-2.5 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <p className="truncate font-semibold">
                                {o.request.title}
                              </p>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                  STATUS_TONE[o.status] ?? "bg-muted",
                                )}
                              >
                                {orderStatusLabels[o.status]}
                              </span>
                            </div>
                            <p className="font-semibold tabular-nums">
                              {formatMoney(o.priceTotal)}
                            </p>
                          </div>
                          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <span>{o.number}</span>
                            <span className="inline-flex items-center gap-1">
                              <User className="size-3.5" />
                              {o.request.customer.name ?? "Заказчик"}
                            </span>
                            {o.addressRevealed ? (
                              <span>{o.facility.address}</span>
                            ) : (
                              <span>{o.facility.title}</span>
                            )}
                            {o.scheduledStartAt && (
                              <span>
                                {format(o.scheduledStartAt, "d MMM", {
                                  locale: ru,
                                })}
                                {o.scheduledEndAt &&
                                  ` — ${format(o.scheduledEndAt, "d MMM", { locale: ru })}`}
                              </span>
                            )}
                          </p>
                          {o.stages.length > 0 && (
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{
                                    width: `${(done / o.stages.length) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {done}/{o.stages.length}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </section>
            ))}
        </div>
      )}
    </main>
  );
}
