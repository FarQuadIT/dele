import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Home,
  Lock,
  MapPin,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { getContractorOrg } from "@/lib/contractor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  offerStatusLabels,
  requestTypeLabels,
  systemTypeLabels,
  urgencyLabels,
} from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import { facilityTypeLabels } from "@/lib/validation/facility";
import { OfferForm } from "@/components/contractor/offer-form";

export const metadata: Metadata = { title: "Заявка" };

export default async function ContractorRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);
  const { id } = await params;

  const request = await db.request.findUnique({
    where: { id },
    include: {
      facility: {
        select: { type: true, region: true, area: true, buildYear: true },
      },
      system: { select: { type: true, name: true } },
      equipment: { select: { name: true, brand: true, model: true } },
      _count: { select: { offers: true } },
    },
  });

  if (!request || !["PUBLISHED", "HAS_OFFERS"].includes(request.status)) {
    notFound();
  }

  const myOffer = org
    ? await db.offer.findUnique({
        where: {
          requestId_organizationId: {
            requestId: request.id,
            organizationId: org.id,
          },
        },
      })
    : null;

  const canOffer = org?.verificationStatus === "VERIFIED" && !myOffer;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/app/contractor/requests">
          <ArrowLeft className="size-4" />
          Все заявки
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="text-2xl font-bold tracking-tight">{request.title}</h1>
        {request.urgency === "EMERGENCY" && (
          <Badge variant="destructive">Авария</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {requestTypeLabels[request.type]} · {urgencyLabels[request.urgency]} ·
        откликов: {request._count.offers}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Что нужно сделать</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {request.description ? (
                <p className="leading-relaxed">{request.description}</p>
              ) : (
                <p className="text-muted-foreground">
                  Описание не заполнено — детали уточняйте в чате после отклика.
                </p>
              )}

              <div className="grid gap-2.5 sm:grid-cols-2">
                <InfoTile
                  icon={Home}
                  label="Объект"
                  value={`${facilityTypeLabels[request.facility.type]}${
                    request.facility.area ? `, ${request.facility.area} м²` : ""
                  }${request.facility.buildYear ? `, ${request.facility.buildYear} г.` : ""}`}
                />
                <InfoTile
                  icon={MapPin}
                  label="Район"
                  value={request.facility.region ?? "Уточняется"}
                />
                {request.system && (
                  <InfoTile
                    icon={Home}
                    label="Система"
                    value={`${request.system.name} (${systemTypeLabels[request.system.type]})`}
                  />
                )}
                {request.equipment && (
                  <InfoTile
                    icon={Home}
                    label="Оборудование"
                    value={[
                      request.equipment.name,
                      request.equipment.brand,
                      request.equipment.model,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                )}
                {(request.desiredDateFrom || request.desiredDateTo) && (
                  <InfoTile
                    icon={CalendarDays}
                    label="Желаемые даты"
                    value={[
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
                  />
                )}
                <InfoTile
                  icon={Wallet}
                  label="Бюджет"
                  value={
                    request.budgetMin || request.budgetMax
                      ? `${request.budgetMin ? `от ${formatMoney(request.budgetMin)}` : ""} ${
                          request.budgetMax
                            ? `до ${formatMoney(request.budgetMax)}`
                            : ""
                        }`.trim()
                      : "Не указан"
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {request.needsEstimate && (
                  <Badge variant="secondary">Нужна смета</Badge>
                )}
                {request.needsContract && (
                  <Badge variant="secondary">Нужен договор</Badge>
                )}
                {request.needsWarranty && (
                  <Badge variant="secondary">Нужна гарантия</Badge>
                )}
              </div>

              <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                <Lock className="mt-0.5 size-3.5 shrink-0" />
                Точный адрес и контакты заказчика откроются после подписания
                договора. До этого общение — в чате платформы.
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          {myOffer ? (
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ваш отклик</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Статус</span>
                  <Badge variant="secondary">
                    {offerStatusLabels[myOffer.status]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Цена</span>
                  <span className="font-semibold">
                    {formatMoney(myOffer.priceTotal)}
                  </span>
                </div>
                <p className="pt-1 text-xs text-muted-foreground">
                  Управлять откликом можно в разделе «Мои отклики».
                </p>
                <Button asChild variant="outline" size="sm" className="mt-1">
                  <Link href="/app/contractor/offers">К моим откликам</Link>
                </Button>
              </CardContent>
            </Card>
          ) : canOffer ? (
            <OfferForm requestId={request.id} />
          ) : (
            <Card className="border-warning/40 shadow-card">
              <CardContent className="pt-5 text-sm">
                <p className="font-semibold">Отклик недоступен</p>
                <p className="mt-1 text-muted-foreground">
                  {org
                    ? "Отклики открываются после проверки компании модератором."
                    : "Создайте профиль компании, чтобы откликаться на заявки."}
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link href="/app/contractor/company">К профилю компании</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-2.5">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
