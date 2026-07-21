import type { Metadata } from "next";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { AdminFilterLink } from "@/components/admin/admin-filter-link";
import { orderStatusLabels } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Заказы" };

const FILTERS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  {
    key: "active",
    label: "Активные",
    statuses: [
      "AWAITING_CONTRACT",
      "AWAITING_PREPAYMENT",
      "PLANNING",
      "IN_PROGRESS",
      "PAUSED",
      "AWAITING_ACCEPTANCE",
      "REWORK",
      "AWAITING_FINAL_PAYMENT",
    ],
  },
  { key: "attention", label: "Требуют внимания", statuses: ["DISPUTE", "INSPECTION", "REWORK"] },
  { key: "done", label: "Завершённые", statuses: ["COMPLETED", "CANCELLED"] },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  await requireRole("ADMIN");
  const { f } = await searchParams;

  const filter = FILTERS.find((x) => x.key === f);
  const where: Prisma.OrderWhereInput = filter
    ? { status: { in: filter.statuses } }
    : {};

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      request: {
        select: { title: true, customer: { select: { name: true } } },
      },
      organization: { select: { name: true } },
      stages: { select: { status: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Заказы</h1>
      <p className="text-sm text-muted-foreground">
        Сделки между заказчиками и компаниями.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <AdminFilterLink href="/admin/orders" active={!filter}>
          Все
        </AdminFilterLink>
        {FILTERS.map((x) => (
          <AdminFilterLink
            key={x.key}
            href={`/admin/orders?f=${x.key}`}
            active={f === x.key}
          >
            {x.label}
          </AdminFilterLink>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium text-muted-foreground">Заказ</th>
              <th className="hidden p-3 font-medium text-muted-foreground md:table-cell">
                Стороны
              </th>
              <th className="p-3 font-medium text-muted-foreground">Статус</th>
              <th className="hidden p-3 font-medium text-muted-foreground sm:table-cell">
                Этапы
              </th>
              <th className="p-3 font-medium text-muted-foreground">Сумма</th>
              <th className="hidden p-3 font-medium text-muted-foreground lg:table-cell">
                Создан
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-muted-foreground"
                >
                  Заказов нет
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const done = o.stages.filter(
                  (s) => s.status === "DONE",
                ).length;
                return (
                  <tr key={o.id} className="border-b last:border-b-0">
                    <td className="max-w-60 p-3">
                      <p className="font-medium">{o.number}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.request.title}
                      </p>
                    </td>
                    <td className="hidden p-3 text-muted-foreground md:table-cell">
                      <p>{o.request.customer.name}</p>
                      <p className="text-xs">{o.organization.name}</p>
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
                        {orderStatusLabels[o.status]}
                      </span>
                    </td>
                    <td className="hidden p-3 tabular-nums text-muted-foreground sm:table-cell">
                      {o.stages.length > 0
                        ? `${done}/${o.stages.length}`
                        : "—"}
                    </td>
                    <td className="p-3 font-semibold tabular-nums">
                      {formatMoney(o.priceTotal)}
                    </td>
                    <td className="hidden p-3 text-muted-foreground lg:table-cell">
                      {format(o.createdAt, "d.MM.yyyy", { locale: ru })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
