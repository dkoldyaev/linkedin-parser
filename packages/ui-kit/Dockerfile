# ==========================================
# UI-Kit Builder Base
# ==========================================
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ui-kit/package.json ./packages/ui-kit/
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile --filter @blueprint/ui-kit...

COPY packages/ui-kit ./packages/ui-kit
WORKDIR /app/packages/ui-kit

# ==========================================
# Target: runner (Production - Built Package)
# ==========================================
FROM base AS runner
RUN pnpm run build
CMD ["node", "-e", "console.log('UI Kit production bundle built successfully.')"]

# ==========================================
# Target: dev (Storybook Development Server)
# ==========================================
FROM base AS dev
EXPOSE 6006
CMD ["pnpm", "run", "storybook"]
