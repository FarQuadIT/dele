"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ClipboardCheck,
  FileSearch,
  Calculator,
  Repeat,
  KanbanSquare,
  Star,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Reveal,
  RevealGroup,
  RevealItem,
} from "@/components/motion/reveal";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const ADVANTAGES = [
  {
    icon: ClipboardCheck,
    title: "Структурированные заявки",
    text: "Клиент выбирает систему и направление работ, описывает задачу и прикрепляет материалы.",
    span: "lg:col-span-2",
  },
  {
    icon: FileSearch,
    title: "Меньше неизвестных до выезда",
    text: "С разрешения владельца — доступ к оборудованию, документам и истории обслуживания.",
    span: "",
  },
  {
    icon: Calculator,
    title: "Точнее оценка работ",
    text: "Сведения об объекте помогают заранее определить специалистов, материалы и стоимость.",
    span: "",
  },
  {
    icon: Repeat,
    title: "Постоянное обслуживание",
    text: "После разовой работы предложите клиенту регулярный сервис — прямо в заказе.",
    span: "lg:col-span-2",
  },
  {
    icon: KanbanSquare,
    title: "Управление заказами",
    text: "Клиенты, этапы, документы, сообщения и сроки — в одном рабочем пространстве.",
    span: "",
  },
  {
    icon: Star,
    title: "Репутация и повторные обращения",
    text: "Выполненные заказы, оценки и отзывы формируют доверие и приводят новых клиентов.",
    span: "",
  },
];

const LOOP = [
  "Разовая заявка",
  "Выполненная работа",
  "Данные в профиле",
  "Напоминание о ТО",
  "Повторный заказ",
  "Постоянный клиент",
];

export function CompaniesSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const trackedRef = useRef(false);

  // Аналитика: секция для компаний увидена
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !trackedRef.current) {
          trackedRef.current = true;
          track({ name: "business_section_view" });
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="for-companies"
      ref={sectionRef}
      className="scroll-mt-20 bg-foreground py-24 text-background dark:bg-card"
    >
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <Reveal className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
            Для сервисных, монтажных и инженерных компаний
          </p>
          <h2 className="max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Не разовые заявки, а постоянные клиенты с понятными объектами
          </h2>
          <p className="max-w-2xl text-pretty opacity-70 sm:text-lg">
            Получайте структурированные обращения, заранее изучайте техническую
            информацию и развивайте долгосрочное сервисное обслуживание.
          </p>
        </Reveal>

        {/* Bento-сетка преимуществ */}
        <RevealGroup
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.08}
        >
          {ADVANTAGES.map((a) => (
            <RevealItem key={a.title} className={a.span}>
              <div className="h-full rounded-2xl border border-background/15 bg-background/5 p-6 backdrop-blur transition-colors hover:bg-background/10">
                <a.icon className="size-5 text-teal" />
                <h3 className="mt-3 font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-70">{a.text}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Петля «разовая заявка -> постоянный клиент» */}
        <Reveal delay={0.1} className="mt-14">
          <div className="rounded-2xl border border-background/15 bg-background/5 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
              {LOOP.map((step, i) => (
                <motion.div
                  key={step}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.14, duration: 0.4 }}
                  className="flex items-center gap-2"
                >
                  <span
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-sm font-medium",
                      i === LOOP.length - 1
                        ? "bg-teal text-teal-foreground"
                        : "border border-background/20",
                    )}
                  >
                    {step}
                  </span>
                  {i < LOOP.length - 1 && (
                    <ArrowRight className="size-4 opacity-40" />
                  )}
                </motion.div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm opacity-70">
              Вы получаете не просто заявку — вы получаете возможность стать
              постоянным техническим партнёром клиента.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-teal text-teal-foreground hover:bg-teal/90">
            <Link
              href="/register?role=contractor&source=landing&section=for-companies"
              onClick={() => track({ name: "business_registration_click" })}
            >
              Стать партнёром сервиса
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-background/25 bg-transparent hover:bg-background/10"
          >
            <Link href="/for-business">Узнать, как это работает</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
