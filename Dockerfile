# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
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
RUN npm install
COPY extension/ ./extension/
RUN npm run extension:build
RUN cd extension/dist && zip -r /app/frontend/dist/extension.zip *

# Stage 2: Python Backend Runtime
FROM python:3.11-slim

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
COPY mcp_server.py ./

# Copy built frontend assets to static dir
COPY --from=frontend-builder /app/frontend/dist /app/static

# Create data dir for SQLite persistence
RUN mkdir -p /app/data && chmod -R 777 /app/data

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
