# ==========================================
# Extension Builder Base
# ==========================================
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app

ARG APP_URL=http://localhost:8000
ENV APP_URL=${APP_URL}

RUN apk add --no-cache zip
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY services/ ./services/
COPY extension/ ./extension/
RUN pnpm install --frozen-lockfile

# ==========================================
# Target: runner (Production - Built & Zipped)
# ==========================================
FROM base AS runner
RUN pnpm run extension:build
RUN cd extension/dist && zip -r /app/extension.zip *

# ==========================================
# Target: dev (Development / Watch)
# ==========================================
FROM base AS dev
CMD ["pnpm", "run", "extension:popup:dev"]
