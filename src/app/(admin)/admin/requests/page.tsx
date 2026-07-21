import type { Metadata } from "next";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { AdminFilterLink } from "@/components/admin/admin-filter-link";
import { requestStatusLabels, requestTypeLabels } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import type { Prisma, RequestStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Заявки" };

const FILTERS: { key: string; label: string; statuses: RequestStatus[] }[] = [
  { key: "open", label: "Открытые", statuses: ["PUBLISHED", "HAS_OFFERS"] },
  { key: "converted", label: "В заказе", statuses: ["CONVERTED"] },
  { key: "draft", label: "Черновики", statuses: ["DRAFT"] },
  {
    key: "closed",
    label: "Закрытые",
    statuses: ["CANCELLED", "EXPIRED"],
  },
];

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  await requireRole("ADMIN");
  const { f } = await searchParams;

  const filter = FILTERS.find((x) => x.key === f);
  const where: Prisma.RequestWhereInput = filter
    ? { status: { in: filter.statuses } }
    : {};

  const requests = await db.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true } },
      facility: { select: { title: true } },
      _count: { select: { offers: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Заявки</h1>
      <p className="text-sm text-muted-foreground">
        Все заявки платформы: статусы, отклики и бюджеты.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <AdminFilterLink href="/admin/requests" active={!filter}>
          Все
        </AdminFilterLink>
        {FILTERS.map((x) => (
          <AdminFilterLink
            key={x.key}
            href={`/admin/requests?f=${x.key}`}
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
              <th className="p-3 font-medium text-muted-foreground">Заявка</th>
              <th className="hidden p-3 font-medium text-muted-foreground md:table-cell">
                Заказчик
              </th>
              <th className="p-3 font-medium text-muted-foreground">Статус</th>
              <th className="hidden p-3 font-medium text-muted-foreground sm:table-cell">
                Отклики
              </th>
              <th className="hidden p-3 font-medium text-muted-foreground lg:table-cell">
                Бюджет
              </th>
              <th className="hidden p-3 font-medium text-muted-foreground sm:table-cell">
                Создана
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-muted-foreground"
                >
                  Заявок нет
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="max-w-60 p-3">
                    <p className="truncate font-medium">{r.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {requestTypeLabels[r.type]} · {r.facility.title}
                    </p>
                  </td>
                  <td className="hidden p-3 text-muted-foreground md:table-cell">
                    {r.customer.name}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
                      {requestStatusLabels[r.status]}
                    </span>
                  </td>
                  <td className="hidden p-3 tabular-nums sm:table-cell">
                    {r._count.offers}
                  </td>
                  <td className="hidden p-3 text-muted-foreground lg:table-cell">
                    {r.budgetMax
                      ? `до ${formatMoney(r.budgetMax)}`
                      : r.budgetMin
                        ? `от ${formatMoney(r.budgetMin)}`
                        : "—"}
                  </td>
                  <td className="hidden p-3 text-muted-foreground sm:table-cell">
                    {format(r.createdAt, "d.MM.yyyy", { locale: ru })}
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
