"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitOffer } from "@/lib/actions/contractor-actions";

export function OfferForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    priceTotal: "",
    priceMaterials: "",
    isEstimate: false,
    durationDays: "",
    warrantyMonths: "",
    comment: "",
    stagesPlan: "",
  });

  const patch = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const result = await submitOffer({
      requestId,
      priceTotal: form.priceTotal,
      priceMaterials: form.priceMaterials,
      isEstimate: form.isEstimate,
      durationDays: form.durationDays,
      warrantyMonths: form.warrantyMonths,
      comment: form.comment,
      stagesPlan: form.stagesPlan,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      if (result.fieldErrors) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(result.fieldErrors)) flat[k] = v[0];
        setErrors(flat);
      }
      return;
    }
    toast.success("Отклик отправлен заказчику");
    router.refresh();
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Ваше предложение</CardTitle>
        <CardDescription>
          Заказчик увидит цену, сроки и план работ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="priceTotal">Стоимость работ, ₽</Label>
            <Input
              id="priceTotal"
              type="number"
              min={1}
              placeholder="15 000"
              value={form.priceTotal}
              onChange={(e) => patch({ priceTotal: e.target.value })}
            />
            {errors.priceTotal && (
              <p className="text-sm text-destructive">{errors.priceTotal}</p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox
              checked={form.isEstimate}
              onCheckedChange={(v) => patch({ isEstimate: v === true })}
            />
            Это предварительная оценка (уточню после выезда)
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="durationDays">Срок, дней</Label>
              <Input
                id="durationDays"
                type="number"
                min={1}
                placeholder="3"
                value={form.durationDays}
                onChange={(e) => patch({ durationDays: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warrantyMonths">Гарантия, мес.</Label>
              <Input
                id="warrantyMonths"
                type="number"
                min={0}
                placeholder="12"
                value={form.warrantyMonths}
                onChange={(e) => patch({ warrantyMonths: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceMaterials">Из них материалы, ₽</Label>
            <Input
              id="priceMaterials"
              type="number"
              min={0}
              placeholder="Необязательно"
              value={form.priceMaterials}
              onChange={(e) => patch({ priceMaterials: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий заказчику</Label>
            <Textarea
              id="comment"
              rows={3}
              placeholder="Когда готовы выехать, что входит в стоимость…"
              value={form.comment}
              onChange={(e) => patch({ comment: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stagesPlan">План работ (каждый этап с новой строки)</Label>
            <Textarea
              id="stagesPlan"
              rows={4}
              placeholder={"Диагностика\nЗамена узла\nПроверка и сдача"}
              value={form.stagesPlan}
              onChange={(e) => patch({ stagesPlan: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Эти этапы станут трекером выполнения в заказе.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            <Send className="size-4" />
            {pending ? "Отправляем…" : "Отправить отклик"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
