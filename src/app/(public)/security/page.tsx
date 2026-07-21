import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCheck,
  FolderLock,
  History,
  KeyRound,
  Lock,
  MapPinOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Безопасность",
  description:
    "Как DELE защищает данные объекта: управляемый доступ, история изменений и подтверждение обновлений.",
};

const PRINCIPLES = [
  {
    icon: KeyRound,
    title: "Доступ управляет владелец",
    text: "Исполнитель видит только те данные, которые нужны для конкретной заявки или заказа — и только с разрешения.",
  },
  {
    icon: MapPinOff,
    title: "Адрес закрыт до сделки",
    text: "До подтверждения заказа компания видит только район. Полный адрес открывается после выбора исполнителя.",
  },
  {
    icon: CheckCheck,
    title: "Изменения — с подтверждением",
    text: "Правки цифрового профиля от исполнителя вступают в силу только после подтверждения владельцем.",
  },
  {
    icon: History,
    title: "Полная история действий",
    text: "Кто, что и когда изменил — фиксируется в журнале. Критические операции оставляют аудиторский след.",
  },
  {
    icon: FolderLock,
    title: "Документы под контролем",
    text: "Файлы привязаны к объекту, системе и заказу. Версии сохраняются, ничего не теряется.",
  },
  {
    icon: Lock,
    title: "Защита аккаунта",
    text: "Пароли хранятся в хешированном виде, сессии защищены, платёжные операции идемпотентны.",
  },
];

export default function SecurityPage() {
  return (
    <main className="flex-1">
      <PageHero
        eyebrow="Безопасность"
        title="Данные объекта принадлежат владельцу"
        subtitle="Прозрачные правила доступа и контроль каждого изменения — базовые принципы DELE."
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {PRINCIPLES.map((p) => (
            <RevealItem key={p.title}>
              <div className="h-full rounded-2xl border bg-card p-6 shadow-card">
                <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <p.icon className="size-5" />
                </div>
                <h2 className="mt-4 font-semibold">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {p.text}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-12 rounded-2xl border bg-muted/40 p-6 text-center md:p-10">
          <h2 className="text-xl font-semibold">
            Остались вопросы о безопасности?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Расскажем, как устроено хранение данных и разграничение доступа.
          </p>
          <Button asChild size="lg" variant="outline" className="mt-5">
            <Link href="/help">Связаться с нами</Link>
          </Button>
        </Reveal>
      </section>
    </main>
  );
}
