FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache ffmpeg python3 make g++
COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN addgroup --system --gid 1001 worker && adduser --system --uid 1001 worker     && mkdir -p /data/media /data/tmp && chown -R worker:worker /data /app

USER worker
CMD ["npx", "tsx", "src/worker/index.ts"]
