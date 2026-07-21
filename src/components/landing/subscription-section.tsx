"use client";

import Link from "next/link";
import { Gauge, Layers, House } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  RevealGroup,
  RevealItem,
  Reveal,
  SectionHeading,
} from "@/components/motion/reveal";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    icon: Gauge,
    name: "Базовый контроль",
    text: "Хранение цифрового профиля, документов и истории работ. Напоминания о приближающемся обслуживании.",
    highlight: false,
  },
  {
    icon: Layers,
    name: "Отдельные системы",
    text: "Регулярное обслуживание вентиляции, отопления, водоснабжения или другого выбранного оборудования.",
    highlight: true,
  },
  {
    icon: House,
    name: "Весь объект",
    text: "Планирование и организация обслуживания всех подключённых инженерных систем.",
    highlight: false,
  },
];

export function SubscriptionSection() {
  return (
    <section
      id="service-subscription"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-24 md:px-6"
    >
      <SectionHeading
        eyebrow="Подписка"
        title="Подключите обслуживание — и больше не следите за сроками сами"
        subtitle="Выберите системы, которые нужно обслуживать, и удобный формат сотрудничества."
      />

      <RevealGroup className="mt-12 grid gap-4 md:grid-cols-3" stagger={0.12}>
        {PLANS.map((p) => (
          <RevealItem key={p.name}>
            <div
              className={cn(
                "relative h-full rounded-2xl border bg-card p-6 shadow-card transition-shadow hover:shadow-float",
                p.highlight && "border-primary/50 ring-1 ring-primary/30",
              )}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  Популярный выбор
                </span>
              )}
              <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <p.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{p.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p.text}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal className="mt-12 flex flex-col items-center gap-4 text-center" delay={0.1}>
        <p className="text-lg font-semibold">
          Один объект. Один профиль. Один понятный план обслуживания.
        </p>
        <Button asChild size="lg">
          <Link
            href="/register?role=customer&source=landing&section=subscription&next=/app/customer/objects"
            onClick={() => track({ name: "subscription_cta_click" })}
          >
            Подобрать обслуживание
          </Link>
        </Button>
        <p className="max-w-md text-xs text-muted-foreground">
          Состав услуг и стоимость зависят от количества систем, оборудования и
          выбранного исполнителя.
        </p>
      </Reveal>
    </section>
  );
}
