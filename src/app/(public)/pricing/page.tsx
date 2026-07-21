import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Тарифы и комиссии",
  description:
    "Бесплатно для владельцев объектов. Прозрачная комиссия для компаний — только за выигранные заказы.",
};

const OWNER_PLANS = [
  {
    name: "Базовый",
    price: "0 ₽",
    period: "навсегда",
    features: [
      "1 объект и цифровой профиль",
      "Документы и история работ",
      "Заявки и отклики без ограничений",
      "Напоминания об обслуживании",
    ],
    cta: "Начать бесплатно",
    href: "/register?role=customer&source=pricing",
    highlight: false,
  },
  {
    name: "Дом+",
    price: "490 ₽",
    period: "в месяц",
    features: [
      "До 5 объектов",
      "Расширенные напоминания и отчёты",
      "Приоритетная поддержка",
      "Технадзор со скидкой",
    ],
    cta: "Скоро — оставить заявку",
    href: "/register?role=customer&source=pricing&next=/app/customer/settings",
    highlight: true,
    soon: true,
  },
];

const CONTRACTOR_TERMS = [
  { label: "Регистрация и профиль компании", value: "Бесплатно" },
  { label: "Просмотр заявок и отклики", value: "Бесплатно" },
  { label: "Комиссия с выигранного заказа", value: "5–10 %" },
  { label: "Подписка на приоритет в выдаче", value: "по запросу" },
];

export default function PricingPage() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Тарифы"
        title="Честные условия для обеих сторон"
        subtitle="Владельцы пользуются сервисом бесплатно. Компании платят комиссию только за результат."
      />

      <section className="mx-auto w-full max-w-5xl px-4 py-16 md:px-6">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight">Владельцам объектов</h2>
        </Reveal>
        <RevealGroup className="mt-6 grid gap-4 md:grid-cols-2" stagger={0.1}>
          {OWNER_PLANS.map((p) => (
            <RevealItem key={p.name}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-card",
                  p.highlight && "border-primary/50 ring-1 ring-primary/30",
                )}
              >
                {p.soon && (
                  <span className="absolute -top-3 left-6 rounded-full bg-warning px-2.5 py-0.5 text-[11px] font-semibold text-black">
                    Скоро
                  </span>
                )}
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold">{p.price}</span>
                  <span className="ml-1.5 text-sm text-muted-foreground">
                    {p.period}
                  </span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-teal" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-6"
                  variant={p.highlight ? "default" : "outline"}
                >
                  <Link href={p.href}>{p.cta}</Link>
                </Button>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">Компаниям</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Числа — ориентировочные плейсхолдеры из концепции; финальные условия
            уточняются.
          </p>
        </Reveal>
        <Reveal delay={0.05} className="mt-6">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
            {CONTRACTOR_TERMS.map((t, i) => (
              <div
                key={t.label}
                className={cn(
                  "flex items-center justify-between gap-4 px-6 py-4",
                  i !== 0 && "border-t",
                )}
              >
                <p className="text-sm">{t.label}</p>
                <p className="text-sm font-semibold text-primary">{t.value}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1} className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/register?role=contractor&source=pricing">
              Стать партнёром
            </Link>
          </Button>
        </Reveal>
      </section>
    </main>
  );
}
