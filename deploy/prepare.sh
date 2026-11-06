#!/usr/bin/env bash
set -euo pipefail
# Run as root after inspection of the Debian host. This never drops databases.
test "$(id -u)" = 0
install -d -m 0755 -o srv653 -g www-data /srv/dele /srv/dele/releases
install -d -m 0750 -o srv653 -g www-data /srv/dele/shared
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='www-data'" | grep -q 1; then
  sudo -u postgres createuser --no-superuser --no-createdb --no-createrole www-data
fi
for database in dele dele_test; do
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$database'" | grep -q 1; then
    sudo -u postgres createdb --owner=www-data "$database"
  fi
done
if [ ! -f /srv/dele/shared/.env ]; then
  appkey="$(php -r 'echo "base64:".base64_encode(random_bytes(32));')"
  umask 0027
  cat > /srv/dele/shared/.env <<EOF
APP_NAME=DELE
APP_ENV=production
APP_KEY=$appkey
APP_DEBUG=false
APP_URL=https://176.118.222.21
APP_LOCALE=ru
APP_FALLBACK_LOCALE=en
LOG_CHANNEL=stack
LOG_LEVEL=warning
DB_CONNECTION=pgsql
DB_HOST=/var/run/postgresql
DB_PORT=5432
DB_DATABASE=dele
DB_USERNAME=www-data
DB_PASSWORD=
SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
CACHE_STORE=file
QUEUE_CONNECTION=sync
MAIL_MAILER=log
EOF
  chown srv653:www-data /srv/dele/shared/.env
  chmod 0640 /srv/dele/shared/.env
fi
install -d -m 0755 /var/www/dele-acme/.well-known/acme-challenge
systemctl enable --now nginx php8.4-fpm postgresql
echo 'DELE directories and empty PostgreSQL databases prepared. No demo seed executed.'
