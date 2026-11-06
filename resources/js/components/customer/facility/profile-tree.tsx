"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Building2,
  Calendar,
  ChevronRight,
  Cpu,
  FileText,
  History,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { addDays, format, isBefore } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  documentCategoryLabels,
  recommendationSeverityLabels,
  recommendationSeverityTone,
  systemTypeLabels,
  systemTypeTone,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { EquipmentItem, FacilityFull } from "./types";

type ViewMode = "systems" | "locations";

export function ProfileTree({
  facility,
  initialEquipmentId,
}: {
  facility: FacilityFull;
  initialEquipmentId?: string;
}) {
  const [view, setView] = useState<ViewMode>("systems");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialEquipmentId &&
      facility.equipment.some((e) => e.id === initialEquipmentId)
      ? initialEquipmentId
      : (facility.equipment[0]?.id ?? null),
  );
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(facility.systems.map((s) => `sys:${s.id}`)),
  );

  const selected = facility.equipment.find((e) => e.id === selectedId) ?? null;

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const unassigned = useMemo(
    () => facility.equipment.filter((e) => !e.system),
    [facility.equipment],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
      {/* Дерево */}
      <Card className="h-fit shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Структура объекта</CardTitle>
            <div className="flex rounded-lg border p-0.5">
              {(
                [
                  { id: "systems", label: "Системы", icon: Layers },
                  { id: "locations", label: "Помещения", icon: Building2 },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setView(m.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    view === m.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <m.icon className="size-3.5" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {view === "systems" ? (
            <>
              {facility.systems.map((system) => {
                const key = `sys:${system.id}`;
                const equipment = facility.equipment.filter(
                  (e) => e.system?.id === system.id,
                );
                return (
                  <TreeBranch
                    key={key}
                    expanded={expanded.has(key)}
                    onToggle={() => toggle(key)}
                    label={system.name}
                    hint={`${equipment.length}`}
                    leading={
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          systemTypeTone[system.type].dot,
                        )}
                      />
                    }
                  >
                    {equipment.length === 0 ? (
                      <p className="py-1.5 pl-9 text-xs text-muted-foreground">
                        Нет оборудования
                      </p>
                    ) : (
                      equipment.map((e) => (
                        <EquipmentLeaf
                          key={e.id}
                          equipment={e}
                          active={e.id === selectedId}
                          onSelect={() => setSelectedId(e.id)}
                          secondary={e.subsystem?.name ?? e.zone?.name}
                        />
                      ))
                    )}
                  </TreeBranch>
                );
              })}
              {unassigned.length > 0 && (
                <TreeBranch
                  expanded={expanded.has("sys:none")}
                  onToggle={() => toggle("sys:none")}
                  label="Без системы"
                  hint={`${unassigned.length}`}
                  leading={
                    <span className="size-2.5 shrink-0 rounded-full bg-muted-foreground" />
                  }
                >
                  {unassigned.map((e) => (
                    <EquipmentLeaf
                      key={e.id}
                      equipment={e}
                      active={e.id === selectedId}
                      onSelect={() => setSelectedId(e.id)}
                      secondary={e.zone?.name}
                    />
                  ))}
                </TreeBranch>
              )}
            </>
          ) : facility.buildings.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              Помещения ещё не описаны.
            </p>
          ) : (
            facility.buildings.map((b) => {
              const bKey = `b:${b.id}`;
              return (
                <TreeBranch
                  key={bKey}
                  expanded={expanded.has(bKey) || facility.buildings.length === 1}
                  onToggle={() => toggle(bKey)}
                  label={b.name}
                  leading={<Building2 className="size-4 text-muted-foreground" />}
                >
                  {b.floors.map((f) => {
                    const fKey = `f:${f.id}`;
                    return (
                      <div key={fKey} className="pl-3">
                        <TreeBranch
                          expanded={expanded.has(fKey) || b.floors.length <= 2}
                          onToggle={() => toggle(fKey)}
                          label={f.name ?? `Этаж ${f.number}`}
                          leading={
                            <Layers className="size-4 text-muted-foreground" />
                          }
                        >
                          {f.zones.map((z) => {
                            const zoneEquipment = facility.equipment.filter(
                              (e) => e.zone?.id === z.id,
                            );
                            return (
                              <div key={z.id} className="pl-3">
                                <p className="flex items-center gap-2 py-1.5 pl-2 text-xs font-medium text-muted-foreground">
                                  <MapPin className="size-3.5" />
                                  {z.name}
                                </p>
                                {zoneEquipment.map((e) => (
                                  <EquipmentLeaf
                                    key={e.id}
                                    equipment={e}
                                    active={e.id === selectedId}
                                    onSelect={() => setSelectedId(e.id)}
                                    secondary={
                                      e.system
                                        ? systemTypeLabels[e.system.type]
                                        : undefined
                                    }
                                  />
                                ))}
                              </div>
                            );
                          })}
                        </TreeBranch>
                      </div>
                    );
                  })}
                </TreeBranch>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Панель деталей */}
      <div className="min-w-0">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <EquipmentDetail equipment={selected} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed text-center"
            >
              <Cpu className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Выберите оборудование в дереве слева
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TreeBranch({
  expanded,
  onToggle,
  label,
  hint,
  leading,
  children,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
  hint?: string;
  leading?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60"
      >
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-90",
          )}
        />
        {leading}
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {label}
        </span>
        {hint && (
          <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">
            {hint}
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EquipmentLeaf({
  equipment,
  active,
  onSelect,
  secondary,
}: {
  equipment: EquipmentItem;
  active: boolean;
  onSelect: () => void;
  secondary?: string;
}) {
  const issues = equipment.recommendations.length;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 pl-9 text-left transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted/60",
      )}
    >
      <Cpu className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{equipment.name}</span>
        {secondary && (
          <span className="block truncate text-[11px] text-muted-foreground">
            {secondary}
          </span>
        )}
      </span>
      {issues > 0 && (
        <span className="size-2 shrink-0 rounded-full bg-warning" />
      )}
    </button>
  );
}

function EquipmentDetail({ equipment: e }: { equipment: EquipmentItem }) {
  const nextService =
    e.lastServiceAt && e.serviceIntervalDays
      ? addDays(e.lastServiceAt, e.serviceIntervalDays)
      : null;
  const serviceOverdue = nextService ? isBefore(nextService, new Date()) : false;

  const specEntries =
    e.specs && typeof e.specs === "object" && !Array.isArray(e.specs)
      ? Object.entries(e.specs as Record<string, unknown>)
      : [];

  const location = e.zone
    ? `${e.zone.floor.building.name} · ${e.zone.floor.name ?? `Этаж ${e.zone.floor.number}`} · ${e.zone.name}`
    : null;

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{e.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {[e.brand, e.model].filter(Boolean).join(" ") ||
                  "Модель не указана"}
              </p>
            </div>
            {e.system && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  systemTypeTone[e.system.type].chip,
                )}
              >
                {systemTypeLabels[e.system.type]}
              </span>
            )}
          </div>
          {location && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {location}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <InfoRow label="Серийный номер" value={e.serialNumber ?? "—"} />
            <InfoRow
              label="Установлено"
              value={
                e.installedAt
                  ? format(e.installedAt, "d MMMM yyyy", { locale: ru })
                  : "—"
              }
            />
            <InfoRow
              label="Гарантия до"
              value={
                e.warrantyUntil ? (
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-success" />
                    {format(e.warrantyUntil, "d MMMM yyyy", { locale: ru })}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <InfoRow
              label="Интервал ТО"
              value={
                e.serviceIntervalDays
                  ? `каждые ${e.serviceIntervalDays} дн.`
                  : "—"
              }
            />
            <InfoRow
              label="Последнее ТО"
              value={
                e.lastServiceAt
                  ? format(e.lastServiceAt, "d MMMM yyyy", { locale: ru })
                  : "—"
              }
            />
            <InfoRow
              label="Следующее ТО"
              value={
                nextService ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      serviceOverdue && "font-semibold text-destructive",
                    )}
                  >
                    <Calendar className="size-3.5" />
                    {format(nextService, "d MMMM yyyy", { locale: ru })}
                    {serviceOverdue && " (просрочено)"}
                  </span>
                ) : (
                  "—"
                )
              }
            />
          </dl>
          {e.notes && (
            <p className="mt-4 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
              {e.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {specEntries.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="size-4 text-primary" />
              Характеристики
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
              {specEntries.map(([k, v]) => (
                <InfoRow key={k} label={k} value={String(v)} />
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {e.recommendations.length > 0 && (
        <Card className="border-warning/40 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-warning" />
              Активные рекомендации
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {e.recommendations.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-2.5"
              >
                <p className="text-sm">Требуется внимание</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    recommendationSeverityTone[r.severity],
                  )}
                >
                  {recommendationSeverityLabels[r.severity]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {e.documents.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" />
              Документы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {e.documents.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {documentCategoryLabels[d.category]} · версия{" "}
                    {d.currentVersion}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {d.versions[0]?.fileName.split(".").pop()?.toUpperCase() ??
                    "ФАЙЛ"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4 text-primary" />
            История изменений
          </CardTitle>
        </CardHeader>
        <CardContent>
          {e.versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Изменений пока не было.
            </p>
          ) : (
            <ol className="relative space-y-4 border-l pl-5">
              {e.versions.map((v) => (
                <li key={v.id} className="relative">
                  <span className="absolute top-1.5 -left-[26px] size-2.5 rounded-full border-2 border-background bg-primary" />
                  <p className="text-sm font-medium">
                    Версия {v.version}
                    {v.comment ? ` — ${v.comment}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {format(v.createdAt, "d MMMM yyyy, HH:mm", { locale: ru })}
                    {v.author?.name ? ` · ${v.author.name}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed pb-1.5 last:border-b-0 sm:border-b-0 sm:pb-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
