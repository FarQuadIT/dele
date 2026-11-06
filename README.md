# DELE

Платформа обслуживания инженерных систем зданий. **Laravel 13 + Inertia 2 + React 19**, TypeScript, Tailwind 4, PostgreSQL. React-компоненты и 3D-сцена перенесены из GitHub `main` (`42c8926`) с сохранением адресов страниц. Node.js нужен для сборки интерфейса; на сервере работают Nginx и PHP-FPM.

Адрес: [https://176.118.222.21](https://176.118.222.21). Ветка: `codex/laravel-fatmetal`. Эта версия не использует старые сервисы Timeweb.

## Разработка

Нужны PHP 8.3+ (на сервере 8.4), Composer 2, Node.js 22+, расширения PHP `mbstring`, `xml`, `curl`, `intl`, `pdo_pgsql` / `pdo_sqlite`. В production используется PostgreSQL; SQLite подходит для локальной разработки и быстрых тестов.

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
npm ci
npm run dev
```

Во втором терминале: `php artisan serve`. Открыть `http://localhost:8000`. Для PostgreSQL заполнить стандартные `DB_*` в `.env`. `DATABASE_URL`, Auth.js и Prisma больше не нужны. `.env` не коммитить. В Windows файл SQLite можно создать командой `New-Item database/database.sqlite -ItemType File`.

## Пользователи

Через `/register` создаются заказчик и исполнитель. Исполнитель заполняет карточку компании; администратор подтверждает её перед отправкой откликов. Администратор создаётся отдельно:

```bash
php artisan dele:admin admin@example.com
```

Команда дважды запрашивает пароль без отображения. Минимум 12 символов, максимум 72 байта; существующую учётную запись команда не меняет. На сервере:

```bash
sudo -u www-data php /srv/dele/current/artisan dele:admin ВАШ_EMAIL
```

Миграции создают структуру; `DatabaseSeeder` не добавляет демо-аккаунтов. Данные Timeweb не импортируются. Сохранены роли и кабинеты, объекты и оборудование, заявки, отклики, заказы и этапы, приёмка, сообщения, документы, рекомендации, технадзор, споры, модерация и журнал действий.

Оплата остаётся демонстрационной. Настоящий эквайринг и SMTP не подключены. `/api/payments/webhook` выключен без `PAYMENT_WEBHOOK_SECRET`; при включении требует bearer-секрет длиной от 32 символов. Для реальной оплаты требуется отдельная интеграция с провайдером.

## Проверки

```bash
php vendor/phpunit/phpunit/phpunit -c phpunit.xml
npm run build
```

Feature-тесты проверяют вход, роли и владельца, цикл заявки и заказа, приёмку, демонстрационные платежи, рекомендации, технадзор, споры и изменения оборудования. По умолчанию используют SQLite in-memory; также проверены с PostgreSQL 17 и отдельной `dele_test`. **Никогда не запускать PHPUnit с рабочей БД:** тесты используют `RefreshDatabase`.

`tests/browser-smoke.cjs` проверяет публичные страницы и кабинеты в Chromium. Требует Playwright Chromium, отдельного QA-приложения на `http://127.0.0.1:3108` и JSON-файла `SMOKE_FIXTURES`. Его создаёт `tests/browser-fixtures.php` только при `APP_ENV=testing` и `DB_DATABASE=dele_test`.

## Fatmetal

Debian 13, PHP 8.4-FPM, Nginx, PostgreSQL 17. База `dele` доступна локально через Unix-сокет. Пользователь `www-data` проходит peer-аутентификацию без сетевого пароля. QA использует отдельную `dele_test`.

```text
/srv/dele/current -> releases/<release>
/srv/dele/releases/<release>/public   # единственный web root
/srv/dele/shared/.env                # ключ и production-настройки
/srv/dele/shared/storage             # сессии, логи, файлы между релизами
/srv/dele/shared/backups             # копия БД перед миграциями
```

В `deploy/` находятся конфигурация Nginx и скрипты подготовки/обновления. `prepare.sh` предназначен для Debian с уже установленными пакетами, запускается root и не удаляет существующие базы.

Для обновления собрать интерфейс локально, упаковать доверенный исходный код и `public/build`, исключив `.git`, `.env`, `vendor`, `node_modules`, `storage`, `public/hot`. Скопировать архив на сервер и проверить содержимое. Затем:

```bash
sudo bash /srv/dele/current/deploy/publish.sh /tmp/dele-release.tar.gz laravel-YYYYMMDD-HHMM
```

Скрипт создаёт новый релиз, устанавливает production-зависимости Composer, подключает общий `.env` и storage, сохраняет `pg_dump`, применяет миграции, кеширует Laravel, переключает симлинк и перезагружает PHP-FPM. Имя релиза должно быть новым. Использовать только собственные доверенные архивы.

Для отката кода переключить `/srv/dele/current` на предыдущий релиз и перезагрузить `php8.4-fpm`. Изменения схемы этим не отменяются; восстановление данных требует отдельного решения и резервной копии.

## HTTPS и обслуживание

Доверенный короткоживущий сертификат Let's Encrypt выпущен на IPv4. Certbot установлен в `/opt/dele-certbot`; `dele-certbot-renew.timer` дважды в день запускает продление и reload Nginx. IPv6 не входит в сертификат. Домен покупать не требуется.

```bash
systemctl status nginx php8.4-fpm postgresql
systemctl list-timers dele-certbot-renew.timer
sudo /opt/dele-certbot/bin/certbot certificates
curl --fail https://176.118.222.21/up
sudo tail -n 50 /srv/dele/shared/storage/logs/laravel.log
```

Сервисы и таймер включены в автозапуск. `APP_DEBUG=false`, HTTPS-cookie, закрытые dotfiles и ограниченный PHP entrypoint настроены на сервере. Резервные копии вне сервера, SMTP и платёжные секреты настраиваются отдельно при необходимости.
