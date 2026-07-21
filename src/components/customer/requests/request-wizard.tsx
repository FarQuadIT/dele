"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Drill,
  FileText,
  Flame,
  Hammer,
  PackageSearch,
  PenTool,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRequest } from "@/lib/actions/request-actions";
import {
  requestTypeValues,
  urgencyValues,
  type CreateRequestInput,
} from "@/lib/validation/request";
import { requestTypeLabels, urgencyLabels } from "@/lib/labels";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { RequestType, UrgencyLevel } from "@/generated/prisma/enums";

type FacilityOption = {
  id: string;
  title: string;
  address: string;
  systems: { id: string; name: string; type: string }[];
  equipment: { id: string; name: string; systemId: string | null }[];
};

const TYPE_META: Record<
  RequestType,
  {
    icon: React.ComponentType<{ className?: string }>;
    hint: string;
    accent?: boolean;
  }
> = {
  SERVICE_ONE_TIME: { icon: Wrench, hint: "ТО, чистка, профилактика" },
  SERVICE_RECURRING: { icon: RefreshCw, hint: "Абонентское обслуживание" },
  REPAIR: { icon: Hammer, hint: "Что-то сломалось или течёт" },
  EMERGENCY: {
    icon: Flame,
    hint: "Затопление, отказ отопления",
    accent: true,
  },
  INSTALLATION: { icon: Drill, hint: "Новая система под ключ" },
  RETROFIT: { icon: PenTool, hint: "Замена и улучшение" },
  DESIGN: { icon: FileText, hint: "Проект и расчёты" },
  PROFILE_FILL: { icon: ClipboardList, hint: "Инвентаризация инженерки" },
  MATERIALS: { icon: PackageSearch, hint: "Оборудование и расходники" },
};

const STEPS = ["Сценарий", "Детали", "Проверка"] as const;

type Draft = {
  type: RequestType | null;
  facilityId: string;
  systemId: string;
  equipmentId: string;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  desiredDateFrom: string;
  desiredDateTo: string;
  visitTimeNote: string;
  budgetMin: string;
  budgetMax: string;
  needsEstimate: boolean;
  needsContract: boolean;
  needsWarranty: boolean;
  contactName: string;
  contactPhone: string;
};

