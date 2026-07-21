import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Package,
  Sparkles,
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  orderStatusLabels,
  recommendationSeverityLabels,
  recommendationSeverityTone,
  requestStatusLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Обзор" };

const ACTIVE_REQUEST_STATUSES = [
  "MODERATION",
  "PUBLISHED",
  "HAS_OFFERS",
  "CONTRACTOR_SELECTED",
] as const;

const ACTIVE_ORDER_STATUSES = [
  "AWAITING_CONTRACT",
  "AWAITING_PREPAYMENT",
  "PLANNING",
  "IN_PROGRESS",
  "PAUSED",
  "AWAITING_ACCEPTANCE",
  "REWORK",
  "INSPECTION",
  "AWAITING_FINAL_PAYMENT",
] as const;

export default async function CustomerOverviewPage() {
  const user = await requireRole("CUSTOMER");

  const [facilities, activeRequests, activeOrders, recommendations, orders] =
    await Promise.all([
      db.facility.count({ where: { ownerId: user.id } }),
      db.request.count({
        where: {
          customerId: user.id,
          status: { in: [...ACTIVE_REQUEST_STATUSES] },
        },
      }),
      db.order.count({
        where: {
          customerId: user.id,
          status: { in: [...ACTIVE_ORDER_STATUSES] },
        },
      }),
      db.serviceRecommendation.findMany({
        where: { facility: { ownerId: user.id }, status: "ACTIVE" },
        orderBy: [{ severity: "desc" }, { dueAt: "asc" }],
        take: 4,
        include: {
          facility: { select: { id: true, title: true } },
          equipment: { select: { name: true } },
        },
      }),
      db.order.findMany({
        where: { customerId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 4,
        include: {
          facility: { select: { title: true } },
          request: { select: { title: true } },
          organization: { select: { name: true } },
        },
      }),
    ]);

  const recentRequests = await db.request.findMany({
    where: { customerId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 4,
    include: { facility: { select: { title: true } } },
  });

  const stats = [
    {
      label: "Объекты",
      value: facilities,
      icon: Building2,
      href: "/app/customer/objects",
    },
    {
      label: "Активные заявки",
      value: activeRequests,
      icon: ClipboardList,
      href: "/app/customer/requests",
    },
    {
      label: "Заказы в работе",
      value: activeOrders,
      icon: Package,
      href: "/app/customer/orders",
    },
    {
      label: "Рекомендации",
      value: recommendations.length,
      icon: Sparkles,
      href: "/app/customer/objects",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Здравствуйте, {user.name?.split(" ")[0] ?? "гость"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Всё о ваших объектах и работах — в одном месте.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/customer/requests/new">
            Создать заявку
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="h-full shadow-card transition-shadow group-hover:shadow-lg">
              <CardContent className="flex flex-col gap-2 pt-5">
                <s.icon className="size-5 text-primary" />
                <p className="text-3xl font-bold tabular-nums">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Рекомендации по обслуживанию</CardTitle>
            <CardDescription>
              Что стоит сделать на объектах в ближайшее время.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Активных рекомендаций нет.
              </p>
            ) : (
              recommendations.map((r) => (
                <Link
                  key={r.id}
                  href={`/app/customer/objects/${r.facility.id}?tab=recommendations`}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.facility.title}
                      {r.equipment ? ` · ${r.equipment.name}` : ""}
                      {r.dueAt
                        ? ` · до ${format(r.dueAt, "d MMM", { locale: ru })}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      recommendationSeverityTone[r.severity],
                    )}
                  >
                    {recommendationSeverityLabels[r.severity]}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Последние заказы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Заказов пока нет.
                </p>
              ) : (
                orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/app/customer/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {o.request.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.facility.title} · {o.organization.name}
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

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Последние заявки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Заявок пока нет.
                </p>
              ) : (
                recentRequests.map((r) => (
                  <Link
                    key={r.id}
                    href={`/app/customer/requests/${r.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <p className="min-w-0 truncate text-sm font-medium">
                      {r.title}
                    </p>
                    <Badge variant="outline" className="shrink-0">
                      {requestStatusLabels[r.status]}
                    </Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
