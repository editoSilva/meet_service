FROM node:20-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]