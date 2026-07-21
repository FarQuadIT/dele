import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Landmark, MapPin, Phone, User } from "lucide-react";
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
import { orderStatusLabels } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import { StageManager } from "@/components/contractor/stage-manager";
import { ContractorOrderChat } from "@/components/contractor/contractor-order-chat";
import { ProfileProposalForm } from "@/components/contractor/profile-proposal-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Заказ" };

export default async function ContractorOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);
  const { id } = await params;

  if (!org) notFound();

  const order = await db.order.findFirst({
    where: { id, organizationId: org.id },
    include: {
      request: {
        select: {
          title: true,
          description: true,
          contactName: true,
          contactPhone: true,
          customer: { select: { name: true } },
        },
      },
      facility: {
        select: {
          title: true,
          address: true,
          equipment: {
            select: {
              id: true,
              name: true,
              brand: true,
              model: true,
              serialNumber: true,
            },
            orderBy: { name: "asc" },
          },
        },
      },
      stages: {
        orderBy: { index: "asc" },
        include: { evidence: { orderBy: { createdAt: "asc" } } },
      },
      payments: { orderBy: { createdAt: "asc" } },
      threads: {
        where: { kind: "ORDER" },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const messages = (order.threads[0]?.messages ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt,
    authorId: m.author.id,
    authorName: m.author.name ?? "Пользователь",
  }));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/app/contractor/orders">
          <ArrowLeft className="size-4" />
          Все заказы
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {order.request.title}
            </h1>
            <Badge variant="secondary">{orderStatusLabels[order.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.number}
            {order.scheduledStartAt &&
              ` · ${format(order.scheduledStartAt, "d MMM", { locale: ru })}`}
            {order.scheduledEndAt &&
              ` — ${format(order.scheduledEndAt, "d MMM yyyy", { locale: ru })}`}
          </p>
        </div>
        <p className="text-2xl font-bold tracking-tight tabular-nums">
          {formatMoney(order.priceTotal)}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <StageManager
            orderId={order.id}
            orderStatus={order.status}
            stages={order.stages.map((s) => ({
              id: s.id,
              index: s.index,
              name: s.name,
              status: s.status,
              plannedAt: s.plannedAt,
              startedAt: s.startedAt,
              completedAt: s.completedAt,
              evidence: s.evidence.map((e) => ({
                id: e.id,
                note: e.note,
                createdAt: e.createdAt,
              })),
            }))}
          />

          <ContractorOrderChat
            orderId={order.id}
            currentUserId={user.id}
            messages={messages}
          />

          <ProfileProposalForm
            orderId={order.id}
            equipment={order.facility.equipment}
          />
        </div>

        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-primary" />
                Заказчик
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">
                {order.request.contactName ??
                  order.request.customer.name ??
                  "Заказчик"}
              </p>
              {order.addressRevealed ? (
                <>
                  {order.request.contactPhone && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-3.5" />
                      {order.request.contactPhone}
                    </p>
                  )}
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    {order.facility.address}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Контакты откроются после подписания договора.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="size-4 text-primary" />
                Оплаты
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {order.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {p.kind === "PREPAYMENT"
                        ? "Предоплата"
                        : p.kind === "FINAL"
                          ? "Финальный платёж"
                          : "Доплата"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.paidAt
                        ? `получен ${format(p.paidAt, "d MMM yyyy", { locale: ru })}`
                        : "ожидается"}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "font-semibold tabular-nums",
                      p.status === "SUCCEEDED"
                        ? "text-success"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatMoney(p.amount)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {order.request.description && (
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Задача</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {order.request.description}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
