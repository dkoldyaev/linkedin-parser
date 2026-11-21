# ==========================================
# Symfony Backend Runtime Base (FrankenPHP)
# ==========================================
FROM dunglas/frankenphp:1-php8.3 AS base

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    SERVER_NAME=":8000"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    libpq-dev \
    librabbitmq-dev \
    && install-php-extensions \
        pdo_pgsql \
        intl \
        zip \
        apcu \
        opcache \
        amqp \
        redis \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

EXPOSE 8000

HEALTHCHECK --interval=5s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/v2/health | grep -q 'ok'

# ==========================================
# Target: runner (Production)
# ==========================================
FROM base AS runner

COPY backend-symfony/ /app/

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts \
    && composer dump-autoload --optimize --classmap-authoritative

RUN php bin/console assets:install public

RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]

# ==========================================
# Target: dev (Development)
# ==========================================
FROM base AS dev

ENV APP_ENV=dev \
    APP_DEBUG=1

COPY backend-symfony/ /app/

RUN composer install --optimize-autoloader --no-interaction --no-scripts

RUN php bin/console assets:install public || true

RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
