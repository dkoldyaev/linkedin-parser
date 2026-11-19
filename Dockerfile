# Stage 1: Build Frontend Assets & Extension
FROM node:24-alpine AS frontend-builder
WORKDIR /app

ARG APP_URL
ENV APP_URL=${APP_URL}

RUN apk add --no-cache zip

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build extension
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY services/ ./services/
RUN npm ci
COPY extension/ ./extension/
RUN npm run extension:build
RUN cd extension/dist && zip -r /app/frontend/dist/extension.zip *

# Stage 2: Symfony Backend Runtime with FrankenPHP
FROM dunglas/frankenphp:1-php8.3

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

# Copy Composer binary
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy Symfony backend application
COPY backend-symfony/ /app/

# Install composer dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts \
    && composer dump-autoload --optimize --classmap-authoritative

# Copy built frontend assets to public directory
COPY --from=frontend-builder /app/frontend/dist /app/public

# Install bundle assets (EasyAdmin, API Platform) into public/bundles
RUN php bin/console assets:install public

# Ensure entrypoint is executable
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=5s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/health | grep -q 'ok'

ENTRYPOINT ["/app/docker-entrypoint.sh"]
