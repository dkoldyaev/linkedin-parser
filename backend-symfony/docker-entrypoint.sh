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

# Run database initialization, schema migration, admin creation, and mock data seeding
echo "Running database initialization..."
php bin/console app:init-database

# Setup messenger transport tables if necessary
php bin/console messenger:setup-transports --quiet || true

# Start background messenger worker
echo "Starting Messenger background worker..."
php bin/console messenger:consume async --memory-limit=128M --time-limit=3600 &

echo "Starting FrankenPHP on ${SERVER_NAME}..."
exec frankenphp run --config /etc/caddy/Caddyfile
