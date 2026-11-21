# ==========================================
# Frontend Production Builder
# ==========================================
FROM node:24-alpine AS builder
WORKDIR /app

ARG APP_URL=http://localhost:8000
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
# Target: runner (Production)
# ==========================================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/public ./public

EXPOSE 3000

CMD ["sh", "-c", "if [ -f frontend/server.js ]; then node frontend/server.js; elif [ -f server.js ]; then node server.js; else find . -name 'server.js' -exec node {} \\;; fi"]

# ==========================================
# Target: dev (Development with Fast Refresh)
# ==========================================
FROM node:24-alpine AS dev
WORKDIR /app

ENV NODE_ENV=development \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
COPY packages/ui-kit ./packages/ui-kit
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci && rm -rf /app/packages/ui-kit/node_modules && ln -s /app/frontend/node_modules /app/packages/ui-kit/node_modules
COPY frontend/ ./

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
