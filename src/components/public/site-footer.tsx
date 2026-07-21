import Link from "next/link";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Владельцам",
    links: [
      { label: "Возможности", href: "/#digital-profile" },
      { label: "Цифровой профиль", href: "/#digital-profile" },
      { label: "Обслуживание", href: "/#service-subscription" },
      { label: "Создание заявки", href: "/#use-cases" },
    ],
  },
  {
    title: "Компаниям",
    links: [
      { label: "Как получать заявки", href: "/for-business" },
      { label: "Требования к исполнителям", href: "/requirements" },
      { label: "Тарифы и комиссии", href: "/pricing" },
      { label: "Регистрация партнёра", href: "/register?role=contractor&source=footer" },
    ],
  },
  {
    title: "Сервис",
    links: [
      { label: "Как это работает", href: "/how-it-works" },
      { label: "Направления", href: "/services" },
      { label: "Безопасность", href: "/security" },
      { label: "Помощь", href: "/help" },
    ],
  },
  {
    title: "Документы",
    links: [
      { label: "Пользовательское соглашение", href: "/help" },
      { label: "Политика конфиденциальности", href: "/help" },
      { label: "Правила сервиса", href: "/help" },
    ],
  },
  {
    title: "Контакты",
    links: [
      { label: "hello@dele.ru", href: "mailto:hello@dele.ru" },
      { label: "+7 495 000-00-00", href: "tel:+74950000000" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <Link
              href="/"
              className="text-xl font-black tracking-widest text-primary"
            >
              DELE
            </Link>
            <p className="mt-3 max-w-40 text-sm text-muted-foreground">
              Цифровое управление инженерными системами объекта.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} DELE. Все права защищены.</p>
          <p>Сделано с заботой об инженерных системах.</p>
        </div>
      </div>
    </footer>
  );
}
