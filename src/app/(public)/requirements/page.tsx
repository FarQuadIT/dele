import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  Camera,
  FileText,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Требования к исполнителям",
  description:
    "Что нужно, чтобы стать партнёром DELE: документы, специализации и стандарты работы.",
};

const REQUIREMENTS = [
  {
    icon: FileText,
    title: "Юридический статус",
    text: "Действующее ИП или юрлицо, реквизиты и ИНН. Данные проходят модерацию.",
  },
  {
    icon: Briefcase,
    title: "Подтверждённый опыт",
    text: "Специализации по системам, примеры выполненных работ и портфолио в профиле.",
  },
  {
    icon: BadgeCheck,
    title: "Допуски и сертификаты",
    text: "Для газа, электрики и лифтового оборудования — обязательные допуски по закону.",
  },
  {
    icon: Camera,
    title: "Фотофиксация этапов",
    text: "Подтверждение выполнения каждого этапа фото- или видеоматериалами.",
  },
  {
    icon: MessageSquare,
    title: "Общение внутри сервиса",
    text: "Переписка и договорённости — в чате заказа, чтобы условия были зафиксированы.",
  },
  {
    icon: ShieldCheck,
    title: "Соблюдение стандартов",
    text: "Работа по смете и договору, корректное ведение статусов и сроков.",
  },
];

export default function RequirementsPage() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Партнёрам"
        title="Требования к исполнителям"
        subtitle="Стандарты, которые делают сервис надёжным для заказчиков и выгодным для добросовестных компаний."
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {REQUIREMENTS.map((r) => (
            <RevealItem key={r.title}>
              <div className="h-full rounded-2xl border bg-card p-6 shadow-card">
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <r.icon className="size-5" />
                </div>
                <h2 className="mt-4 font-semibold">{r.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {r.text}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-12 rounded-2xl border bg-muted/40 p-6 text-center md:p-10" delay={0.05}>
          <h2 className="text-xl font-semibold">Соответствуете требованиям?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Зарегистрируйте компанию — модерация обычно занимает один рабочий
            день.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/register?role=contractor&source=requirements">
              Зарегистрировать компанию
            </Link>
          </Button>
        </Reveal>
      </section>
    </main>
  );
}
