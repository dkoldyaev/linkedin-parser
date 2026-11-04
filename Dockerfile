# ==========================================
# Stage 1: Build Extension
# ==========================================
FROM node:24-alpine AS extension-builder
WORKDIR /app
RUN apk add --no-cache zip
COPY package*.json ./
COPY packages/ ./packages/
COPY services/ ./services/
RUN npm ci
COPY extension/ ./extension/
RUN npm run extension:build
RUN cd extension/dist && zip -r /app/extension.zip *

# ==========================================
# Stage 2: Build Next.js Frontend
# ==========================================
FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend

ARG APP_URL
ENV APP_URL=${APP_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 3: Python Backend Runtime
# ==========================================
FROM python:3.11-slim AS backend

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    STATIC_DIR=/app/static \
    DATA_DIR=/app/data

# Install curl for healthcheck and Chromium for selenium-driverless
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ ./backend

# Copy extension zip to static dir so it can be downloaded at /extension.zip
RUN mkdir -p /app/static
COPY --from=extension-builder /app/extension.zip /app/static/extension.zip

# Create data dir for SQLite persistence
RUN mkdir -p /app/data && chmod -R 777 /app/data

EXPOSE 8000

HEALTHCHECK --interval=5s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/health || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]

# ==========================================
# Stage 4: Next.js Frontend Production Server
# ==========================================
FROM node:24-alpine AS frontend-runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

# Copy standalone build and static assets
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=extension-builder /app/extension.zip ./frontend/public/extension.zip

EXPOSE 3000

CMD ["node", "frontend/server.js"]
