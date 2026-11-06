import { FileQuestion, FolderOpen, CalendarX, Siren } from "lucide-react";
import {
  Reveal,
  RevealGroup,
  RevealItem,
  SectionHeading,
} from "@/components/motion/reveal";

const PROBLEMS = [
  {
    icon: FileQuestion,
    title: "Неизвестно, что именно установлено",
    text: "Оборудование ставили разные компании или предыдущий собственник. Модели, параметры и контакты исполнителей теряются.",
  },
  {
    icon: FolderOpen,
    title: "Документы — в разных местах",
    text: "Паспорта, схемы, гарантии, договоры и акты — в папках, почте, мессенджерах. Или их нет вовсе.",
  },
  {
    icon: CalendarX,
    title: "Обслуживание легко пропустить",
    text: "Фильтры, насосы, котлы и вентиляция имеют собственные регламенты и сроки, которые сложно держать в голове.",
  },
  {
    icon: Siren,
    title: "При аварии всё ищется заново",
    text: "Срочно понять, что сломалось, найти специалиста и заново объяснить ему устройство системы.",
  },
];

export function ProblemsSection() {
  return (
    <section id="problems" className="mx-auto w-full max-w-6xl px-4 py-24 md:px-6">
      <SectionHeading
        eyebrow="Знакомая ситуация"
        title="Чем больше систем в доме, тем сложнее держать всё в голове"
        subtitle="Вентиляция, отопление, вода, электричество и другое оборудование требуют документов, обслуживания и контроля."
      />

      <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
        {PROBLEMS.map((p) => (
          <RevealItem key={p.title}>
            <div className="group h-full rounded-2xl border bg-card p-6 shadow-card transition-shadow hover:shadow-float">
              <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <p.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p.text}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal className="mt-12 text-center" delay={0.1}>
        <p className="mx-auto max-w-2xl text-pretty text-lg font-medium">
          DELE собирает всю эту информацию в одном месте и превращает
          обслуживание объекта в понятный процесс.
        </p>
      </Reveal>
    </section>
  );
}
