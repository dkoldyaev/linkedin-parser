# ==========================================
# Parser-API Base
# ==========================================
FROM node:24-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/parsers ./packages/parsers
COPY services/parser-api ./services/parser-api

RUN npm ci

RUN npm run build --workspace=@parser-as-service/parsers

WORKDIR /app/services/parser-api

# ==========================================
# Target: runner (Production)
# ==========================================
FROM base AS runner
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start"]

# ==========================================
# Target: dev (Development)
# ==========================================
FROM base AS dev
EXPOSE 4000
CMD ["npm", "run", "dev"]
