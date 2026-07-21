import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock,
  Inbox,
  ListChecks,
  Package,
  Star,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { getContractorOrg } from "@/lib/contractor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { orderStatusLabels } from "@/lib/labels";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Обзор" };

export default async function ContractorOverviewPage() {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);

  if (!org) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <Building2 className="size-12 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          Добро пожаловать в DELE для компаний
        </h1>
        <p className="max-w-md text-muted-foreground">
          Создайте профиль компании — после проверки вы начнёте получать
          заявки от владельцев домов и квартир в вашем регионе.
        </p>
        <Button asChild size="lg">
          <Link href="/app/contractor/company">
            Создать профиль компании
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </main>
    );
  }

  const [openRequests, myOffers, activeOrders, lastOrders] = await Promise.all([
    db.request.count({
      where: {
        status: { in: ["PUBLISHED", "HAS_OFFERS"] },
        offers: { none: { organizationId: org.id } },
      },
    }),
    db.offer.count({
      where: { organizationId: org.id, status: "SENT" },
    }),
    db.order.count({
      where: {
        organizationId: org.id,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
    db.order.findMany({
      where: { organizationId: org.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { request: { select: { title: true } } },
    }),
  ]);

  const stats = [
    {
      label: "Открытые заявки",
      value: openRequests,
      icon: Inbox,
      href: "/app/contractor/requests",
    },
    {
      label: "Активные отклики",
      value: myOffers,
      icon: ListChecks,
      href: "/app/contractor/offers",
    },
    {
      label: "Заказы в работе",
      value: activeOrders,
      icon: Package,
      href: "/app/contractor/orders",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {org.verificationStatus === "VERIFIED" ? (
              <span className="inline-flex items-center gap-1 text-primary">
                <BadgeCheck className="size-4" />
                Проверенная компания
              </span>
            ) : org.verificationStatus === "PENDING" ? (
              <span className="inline-flex items-center gap-1 text-warning">
                <Clock className="size-4" />
                На модерации
              </span>
            ) : (
              "Профиль не проверен"
            )}
            {org.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-warning text-warning" />
                {org.ratingAvg.toFixed(1)} ({org.ratingCount})
              </span>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/app/contractor/requests">
            Смотреть заявки
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      <Card className="mt-8 shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Последние заказы</CardTitle>
          <CardDescription>
            Постоянные клиенты начинаются с первого хорошо сделанного заказа.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lastOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Заказов пока нет — откликайтесь на заявки.
            </p>
          ) : (
            lastOrders.map((o) => (
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
                    {o.number} · {formatMoney(o.priceTotal)}
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
    </main>
  );
}
