import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Помощь",
  description: "Ответы на частые вопросы и контакты поддержки DELE.",
};

const CHANNELS = [
  {
    icon: Mail,
    title: "Почта",
    text: "hello@dele.ru",
    href: "mailto:hello@dele.ru",
  },
  {
    icon: Phone,
    title: "Телефон",
    text: "+7 495 000-00-00",
    href: "tel:+74950000000",
  },
  {
    icon: MessageCircle,
    title: "Мессенджеры",
    text: "Telegram / WhatsApp",
    href: "mailto:hello@dele.ru",
  },
];

const FAQ = [
  {
    q: "Как начать пользоваться сервисом?",
    a: "Зарегистрируйтесь как владелец объекта, добавьте первый объект и создайте заявку или начните заполнять цифровой профиль.",
  },
  {
    q: "Сколько стоит сервис для владельца?",
    a: "Базовые возможности бесплатны: объект, профиль, заявки и история работ. Расширенные функции появятся отдельным тарифом.",
  },
  {
    q: "Как компании получить заявки?",
    a: "Зарегистрируйте компанию, заполните профиль и пройдите модерацию. После этого вы увидите ленту подходящих заявок.",
  },
  {
    q: "Что делать при споре с исполнителем?",
    a: "Откройте спор в карточке заказа — администрация рассмотрит переписку, документы и фотофиксацию этапов.",
  },
  {
    q: "Можно ли удалить данные объекта?",
    a: "Да, объект можно удалить, пока по нему нет активных заказов. История завершённых заказов сохраняется по правилам сервиса.",
  },
];

export default function HelpPage() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Поддержка"
        title="Чем помочь?"
        subtitle="Ответы на частые вопросы и живая поддержка — на связи в рабочие часы."
      />

      <section className="mx-auto w-full max-w-5xl px-4 py-16 md:px-6">
        <RevealGroup className="grid gap-4 sm:grid-cols-3" stagger={0.08}>
          {CHANNELS.map((c) => (
            <RevealItem key={c.title}>
              <Link
                href={c.href}
                className="flex h-full flex-col items-center gap-2 rounded-2xl border bg-card p-6 text-center shadow-card transition-shadow hover:shadow-float"
              >
                <c.icon className="size-6 text-primary" />
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.text}</p>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">Частые вопросы</h2>
          <Accordion type="single" collapsible className="mt-4 w-full">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-left text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <Reveal className="mt-12 rounded-2xl border bg-muted/40 p-6 text-center md:p-10">
          <h2 className="text-xl font-semibold">Не нашли ответ?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Напишите нам — отвечаем в течение рабочего дня.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="mailto:hello@dele.ru">Написать в поддержку</Link>
          </Button>
        </Reveal>
      </section>
    </main>
  );
}
