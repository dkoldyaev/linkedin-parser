# ==========================================
# Parser-API Base
# ==========================================
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

WORKDIR /app

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/parsers ./packages/parsers
COPY services/parser-api ./services/parser-api

RUN pnpm install --frozen-lockfile --filter @parser-as-service/parser-api...

RUN pnpm --filter @parser-as-service/parsers run build

WORKDIR /app/services/parser-api

# ==========================================
# Target: runner (Production)
# ==========================================
FROM base AS runner
RUN pnpm run build
EXPOSE 4000
CMD ["pnpm", "run", "start"]

# ==========================================
# Target: dev (Development)
# ==========================================
FROM base AS dev
EXPOSE 4000
CMD ["pnpm", "run", "dev"]