export function RequestWizard({
  facilities,
  initialFacilityId,
  initialEquipmentId,
  initialType,
  contactDefaults,
}: {
  facilities: FacilityOption[];
  initialFacilityId?: string;
  initialEquipmentId?: string;
  initialType?: string;
  contactDefaults: { name: string; phone: string };
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pending, setPending] = useState<false | "draft" | "publish">(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const initialFacility =
    facilities.find((f) => f.id === initialFacilityId) ?? facilities[0];
  const initialEquipment = initialFacility?.equipment.find(
    (e) => e.id === initialEquipmentId,
  );

  const [draft, setDraft] = useState<Draft>({
    type: requestTypeValues.includes(initialType as RequestType)
      ? (initialType as RequestType)
      : null,
    facilityId: initialFacility?.id ?? "",
    systemId: initialEquipment?.systemId ?? "",
    equipmentId: initialEquipment?.id ?? "",
    title: "",
    description: "",
    urgency: "NORMAL",
    desiredDateFrom: "",
    desiredDateTo: "",
    visitTimeNote: "",
    budgetMin: "",
    budgetMax: "",
    needsEstimate: true,
    needsContract: true,
    needsWarranty: false,
    contactName: contactDefaults.name,
    contactPhone: contactDefaults.phone,
  });

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const facility = facilities.find((f) => f.id === draft.facilityId);
  const systems = facility?.systems ?? [];
  const equipment = useMemo(() => {
    const all = facility?.equipment ?? [];
    return draft.systemId
      ? all.filter((e) => e.systemId === draft.systemId)
      : all;
  }, [facility, draft.systemId]);

  const isEmergency = draft.type === "EMERGENCY";

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateDetails = () => {
    const errors: Record<string, string> = {};
    if (!draft.facilityId) errors.facilityId = "Выберите объект";
    if (draft.title.trim().length < 5)
      errors.title = "Опишите задачу коротко (от 5 символов)";
    if (
      draft.budgetMin &&
      draft.budgetMax &&
      Number(draft.budgetMin) > Number(draft.budgetMax)
    )
      errors.budgetMax = "Максимум меньше минимума";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildInput = (): CreateRequestInput => ({
    type: draft.type ?? "SERVICE_ONE_TIME",
    facilityId: draft.facilityId,
    systemId: draft.systemId || undefined,
    equipmentId: draft.equipmentId || undefined,
    title: draft.title.trim(),
    description: draft.description,
    urgency: isEmergency ? "EMERGENCY" : draft.urgency,
    desiredDateFrom: draft.desiredDateFrom,
    desiredDateTo: draft.desiredDateTo,
    visitTimeNote: draft.visitTimeNote,
    budgetMin: draft.budgetMin === "" ? undefined : Number(draft.budgetMin),
    budgetMax: draft.budgetMax === "" ? undefined : Number(draft.budgetMax),
    needsEstimate: draft.needsEstimate,
    needsContract: draft.needsContract,
    needsWarranty: draft.needsWarranty,
    contactName: draft.contactName,
    contactPhone: draft.contactPhone,
  });

  async function submit(mode: "draft" | "publish") {
    setPending(mode);
    const result = await createRequest(buildInput(), mode);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      if (result.fieldErrors) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(result.fieldErrors)) flat[k] = v[0];
        setFieldErrors(flat);
        goTo(1);
      }
      return;
    }

    track({
      name: mode === "publish" ? "request_published" : "request_drafted",
      type: draft.type ?? "unknown",
    });
    toast.success(
      mode === "publish"
        ? "Заявка опубликована — исполнители уже видят её"
        : "Черновик сохранён",
    );
    router.push(`/app/customer/requests/${result.data!.id}`);
  }

  return (
    <div>
      {/* Шаги */}
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              disabled={i > step}
              onClick={() => i < step && goTo(i)}
              className="flex items-center gap-2.5"
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  i < step
                    ? "border-primary bg-primary text-primary-foreground"
                    : i === step
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:block",
                  i === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="mx-3 h-px flex-1 bg-border">
                <div
                  className="h-px bg-primary transition-all duration-500"
                  style={{ width: i < step ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -32 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          {step === 0 && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Что нужно сделать?
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Выберите сценарий — под него подстроится форма заявки.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {requestTypeValues.map((t) => {
                  const meta = TYPE_META[t];
                  const active = draft.type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        patch({ type: t });
                        track({ name: "request_type_selected", type: t });
                        setTimeout(() => goTo(1), 180);
                      }}
                      className={cn(
                        "group flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                        active && "border-primary ring-2 ring-primary/30",
                        meta.accent && "border-destructive/40",
                      )}
                    >
                      <meta.icon
                        className={cn(
                          "size-6",
                          meta.accent ? "text-destructive" : "text-primary",
                        )}
                      />
                      <span className="font-semibold">
                        {requestTypeLabels[t]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {meta.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {draft.type ? requestTypeLabels[draft.type] : "Детали"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Чем точнее детали — тем точнее предложения исполнителей.
                </p>
              </div>

              {isEmergency && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                  <div className="text-sm">
                    <p className="font-semibold text-destructive">
                      Аварийная заявка
                    </p>
                    <p className="mt-0.5 text-muted-foreground">
                      Уйдёт исполнителям с максимальным приоритетом. Если есть
                      угроза жизни — сначала звоните в экстренные службы (112).
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Объект</Label>
                <Select
                  value={draft.facilityId}
                  onValueChange={(v) =>
                    patch({ facilityId: v, systemId: "", equipmentId: "" })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите объект" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.title} — {f.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.facilityId && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.facilityId}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Система (необязательно)</Label>
                  <Select
                    value={draft.systemId || "none"}
                    onValueChange={(v) =>
                      patch({
                        systemId: v === "none" ? "" : v,
                        equipmentId: "",
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не выбрана</SelectItem>
                      {systems.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Оборудование (необязательно)</Label>
                  <Select
                    value={draft.equipmentId || "none"}
                    onValueChange={(v) =>
                      patch({ equipmentId: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не выбрано</SelectItem>
                      {equipment.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Коротко о задаче</Label>
                <Input
                  id="title"
                  placeholder={
                    isEmergency
                      ? "Прорвало трубу в котельной"
                      : "Например: годовое ТО газового котла"
                  }
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                />
                {fieldErrors.title && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Подробности</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Что происходит, когда началось, что уже пробовали…"
                  value={draft.description}
                  onChange={(e) => patch({ description: e.target.value })}
                />
              </div>

              {!isEmergency && (
                <>
                  <div className="space-y-2">
                    <Label>Срочность</Label>
                    <div className="flex flex-wrap gap-2">
                      {urgencyValues
                        .filter((u) => u !== "EMERGENCY")
                        .map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => patch({ urgency: u })}
                            className={cn(
                              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                              draft.urgency === u
                                ? "border-primary bg-primary text-primary-foreground"
                                : "hover:bg-muted",
                            )}
                          >
                            {urgencyLabels[u]}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dateFrom">Желаемая дата с</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={draft.desiredDateFrom}
                        onChange={(e) =>
                          patch({ desiredDateFrom: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateTo">по</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={draft.desiredDateTo}
                        onChange={(e) =>
                          patch({ desiredDateTo: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visitNote">Удобное время визита</Label>
                    <Input
                      id="visitNote"
                      placeholder="Будни после 18:00, выходные — весь день"
                      value={draft.visitTimeNote}
                      onChange={(e) => patch({ visitTimeNote: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="budgetMin">Бюджет от, ₽</Label>
                      <Input
                        id="budgetMin"
                        type="number"
                        min={0}
                        placeholder="10 000"
                        value={draft.budgetMin}
                        onChange={(e) => patch({ budgetMin: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budgetMax">до, ₽</Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        min={0}
                        placeholder="30 000"
                        value={draft.budgetMax}
                        onChange={(e) => patch({ budgetMax: e.target.value })}
                      />
                      {fieldErrors.budgetMax && (
                        <p className="text-sm text-destructive">
                          {fieldErrors.budgetMax}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-3 rounded-xl border p-4">
                <p className="text-sm font-semibold">Что нужно от исполнителя</p>
                {(
                  [
                    ["needsEstimate", "Смета до начала работ"],
                    ["needsContract", "Договор"],
                    ["needsWarranty", "Гарантия на работы"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2.5 text-sm"
                  >
                    <Checkbox
                      checked={draft[key]}
                      onCheckedChange={(v) => patch({ [key]: v === true })}
                    />
                    {label}
                  </label>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Контактное лицо</Label>
                  <Input
                    id="contactName"
                    value={draft.contactName}
                    onChange={(e) => patch({ contactName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Телефон</Label>
                  <Input
                    id="contactPhone"
                    placeholder="+7 900 000-00-00"
                    value={draft.contactPhone}
                    onChange={(e) => patch({ contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={() => goTo(0)}>
                  <ArrowLeft className="size-4" />
                  Сценарий
                </Button>
                <Button
                  onClick={() => {
                    if (validateDetails()) goTo(2);
                  }}
                >
                  К проверке
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Проверьте заявку
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Исполнители увидят её без точного адреса — только район.
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border p-5">
                <PreviewRow
                  label="Сценарий"
                  value={draft.type ? requestTypeLabels[draft.type] : "—"}
                />
                <PreviewRow
                  label="Объект"
                  value={facility ? facility.title : "—"}
                />
                {draft.systemId && (
                  <PreviewRow
                    label="Система"
                    value={
                      systems.find((s) => s.id === draft.systemId)?.name ?? "—"
                    }
                  />
                )}
                {draft.equipmentId && (
                  <PreviewRow
                    label="Оборудование"
                    value={
                      facility?.equipment.find(
                        (e) => e.id === draft.equipmentId,
                      )?.name ?? "—"
                    }
                  />
                )}
                <PreviewRow label="Задача" value={draft.title} strong />
                {draft.description && (
                  <PreviewRow label="Детали" value={draft.description} />
                )}
                <PreviewRow
                  label="Срочность"
                  value={
                    urgencyLabels[isEmergency ? "EMERGENCY" : draft.urgency]
                  }
                />
                {(draft.desiredDateFrom || draft.desiredDateTo) && (
                  <PreviewRow
                    label="Даты"
                    value={[draft.desiredDateFrom, draft.desiredDateTo]
                      .filter(Boolean)
                      .join(" — ")}
                  />
                )}
                {(draft.budgetMin || draft.budgetMax) && (
                  <PreviewRow
                    label="Бюджет"
                    value={`${draft.budgetMin ? `от ${Number(draft.budgetMin).toLocaleString("ru-RU")} ₽` : ""} ${draft.budgetMax ? `до ${Number(draft.budgetMax).toLocaleString("ru-RU")} ₽` : ""}`.trim()}
                  />
                )}
                <PreviewRow
                  label="Условия"
                  value={
                    [
                      draft.needsEstimate && "смета",
                      draft.needsContract && "договор",
                      draft.needsWarranty && "гарантия",
                    ]
                      .filter(Boolean)
                      .join(", ") || "без особых условий"
                  }
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button variant="ghost" onClick={() => goTo(1)}>
                  <ArrowLeft className="size-4" />
                  Детали
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={pending !== false}
                    onClick={() => submit("draft")}
                  >
                    {pending === "draft" ? "Сохраняем…" : "Сохранить черновик"}
                  </Button>
                  <Button
                    disabled={pending !== false}
                    onClick={() => submit("publish")}
                  >
                    {pending === "publish"
                      ? "Публикуем…"
                      : "Опубликовать заявку"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed pb-3 last:border-b-0 last:pb-0">
      <p className="shrink-0 text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-right text-sm",
          strong ? "font-semibold" : "font-medium",
        )}
      >
        {value}
      </p>
    </div>
  );
}
