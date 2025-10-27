FROM node:lts-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package*.json .

RUN npm ci --omit=dev

COPY --chown=appuser:appgroup . .

USER appuser

CMD ["node", "src/index.js"]
