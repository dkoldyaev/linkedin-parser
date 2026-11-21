#!/bin/sh
set -e

echo "=== Starting Symfony Backend with FrankenPHP ==="

# Wait for PostgreSQL database if configured
if echo "${DATABASE_URL}" | grep -q "postgres"; then
    echo "Checking database connectivity..."
    MAX_TRIES=30
    COUNT=0
    until php bin/console doctrine:query:sql "SELECT 1" > /dev/null 2>&1 || [ "$COUNT" -ge "$MAX_TRIES" ]; do
        echo "Waiting for database to be ready ($COUNT/$MAX_TRIES)..."
        sleep 2
        COUNT=$((COUNT + 1))
    done
fi

# Run doctrine migrations
echo "Running Doctrine database migrations..."
php bin/console doctrine:migrations:migrate --no-interaction --all-or-nothing || true

# Run database initialization & schema update
echo "Running database initialization..."
php bin/console app:init-database

# Configure admin users via user:make_admin
echo "Ensuring admin users via user:make_admin..."
php bin/console user:make_admin --no-interaction || true

# Seed mock data if CREATE_MOCK_DATA is enabled
if [ "${CREATE_MOCK_DATA}" = "true" ] || [ "${CREATE_MOCK_DATA}" = "1" ] || [ "${CREATE_MOCK_DATA}" = "yes" ]; then
    echo "Seeding mock data via mock:create..."
    php bin/console mock:create --no-interaction || true
fi

# Ensure bundle assets (EasyAdmin, API Platform) are installed
php bin/console assets:install public --quiet || true

# Setup messenger transport tables if necessary
php bin/console messenger:setup-transports --quiet || true

# Start background messenger worker with auto-restart
echo "Starting Messenger background worker with auto-restart..."
(
    while true; do
        php bin/console messenger:consume async --memory-limit=128M --time-limit=3600 --failure-limit=10 || true
        sleep 2
    done
) &

echo "Starting FrankenPHP on ${SERVER_NAME}..."
exec frankenphp run --config /etc/caddy/Caddyfile
