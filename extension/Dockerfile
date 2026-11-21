# ==========================================
# Extension Builder Base
# ==========================================
FROM node:24-alpine AS base
WORKDIR /app

ARG APP_URL=http://localhost:8000
ENV APP_URL=${APP_URL}

RUN apk add --no-cache zip
COPY package*.json ./
COPY packages/ ./packages/
COPY services/ ./services/
RUN npm ci
COPY extension/ ./extension/

# ==========================================
# Target: runner (Production - Built & Zipped)
# ==========================================
FROM base AS runner
RUN npm run extension:build
RUN cd extension/dist && zip -r /app/extension.zip *

# ==========================================
# Target: dev (Development / Watch)
# ==========================================
FROM base AS dev
CMD ["npm", "run", "extension:popup:dev"]
