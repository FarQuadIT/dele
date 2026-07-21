import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { getContractorOrg } from "@/lib/contractor";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrdersCalendar } from "@/components/customer/orders/orders-calendar";
import { orderStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "Календарь" };

export default async function ContractorCalendarPage() {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);

  const orders = org
    ? await db.order.findMany({
        where: {
          organizationId: org.id,
          scheduledStartAt: { not: null },
        },
        orderBy: { scheduledStartAt: "asc" },
        include: { request: { select: { title: true } } },
      })
    : [];

  const items = orders.map((o) => ({
    id: o.id,
    title: o.request.title,
    start: o.scheduledStartAt!.toISOString(),
    end: (o.scheduledEndAt ?? o.scheduledStartAt!).toISOString(),
    active: !["COMPLETED", "CANCELLED"].includes(o.status),
  }));

  const upcoming = orders.filter(
    (o) =>
      !["COMPLETED", "CANCELLED"].includes(o.status) &&
      o.scheduledStartAt &&
      o.scheduledEndAt &&
      o.scheduledEndAt >= new Date(),
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Календарь работ</h1>
      <p className="text-sm text-muted-foreground">
        Загрузка бригад по дням: активные заказы выделены цветом.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[340px_1fr]">
        <Card className="h-fit shadow-card">
          <CardContent className="pt-5">
            <OrdersCalendar items={items} hrefBase="/app/contractor/orders" />
          </CardContent>
        </Card>

        <Card className="h-fit shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-primary" />
              Ближайшие работы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Запланированных работ нет.
              </p>
            ) : (
              upcoming.map((o) => (
                <Link
                  key={o.id}
                  href={`/app/contractor/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {o.request.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(o.scheduledStartAt!, "d MMM", { locale: ru })}
                      {o.scheduledEndAt &&
                        ` — ${format(o.scheduledEndAt, "d MMM", { locale: ru })}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {orderStatusLabels[o.status]}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
