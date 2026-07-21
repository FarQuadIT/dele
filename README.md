# DELE

Цифровая платформа полного жизненного цикла инженерных систем зданий: цифровой профиль объекта, заявки, отклики, заказы, этапы работ, технадзор и споры.

Стек: **Next.js 16** · TypeScript · Tailwind · shadcn/ui · Prisma · SQLite · Auth.js · React Three Fiber · Motion · Lenis.

## Быстрый старт

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### Демо-аккаунты (после сида)

| Роль        | Email                   | Пароль     |
|-------------|-------------------------|------------|
| Заказчик    | `customer@dele.ru`      | `demo1234` |
| Исполнитель | `contractor@dele.ru`    | `demo1234` |
| Админ       | `admin@dele.ru`         | `demo1234` |

Prisma Studio: `npm run db:studio` → [http://localhost:5555](http://localhost:5555).

## Структура

- `src/app/(public)` — лендинг и публичные страницы
- `src/app/(customer)/app/customer` — кабинет заказчика
- `src/app/(contractor)/app/contractor` — кабинет исполнителя
- `src/app/(admin)/admin` — панель администратора
- `src/app/api/payments/webhook` — идемпотентный вебхук платежей
- `prisma/` — схема, миграции, сид

## Платежный вебхук

`POST /api/payments/webhook`

```json
{
  "event": "payment.succeeded",
  "externalId": "yk_123",
  "idempotencyKey": "<order-request-id>-final",
  "paymentId": "<optional Payment.id>",
  "amount": 150000
}
```

Повтор с тем же `externalId` возвращает `{ duplicate: true }` без двойного списания.

## Миграция на PostgreSQL

1. Установите адаптер: `npm i @prisma/adapter-pg pg`
2. В `prisma/schema.prisma` смените `provider = "sqlite"` → `provider = "postgresql"`
3. В `.env`: `DATABASE_URL="postgresql://user:pass@localhost:5432/dele"`
4. Обновите `src/lib/db.ts` — создавайте клиент через `PrismaPg` вместо `PrismaLibSql`
5. `npx prisma migrate deploy` (или `migrate dev` для новой БД)
6. `npm run db:seed`

Логика приложения от провайдера не зависит — меняется только адаптер и URL.

## Скрипты

| Команда            | Назначение              |
|--------------------|-------------------------|
| `npm run dev`      | Dev-сервер              |
| `npm run build`    | Production-сборка       |
| `npm run db:seed`  | Демо-данные             |
| `npm run db:studio`| Prisma Studio           |
| `npm run lint`     | ESLint                  |

## Устранение проблем

**Страница долго не открывается / зависает на «рендеринге» в dev-режиме.**
Первый заход на каждый маршрут в `next dev` (Turbopack) компилируется по требованию — это нормально, обычно 1–5 сек. Если ощутимо дольше или в терминале видны ошибки вида `Cannot find module` / `Unexpected end of JSON input` — кэш Turbopack повреждён. Остановите сервер и очистите кэш:

```bash
# остановить dev-сервер (Ctrl+C), затем
rm -rf .next   # PowerShell: Remove-Item -Recurse -Force .next
npm run dev
```

**Кнопка «Войти» / «Создать профиль» на лендинге не реагирует.**
Если вы уже авторизованы (валидная cookie сессии), `proxy.ts` намеренно уводит с `/login` и `/register` в ваш кабинет, а не показывает форму — это ожидаемое поведение. Хедер лендинга отражает это: вместо «Войти» показывается меню с именем аккаунта и пунктом «Личный кабинет» / «Выйти».
