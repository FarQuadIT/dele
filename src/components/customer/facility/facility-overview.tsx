"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Cpu } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { orderStatusLabels, systemTypeLabels, systemTypeTone } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { FacilityFull } from "./types";
import { FacilityHouseWidget } from "./facility-house-widget";

export function FacilityOverview({
  facility,
  onOpenEquipment,
}: {
  facility: FacilityFull;
  onOpenEquipment: (equipmentId: string) => void;
}) {
  const bySystem = facility.systems.map((s) => {
    const equipment = facility.equipment.filter((e) => e.system?.id === s.id);
    const issues = equipment.reduce(
      (acc, e) => acc + e.recommendations.length,
      0,
    );
    return { system: s, equipment, issues };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-6">
        <FacilityHouseWidget />
        {facility.description && (
          <Card className="shadow-card">
            <CardContent className="pt-5 text-sm leading-relaxed text-muted-foreground">
              {facility.description}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Инженерные системы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {bySystem.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Системы ещё не добавлены — начните с цифрового профиля.
              </p>
            ) : (
              bySystem.map(({ system, equipment, issues }) => (
                <div
                  key={system.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        "size-2.5 shrink-0 rounded-full",
                        systemTypeTone[system.type].dot,
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {system.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {systemTypeLabels[system.type]} · оборудования:{" "}
                        {equipment.length}
                      </p>
                    </div>
                  </div>
                  {issues > 0 ? (
                    <Badge className="shrink-0 gap-1 bg-warning/15 text-warning hover:bg-warning/15">
                      <AlertTriangle className="size-3" />
                      {issues}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-success">
                      ОК
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Оборудование</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {facility.equipment.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Оборудование пока не добавлено.
              </p>
            ) : (
              facility.equipment.slice(0, 5).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onOpenEquipment(e.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Cpu className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[e.brand, e.model].filter(Boolean).join(" ") ||
                          "Без модели"}
                        {e.zone ? ` · ${e.zone.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Последние работы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {facility.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Работ по объекту ещё не было.
              </p>
            ) : (
              facility.orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/app/customer/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {o.request.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.organization.name} ·{" "}
                      {format(o.updatedAt, "d MMMM yyyy", { locale: ru })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {orderStatusLabels[o.status]}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
