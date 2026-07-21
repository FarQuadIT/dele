import type { Metadata } from "next";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Prisma, UserRole } from "@/generated/prisma/client";
import { AdminFilterLink } from "@/components/admin/admin-filter-link";

export const metadata: Metadata = { title: "Пользователи" };

const ROLE_LABEL: Record<UserRole, string> = {
  CUSTOMER: "Заказчик",
  CONTRACTOR: "Исполнитель",
  ADMIN: "Администратор",
};

const ROLE_TONE: Record<UserRole, string> = {
  CUSTOMER: "bg-secondary text-secondary-foreground",
  CONTRACTOR: "bg-primary/12 text-primary",
  ADMIN: "bg-warning/15 text-warning",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  await requireRole("ADMIN");
  const { role } = await searchParams;

  const where: Prisma.UserWhereInput =
    role && role in ROLE_LABEL ? { role: role as UserRole } : {};

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { facilitiesOwned: true, requests: true } },
      memberships: {
        take: 1,
        include: { organization: { select: { name: true } } },
      },
    },
  });

  const total = await db.user.count();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Пользователи</h1>
      <p className="text-sm text-muted-foreground">
        {total} {plural(total, "аккаунт", "аккаунта", "аккаунтов")} на
        платформе.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <AdminFilterLink href="/admin/users" active={!role}>
          Все
        </AdminFilterLink>
        {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
          <AdminFilterLink
            key={r}
            href={`/admin/users?role=${r}`}
            active={role === r}
          >
            {ROLE_LABEL[r]}
          </AdminFilterLink>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium text-muted-foreground">
                Пользователь
              </th>
              <th className="p-3 font-medium text-muted-foreground">Роль</th>
              <th className="hidden p-3 font-medium text-muted-foreground md:table-cell">
                Активность
              </th>
              <th className="hidden p-3 font-medium text-muted-foreground sm:table-cell">
                Регистрация
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-b-0">
                <td className="p-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="p-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      ROLE_TONE[u.role],
                    )}
                  >
                    {ROLE_LABEL[u.role]}
                  </span>
                  {u.memberships[0] && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {u.memberships[0].organization.name}
                    </p>
                  )}
                </td>
                <td className="hidden p-3 text-muted-foreground md:table-cell">
                  {u.role === "CUSTOMER"
                    ? `${u._count.facilitiesOwned} объектов · ${u._count.requests} заявок`
                    : "—"}
                </td>
                <td className="hidden p-3 text-muted-foreground sm:table-cell">
                  {format(u.createdAt, "d MMM yyyy", { locale: ru })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
