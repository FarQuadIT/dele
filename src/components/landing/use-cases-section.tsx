"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Hammer, Wrench, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/motion/reveal";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type CaseKey = "service" | "emergency" | "installation" | "repair";

const CASES: {
  key: CaseKey;
  tab: string;
  icon: typeof Wrench;
  accent?: boolean;
  title: string;
  text: string;
  mock: React.ReactNode;
  cta?: { label: string; href: string; event?: () => void };
  disclaimer?: string;
}[] = [
  {
    key: "service",
    tab: "Обслуживание",
    icon: CalendarCheck,
    title: "Обслуживание без напоминаний в календаре и звонков подрядчикам",
    text: "Сервис хранит регламенты оборудования, напоминает о предстоящих работах и позволяет создать заявку прямо из цифрового профиля.",
    mock: (
      <div className="space-y-3">
        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <p className="text-xs text-muted-foreground">Напоминание</p>
          <p className="mt-1 text-sm font-medium">
            Обслуживание вентиляции — через 14 дней
          </p>
          <div className="mt-3 flex gap-2">
            <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              Создать заявку
            </span>
            <span className="rounded-lg border px-3 py-1.5 text-xs">
              Напомнить позже
            </span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 opacity-70 shadow-soft">
          <p className="text-xs text-muted-foreground">Выполнено</p>
          <p className="mt-1 text-sm">ТО котла · акт сохранён в профиле</p>
        </div>
      </div>
    ),
  },
  {
    key: "emergency",
    tab: "Авария",
    icon: AlertTriangle,
    accent: true,
    title: "При проблеме не нужно объяснять всё с самого начала",
    text: "Создайте срочную заявку — выбранный специалист получит доступ к данным системы, документам, фото и истории предыдущих работ.",
    cta: {
      label: "Создать срочную заявку",
      href: "/register?role=customer&source=landing&section=use-cases&next=/app/customer/requests/new?type=EMERGENCY",
      event: () => track({ name: "emergency_cta_click" }),
    },
    disclaimer:
      "При непосредственной угрозе людям или имуществу также обращайтесь в соответствующую аварийную службу.",
    mock: (
      <div className="space-y-3">
        <div className="rounded-xl border border-destructive/40 bg-card p-4 shadow-soft">
          <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertTriangle className="size-3.5" />
            Срочная заявка
          </p>
          <p className="mt-1 text-sm font-medium">
            Отопление: падает давление в контуре
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Исполнителю передано: модель котла, схема котельной, история ТО
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <p className="text-xs text-muted-foreground">Отклик · 12 минут</p>
          <p className="mt-1 text-sm">Warm-Tec: выезд сегодня до 18:00</p>
        </div>
      </div>
    ),
  },
  {
    key: "installation",
    tab: "Монтаж",
    icon: Hammer,
    title: "Сравнивайте предложения по понятным условиям",
    text: "Получайте отклики с составом работ, стоимостью оборудования, сроками, договором и сметой. Выбирайте подходящего исполнителя.",
    mock: (
      <div className="space-y-3">
        {[
          { org: "FLOW Engineering", price: "285 000 ₽", days: "14 дней", warranty: "24 мес" },
          { org: "Wat-Ing", price: "310 000 ₽", days: "10 дней", warranty: "12 мес" },
        ].map((o) => (
          <div key={o.org} className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{o.org}</p>
              <p className="text-sm font-semibold text-primary">{o.price}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Срок: {o.days} · Гарантия: {o.warranty} · Смета приложена
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "repair",
    tab: "Ремонт",
    icon: Wrench,
    title: "Исполнитель заранее понимает, с чем предстоит работать",
    text: "Прикрепите описание проблемы, фотографии и сведения об оборудовании — компания точнее оценит задачу и подготовится к выезду.",
    mock: (
      <div className="space-y-3">
        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <p className="text-xs text-muted-foreground">Заявка на ремонт</p>
          <p className="mt-1 text-sm font-medium">
            Кондиционер в гостиной не охлаждает
          </p>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded bg-muted px-2 py-0.5 text-[11px]">Daikin FTXM35R</span>
            <span className="rounded bg-muted px-2 py-0.5 text-[11px]">фото ×3</span>
            <span className="rounded bg-muted px-2 py-0.5 text-[11px]">история ТО</span>
          </div>
        </div>
      </div>
    ),
  },
];

export function UseCasesSection() {
  const [active, setActive] = useState<CaseKey>("service");
  const current = CASES.find((c) => c.key === active)!;

  return (
    <section id="use-cases" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-24 md:px-6">
      <SectionHeading
        eyebrow="Сценарии"
        title="Один сервис — для планового и внезапного"
      />

      {/* Табы */}
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {CASES.map((c) => (
          <button
            key={c.key}
            onClick={() => setActive(c.key)}
            className={cn(
              "relative flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active === c.key
                ? c.accent
                  ? "border-destructive bg-destructive text-white"
                  : "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted",
              c.accent && active !== c.key && "border-destructive/40 text-destructive",
            )}
          >
            <c.icon className="size-4" />
            {c.tab}
          </button>
        ))}
      </div>

      {/* Контент вкладки */}
      <div className="mt-10 overflow-hidden rounded-3xl border bg-muted/30 shadow-soft">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-10 p-8 md:grid-cols-2 md:p-12"
          >
            <div className="flex flex-col justify-center gap-4">
              <h3 className="text-balance text-2xl font-bold tracking-tight">
                {current.title}
              </h3>
              <p className="text-pretty leading-relaxed text-muted-foreground">
                {current.text}
              </p>
              {current.cta && (
                <div>
                  <Button
                    asChild
                    variant={current.accent ? "destructive" : "default"}
                    size="lg"
                  >
                    <Link href={current.cta.href} onClick={current.cta.event}>
                      {current.cta.label}
                    </Link>
                  </Button>
                </div>
              )}
              {current.disclaimer && (
                <p className="text-xs text-muted-foreground">{current.disclaimer}</p>
              )}
            </div>
            <div className="flex items-center">
              <div className="w-full">{current.mock}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
