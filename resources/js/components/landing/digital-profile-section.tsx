"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Droplets,
  Flame,
  Wind,
  Zap,
  Package,
  FileText,
  History,
  BellRing,
} from "lucide-react";
import { SectionHeading, Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

type SystemKey = "water" | "heating" | "air" | "electricity";

const SYSTEMS: {
  key: SystemKey;
  name: string;
  icon: typeof Droplets;
  color: string;
  bg: string;
  subsystems?: string[];
  equipment: string;
  document: string;
  history: string;
  recommendation: string;
}[] = [
  {
    key: "water",
    name: "Вода",
    icon: Droplets,
    color: "text-system-water",
    bg: "bg-system-water",
    subsystems: ["Скважина", "Фильтрация", "Горячая вода"],
    equipment: "Насос Grundfos SQ 3-65 · установлен в 2019",
    document: "Паспорт скважины, схема разводки",
    history: "Профилактика насоса — 10 мес. назад",
    recommendation: "Диагностика насоса через 2 месяца",
  },
  {
    key: "heating",
    name: "Отопление",
    icon: Flame,
    color: "text-system-heat",
    bg: "bg-system-heat",
    subsystems: ["Котельная", "Радиаторы", "Тёплый пол"],
    equipment: "Котёл Viessmann Vitodens 100-W, 26 кВт",
    document: "Паспорт котла, договор на ТО",
    history: "Годовое ТО — 11 мес. назад, заменён электрод розжига",
    recommendation: "Плановое ТО котла через 18 дней",
  },
  {
    key: "air",
    name: "Вентиляция",
    icon: Wind,
    color: "text-system-air",
    bg: "bg-system-air",
    subsystems: ["Очистка", "Подогрев", "Увлажнение", "Кондиционирование"],
    equipment: "Приточная установка + кондиционер Daikin FTXM35R",
    document: "Проект вентиляции (аксонометрия), 2 версии",
    history: "Чистка фильтров — 5,5 мес. назад",
    recommendation: "Чистка фильтров и проверка фреона через 14 дней",
  },
  {
    key: "electricity",
    name: "Электричество",
    icon: Zap,
    color: "text-system-electric",
    bg: "bg-system-electric",
    subsystems: ["Щит", "Освещение", "Розеточные группы"],
    equipment: "Ввод 15 кВт, щит на 24 модуля",
    document: "Однолинейная схема, акт допуска",
    history: "Ревизия щита — 1,5 года назад",
    recommendation: "Замер сопротивления изоляции — раз в 3 года",
  },
];

const FACETS = [
  { icon: Package, title: "Всё оборудование", key: "equipment" as const },
  { icon: FileText, title: "Все документы", key: "document" as const },
  { icon: History, title: "Полная история работ", key: "history" as const },
  { icon: BellRing, title: "Рекомендации и напоминания", key: "recommendation" as const },
];

export function DigitalProfileSection() {
  const [active, setActive] = useState<SystemKey>("heating");
  const current = SYSTEMS.find((s) => s.key === active)!;

  return (
    <section
      id="digital-profile"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-24 md:px-6"
    >
      <SectionHeading
        eyebrow="Решение"
        title="Один цифровой профиль для всего объекта"
        subtitle="Структурированная информация обо всех инженерных системах, оборудовании, документах, выполненных работах и будущих сроках обслуживания."
      />

      <div className="mt-14 grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
        {/* Дерево систем */}
        <Reveal>
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
                Д
              </span>
              <div>
                <p className="font-semibold leading-tight">Загородный дом</p>
                <p className="text-xs text-muted-foreground">
                  Цифровой профиль объекта
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-1.5">
              {SYSTEMS.map((s) => {
                const isActive = s.key === active;
                return (
                  <div key={s.key}>
                    <button
                      onClick={() => setActive(s.key)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                        isActive
                          ? "border-primary/40 bg-secondary shadow-soft"
                          : "border-transparent hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg text-white",
                          s.bg,
                        )}
                      >
                        <s.icon className="size-4" />
                      </span>
                      <span className="font-medium">{s.name}</span>
                      <motion.span
                        layout
                        className={cn(
                          "ml-auto size-2 rounded-full",
                          isActive ? "bg-primary" : "bg-border",
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isActive && s.subsystems && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                          className="ml-8 overflow-hidden border-l pl-5"
                        >
                          {s.subsystems.map((sub, i) => (
                            <motion.li
                              key={sub}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.08 + i * 0.05 }}
                              className="py-1.5 text-sm text-muted-foreground"
                            >
                              {sub}
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Четыре грани профиля для выбранной системы */}
        <div className="grid gap-4 sm:grid-cols-2">
          {FACETS.map((f, i) => (
            <Reveal key={f.key} delay={i * 0.08}>
              <div className="h-full rounded-2xl border bg-card p-5 shadow-card">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <f.icon className="size-4.5" />
                  </span>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                </div>
                <div className="mt-3 min-h-16">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={current.key + f.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="text-sm leading-relaxed text-muted-foreground"
                    >
                      <span
                        className={cn(
                          "mr-2 inline-block size-2 rounded-full align-middle",
                          current.bg,
                        )}
                      />
                      {current[f.key]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
