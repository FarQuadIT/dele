"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCheck, Play, Send } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  completeStage,
  startStage,
  submitForAcceptance,
} from "@/lib/actions/contractor-actions";
import { cn } from "@/lib/utils";
import type { OrderStatus, StageStatus } from "@/generated/prisma/enums";

type StageItem = {
  id: string;
  index: number;
  name: string;
  status: StageStatus;
  plannedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  evidence: { id: string; note: string | null; createdAt: Date }[];
};

export function StageManager({
  orderId,
  orderStatus,
  stages,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  stages: StageItem[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [completing, setCompleting] = useState<StageItem | null>(null);
  const [note, setNote] = useState("");

  const canManage = ["PLANNING", "IN_PROGRESS", "PAUSED", "REWORK"].includes(
    orderStatus,
  );
  const allDone =
    stages.length > 0 && stages.every((s) => s.status === "DONE");

  async function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successMsg: string,
  ) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    toast.success(successMsg);
    router.refresh();
    return true;
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Этапы работ</CardTitle>
            <CardDescription>
              Отмечайте прогресс — заказчик видит его сразу.
            </CardDescription>
          </div>
          {canManage && allDone && (
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                run(
                  () => submitForAcceptance(orderId),
                  "Работы переданы на приёмку",
                )
              }
            >
              <CheckCheck className="size-4" />
              Передать на приёмку
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-0">
          {stages.map((s, i) => {
            const isLast = i === stages.length - 1;
            return (
              <li key={s.id} className="relative flex gap-4">
                {!isLast && (
                  <span
                    className={cn(
                      "absolute top-8 left-[15px] h-[calc(100%-16px)] w-0.5",
                      s.status === "DONE" ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                    s.status === "DONE" &&
                      "border-primary bg-primary text-primary-foreground",
                    s.status === "IN_PROGRESS" &&
                      "border-primary bg-card text-primary",
                    s.status === "PENDING" &&
                      "border-border bg-card text-muted-foreground",
                  )}
                >
                  {s.status === "DONE" ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    <span
                      className={cn(
                        "size-2.5 rounded-full",
                        s.status === "IN_PROGRESS"
                          ? "animate-pulse bg-primary"
                          : "bg-border",
                      )}
                    />
                  )}
                </span>

                <div className={cn("min-w-0 flex-1 pb-6", isLast && "pb-0")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm leading-8 font-medium",
                        s.status === "PENDING" && "text-muted-foreground",
                      )}
                    >
                      {s.name}
                    </p>
                    {canManage && s.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          run(
                            () => startStage({ orderId, stageId: s.id }),
                            `Этап начат: ${s.name}`,
                          )
                        }
                      >
                        <Play className="size-3.5" />
                        Начать
                      </Button>
                    )}
                    {canManage && s.status === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          setCompleting(s);
                          setNote("");
                        }}
                      >
                        <Check className="size-3.5" />
                        Завершить
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.completedAt
                      ? `Завершён ${format(s.completedAt, "d MMM, HH:mm", { locale: ru })}`
                      : s.startedAt
                        ? `В работе с ${format(s.startedAt, "d MMM", { locale: ru })}`
                        : s.plannedAt
                          ? `План: ${format(s.plannedAt, "d MMM", { locale: ru })}`
                          : ""}
                  </p>
                  <AnimatePresence initial={false}>
                    {s.evidence.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1.5 space-y-1"
                      >
                        {s.evidence.map((e) => (
                          <li
                            key={e.id}
                            className="rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground"
                          >
                            {e.note ?? "Вложение"}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            );
          })}
        </ol>

        {orderStatus === "AWAITING_ACCEPTANCE" && (
          <p className="mt-4 rounded-lg bg-warning/10 p-3 text-sm text-warning">
            Работы на приёмке у заказчика.
          </p>
        )}
        {orderStatus === "REWORK" && (
          <p className="mt-4 rounded-lg bg-destructive/8 p-3 text-sm text-destructive">
            Заказчик вернул работы на доработку — проверьте чат и уведомления.
          </p>
        )}
      </CardContent>

      <Dialog
        open={completing !== null}
        onOpenChange={(v) => !v && setCompleting(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Завершить этап</DialogTitle>
            <DialogDescription>
              {completing?.name}. Добавьте короткий отчёт — заказчик увидит его
              в карточке заказа.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder="Что сделано, на что обратить внимание…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCompleting(null)}>
              Отмена
            </Button>
            <Button
              disabled={pending}
              onClick={async () => {
                if (!completing) return;
                const ok = await run(
                  () =>
                    completeStage({
                      orderId,
                      stageId: completing.id,
                      note,
                    }),
                  `Этап завершён: ${completing.name}`,
                );
                if (ok) setCompleting(null);
              }}
            >
              <Send className="size-4" />
              Завершить этап
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
