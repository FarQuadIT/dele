import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { getContractorOrg } from "@/lib/contractor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  requestTypeLabels,
  systemTypeLabels,
  urgencyLabels,
} from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import { RequestFilters } from "@/components/contractor/request-filters";
import { cn } from "@/lib/utils";
import type { RequestType, UrgencyLevel } from "@/generated/prisma/enums";
import { requestTypeValues, urgencyValues } from "@/lib/validation/request";

export const metadata: Metadata = { title: "Новые заявки" };

export default async function ContractorRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; urgency?: string; sort?: string }>;
}) {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);
  const params = await searchParams;

  const type = requestTypeValues.includes(params.type as RequestType)
    ? (params.type as RequestType)
    : undefined;
  const urgency = urgencyValues.includes(params.urgency as UrgencyLevel)
    ? (params.urgency as UrgencyLevel)
    : undefined;
  const sort = params.sort === "budget" ? "budget" : "fresh";

  const requests = await db.request.findMany({
    where: {
      status: { in: ["PUBLISHED", "HAS_OFFERS"] },
      ...(type ? { type } : {}),
      ...(urgency ? { urgency } : {}),
    },
    orderBy:
      sort === "budget"
        ? [{ budgetMax: { sort: "desc", nulls: "last" } }]
        : [{ publishedAt: "desc" }],
    include: {
      facility: { select: { type: true, region: true } },
      system: { select: { type: true } },
      _count: { select: { offers: true } },
      offers: org
        ? { where: { organizationId: org.id }, select: { id: true } }
        : false,
    },
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Новые заявки</h1>
        <p className="text-sm text-muted-foreground">
          Обезличенные заявки владельцев: без адресов и контактов до договора.
        </p>
      </div>

      <RequestFilters
        current={{ type: params.type, urgency: params.urgency, sort }}
      />

      {requests.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Inbox className="size-10 text-muted-foreground" />
          <p className="font-medium">По фильтрам ничего не нашлось</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Попробуйте сбросить фильтры или зайдите позже.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {requests.map((r) => {
            const alreadyOffered =
              Array.isArray(r.offers) && r.offers.length > 0;
            return (
              <Link
                key={r.id}
                href={`/app/contractor/requests/${r.id}`}
                className="block"
              >
                <Card
                  className={cn(
                    "shadow-card transition-shadow hover:shadow-lg",
                    r.urgency === "EMERGENCY" && "border-destructive/40",
                  )}
                >
                  <CardContent className="space-y-2.5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{r.title}</p>
                      {r.urgency === "EMERGENCY" && (
                        <Badge variant="destructive">Авария</Badge>
                      )}
                      {alreadyOffered && (
                        <Badge variant="secondary">Вы откликнулись</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                      <span>{requestTypeLabels[r.type]}</span>
                      {r.system && (
                        <span>· {systemTypeLabels[r.system.type]}</span>
                      )}
                      <span>· {urgencyLabels[r.urgency]}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {r.facility.region ?? "Регион скрыт"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {r.publishedAt
                          ? `Опубликована ${formatDistanceToNow(r.publishedAt, { addSuffix: true, locale: ru })}`
                          : ""}
                        {" · "}
                        откликов: {r._count.offers}
                      </span>
                      <span className="font-semibold">
                        {r.budgetMin || r.budgetMax
                          ? `${r.budgetMin ? `от ${formatMoney(r.budgetMin)}` : ""} ${
                              r.budgetMax
                                ? `до ${formatMoney(r.budgetMax)}`
                                : ""
                            }`.trim()
                          : "Бюджет не указан"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
