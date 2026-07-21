import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardCheck,
  FileSearch,
  KanbanSquare,
  Repeat,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { StageTracker } from "@/components/shared/stage-tracker";

export const metadata: Metadata = {
  title: "Для компаний",
  description:
    "Структурированные заявки, данные объекта до выезда и постоянные клиенты на обслуживание.",
};

const BENEFITS = [
  {
    icon: ClipboardCheck,
    title: "Заявки без «испорченного телефона»",
    text: "Система, тип работ, описание, фото и бюджет — вы сразу понимаете задачу.",
  },
  {
    icon: FileSearch,
    title: "Техданные до выезда",
    text: "С разрешения владельца видны оборудование, документы и история работ.",
  },
  {
    icon: KanbanSquare,
    title: "Заказы под управлением",
    text: "Этапы, фотофиксация, документы и общение с клиентом в одном кабинете.",
  },
  {
    icon: Repeat,
    title: "Подписки на сервис",
    text: "Превращайте разовые работы в регулярное обслуживание и стабильную выручку.",
  },
  {
    icon: Star,
    title: "Работающая репутация",
    text: "Выполненные заказы и отзывы видны заказчикам и приводят новые обращения.",
  },
  {
    icon: Users,
    title: "Команда и роли",
    text: "Сотрудники, зоны ответственности и загрузка — прозрачно для руководителя.",
  },
];

const STEPS = [
  { name: "Регистрация компании и профиль", status: "DONE" as const },
  { name: "Проверка и модерация", status: "DONE" as const },
  { name: "Отклики на подходящие заявки", status: "IN_PROGRESS" as const },
  { name: "Заказ, этапы и приёмка", status: "PENDING" as const },
  { name: "Отзыв и повторные обращения", status: "PENDING" as const },
];

export default function ForBusinessPage() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Для сервисных, монтажных и инженерных компаний"
        title="Не разовые заявки, а постоянные клиенты"
        subtitle="Получайте структурированные обращения с техническими данными объекта и развивайте долгосрочное обслуживание."
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {BENEFITS.map((b) => (
            <RevealItem key={b.title}>
              <div className="h-full rounded-2xl border bg-card p-6 shadow-card">
                <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <b.icon className="size-5" />
                </div>
                <h2 className="mt-4 font-semibold">{b.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {b.text}
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
              Путь партнёра в DELE
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Подключение занимает один день. Комиссия — только за выигранные
              заказы, подробности на странице тарифов.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register?role=contractor&source=for-business">
                  Стать партнёром
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/requirements">Требования к исполнителям</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <StageTracker stages={STEPS} />
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
