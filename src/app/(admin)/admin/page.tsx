import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Package,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { orderStatusLabels, requestStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "Дашборд" };

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const [
    usersCount,
    customersCount,
    contractorsCount,
    orgsCount,
    orgsPending,
    requestsCount,
    requestsOpen,
    offersCount,
    ordersCount,
    ordersActive,
    paymentsSucceeded,
    recentRequests,
    recentOrders,
    recentAudit,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.user.count({ where: { role: "CONTRACTOR" } }),
    db.organization.count(),
    db.organization.count({ where: { verificationStatus: "PENDING" } }),
    db.request.count(),
    db.request.count({ where: { status: { in: ["PUBLISHED", "HAS_OFFERS"] } } }),
    db.offer.count(),
    db.order.count(),
    db.order.count({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
    }),
    db.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amount: true },
    }),
    db.request.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        number: true,
        status: true,
        priceTotal: true,
        request: { select: { title: true } },
        organization: { select: { name: true } },
      },
    }),
    db.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { actor: { select: { name: true } } },
    }),
  ]);

  const gmv = paymentsSucceeded._sum.amount ?? 0;

  const stats = [
    {
      label: "Пользователи",
      value: usersCount,
      hint: `${customersCount} заказчиков · ${contractorsCount} исполнителей`,
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Компании",
      value: orgsCount,
      hint:
        orgsPending > 0 ? `${orgsPending} ждут модерации` : "Модерация чиста",
      icon: Building2,
      href: "/admin/companies",
      attention: orgsPending > 0,
    },
    {
      label: "Заявки",
      value: requestsCount,
      hint: `${requestsOpen} открыты · ${offersCount} откликов`,
      icon: ClipboardList,
      href: "/admin/requests",
    },
    {
      label: "Заказы",
      value: ordersCount,
      hint: `${ordersActive} в работе`,
      icon: Package,
      href: "/admin/orders",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Платформа на ладони
      </h1>
      <p className="text-sm text-muted-foreground">
        Ключевые показатели и последняя активность.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="h-full shadow-card transition-shadow hover:shadow-lg">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <s.icon className="size-5 text-primary" />
                  {s.attention && (
                    <span className="flex size-2.5">
                      <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-warning opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-warning" />
                    </span>
                  )}
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums">
                  {s.value}
                </p>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.hint}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-1">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <Wallet className="size-5 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums">
              {formatMoney(gmv)}
            </p>
            <p className="text-sm font-medium">Оборот платежей</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Сумма успешных платежей · комиссия ~{formatMoney(Math.round(gmv * 0.07))}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/admin/payments">
                Все платежи
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {orgsPending > 0 && (
          <Card className="border-warning/40 shadow-card lg:col-span-2">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-8 text-warning" />
                <div>
                  <p className="font-semibold">
                    Компании ждут модерации: {orgsPending}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Проверьте данные и откройте доступ к заявкам.
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href="/admin/companies?status=PENDING">
                  К модерации
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Последние заявки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {recentRequests.map((r) => (
              <Link
                key={r.id}
                href={`/admin/requests`}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.customer.name} ·{" "}
                    {formatDistanceToNow(r.createdAt, {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {requestStatusLabels[r.status]}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Последние заказы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders`}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {o.request.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.number} · {o.organization.name} ·{" "}
                    {formatMoney(o.priceTotal)}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {orderStatusLabels[o.status]}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Журнал действий</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {recentAudit.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm"
            >
              <p className="min-w-0 truncate">
                <span className="font-medium">
                  {e.actor?.name ?? "Система"}
                </span>{" "}
                <span className="text-muted-foreground">{e.action}</span>{" "}
                <span className="text-muted-foreground">· {e.entity}</span>
              </p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(e.createdAt, {
                  addSuffix: true,
                  locale: ru,
                })}
              </span>
            </div>
          ))}
          <Button asChild variant="ghost" size="sm" className="mt-1">
            <Link href="/admin/audit">
              Весь журнал
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
