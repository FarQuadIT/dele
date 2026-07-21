import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Wallet } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  requestStatusLabels,
  requestTypeLabels,
  urgencyLabels,
} from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import { OffersBoard } from "@/components/customer/requests/offers-board";
import { RequestActions } from "@/components/customer/requests/request-actions";

export const metadata: Metadata = { title: "Заявка" };

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("CUSTOMER");
  const { id } = await params;

  const request = await db.request.findFirst({
    where: { id, customerId: user.id },
    include: {
      facility: { select: { id: true, title: true, address: true } },
      system: { select: { name: true } },
      equipment: { select: { name: true } },
      order: { select: { id: true } },
      offers: {
        orderBy: { createdAt: "asc" },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              verificationStatus: true,
              ratingAvg: true,
              ratingCount: true,
              specializations: true,
            },
          },
          threads: {
            include: {
              messages: {
                orderBy: { createdAt: "asc" },
                include: { author: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!request) notFound();

  const visibleOffers = request.offers.filter(
    (o) => o.status !== "DRAFT" && o.status !== "WITHDRAWN",
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/app/customer/requests">
          <ArrowLeft className="size-4" />
          Все заявки
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {request.title}
            </h1>
            <Badge variant="secondary">
              {requestStatusLabels[request.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {requestTypeLabels[request.type]} ·{" "}
            {urgencyLabels[request.urgency]}
            {request.publishedAt
              ? ` · опубликована ${format(request.publishedAt, "d MMMM", { locale: ru })}`
              : ""}
          </p>
        </div>
        <RequestActions
          id={request.id}
          status={request.status}
          orderId={request.order?.id}
          acceptedOffer={
            request.acceptedOfferId
              ? (() => {
                  const accepted = request.offers.find(
                    (o) => o.id === request.acceptedOfferId,
                  );
                  if (!accepted) return undefined;
                  const schedule =
                    accepted.paymentSchedule &&
                    typeof accepted.paymentSchedule === "object" &&
                    !Array.isArray(accepted.paymentSchedule)
                      ? (accepted.paymentSchedule as { prepayment?: number })
                      : null;
                  const share = schedule?.prepayment ?? 0.3;
                  return {
                    orgName: accepted.organization.name,
                    priceTotal: accepted.priceTotal,
                    prepaymentAmount: Math.round(accepted.priceTotal * share),
                  };
                })()
              : undefined
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Сводка */}
        <div className="space-y-4">
          <Card className="h-fit shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Детали заявки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">{request.facility.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Адрес скрыт от исполнителей до договора
                  </p>
                </div>
              </div>
              {(request.system || request.equipment) && (
                <div className="flex flex-wrap gap-2">
                  {request.system && (
                    <Badge variant="outline">{request.system.name}</Badge>
                  )}
                  {request.equipment && (
                    <Badge variant="outline">{request.equipment.name}</Badge>
                  )}
                </div>
              )}
              {request.description && (
                <p className="rounded-lg bg-muted/60 p-3 leading-relaxed text-muted-foreground">
                  {request.description}
                </p>
              )}
              {(request.desiredDateFrom || request.desiredDateTo) && (
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {[
                      request.desiredDateFrom &&
                        format(request.desiredDateFrom, "d MMM", {
                          locale: ru,
                        }),
                      request.desiredDateTo &&
                        format(request.desiredDateTo, "d MMM yyyy", {
                          locale: ru,
                        }),
                    ]
                      .filter(Boolean)
                      .join(" — ")}
                    {request.visitTimeNote ? ` · ${request.visitTimeNote}` : ""}
                  </span>
                </div>
              )}
              {(request.budgetMin || request.budgetMax) && (
                <div className="flex items-center gap-2.5">
                  <Wallet className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {request.budgetMin
                      ? `от ${formatMoney(request.budgetMin)}`
                      : ""}{" "}
                    {request.budgetMax
                      ? `до ${formatMoney(request.budgetMax)}`
                      : ""}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {request.needsEstimate && (
                  <Badge variant="secondary">Смета</Badge>
                )}
                {request.needsContract && (
                  <Badge variant="secondary">Договор</Badge>
                )}
                {request.needsWarranty && (
                  <Badge variant="secondary">Гарантия</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Отклики */}
        <OffersBoard
          requestStatus={request.status}
          acceptedOfferId={request.acceptedOfferId}
          currentUserId={user.id}
          offers={visibleOffers.map((o) => ({
            id: o.id,
            status: o.status,
            priceTotal: o.priceTotal,
            priceMaterials: o.priceMaterials,
            isEstimate: o.isEstimate,
            durationDays: o.durationDays,
            warrantyMonths: o.warrantyMonths,
            validUntil: o.validUntil,
            comment: o.comment,
            stagesPlan: Array.isArray(o.stagesPlan)
              ? (o.stagesPlan as string[])
              : null,
            organization: {
              id: o.organization.id,
              name: o.organization.name,
              verified: o.organization.verificationStatus === "VERIFIED",
              ratingAvg: o.organization.ratingAvg,
              ratingCount: o.organization.ratingCount,
            },
            messages: (o.threads[0]?.messages ?? []).map((m) => ({
              id: m.id,
              body: m.body,
              createdAt: m.createdAt,
              authorId: m.author.id,
              authorName: m.author.name ?? "Пользователь",
            })),
          }))}
        />
      </div>
    </main>
  );
}
