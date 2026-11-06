#!/usr/bin/env bash
set -euo pipefail
# Publish a trusted, locally built archive. Run as root on the DELE host.
test "$(id -u)" = 0
archive="$(realpath "${1:?Pass a release archive}")"
release="${2:?Pass a new release name}"
[[ "$release" =~ ^[a-zA-Z0-9][a-zA-Z0-9._-]+$ ]] || exit 2
target="/srv/dele/releases/$release"
test -f "$archive"
test ! -e "$target"
test -f /srv/dele/shared/.env
install -d -m 0755 -o srv653 -g www-data "$target"
tar -xzf "$archive" -C "$target" --no-same-owner
test -f "$target/artisan"
test -f "$target/public/build/manifest.json"
test ! -e "$target/.env"
ln -s /srv/dele/shared/.env "$target/.env"
if [ ! -d /srv/dele/shared/storage ]; then
  install -d -m 2770 -o srv653 -g www-data /srv/dele/shared/storage
  if [ -d /srv/dele/current/storage ]; then
    cp -a /srv/dele/current/storage/. /srv/dele/shared/storage/
  fi
fi
if [ -d "$target/storage" ]; then
  cp -an "$target/storage/." /srv/dele/shared/storage/
  mv "$target/storage" "$target/storage-skeleton"
fi
ln -s /srv/dele/shared/storage "$target/storage"
install -d -m 2770 -o srv653 -g www-data /srv/dele/shared/storage/app/{private,public} /srv/dele/shared/storage/framework/{cache/data,sessions,views} /srv/dele/shared/storage/logs
chown -R srv653:www-data "$target" /srv/dele/shared/storage
chmod -R g+rwX /srv/dele/shared/storage "$target/bootstrap/cache"
cd "$target"
sudo -u srv653 composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
install -d -m 0750 -o srv653 -g www-data /srv/dele/shared/backups
umask 0027
sudo -u www-data pg_dump --format=custom dele > "/srv/dele/shared/backups/before-$release.dump"
sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan optimize
ln -s "$target" /srv/dele/.current-next
mv -Tf /srv/dele/.current-next /srv/dele/current
systemctl reload php8.4-fpm
curl --fail --silent --show-error --output /dev/null https://176.118.222.21/up
echo "Published $release"
