import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";

const brandColors = [
  { name: "primary (индиго)", cls: "bg-primary" },
  { name: "teal (бирюза)", cls: "bg-teal" },
  { name: "secondary", cls: "bg-secondary" },
  { name: "accent", cls: "bg-accent" },
  { name: "muted", cls: "bg-muted" },
  { name: "destructive", cls: "bg-destructive" },
  { name: "success", cls: "bg-success" },
  { name: "warning", cls: "bg-warning" },
];

const systemColors = [
  { name: "Вода", cls: "bg-system-water" },
  { name: "Водоотвод", cls: "bg-system-drain" },
  { name: "Тепло", cls: "bg-system-heat" },
  { name: "Воздух", cls: "bg-system-air" },
  { name: "Электричество", cls: "bg-system-electric" },
  { name: "Автоматизация", cls: "bg-system-auto" },
];

export default function StyleguidePage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            DELE Design System
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Styleguide</h1>
          <p className="mt-2 text-muted-foreground">
            Палитра, типографика и базовые компоненты платформы.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <Separator className="my-10" />

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Палитра</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {brandColors.map((c) => (
            <div key={c.name} className="space-y-2">
              <div
                className={`h-20 rounded-xl border shadow-card ${c.cls}`}
              />
              <p className="text-sm text-muted-foreground">{c.name}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-10 text-lg font-semibold">
          Цвета инженерных систем
        </h3>
        <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
          {systemColors.map((c) => (
            <div key={c.name} className="space-y-2">
              <div className={`h-14 rounded-xl border shadow-card ${c.cls}`} />
              <p className="text-sm text-muted-foreground">{c.name}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="my-10" />

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Типографика</h2>
        <div className="mt-6 space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Заголовок H1 — Все системы под контролем
          </h1>
          <h2 className="text-3xl font-semibold tracking-tight">
            Заголовок H2 — Цифровой профиль объекта
          </h2>
          <h3 className="text-xl font-semibold">
            Заголовок H3 — История работ и документы
          </h3>
          <p className="max-w-2xl text-base leading-7">
            Обычный текст. Храните документы и сведения об оборудовании,
            следите за сроками обслуживания, вызывайте специалистов и
            сохраняйте всю историю работ в одном цифровом профиле.
          </p>
          <p className="text-sm text-muted-foreground">
            Вторичный текст — подписи, подсказки и пояснения.
          </p>
          <p className="font-mono text-sm">
            Моноширинный: DELE-ORDER-2026-0142
          </p>
        </div>
      </section>

      <Separator className="my-10" />

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Кнопки</h2>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button size="lg">Создать цифровой профиль</Button>
          <Button size="lg" variant="outline">
            Заказать помощь специалиста
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Удалить</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <Separator className="my-10" />

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Бейджи и статусы</h2>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Badge>Опубликована</Badge>
          <Badge variant="secondary">Черновик</Badge>
          <Badge variant="outline">Планируется</Badge>
          <Badge variant="destructive">В споре</Badge>
          <Badge className="bg-success text-white">Работает</Badge>
          <Badge className="bg-warning text-black">ТО через 18 дней</Badge>
        </div>
      </section>

      <Separator className="my-10" />

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">
          Карточки и формы
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Объект: Загородный дом</CardTitle>
              <CardDescription>Московская область, 214 м²</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-system-water" />
                  Вода
                </span>
                <span className="text-success">Работает</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-system-heat" />
                  Отопление
                </span>
                <span className="text-warning">ТО через 18 дней</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-system-air" />
                  Вентиляция
                </span>
                <span className="text-destructive">Требует внимания</span>
              </div>
              <Button className="mt-2 w-full">Создать заявку</Button>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Форма</CardTitle>
              <CardDescription>Поля ввода и переключатели</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Электронная почта</Label>
                <Input id="email" placeholder="you@example.ru" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notify">Напоминания об обслуживании</Label>
                <Switch id="notify" defaultChecked />
              </div>
              <Tabs defaultValue="list">
                <TabsList className="w-full">
                  <TabsTrigger value="list" className="flex-1">
                    Список
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="flex-1">
                    Календарь
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="list"
                  className="pt-3 text-sm text-muted-foreground"
                >
                  Заказы в виде списка.
                </TabsContent>
                <TabsContent
                  value="calendar"
                  className="pt-3 text-sm text-muted-foreground"
                >
                  Календарное представление заказов.
                </TabsContent>
              </Tabs>
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-10" />

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Тени</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 shadow-soft">
            shadow-soft
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-card">
            shadow-card
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-float">
            shadow-float
          </div>
        </div>
      </section>
    </main>
  );
}
