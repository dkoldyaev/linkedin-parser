# ==========================================
# Frontend Production Builder (Vite SPA)
# ==========================================
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ui-kit/package.json ./packages/ui-kit/
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile --filter frontend...

COPY packages/ui-kit ./packages/ui-kit
COPY frontend ./frontend
WORKDIR /app/frontend
RUN pnpm run build

# ==========================================
# Target: runner (Production Static Nginx)
# ==========================================
FROM nginx:1.27-alpine AS runner

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

# ==========================================
# Target: dev (Development with Vite HMR)
# ==========================================
FROM node:24-alpine AS dev
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app

ENV NODE_ENV=development

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ui-kit/package.json ./packages/ui-kit/
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile --filter frontend...

COPY packages/ui-kit ./packages/ui-kit
COPY frontend ./frontend
WORKDIR /app/frontend

EXPOSE 3000

CMD ["pnpm", "run", "dev", "--host", "0.0.0.0", "--port", "3000"]
