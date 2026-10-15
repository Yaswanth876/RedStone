FROM node:20-alpine

WORKDIR /app

# Install openssl required by Prisma
RUN apk add --no-cache openssl

# Install npm dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source code
COPY src ./src/

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "src/server.js"]
