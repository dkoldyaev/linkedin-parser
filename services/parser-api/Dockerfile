FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/parsers ./packages/parsers
COPY services/parser-api ./services/parser-api

RUN npm install

WORKDIR /app/services/parser-api
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]
