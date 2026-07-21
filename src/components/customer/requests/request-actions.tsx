"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Ban,
  FileSignature,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cancelRequest, publishRequest } from "@/lib/actions/request-actions";
import { convertRequestToOrder } from "@/lib/actions/order-actions";
import { formatMoney } from "@/lib/format";
import type { RequestStatus } from "@/generated/prisma/enums";

export function RequestActions({
  id,
  status,
  orderId,
  acceptedOffer,
}: {
  id: string;
  status: RequestStatus;
  orderId?: string;
  acceptedOffer?: {
    orgName: string;
    priceTotal: number;
    prepaymentAmount: number;
  };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);

  async function onPublish() {
    setPending(true);
    const result = await publishRequest(id);
    setPending(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Заявка опубликована");
    router.refresh();
  }

  async function onCancel() {
    setPending(true);
    const result = await cancelRequest(id);
    setPending(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Заявка отменена");
    setCancelOpen(false);
    router.refresh();
  }

  async function onConvert() {
    setPending(true);
    const result = await convertRequestToOrder(id);
    setPending(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Договор подписан, предоплата внесена — заказ создан");
    setContractOpen(false);
    router.push(`/app/customer/orders/${result.data!.orderId}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" && (
        <Button onClick={onPublish} disabled={pending}>
          <Megaphone className="size-4" />
          Опубликовать
        </Button>
      )}
      {status === "CONTRACTOR_SELECTED" && acceptedOffer && (
        <Dialog open={contractOpen} onOpenChange={setContractOpen}>
          <DialogTrigger asChild>
            <Button>
              <FileSignature className="size-4" />
              Договор и предоплата
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Договор с «{acceptedOffer.orgName}»</DialogTitle>
              <DialogDescription>
                Демо-режим: подписание и оплата имитируются, деньги не
                списываются.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2.5 rounded-xl border p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Стоимость работ</span>
                <span className="font-semibold">
                  {formatMoney(acceptedOffer.priceTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Предоплата сейчас
                </span>
                <span className="font-semibold text-primary">
                  {formatMoney(acceptedOffer.prepaymentAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Остаток после приёмки
                </span>
                <span className="font-medium">
                  {formatMoney(
                    acceptedOffer.priceTotal - acceptedOffer.prepaymentAmount,
                  )}
                </span>
              </div>
              <p className="flex items-start gap-2 rounded-lg bg-secondary/60 p-2.5 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                После подписания исполнитель увидит точный адрес объекта, а
                этапы работ появятся в заказе.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setContractOpen(false)}>
                Отмена
              </Button>
              <Button onClick={onConvert} disabled={pending}>
                {pending ? "Оформляем…" : "Подписать и оплатить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {status === "CONVERTED" && orderId && (
        <Button asChild>
          <Link href={`/app/customer/orders/${orderId}`}>
            Перейти к заказу
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      )}
      {["DRAFT", "MODERATION", "PUBLISHED", "HAS_OFFERS"].includes(status) && (
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={pending}>
              <Ban className="size-4" />
              Отменить
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Отменить заявку?</DialogTitle>
              <DialogDescription>
                Исполнители перестанут видеть заявку, а отклики будут закрыты.
                Действие необратимо.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCancelOpen(false)}>
                Оставить
              </Button>
              <Button
                variant="destructive"
                onClick={onCancel}
                disabled={pending}
              >
                {pending ? "Отменяем…" : "Отменить заявку"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
