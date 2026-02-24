FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl

COPY package.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

CMD ["sh", "-c", "sleep 10 && npx prisma migrate deploy && node src/server.js"]