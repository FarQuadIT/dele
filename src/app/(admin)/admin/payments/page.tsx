import type { Metadata } from "next";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentKind, PaymentStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Платежи" };

const KIND_LABEL: Record<PaymentKind, string> = {
  PREPAYMENT: "Предоплата",
  FINAL: "Финальный",
  ADDITIONAL: "Доплата",
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Ожидается",
  PROCESSING: "Обработка",
  SUCCEEDED: "Успешен",
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

export default async function AdminPaymentsPage() {
  await requireRole("ADMIN");

  const payments = await db.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          number: true,
          request: {
            select: { title: true, customer: { select: { name: true } } },
          },
          organization: { select: { name: true } },
        },
      },
    },
  });

  const succeeded = payments.filter((p) => p.status === "SUCCEEDED");
  const total = succeeded.reduce((acc, p) => acc + p.amount, 0);
  const pending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Платежи</h1>
      <p className="text-sm text-muted-foreground">
        Мок-платежи: реальный эквайринг и вебхуки — Phase 6.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Оборот</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatMoney(total)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Ожидается</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatMoney(pending)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">
              Комиссия платформы (7%)
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatMoney(Math.round(total * 0.07))}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium text-muted-foreground">Заказ</th>
              <th className="hidden p-3 font-medium text-muted-foreground md:table-cell">
                Стороны
              </th>
              <th className="p-3 font-medium text-muted-foreground">Тип</th>
              <th className="p-3 font-medium text-muted-foreground">Сумма</th>
              <th className="hidden p-3 font-medium text-muted-foreground sm:table-cell">
                Дата
              </th>
              <th className="p-3 font-medium text-muted-foreground">Статус</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b last:border-b-0">
                <td className="max-w-52 p-3">
                  <p className="font-medium">{p.order.number}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.order.request.title}
                  </p>
                </td>
                <td className="hidden p-3 text-muted-foreground md:table-cell">
                  <p>{p.order.request.customer.name}</p>
                  <p className="text-xs">{p.order.organization.name}</p>
                </td>
                <td className="p-3">{KIND_LABEL[p.kind]}</td>
                <td className="p-3 font-semibold tabular-nums">
                  {formatMoney(p.amount)}
                </td>
                <td className="hidden p-3 text-muted-foreground sm:table-cell">
                  {p.paidAt
                    ? format(p.paidAt, "d MMM yyyy", { locale: ru })
                    : "—"}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
