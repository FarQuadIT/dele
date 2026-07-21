"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { requestTypeLabels, urgencyLabels } from "@/lib/labels";
import { requestTypeValues, urgencyValues } from "@/lib/validation/request";

/** Фильтры ленты заявок. Состояние живёт в URL — ссылку можно переслать коллеге. */
export function RequestFilters({
  current,
}: {
  current: { type?: string; urgency?: string; sort: string };
}) {
  const router = useRouter();

  function apply(next: Partial<typeof current>) {
    const merged = { ...current, ...next };
    const params = new URLSearchParams();
    if (merged.type) params.set("type", merged.type);
    if (merged.urgency) params.set("urgency", merged.urgency);
    if (merged.sort && merged.sort !== "fresh") params.set("sort", merged.sort);
    router.replace(
      params.size > 0
        ? `/app/contractor/requests?${params}`
        : "/app/contractor/requests",
      { scroll: false },
    );
  }

  const hasFilters = Boolean(current.type || current.urgency);

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <Select
        value={current.type ?? "all"}
        onValueChange={(v) => apply({ type: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-55">
          <SelectValue placeholder="Тип работ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все типы работ</SelectItem>
          {requestTypeValues.map((t) => (
            <SelectItem key={t} value={t}>
              {requestTypeLabels[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={current.urgency ?? "all"}
        onValueChange={(v) => apply({ urgency: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-45">
          <SelectValue placeholder="Срочность" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Любая срочность</SelectItem>
          {urgencyValues.map((u) => (
            <SelectItem key={u} value={u}>
              {urgencyLabels[u]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={current.sort} onValueChange={(v) => apply({ sort: v })}>
        <SelectTrigger className="w-45">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fresh">Сначала новые</SelectItem>
          <SelectItem value="budget">Сначала с бюджетом</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => apply({ type: undefined, urgency: undefined })}
        >
          <X className="size-4" />
          Сбросить
        </Button>
      )}
    </div>
  );
}
