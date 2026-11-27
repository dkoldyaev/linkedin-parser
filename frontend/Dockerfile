# ==========================================
# Stage 1: Base Workspace Dependencies
# ==========================================
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ui-kit/package.json ./packages/ui-kit/
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile --filter @blueprint/ui-kit --filter frontend

# ==========================================
# Stage 2: UI-Kit Builder (@blueprint/ui-kit)
# ==========================================
FROM deps AS ui-kit-builder
COPY packages/ui-kit ./packages/ui-kit
RUN pnpm --filter @blueprint/ui-kit run build

# ==========================================
# Stage 3: Frontend Production Builder (Vite SPA)
# ==========================================
FROM ui-kit-builder AS builder
COPY frontend ./frontend
WORKDIR /app/frontend
RUN pnpm exec vite build

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
FROM ui-kit-builder AS dev
ENV NODE_ENV=development
COPY frontend ./frontend
WORKDIR /app/frontend

EXPOSE 3000

CMD ["pnpm", "run", "dev", "--host", "0.0.0.0", "--port", "3000"]
