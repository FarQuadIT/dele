#!/usr/bin/env bash
set -euo pipefail
test "$(id -u)" = 0
nginx -t
systemctl is-active nginx php8.4-fpm postgresql dele-certbot-renew.timer
systemctl is-enabled nginx php8.4-fpm postgresql dele-certbot-renew.timer
curl --fail --silent --show-error --output /dev/null https://176.118.222.21/
curl --fail --silent --show-error --output /dev/null https://176.118.222.21/up
test "$(curl --silent --output /dev/null --write-out '%{http_code}' https://176.118.222.21/.env)" = 403
test "$(curl --silent --output /dev/null --write-out '%{http_code}' https://176.118.222.21/composer.json)" = 404
sudo -u postgres psql -d dele -c 'SELECT count(*) AS users FROM "User";'
openssl x509 -in /etc/letsencrypt/live/176.118.222.21/fullchain.pem -noout -dates
echo 'DELE HTTPS, services and web root verified.'
