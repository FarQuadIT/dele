import {
  KeyRound,
  History,
  FolderLock,
  CheckCheck,
  BadgeCheck,
} from "lucide-react";
import {
  RevealGroup,
  RevealItem,
  SectionHeading,
} from "@/components/motion/reveal";

const CARDS = [
  {
    icon: KeyRound,
    title: "Управляемый доступ",
    text: "Доступ к данным получают только выбранные пользователи и исполнители — ровно в объёме конкретной задачи.",
  },
  {
    icon: History,
    title: "История изменений",
    text: "Сервис сохраняет, кто и когда добавил или изменил информацию в профиле объекта.",
  },
  {
    icon: FolderLock,
    title: "Контроль документов",
    text: "Документы и результаты работ привязаны к конкретному объекту, системе и заказу.",
  },
  {
    icon: CheckCheck,
    title: "Подтверждение обновлений",
    text: "Изменения профиля, предложенные исполнителем, вступают в силу только после подтверждения владельцем.",
  },
  {
    icon: BadgeCheck,
    title: "Профиль компании",
    text: "Реквизиты, специализации, сертификаты, портфолио и отзывы помогают принять обоснованное решение.",
  },
];

export function SecuritySection() {
  return (
    <section
      id="security"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-24 md:px-6"
    >
      <SectionHeading
        eyebrow="Доверие и безопасность"
        title="Техническая информация объекта остаётся под контролем владельца"
        subtitle="Владелец сам определяет, какие сведения доступны исполнителю — компания видит только то, что нужно для конкретной заявки."
      />

      <RevealGroup
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        stagger={0.09}
      >
        {CARDS.map((c) => (
          <RevealItem key={c.title}>
            <div className="h-full rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <c.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {c.text}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
