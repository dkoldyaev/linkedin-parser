FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/parsers ./packages/parsers
COPY services/parser-api ./services/parser-api

# The lockfile comes from macOS and misses Linux optional native deps (npm bug #4828)
RUN rm -f package-lock.json && npm install

RUN npm run build --workspace=@parser-as-service/parsers

WORKDIR /app/services/parser-api
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]
