import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, MessagesSquare, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  requestStatusLabels,
  requestTypeLabels,
  urgencyLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Заявки" };

const GROUPS = [
  {
    id: "active",
    label: "Активные",
    statuses: [
      "MODERATION",
      "PUBLISHED",
      "HAS_OFFERS",
      "CONTRACTOR_SELECTED",
    ] as RequestStatus[],
  },
  { id: "drafts", label: "Черновики", statuses: ["DRAFT"] as RequestStatus[] },
  {
    id: "archive",
    label: "Архив",
    statuses: ["CONVERTED", "EXPIRED", "CANCELLED"] as RequestStatus[],
  },
] as const;

const STATUS_TONE: Partial<Record<RequestStatus, string>> = {
  PUBLISHED: "bg-secondary text-secondary-foreground",
  HAS_OFFERS: "bg-primary/12 text-primary",
  CONTRACTOR_SELECTED: "bg-success/15 text-success",
  CONVERTED: "bg-success/15 text-success",
  CANCELLED: "bg-muted text-muted-foreground",
  EXPIRED: "bg-muted text-muted-foreground",
  DRAFT: "bg-muted text-muted-foreground",
  MODERATION: "bg-warning/15 text-warning",
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requireRole("CUSTOMER");
  const { view } = await searchParams;
  const group = GROUPS.find((g) => g.id === view) ?? GROUPS[0];

  const [requests, counts] = await Promise.all([
    db.request.findMany({
      where: { customerId: user.id, status: { in: group.statuses } },
      orderBy: { updatedAt: "desc" },
      include: {
        facility: { select: { title: true } },
        _count: { select: { offers: true } },
      },
    }),
    Promise.all(
      GROUPS.map((g) =>
        db.request.count({
          where: { customerId: user.id, status: { in: g.statuses } },
        }),
      ),
    ),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Заявки</h1>
          <p className="text-sm text-muted-foreground">
            От публикации до выбора исполнителя.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/customer/requests/new">
            <Plus className="size-4" />
            Новая заявка
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex gap-1 rounded-xl bg-muted p-1">
        {GROUPS.map((g, i) => (
          <Link
            key={g.id}
            href={g.id === "active" ? "/app/customer/requests" : `?view=${g.id}`}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              group.id === g.id
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {g.label}
            <span className="text-xs tabular-nums text-muted-foreground">
              {counts[i]}
            </span>
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <ClipboardList className="size-10 text-muted-foreground" />
          <p className="font-medium">
            {group.id === "active"
              ? "Активных заявок нет"
              : group.id === "drafts"
                ? "Черновиков нет"
                : "Архив пуст"}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Создайте заявку — проверенные исполнители пришлют предложения с
            ценой и сроками.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {requests.map((r) => (
            <Link key={r.id} href={`/app/customer/requests/${r.id}`}>
              <Card className="mb-3 shadow-card transition-shadow hover:shadow-lg">
                <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{r.title}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          STATUS_TONE[r.status] ?? "bg-muted",
                        )}
                      >
                        {requestStatusLabels[r.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {requestTypeLabels[r.type]} · {r.facility.title} ·{" "}
                      {urgencyLabels[r.urgency]} · обновлена{" "}
                      {formatDistanceToNow(r.updatedAt, {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <MessagesSquare className="size-4 text-muted-foreground" />
                    <span className="font-medium tabular-nums">
                      {r._count.offers}
                    </span>
                    <span className="text-muted-foreground">
                      {r._count.offers === 1 ? "отклик" : "откликов"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {group.id === "active" && requests.length > 0 && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Точный адрес объекта исполнители видят только после заключения
          договора.
        </p>
      )}
    </main>
  );
}
