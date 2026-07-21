import type { Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Платежи" };

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Ожидает",
  PROCESSING: "Обрабатывается",
  SUCCEEDED: "Оплачен",
  FAILED: "Ошибка",
  CANCELLED: "Отменён",
  REFUNDED: "Возврат",
};

const STATUS_TONE: Record<PaymentStatus, string> = {
  PENDING: "bg-warning/15 text-warning",
  PROCESSING: "bg-secondary text-secondary-foreground",
  SUCCEEDED: "bg-success/15 text-success",
  FAILED: "bg-destructive/12 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
  REFUNDED: "bg-muted text-muted-foreground",
};

export default async function PaymentsPage() {
  const user = await requireRole("CUSTOMER");

  const payments = await db.payment.findMany({
    where: { order: { customerId: user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          number: true,
          request: { select: { title: true } },
          organization: { select: { name: true } },
        },
      },
    },
  });

  const totalPaid = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((acc, p) => acc + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Платежи</h1>
      <p className="text-sm text-muted-foreground">
        История оплат по заказам. Демо-режим: платежи имитируются.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Всего оплачено</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {formatMoney(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Ожидает оплаты</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {formatMoney(totalPending)}
            </p>
          </CardContent>
        </Card>
      </div>

      {payments.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Wallet className="size-10 text-muted-foreground" />
          <p className="font-medium">Платежей пока нет</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium text-muted-foreground">
                  Назначение
                </th>
                <th className="hidden p-3 font-medium text-muted-foreground sm:table-cell">
                  Заказ
                </th>
                <th className="p-3 font-medium text-muted-foreground">
                  Сумма
                </th>
                <th className="p-3 font-medium text-muted-foreground">
                  Статус
                </th>
                <th className="hidden p-3 font-medium text-muted-foreground md:table-cell">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="p-3">
                    <p className="font-medium">
                      {p.kind === "PREPAYMENT"
                        ? "Предоплата"
                        : p.kind === "FINAL"
                          ? "Финальный платёж"
                          : "Доплата"}
                    </p>
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {p.order.request.title}
                    </p>
                  </td>
                  <td className="hidden p-3 sm:table-cell">
                    <Link
                      href={`/app/customer/orders/${p.order.id}`}
                      className="text-primary hover:underline"
                    >
                      {p.order.number}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {p.order.organization.name}
                    </p>
                  </td>
                  <td className="p-3 font-semibold tabular-nums">
                    {formatMoney(p.amount)}
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        STATUS_TONE[p.status],
                      )}
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="hidden p-3 text-muted-foreground md:table-cell">
                    {p.paidAt
                      ? format(p.paidAt, "d MMM yyyy", { locale: ru })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
