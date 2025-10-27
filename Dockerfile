FROM node:lts-bookworm-slim

RUN adduser --disabled-password --gecos "" appuser

WORKDIR /app

COPY package*.json .

RUN npm ci --omit=dev

COPY --chown=appuser:appuser . .

USER appuser

CMD ["node", "src/index.js"]
