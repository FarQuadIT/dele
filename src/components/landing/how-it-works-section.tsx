"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Building2, ClipboardList, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, SectionHeading } from "@/components/motion/reveal";

const STEPS = [
  {
    n: "01",
    icon: Building2,
    title: "Создайте объект",
    text: "Зарегистрируйтесь и добавьте дом, квартиру или коммерческое помещение.",
    cta: { label: "Добавить объект", href: "/register?role=customer&source=landing&section=how-it-works" },
  },
  {
    n: "02",
    icon: ClipboardList,
    title: "Заполните цифровой профиль",
    text: "Внесите данные сами, загрузите документы или пригласите специалиста для обследования.",
    cta: {
      label: "Заказать заполнение",
      href: "/register?role=customer&source=landing&section=how-it-works&next=/app/customer/requests",
    },
  },
  {
    n: "03",
    icon: LayoutDashboard,
    title: "Управляйте через один сервис",
    text: "Напоминания, заявки, выбор исполнителей, этапы работ и вся история — в кабинете.",
  },
];

export function HowItWorksSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y bg-muted/40 py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Как это работает"
          title="Начать проще, чем разбираться со всем самостоятельно"
        />

        <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
          {/* Соединяющая линия («beam») между шагами */}
          <div className="pointer-events-none absolute top-7 right-[16%] left-[16%] hidden h-0.5 md:block">
            <div className="h-full w-full rounded bg-border" />
            {!reduceMotion && (
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className="absolute inset-0 origin-left rounded bg-gradient-to-r from-primary via-teal to-primary"
              />
            )}
          </div>

          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.15} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl border bg-card shadow-card">
                  <step.icon className="size-6 text-primary" />
                  <span className="absolute -top-2 -right-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {step.n}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.text}
                </p>
                {step.cta && (
                  <Button asChild variant="link" className="mt-1">
                    <Link href={step.cta.href}>{step.cta.label}</Link>
                  </Button>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
