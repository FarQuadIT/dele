"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  Inbox,
  MessageSquare,
  Scale,
  Send,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  acceptOffer,
  declineOffer,
  sendOfferMessage,
} from "@/lib/actions/request-actions";
import { offerStatusLabels } from "@/lib/labels";
import { formatMoney, plural } from "@/lib/format";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { OfferStatus, RequestStatus } from "@/generated/prisma/enums";

export type OfferView = {
  id: string;
  status: OfferStatus;
  priceTotal: number;
  priceMaterials: number | null;
  isEstimate: boolean;
  durationDays: number | null;
  warrantyMonths: number | null;
  validUntil: Date | null;
  comment: string | null;
  stagesPlan: string[] | null;
  organization: {
    id: string;
    name: string;
    verified: boolean;
    ratingAvg: number;
    ratingCount: number;
  };
  messages: {
    id: string;
    body: string;
    createdAt: Date;
    authorId: string;
    authorName: string;
  }[];
};

export function OffersBoard({
  offers,
  requestStatus,
  acceptedOfferId,
  currentUserId,
}: {
  offers: OfferView[];
  requestStatus: RequestStatus;
  acceptedOfferId: string | null;
  currentUserId: string;
}) {
  const router = useRouter();
  const [compare, setCompare] = useState(false);
  const [chatOfferId, setChatOfferId] = useState<string | null>(null);
  const [acceptCandidate, setAcceptCandidate] = useState<OfferView | null>(
    null,
  );
  const [pending, setPending] = useState(false);

  const canChoose =
    !acceptedOfferId &&
    ["PUBLISHED", "HAS_OFFERS"].includes(requestStatus);

  const chatOffer = offers.find((o) => o.id === chatOfferId) ?? null;

  const sorted = useMemo(
    () =>
      [...offers].sort((a, b) => {
        if (a.id === acceptedOfferId) return -1;
        if (b.id === acceptedOfferId) return 1;
        return a.priceTotal - b.priceTotal;
      }),
    [offers, acceptedOfferId],
  );

  async function onAccept() {
    if (!acceptCandidate) return;
    setPending(true);
    const result = await acceptOffer(acceptCandidate.id);
    setPending(false);
    if (!result.ok) return void toast.error(result.error);
    track({ name: "offer_accepted" });
    toast.success(
      `Исполнитель выбран: ${acceptCandidate.organization.name}. Следующий шаг — договор.`,
    );
    setAcceptCandidate(null);
    router.refresh();
  }

  async function onDecline(offerId: string) {
    setPending(true);
    const result = await declineOffer(offerId);
    setPending(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Отклик отклонён");
    router.refresh();
  }

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
        <Inbox className="size-8 text-muted-foreground" />
        <p className="font-medium">Откликов пока нет</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Обычно первые предложения приходят в течение нескольких часов после
          публикации.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Отклики{" "}
          <span className="text-muted-foreground">({offers.length})</span>
        </h2>
        {offers.length >= 2 && (
          <Button
            variant={compare ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setCompare((v) => !v);
              if (!compare)
                track({ name: "offer_compare_opened", count: offers.length });
            }}
          >
            <Scale className="size-4" />
            {compare ? "К карточкам" : "Сравнить"}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {compare ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="overflow-x-auto rounded-2xl border shadow-card"
          >
            <table className="w-full min-w-130 text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3 font-medium text-muted-foreground">
                    Параметр
                  </th>
                  {sorted.map((o) => (
                    <th key={o.id} className="p-3 font-semibold">
                      <div className="flex items-center gap-1.5">
                        {o.organization.name}
                        {o.organization.verified && (
                          <BadgeCheck className="size-4 text-primary" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow
                  label="Цена"
                  values={sorted.map((o) => ({
                    key: o.id,
                    node: (
                      <span className="font-semibold">
                        {formatMoney(o.priceTotal)}
                        {o.isEstimate && (
                          <span className="text-xs font-normal text-muted-foreground">
                            {" "}
                            (оценка)
                          </span>
                        )}
                      </span>
                    ),
                  }))}
                  highlightKey={
                    sorted.reduce((min, o) =>
                      o.priceTotal < min.priceTotal ? o : min,
                    ).id
                  }
                />
                <CompareRow
                  label="Материалы"
                  values={sorted.map((o) => ({
                    key: o.id,
                    node: o.priceMaterials
                      ? formatMoney(o.priceMaterials)
                      : "включены / не указаны",
                  }))}
                />
                <CompareRow
                  label="Срок"
                  values={sorted.map((o) => ({
                    key: o.id,
                    node: o.durationDays
                      ? `${o.durationDays} ${plural(o.durationDays, "день", "дня", "дней")}`
                      : "—",
                  }))}
                />
                <CompareRow
                  label="Гарантия"
                  values={sorted.map((o) => ({
                    key: o.id,
                    node: o.warrantyMonths ? `${o.warrantyMonths} мес.` : "—",
                  }))}
                  highlightKey={
                    sorted.filter((o) => o.warrantyMonths).length > 0
                      ? sorted.reduce((max, o) =>
                          (o.warrantyMonths ?? 0) > (max.warrantyMonths ?? 0)
                            ? o
                            : max,
                        ).id
                      : undefined
                  }
                />
                <CompareRow
                  label="Рейтинг"
                  values={sorted.map((o) => ({
                    key: o.id,
                    node:
                      o.organization.ratingCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3.5 fill-warning text-warning" />
                          {o.organization.ratingAvg.toFixed(1)}
                          <span className="text-xs text-muted-foreground">
                            ({o.organization.ratingCount})
                          </span>
                        </span>
                      ) : (
                        "новая компания"
                      ),
                  }))}
                />
                <CompareRow
                  label="Действует до"
                  values={sorted.map((o) => ({
                    key: o.id,
                    node: o.validUntil
                      ? format(o.validUntil, "d MMM", { locale: ru })
                      : "—",
                  }))}
                />
                {canChoose && (
                  <tr>
                    <td className="p-3" />
                    {sorted.map((o) => (
                      <td key={o.id} className="p-3">
                        {o.status === "SENT" && (
                          <Button
                            size="sm"
                            onClick={() => setAcceptCandidate(o)}
                          >
                            Выбрать
                          </Button>
                        )}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {sorted.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                accepted={o.id === acceptedOfferId}
                canChoose={canChoose}
                pending={pending}
                onAccept={() => setAcceptCandidate(o)}
                onDecline={() => onDecline(o.id)}
                onChat={() => setChatOfferId(o.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Подтверждение выбора */}
      <Dialog
        open={acceptCandidate !== null}
        onOpenChange={(v) => !v && setAcceptCandidate(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Выбрать исполнителя?</DialogTitle>
            <DialogDescription>
              {acceptCandidate && (
                <>
                  «{acceptCandidate.organization.name}» —{" "}
                  {formatMoney(acceptCandidate.priceTotal)}. Остальные отклики
                  будут отклонены, следующий шаг — договор и предоплата.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAcceptCandidate(null)}>
              Отмена
            </Button>
            <Button onClick={onAccept} disabled={pending}>
              {pending ? "Выбираем…" : "Подтвердить выбор"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Чат */}
      <Sheet
        open={chatOffer !== null}
        onOpenChange={(v) => !v && setChatOfferId(null)}
      >
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {chatOffer && (
            <OfferChat
              offer={chatOffer}
              currentUserId={currentUserId}
              onSent={() => router.refresh()}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CompareRow({
  label,
  values,
  highlightKey,
}: {
  label: string;
  values: { key: string; node: React.ReactNode }[];
  highlightKey?: string;
}) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="p-3 text-muted-foreground">{label}</td>
      {values.map((v) => (
        <td
          key={v.key}
          className={cn("p-3", v.key === highlightKey && "bg-success/8")}
        >
          <span className="inline-flex items-center gap-1.5">
            {v.node}
            {v.key === highlightKey && (
              <Check className="size-3.5 text-success" />
            )}
          </span>
        </td>
      ))}
    </tr>
  );
}

function OfferCard({
  offer: o,
  accepted,
  canChoose,
  pending,
  onAccept,
  onDecline,
  onChat,
}: {
  offer: OfferView;
  accepted: boolean;
  canChoose: boolean;
  pending: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onChat: () => void;
}) {
  const [stagesOpen, setStagesOpen] = useState(false);
  const inactive = ["DECLINED", "EXPIRED"].includes(o.status);

  return (
    <Card
      className={cn(
        "shadow-card transition-all",
        accepted && "border-success ring-1 ring-success/40",
        inactive && "opacity-60",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold">{o.organization.name}</p>
              {o.organization.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  <BadgeCheck className="size-3.5" />
                  Проверена
                </span>
              )}
              {accepted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                  <Check className="size-3.5" />
                  Выбран
                </span>
              )}
              {inactive && (
                <Badge variant="outline">{offerStatusLabels[o.status]}</Badge>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              {o.organization.ratingCount > 0 ? (
                <>
                  <Star className="size-3.5 fill-warning text-warning" />
                  {o.organization.ratingAvg.toFixed(1)} ·{" "}
                  {o.organization.ratingCount}{" "}
                  {plural(
                    o.organization.ratingCount,
                    "отзыв",
                    "отзыва",
                    "отзывов",
                  )}
                </>
              ) : (
                "Отзывов пока нет"
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold tracking-tight">
              {formatMoney(o.priceTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {o.isEstimate ? "предварительная оценка" : "фиксированная цена"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {o.durationDays && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {o.durationDays} {plural(o.durationDays, "день", "дня", "дней")}
            </span>
          )}
          {o.warrantyMonths && (
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" />
              гарантия {o.warrantyMonths} мес.
            </span>
          )}
          {o.validUntil && (
            <span>
              действует до {format(o.validUntil, "d MMM", { locale: ru })}
            </span>
          )}
        </div>

        {o.comment && <p className="text-sm leading-relaxed">{o.comment}</p>}

        {o.stagesPlan && o.stagesPlan.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setStagesOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              План работ ({o.stagesPlan.length})
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  stagesOpen && "rotate-180",
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {stagesOpen && (
                <motion.ol
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 space-y-1.5 overflow-hidden"
                >
                  {o.stagesPlan.map((s, i) => (
                    <li
                      key={s}
                      className="flex items-center gap-2.5 text-sm text-muted-foreground"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </motion.ol>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {canChoose && o.status === "SENT" && (
            <Button onClick={onAccept} disabled={pending}>
              <Check className="size-4" />
              Выбрать исполнителя
            </Button>
          )}
          <Button variant="outline" onClick={onChat}>
            <MessageSquare className="size-4" />
            Чат
            {o.messages.length > 0 && (
              <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
                {o.messages.length}
              </span>
            )}
          </Button>
          {canChoose && o.status === "SENT" && (
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={onDecline}
              disabled={pending}
            >
              <X className="size-4" />
              Отклонить
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OfferChat({
  offer,
  currentUserId,
  onSent,
}: {
  offer: OfferView;
  currentUserId: string;
  onSent: () => void;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [optimistic, setOptimistic] = useState<OfferView["messages"]>([]);

  // После router.refresh сервер уже содержит отправленное сообщение —
  // локальную оптимистичную копию убираем.
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
    const result = await sendOfferMessage({ offerId: offer.id, body: text });
    setSending(false);
    if (!result.ok) {
      toast.error(result.error);
      setOptimistic((prev) => prev.slice(0, -1));
      setBody(text);
      return;
    }
    onSent();
  }

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle>{offer.organization.name}</SheetTitle>
        <SheetDescription>
          Обсудите детали до выбора исполнителя. Контакты откроются после
          договора.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Сообщений пока нет — задайте вопрос первым.
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
