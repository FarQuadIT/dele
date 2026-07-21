import type { Metadata } from "next";
import Link from "next/link";
import {
  Droplets,
  Flame,
  Wind,
  Zap,
  Cpu,
  ShowerHead,
  Wrench,
  Hammer,
  AlertTriangle,
  CalendarCheck,
  PencilRuler,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Направления",
  description:
    "Инженерные системы, с которыми работает DELE: вода, тепло, воздух, электрика, автоматизация.",
};

const SYSTEMS = [
  {
    icon: Droplets,
    name: "Водоснабжение",
    color: "bg-system-water",
    items: ["Скважины и колодцы", "Насосные станции", "Фильтрация и умягчение", "Разводка и коллекторы"],
  },
  {
    icon: ShowerHead,
    name: "Водоотведение",
    color: "bg-system-drain",
    items: ["Септики и ЛОС", "Канализация", "Дренаж и ливнёвка", "Обслуживание станций"],
  },
  {
    icon: Flame,
    name: "Отопление",
    color: "bg-system-heat",
    items: ["Котельные и котлы", "Радиаторы и тёплые полы", "Тепловые насосы", "Сервисные контракты"],
  },
  {
    icon: Wind,
    name: "Вентиляция и климат",
    color: "bg-system-air",
    items: ["Приточные установки", "Кондиционирование", "Увлажнение и очистка", "Рекуперация"],
  },
  {
    icon: Zap,
    name: "Электроснабжение",
    color: "bg-system-electric",
    items: ["Щиты и разводка", "Освещение", "Резервное питание", "Замеры и допуски"],
  },
  {
    icon: Cpu,
    name: "Автоматизация",
    color: "bg-system-auto",
    items: ["Умный дом", "Диспетчеризация", "Датчики протечек и климата", "Сценарии управления"],
  },
];

const WORK_TYPES = [
  { icon: PencilRuler, name: "Проектирование" },
  { icon: Hammer, name: "Монтаж" },
  { icon: RefreshCw, name: "Модернизация" },
  { icon: Wrench, name: "Ремонт" },
  { icon: CalendarCheck, name: "Обслуживание" },
  { icon: AlertTriangle, name: "Аварийный выезд" },
];

export default function ServicesPage() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Направления"
        title="Все инженерные системы объекта — в одном сервисе"
        subtitle="От скважины до умного дома: заявки, исполнители и история работ по каждой системе."
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {SYSTEMS.map((s) => (
            <RevealItem key={s.name}>
              <div className="h-full rounded-2xl border bg-card p-6 shadow-card transition-shadow hover:shadow-float">
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl text-white",
                    s.color,
                  )}
                >
                  <s.icon className="size-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">{s.name}</h2>
                <ul className="mt-3 space-y-1.5">
                  {s.items.map((i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className={cn("size-1.5 rounded-full", s.color)} />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="border-t bg-muted/40 py-16">
        <div className="mx-auto w-full max-w-5xl px-4 md:px-6">
          <Reveal className="text-center">
            <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Любой формат работ
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              По каждой системе можно заказать полный цикл — от проекта до
              регулярного обслуживания.
            </p>
          </Reveal>
          <RevealGroup
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
            stagger={0.06}
          >
            {WORK_TYPES.map((w) => (
              <RevealItem key={w.name}>
                <div className="flex flex-col items-center gap-2.5 rounded-2xl border bg-card p-5 text-center shadow-soft">
                  <w.icon className="size-5 text-primary" />
                  <p className="text-sm font-medium">{w.name}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal className="mt-10 text-center" delay={0.1}>
            <Button asChild size="lg">
              <Link href="/register?role=customer&source=services">
                Создать заявку
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
