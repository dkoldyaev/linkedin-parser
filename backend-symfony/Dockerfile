FROM dunglas/frankenphp:1-php8.3

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    SERVER_NAME=":80"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
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

COPY backend-symfony/ /app/

RUN composer install --no-dev --optimize-autoloader --no-interaction

EXPOSE 80

HEALTHCHECK --interval=5s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://127.0.0.1/api/health | grep -q 'healthy'
