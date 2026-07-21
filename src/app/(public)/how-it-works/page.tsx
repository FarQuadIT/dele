import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  ClipboardList,
  FileText,
  Inbox,
  ListChecks,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { StageTracker } from "@/components/shared/stage-tracker";

export const metadata: Metadata = {
  title: "Как это работает",
  description:
    "От регистрации и цифрового профиля — до заявок, откликов, заказа и приёмки работ.",
};

const OWNER_FLOW = [
  {
    icon: Building2,
    title: "Создайте объект",
    text: "Дом, квартира или коммерческое помещение. Достаточно названия и адреса — остальное позже.",
  },
  {
    icon: ClipboardList,
    title: "Заполните цифровой профиль",
    text: "Системы, оборудование, документы. Сами или с помощью специалиста по обследованию.",
  },
  {
    icon: Inbox,
    title: "Создайте заявку",
    text: "Обслуживание, ремонт, монтаж или авария — исполнители получат структурированную задачу.",
  },
  {
    icon: ListChecks,
    title: "Сравните отклики",
    text: "Состав работ, цена, сроки, гарантия. Общайтесь в чате и выбирайте лучшего.",
  },
  {
    icon: Package,
    title: "Следите за заказом",
    text: "Этапы с фотофиксацией, документы, платежи и приёмка — всё в одном месте.",
  },
  {
    icon: FileText,
    title: "История сохраняется",
    text: "Акты и данные о работах попадают в профиль объекта и работают на будущее.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Как это работает"
        title="Понятный путь: от профиля объекта до принятой работы"
        subtitle="DELE ведёт весь жизненный цикл: цифровой профиль, заявка, отклики, договор, этапы работ и история."
      />

      <section className="mx-auto w-full max-w-5xl px-4 py-16 md:px-6">
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {OWNER_FLOW.map((s, i) => (
            <RevealItem key={s.title}>
              <div className="relative h-full rounded-2xl border bg-card p-6 shadow-card">
                <span className="absolute top-5 right-5 text-2xl font-black text-muted-foreground/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <s.icon className="size-5" />
                </div>
                <h2 className="mt-4 font-semibold">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.text}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="border-t bg-muted/40 py-16">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 md:grid-cols-2 md:px-6">
          <Reveal>
            <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Статусы под контролем на каждом шаге
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              До выбора исполнителя живёт заявка, после оплаты появляется заказ
              с этапами. В календаре — только подтверждённые работы, никакой
              путаницы.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild>
                <Link href="/register?role=customer&source=how-it-works">
                  Начать бесплатно
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/services">Посмотреть направления</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <StageTracker
                stages={[
                  { name: "Заявка опубликована", status: "DONE" },
                  { name: "Получены отклики", status: "DONE" },
                  { name: "Исполнитель выбран", status: "DONE" },
                  { name: "Договор и предоплата", status: "IN_PROGRESS" },
                  { name: "Работы по этапам", status: "PENDING" },
                  { name: "Приёмка и отзыв", status: "PENDING" },
                ]}
              />
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
