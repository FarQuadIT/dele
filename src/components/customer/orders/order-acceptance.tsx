"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  BadgeCheck,
  CreditCard,
  Scale,
  ShieldQuestion,
  Star,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  acceptWork,
  payFinal,
  requestRework,
  submitReview,
} from "@/lib/actions/order-actions";
import {
  openDispute,
  requestInspection,
} from "@/lib/actions/inspection-actions";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/enums";

/** Панель действий заказчика: приёмка, технадзор, спор, доплата, отзыв. */
export function OrderAcceptance({
  orderId,
  status,
  hasReview,
  finalAmount,
}: {
  orderId: string;
  status: OrderStatus;
  hasReview: boolean;
  finalAmount: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [reworkOpen, setReworkOpen] = useState(false);
  const [reworkReason, setReworkReason] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeSubject, setDisputeSubject] = useState("");
  const [disputeText, setDisputeText] = useState("");

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success(successMsg);
    router.refresh();
    return true;
  }

  if (status === "AWAITING_ACCEPTANCE") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/50 bg-warning/8 p-4"
      >
        <div>
          <p className="font-semibold">Работы переданы на приёмку</p>
          <p className="text-sm text-muted-foreground">
            Проверьте результат и отчёты. Сомневаетесь — пригласите независимый
            технадзор.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() =>
              run(
                () => requestInspection(orderId),
                "Технадзор запрошен — инженер свяжется с вами",
              )
            }
            disabled={pending}
          >
            <ShieldQuestion className="size-4" />
            Технадзор
          </Button>
          <Dialog open={reworkOpen} onOpenChange={setReworkOpen}>
            <Button
              variant="outline"
              onClick={() => setReworkOpen(true)}
              disabled={pending}
            >
              <Undo2 className="size-4" />
              На доработку
            </Button>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Вернуть на доработку</DialogTitle>
                <DialogDescription>
                  Опишите, что именно нужно исправить — исполнитель получит
                  уведомление.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                rows={4}
                placeholder="Например: не закреплён воздуховод в котельной…"
                value={reworkReason}
                onChange={(e) => setReworkReason(e.target.value)}
              />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setReworkOpen(false)}>
                  Отмена
                </Button>
                <Button
                  variant="destructive"
                  disabled={pending || reworkReason.trim().length < 5}
                  onClick={async () => {
                    const ok = await run(
                      () =>
                        requestRework({
                          orderId,
                          reason: reworkReason.trim(),
                        }),
                      "Заказ возвращён на доработку",
                    );
                    if (ok) setReworkOpen(false);
                  }}
                >
                  Отправить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => run(() => acceptWork(orderId), "Работы приняты")}
            disabled={pending}
          >
            <BadgeCheck className="size-4" />
            Принять работы
          </Button>
        </div>
      </motion.div>
    );
  }

  if (status === "REWORK") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/8 p-4"
        >
          <div>
            <p className="font-semibold">Работы на доработке</p>
            <p className="text-sm text-muted-foreground">
              Исполнитель устраняет замечания. Если договориться не удаётся —
              откройте спор, платформа поможет.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setDisputeOpen(true)}
            disabled={pending}
          >
            <Scale className="size-4" />
            Открыть спор
          </Button>
        </motion.div>

        <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Открыть спор</DialogTitle>
              <DialogDescription>
                Опишите проблему — платформа изучит материалы заказа и примет
                решение. Обе стороны получат уведомления.
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Суть спора, например: работы не соответствуют смете"
              value={disputeSubject}
              onChange={(e) => setDisputeSubject(e.target.value)}
            />
            <Textarea
              rows={4}
              placeholder="Подробности: что не так, о чём договаривались…"
              value={disputeText}
              onChange={(e) => setDisputeText(e.target.value)}
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDisputeOpen(false)}>
                Отмена
              </Button>
              <Button
                variant="destructive"
                disabled={pending || disputeSubject.trim().length < 5}
                onClick={async () => {
                  const ok = await run(
                    () =>
                      openDispute({
                        orderId,
                        subject: disputeSubject.trim(),
                        description: disputeText.trim(),
                      }),
                    "Спор открыт — платформа рассмотрит его",
                  );
                  if (ok) setDisputeOpen(false);
                }}
              >
                Открыть спор
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (status === "INSPECTION") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/40 bg-secondary/50 p-4"
      >
        <ShieldQuestion className="size-8 shrink-0 text-primary" />
        <div>
          <p className="font-semibold">Идёт технадзор</p>
          <p className="text-sm text-muted-foreground">
            Независимый инженер проверяет работы. Заключение придёт в
            уведомления, после этого приёмка продолжится.
          </p>
        </div>
      </motion.div>
    );
  }

  if (status === "DISPUTE") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/8 p-4"
      >
        <Scale className="size-8 shrink-0 text-destructive" />
        <div>
          <p className="font-semibold">Спор на рассмотрении</p>
          <p className="text-sm text-muted-foreground">
            Платформа изучает материалы заказа. Решение придёт в уведомления
            обеим сторонам.
          </p>
        </div>
      </motion.div>
    );
  }

  if (status === "AWAITING_FINAL_PAYMENT") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-secondary/50 p-4"
      >
        <div>
          <p className="font-semibold">Осталась финальная оплата</p>
          <p className="text-sm text-muted-foreground">
            Работы приняты. После оплаты заказ будет закрыт, а гарантия —
            активирована.
          </p>
        </div>
        <Button
          onClick={() =>
            run(() => payFinal(orderId), "Оплата прошла — заказ завершён")
          }
          disabled={pending}
        >
          <CreditCard className="size-4" />
          Оплатить {formatMoney(finalAmount)}
        </Button>
      </motion.div>
    );
  }

  if (status === "COMPLETED" && !hasReview) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/40 bg-success/8 p-4"
        >
          <div>
            <p className="font-semibold">Заказ завершён</p>
            <p className="text-sm text-muted-foreground">
              Поделитесь впечатлением — отзывы помогают другим владельцам.
            </p>
          </div>
          <Button variant="outline" onClick={() => setReviewOpen(true)}>
            <Star className="size-4" />
            Оставить отзыв
          </Button>
        </motion.div>

        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Оцените работу исполнителя</DialogTitle>
              <DialogDescription>
                Отзыв появится в профиле компании после публикации.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center gap-1.5 py-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} из 5`}
                >
                  <Star
                    className={cn(
                      "size-8 transition-all hover:scale-110",
                      n <= rating
                        ? "fill-warning text-warning"
                        : "text-border",
                    )}
                  />
                </button>
              ))}
            </div>
            <Textarea
              rows={3}
              placeholder="Что понравилось, что можно улучшить…"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setReviewOpen(false)}>
                Позже
              </Button>
              <Button
                disabled={pending}
                onClick={async () => {
                  const ok = await run(
                    () =>
                      submitReview({ orderId, rating, text: reviewText }),
                    "Спасибо за отзыв!",
                  );
                  if (ok) setReviewOpen(false);
                }}
              >
                Опубликовать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}
