FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/parsers ./packages/parsers
COPY services/parser-api ./services/parser-api

RUN npm ci

RUN npm run build --workspace=@parser-as-service/parsers

WORKDIR /app/services/parser-api
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]
