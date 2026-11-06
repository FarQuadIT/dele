"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal, SectionHeading } from "@/components/motion/reveal";
import { track } from "@/lib/analytics";

const AUDIENCE = [
  "Загородные дома",
  "Квартиры с комплексными системами",
  "Коммерческие объекты",
  "Новые объекты — с первого дня",
  "Приобретённая недвижимость",
];

const FAQ = [
  {
    q: "Обязательно ли сразу заполнять весь профиль?",
    a: "Нет. Можно начать с одной инженерной системы или загрузить только имеющиеся документы. Профиль постепенно дополняется по мере эксплуатации и выполнения работ.",
  },
  {
    q: "Что делать, если я не знаю, какое оборудование установлено?",
    a: "Закажите обследование — специалист приедет, соберёт сведения об оборудовании и заполнит цифровой профиль за вас.",
  },
  {
    q: "Кто видит информацию об объекте?",
    a: "Владелец управляет доступом. Исполнителю предоставляются только сведения, необходимые для выполнения конкретной задачи.",
  },
  {
    q: "Можно ли использовать сервис только для разовых заявок?",
    a: "Да. Создавайте отдельные заявки на ремонт, монтаж или обслуживание без подключения комплексного сопровождения.",
  },
  {
    q: "Можно ли подключить регулярное обслуживание?",
    a: "Да. Для отдельных систем или всего объекта можно выбрать периодическое сервисное обслуживание.",
  },
  {
    q: "Что происходит после выполнения работы?",
    a: "Документы и результаты сохраняются в заказе. Данные попадают в цифровой профиль после подтверждения владельцем.",
  },
  {
    q: "Может ли компания вести в сервисе своих клиентов?",
    a: "Да. Компания ведёт заказы, этапы работ, документы и историю взаимодействия, а также предлагает клиентам регулярное обслуживание.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 border-t bg-muted/40 py-24">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-6">
        <SectionHeading eyebrow="Вопросы и ответы" title="Частые вопросы" />

        {/* Для кого подходит — компактные чипы */}
        <Reveal className="mt-8 flex flex-wrap justify-center gap-2">
          {AUDIENCE.map((a) => (
            <span
              key={a}
              className="rounded-full border bg-card px-3.5 py-1.5 text-sm text-muted-foreground"
            >
              {a}
            </span>
          ))}
        </Reveal>

        <Reveal className="mt-10" delay={0.1}>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger
                  className="text-left text-base"
                  onClick={() => track({ name: "faq_open", question: item.q })}
                >
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
