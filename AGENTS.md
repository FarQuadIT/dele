# DELE Laravel

Laravel 13 / PHP 8.4, Inertia 2, React 19 and PostgreSQL.
Frontend: resources/js. Backend: app, routes and database.
Run npm run build and php vendor/phpunit/phpunit/phpunit -c phpunit.xml.
Never run tests against the application database: use SQLite :memory: or the dedicated dele_test PostgreSQL database.
Do not seed shared demo users or touch Timeweb resources.
