FROM node:lts

RUN useradd --system appuser

WORKDIR /app

COPY package*.json .

RUN npm ci --omit=dev

COPY . .

USER appuser

CMD ["node", "src/index.js"]
