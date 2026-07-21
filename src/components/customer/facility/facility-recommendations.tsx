"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Clock, Cpu, Sparkles, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  recommendationSeverityLabels,
  recommendationSeverityTone,
  recommendationStatusLabels,
  systemTypeLabels,
} from "@/lib/labels";
import {
  dismissRecommendation,
  postponeRecommendation,
} from "@/lib/actions/recommendation-actions";
import { cn } from "@/lib/utils";
import type { RecommendationItem } from "./types";

export function FacilityRecommendations({
  facilityId,
  items,
  onOpenEquipment,
}: {
  facilityId: string;
  items: RecommendationItem[];
  onOpenEquipment: (equipmentId: string) => void;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function run(
    id: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
    okMsg: string,
  ) {
    setPendingId(id);
    const result = await action();
    setPendingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(okMsg);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
        <Sparkles className="size-8 text-muted-foreground" />
        <p className="font-medium">Рекомендаций нет</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Система напомнит о плановом обслуживании, когда придёт срок.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((r) => (
        <Card
          key={r.id}
          className={cn(
            "shadow-card",
            r.severity === "CRITICAL" && "border-destructive/40",
            r.severity === "IMPORTANT" && "border-warning/40",
          )}
        >
          <CardContent className="flex h-full flex-col gap-3 pt-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{r.title}</p>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  recommendationSeverityTone[r.severity],
                )}
              >
                {recommendationSeverityLabels[r.severity]}
              </span>
            </div>
            {r.reason && (
              <p className="text-sm text-muted-foreground">{r.reason}</p>
            )}
            <div className="flex flex-wrap gap-2 text-xs">
              {r.system && (
                <Badge variant="outline">
                  {systemTypeLabels[r.system.type]}
                </Badge>
              )}
              {r.dueAt && (
                <Badge variant="outline">
                  до {format(r.dueAt, "d MMMM yyyy", { locale: ru })}
                </Badge>
              )}
              {r.status !== "ACTIVE" && (
                <Badge variant="secondary">
                  {recommendationStatusLabels[r.status]}
                </Badge>
              )}
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
              {r.status === "ACTIVE" && (
                <>
                  <Button asChild size="sm">
                    <Link
                      href={`/app/customer/requests/new?facility=${facilityId}${
                        r.equipment ? `&equipment=${r.equipment.id}` : ""
                      }&from=recommendation`}
                    >
                      Создать заявку
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pendingId === r.id}
                    onClick={() =>
                      run(
                        r.id,
                        () => postponeRecommendation(r.id),
                        "Отложено на 30 дней",
                      )
                    }
                  >
                    <Clock className="size-3.5" />
                    Отложить
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pendingId === r.id}
                    onClick={() =>
                      run(
                        r.id,
                        () => dismissRecommendation(r.id),
                        "Рекомендация скрыта",
                      )
                    }
                  >
                    <X className="size-3.5" />
                    Неактуально
                  </Button>
                </>
              )}
              {r.equipment && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenEquipment(r.equipment!.id)}
                >
                  <Cpu className="size-3.5" />
                  {r.equipment.name}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
