# ==========================================
# Stage 1: Build Extension
# ==========================================
FROM node:24-alpine AS extension-builder
WORKDIR /app

ARG APP_URL
ENV APP_URL=${APP_URL}

RUN apk add --no-cache zip
COPY package*.json ./
COPY packages/ ./packages/
COPY services/ ./services/
RUN npm ci
COPY extension/ ./extension/
RUN npm run extension:build
RUN cd extension/dist && zip -r /app/extension.zip *

# ==========================================
# Stage 2: Build @blueprint/ui-kit & Next.js Frontend
# ==========================================
FROM node:24-alpine AS frontend-builder
WORKDIR /app

ARG APP_URL
ARG BACKEND_INTERNAL_URL=http://app:8000
ENV APP_URL=${APP_URL} \
    BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL} \
    NEXT_TELEMETRY_DISABLED=1

COPY packages/ui-kit /app/packages/ui-kit
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci && rm -rf /app/packages/ui-kit/node_modules && ln -s /app/frontend/node_modules /app/packages/ui-kit/node_modules
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 3: Symfony Backend Runtime with FrankenPHP
# ==========================================
FROM dunglas/frankenphp:1-php8.3 AS backend

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

COPY backend-symfony/ /app/

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts \
    && composer dump-autoload --optimize --classmap-authoritative

COPY --from=extension-builder /app/extension.zip /app/public/extension.zip

RUN php bin/console assets:install public

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=5s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/health | grep -q 'ok'

ENTRYPOINT ["/app/docker-entrypoint.sh"]

# ==========================================
# Stage 4: Next.js Frontend Production Server
# ==========================================
FROM node:24-alpine AS frontend-runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=extension-builder /app/extension.zip ./frontend/public/extension.zip
COPY --from=extension-builder /app/extension.zip ./public/extension.zip

EXPOSE 3000

CMD ["sh", "-c", "if [ -f frontend/server.js ]; then node frontend/server.js; elif [ -f server.js ]; then node server.js; else find . -name 'server.js' -exec node {} \\;; fi"]
