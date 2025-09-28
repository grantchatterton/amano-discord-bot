FROM node:lts-bookworm-slim

RUN useradd --system nodeuser

WORKDIR /app

COPY package*.json .

RUN npm ci --omit=dev

COPY . .

USER nodeuser

CMD ["node", "src/index.js"]
