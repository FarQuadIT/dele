"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Inbox,
  Lock,
  MessageSquare,
  Send,
  Undo2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  contractorSendOfferMessage,
  withdrawOffer,
} from "@/lib/actions/contractor-actions";
import { offerStatusLabels, requestTypeLabels } from "@/lib/labels";
import { formatMoney, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OfferStatus, RequestType } from "@/generated/prisma/enums";

type OfferItem = {
  id: string;
  status: OfferStatus;
  priceTotal: number;
  durationDays: number | null;
  warrantyMonths: number | null;
  comment: string | null;
  createdAt: Date;
  request: {
    id: string;
    title: string;
    type: RequestType;
    orderId: string | null;
  };
  messages: {
    id: string;
    body: string;
    createdAt: Date;
    authorId: string;
    authorName: string;
  }[];
};

const STATUS_TONE: Record<OfferStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-secondary text-secondary-foreground",
  ACCEPTED: "bg-success/15 text-success",
  DECLINED: "bg-muted text-muted-foreground",
  WITHDRAWN: "bg-muted text-muted-foreground",
  EXPIRED: "bg-warning/15 text-warning",
};

export function OffersList({
  offers,
  currentUserId,
}: {
  offers: OfferItem[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [chatOfferId, setChatOfferId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const chatOffer = offers.find((o) => o.id === chatOfferId) ?? null;

  async function onWithdraw(id: string) {
    setPending(true);
    const result = await withdrawOffer(id);
    setPending(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Отклик отозван");
    router.refresh();
  }

  if (offers.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <Inbox className="size-10 text-muted-foreground" />
        <p className="font-medium">Откликов пока нет</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Найдите подходящую заявку в разделе «Новые заявки».
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {offers.map((o) => (
        <Card
          key={o.id}
          className={cn(
            "shadow-card",
            o.status === "ACCEPTED" && "border-success/50",
          )}
        >
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <p className="truncate font-semibold">{o.request.title}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    STATUS_TONE[o.status],
                  )}
                >
                  {offerStatusLabels[o.status]}
                </span>
              </div>
              <p className="font-semibold tabular-nums">
                {formatMoney(o.priceTotal)}
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              {requestTypeLabels[o.request.type]} · отправлен{" "}
              {format(o.createdAt, "d MMM yyyy", { locale: ru })}
              {o.durationDays
                ? ` · ${o.durationDays} ${plural(o.durationDays, "день", "дня", "дней")}`
                : ""}
              {o.warrantyMonths ? ` · гарантия ${o.warrantyMonths} мес.` : ""}
            </p>

            {o.status === "ACCEPTED" && (
              <p className="flex items-center gap-2 rounded-lg bg-success/8 p-2.5 text-sm text-success">
                <Lock className="size-4 shrink-0" />
                Отклик принят заказчиком и зафиксирован — изменения недоступны.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {o.request.orderId && (
                <Button asChild size="sm">
                  <Link href={`/app/contractor/orders/${o.request.orderId}`}>
                    К заказу
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChatOfferId(o.id)}
              >
                <MessageSquare className="size-4" />
                Чат с заказчиком
                {o.messages.length > 0 && (
                  <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
                    {o.messages.length}
                  </span>
                )}
              </Button>
              {o.status === "SENT" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  disabled={pending}
                  onClick={() => onWithdraw(o.id)}
                >
                  <Undo2 className="size-4" />
                  Отозвать
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Sheet
        open={chatOffer !== null}
        onOpenChange={(v) => !v && setChatOfferId(null)}
      >
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {chatOffer && (
            <ContractorOfferChat
              key={chatOffer.id}
              offer={chatOffer}
              currentUserId={currentUserId}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ContractorOfferChat({
  offer,
  currentUserId,
}: {
  offer: OfferItem;
  currentUserId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [optimistic, setOptimistic] = useState<OfferItem["messages"]>([]);

  const serverCount = offer.messages.length;
  useEffect(() => {
    setOptimistic([]);
  }, [serverCount]);

  const messages = [...offer.messages, ...optimistic];

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setBody("");
    setOptimistic((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        body: text,
        createdAt: new Date(),
        authorId: currentUserId,
        authorName: "Вы",
      },
    ]);
    const result = await contractorSendOfferMessage({
      offerId: offer.id,
      body: text,
    });
    setSending(false);
    if (!result.ok) {
      toast.error(result.error);
      setOptimistic((prev) => prev.slice(0, -1));
      setBody(text);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle>{offer.request.title}</SheetTitle>
        <SheetDescription>
          Диалог с заказчиком. Контакты откроются после договора.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Сообщений пока нет.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.authorId === currentUserId;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                  mine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-muted",
                )}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    mine
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {formatDistanceToNow(m.createdAt, {
                    addSuffix: true,
                    locale: ru,
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            rows={2}
            placeholder="Ваше сообщение…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            className="min-h-0 resize-none"
          />
          <Button
            size="icon"
            onClick={send}
            disabled={sending || body.trim().length === 0}
            aria-label="Отправить"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
