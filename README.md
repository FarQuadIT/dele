# DELE

Цифровая платформа полного жизненного цикла инженерных систем зданий: цифровой профиль объекта, заявки, отклики, заказы, этапы работ, технадзор и споры.

Стек: **Next.js 16** · TypeScript · Tailwind · shadcn/ui · Prisma · PostgreSQL · Auth.js · React Three Fiber · Motion · Lenis.

## Быстрый старт

1. Задайте `DATABASE_URL` в `.env` (строка подключения PostgreSQL — см. «Деплой на Timeweb Cloud» ниже).
2. Установите зависимости и примените миграции:

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

## База данных

Используется PostgreSQL через адаптер `@prisma/adapter-pg`. Строка подключения — в `.env` (`DATABASE_URL="postgresql://user:pass@host:5432/db"`).

Если провайдер маршрутизирует TLS по домену и требует свой корневой сертификат (как Timeweb Cloud DBaaS), положите его в `prisma/certs/timeweb-ca.crt` — `src/lib/db.ts`, `prisma/seed.ts` и `prisma/verify.ts` подхватят его автоматически для полной проверки цепочки (`sslmode=verify-full`). Если файла нет — соединение идёт без явной настройки TLS (провайдер сам решает через параметры URL).

## Деплой на Timeweb Cloud (App Platform)

1. **База данных**: создайте кластер PostgreSQL в разделе «Базы данных» (регион — тот же, что у приложения; SSR у Next.js на Timeweb доступен только в Москве и Амстердаме). Скопируйте строку подключения по домену (не по голому IP — у Timeweb TLS маршрутизируется по SNI) с вкладки «Подключение» и сохраните корневой сертификат в `prisma/certs/timeweb-ca.crt`.
2. **Приложение**: в App Platform подключите репозиторий, фреймворк — Next.js, включите SSR.
   - Команда сборки: `npx prisma generate && npm run build`
   - Команда запуска: `npx prisma migrate deploy && npm start`
   - Переменные окружения: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`
3. При первом деплое миграции применятся автоматически. Сид демо-данными (`npm run db:seed`) запускается вручную одноразово (не как часть команды запуска — иначе демо-данные будут пересоздаваться при каждом перезапуске).

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
