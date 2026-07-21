import type { Metadata } from "next";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { AdminFilterLink } from "@/components/admin/admin-filter-link";
import { CompanyModeration } from "@/components/admin/company-moderation";
import { systemTypeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type {
  OrgVerificationStatus,
  Prisma,
} from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Компании" };

const STATUS_LABEL: Record<OrgVerificationStatus, string> = {
  UNVERIFIED: "Без проверки",
  PENDING: "Ждёт модерации",
  VERIFIED: "Проверена",
  REJECTED: "Отклонена",
};

const STATUS_TONE: Record<OrgVerificationStatus, string> = {
  UNVERIFIED: "bg-muted text-muted-foreground",
  PENDING: "bg-warning/15 text-warning",
  VERIFIED: "bg-success/15 text-success",
  REJECTED: "bg-destructive/12 text-destructive",
};

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN");
  const { status } = await searchParams;

  const where: Prisma.OrganizationWhereInput =
    status && status in STATUS_LABEL
      ? { verificationStatus: status as OrgVerificationStatus }
      : {};

  const companies = await db.organization.findMany({
    where,
    orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }],
    include: {
      members: {
        where: { role: "OWNER" },
        take: 1,
        include: { user: { select: { name: true, email: true } } },
      },
      _count: { select: { offers: true, orders: true } },
    },
  });

  const pendingCount = await db.organization.count({
    where: { verificationStatus: "PENDING" },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Компании</h1>
      <p className="text-sm text-muted-foreground">
        Модерация открывает компаниям доступ к откликам.
        {pendingCount > 0 && ` Сейчас в очереди: ${pendingCount}.`}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <AdminFilterLink href="/admin/companies" active={!status}>
          Все
        </AdminFilterLink>
        {(Object.keys(STATUS_LABEL) as OrgVerificationStatus[]).map((s) => (
          <AdminFilterLink
            key={s}
            href={`/admin/companies?status=${s}`}
            active={status === s}
          >
            {STATUS_LABEL[s]}
          </AdminFilterLink>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {companies.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Компаний с таким статусом нет.
          </p>
        )}
        {companies.map((c) => {
          const owner = c.members[0]?.user;
          const specializations = Array.isArray(c.specializations)
            ? (c.specializations as string[])
            : [];
          return (
            <Card key={c.id} className="shadow-card">
              <CardContent className="space-y-3 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <p className="truncate text-base font-semibold">
                      {c.name}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        STATUS_TONE[c.verificationStatus],
                      )}
                    >
                      {STATUS_LABEL[c.verificationStatus]}
                    </span>
                    {c.ratingCount > 0 && (
                      <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                        <Star className="size-3.5 fill-warning text-warning" />
                        {c.ratingAvg.toFixed(1)} ({c.ratingCount})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    с {format(c.createdAt, "d MMM yyyy", { locale: ru })}
                  </p>
                </div>

                <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <p className="text-muted-foreground">
                    ИНН: <span className="text-foreground">{c.inn ?? "—"}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Владелец:{" "}
                    <span className="text-foreground">
                      {owner ? `${owner.name} (${owner.email})` : "—"}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Активность:{" "}
                    <span className="text-foreground">
                      {c._count.offers} откликов · {c._count.orders} заказов
                    </span>
                  </p>
                  {specializations.length > 0 && (
                    <p className="truncate text-muted-foreground">
                      Специализации:{" "}
                      <span className="text-foreground">
                        {specializations
                          .map(
                            (s) =>
                              systemTypeLabels[
                                s as keyof typeof systemTypeLabels
                              ] ?? s,
                          )
                          .join(", ")}
                      </span>
                    </p>
                  )}
                </div>

                {c.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                )}

                {c.verificationNote &&
                  c.verificationStatus === "REJECTED" && (
                    <p className="rounded-lg bg-destructive/8 p-2.5 text-sm text-destructive">
                      Причина отклонения: {c.verificationNote}
                    </p>
                  )}

                <CompanyModeration
                  organizationId={c.id}
                  status={c.verificationStatus}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
