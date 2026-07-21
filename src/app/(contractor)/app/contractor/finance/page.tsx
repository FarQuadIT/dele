import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { getContractorOrg } from "@/lib/contractor";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Финансы" };

const COMMISSION = 0.07;

export default async function FinancePage() {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);

  const payments = org
    ? await db.payment.findMany({
        where: { order: { organizationId: org.id } },
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              id: true,
              number: true,
              request: { select: { title: true } },
            },
          },
        },
      })
    : [];

  const received = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((acc, p) => acc + p.amount, 0);
  const expected = payments
    .filter((p) => p.status === "PENDING")
    .reduce((acc, p) => acc + p.amount, 0);
  const commission = Math.round(received * COMMISSION);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Финансы</h1>
      <p className="text-sm text-muted-foreground">
        Поступления по заказам и комиссия платформы (демо-расчёт).
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Получено</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatMoney(received)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Ожидается</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatMoney(expected)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">
              Комиссия DELE (7%)
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatMoney(commission)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium text-muted-foreground">Заказ</th>
              <th className="p-3 font-medium text-muted-foreground">Тип</th>
              <th className="p-3 font-medium text-muted-foreground">Сумма</th>
              <th className="hidden p-3 font-medium text-muted-foreground sm:table-cell">
                Дата
              </th>
              <th className="p-3 font-medium text-muted-foreground">Статус</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-muted-foreground"
                >
                  Платежей пока нет
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="p-3">
                    <Link
                      href={`/app/contractor/orders/${p.order.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {p.order.number}
                    </Link>
                    <p className="max-w-50 truncate text-xs text-muted-foreground">
                      {p.order.request.title}
                    </p>
                  </td>
                  <td className="p-3">
                    {p.kind === "PREPAYMENT"
                      ? "Предоплата"
                      : p.kind === "FINAL"
                        ? "Финальный"
                        : "Доплата"}
                  </td>
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
                        p.status === "SUCCEEDED"
                          ? "bg-success/15 text-success"
                          : "bg-warning/15 text-warning",
                      )}
                    >
                      {p.status === "SUCCEEDED" ? "Получен" : "Ожидается"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
