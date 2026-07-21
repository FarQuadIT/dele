import {
  Camera,
  FileCheck,
  MessagesSquare,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Reveal, SectionHeading } from "@/components/motion/reveal";
import { StageTracker } from "@/components/shared/stage-tracker";

const BENEFITS = [
  { icon: FileCheck, text: "Договоры, сметы и акты — в заказе" },
  { icon: Camera, text: "Фото- и видеофиксация этапов" },
  { icon: MessagesSquare, text: "Сообщения с исполнителем" },
  { icon: ShieldCheck, text: "Технический надзор по запросу" },
  { icon: Star, text: "Приёмка и оценка результата" },
];

const BEFORE = [
  "Искать документы",
  "Вспоминать модель оборудования",
  "Объяснять устройство системы",
  "Звонить нескольким компаниям",
  "Контролировать процесс вручную",
];

const AFTER = [
  "Открыть готовый профиль",
  "Выбрать оборудование из списка",
  "Передать исполнителю нужные сведения",
  "Получить отклики внутри сервиса",
  "Следить за этапами заказа",
];

export function WorkControlSection() {
  return (
    <section
      id="work-control"
      className="scroll-mt-20 border-y bg-muted/40 py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Прозрачность"
          title="Вы видите не только результат, но и весь процесс"
          subtitle="После выбора исполнителя заказ появляется в кабинете: этапы, документы, общение и приёмка — всё в одном месте."
        />

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[1.05fr_1fr]">
          {/* Живой трекер этапов (тот же компонент, что в кабинете) */}
          <Reveal>
            <div className="rounded-2xl border bg-card p-6 shadow-card md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Монтаж вентиляции</p>
                  <p className="text-xs text-muted-foreground">
                    Заказ DELE-2026-0142 · FLOW Engineering
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  В работе
                </span>
              </div>
              <StageTracker
                stages={[
                  { name: "Обследование объекта", status: "DONE", meta: "Фотоотчёт приложен" },
                  { name: "Подготовка проекта", status: "DONE", meta: "Проект согласован" },
                  { name: "Поставка оборудования", status: "IN_PROGRESS", meta: "Ожидается 2 дня" },
                  { name: "Монтаж", status: "PENDING" },
                  { name: "Пусконаладка", status: "PENDING" },
                  { name: "Приёмка", status: "PENDING" },
                ]}
              />
            </div>
          </Reveal>

          <div className="space-y-10">
            {/* Преимущества */}
            <Reveal delay={0.1}>
              <ul className="space-y-3">
                {BENEFITS.map((b) => (
                  <li key={b.text} className="flex items-center gap-3 text-sm">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <b.icon className="size-4" />
                    </span>
                    {b.text}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* До / После */}
            <Reveal delay={0.15}>
              <div className="overflow-hidden rounded-2xl border shadow-card">
                <div className="grid sm:grid-cols-2">
                  <div className="bg-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Без сервиса
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {BEFORE.map((t) => (
                        <li
                          key={t}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-secondary/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      С DELE
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {AFTER.map((t) => (
                        <li key={t} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="border-t bg-card px-5 py-3.5 text-center text-sm font-medium">
                  Одна заявка. Вся информация уже на месте.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
