# ==========================================
# Frontend Production Builder (Vite SPA)
# ==========================================
FROM node:24-alpine AS builder
WORKDIR /app

COPY packages/ui-kit /app/packages/ui-kit
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci && rm -rf /app/packages/ui-kit/node_modules && ln -s /app/frontend/node_modules /app/packages/ui-kit/node_modules
COPY frontend/ ./
RUN npm run build

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
WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./
COPY packages/ui-kit ./packages/ui-kit
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci && rm -rf /app/packages/ui-kit/node_modules && ln -s /app/frontend/node_modules /app/packages/ui-kit/node_modules
COPY frontend/ ./

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
