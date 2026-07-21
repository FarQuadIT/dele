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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { proposeProfileChange } from "@/lib/actions/proposal-actions";

type EquipmentOption = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
};

export function ProfileProposalForm({
  orderId,
  equipment,
}: {
  orderId: string;
  equipment: EquipmentOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [equipmentId, setEquipmentId] = useState(equipment[0]?.id ?? "");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [comment, setComment] = useState("");

  if (equipment.length === 0) {
    return null;
  }

  async function submit() {
    if (!equipmentId) {
      toast.error("Выберите оборудование");
      return;
    }
    setPending(true);
    const result = await proposeProfileChange({
      orderId,
      equipmentId,
      comment,
      changes: {
        brand: brand || undefined,
        model: model || undefined,
        serialNumber: serialNumber || undefined,
        notes: notes || undefined,
      },
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Предложение отправлено заказчику");
    setBrand("");
    setModel("");
    setSerialNumber("");
    setNotes("");
    setComment("");
    router.refresh();
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Обновить цифровой профиль</CardTitle>
        <CardDescription>
          Предложите изменения — заказчик подтвердит их перед записью в профиль.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Оборудование</Label>
          <Select value={equipmentId} onValueChange={setEquipmentId}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите" />
            </SelectTrigger>
            <SelectContent>
              {equipment.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                  {e.model ? ` · ${e.model}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Бренд</Label>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Модель</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Серийный номер</Label>
          <Input
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Заметки</Label>
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Комментарий заказчику</Label>
          <Textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Что изменилось по итогам работ"
          />
        </div>
        <Button onClick={submit} disabled={pending}>
          <Send className="size-3.5" />
          Отправить предложение
        </Button>
      </CardContent>
    </Card>
  );
}
