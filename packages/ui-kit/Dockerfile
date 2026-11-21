# ==========================================
# UI-Kit Builder Base
# ==========================================
FROM node:24-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY packages/ui-kit/package*.json ./packages/ui-kit/
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci && rm -rf /app/packages/ui-kit/node_modules && ln -s /app/frontend/node_modules /app/packages/ui-kit/node_modules

COPY packages/ui-kit ./packages/ui-kit
WORKDIR /app/packages/ui-kit

# ==========================================
# Target: runner (Production - Built Package)
# ==========================================
FROM base AS runner
RUN npm run build
CMD ["node", "-e", "console.log('UI Kit production bundle built successfully.')"]

# ==========================================
# Target: dev (Storybook Development Server)
# ==========================================
FROM base AS dev
EXPOSE 6006
CMD ["npm", "run", "storybook"]
