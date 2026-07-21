"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  concludeInspection,
  resolveDispute,
} from "@/lib/actions/inspection-actions";

export function ConcludeInspection({ inspectionId }: { inspectionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [conclusion, setConclusion] = useState("");

  async function submit(passed: boolean) {
    setPending(true);
    const result = await concludeInspection({
      inspectionId,
      passed,
      conclusion: conclusion.trim(),
    });
    setPending(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Заключение зафиксировано");
    router.refresh();
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="mt-2.5"
        onClick={() => setOpen(true)}
      >
        Зафиксировать заключение
      </Button>
    );
  }

  return (
    <div className="mt-2.5 space-y-2">
      <Textarea
        rows={3}
        placeholder="Заключение инженера: что проверено, что выявлено…"
        value={conclusion}
        onChange={(e) => setConclusion(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending || conclusion.trim().length < 5}
          onClick={() => submit(true)}
        >
          Работы соответствуют
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={pending || conclusion.trim().length < 5}
          onClick={() => submit(false)}
        >
          Есть замечания — на доработку
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Отмена
        </Button>
      </div>
    </div>
  );
}

const OUTCOMES = [
  { value: "RESOLVED_CUSTOMER", label: "В пользу заказчика" },
  { value: "RESOLVED_CONTRACTOR", label: "В пользу исполнителя" },
  { value: "RESOLVED_COMPROMISE", label: "Компромисс" },
] as const;

export function ResolveDispute({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] =
    useState<(typeof OUTCOMES)[number]["value"]>("RESOLVED_COMPROMISE");
  const [resolution, setResolution] = useState("");

  async function submit() {
    setPending(true);
    const result = await resolveDispute({
      disputeId,
      outcome,
      resolution: resolution.trim(),
    });
    setPending(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Спор решён, стороны уведомлены");
    router.refresh();
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="mt-2.5"
        onClick={() => setOpen(true)}
      >
        Решить спор
      </Button>
    );
  }

  return (
    <div className="mt-2.5 space-y-2">
      <Select
        value={outcome}
        onValueChange={(v) => setOutcome(v as typeof outcome)}
      >
        <SelectTrigger className="w-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OUTCOMES.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        rows={3}
        placeholder="Мотивированное решение платформы…"
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending || resolution.trim().length < 5}
          onClick={submit}
        >
          Зафиксировать решение
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
