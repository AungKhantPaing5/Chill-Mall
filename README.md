# CHILL MALL — AI Video Streaming Platform

Production-ready, bilingual (**English / Myanmar**) AI Video Streaming Platform built with **Next.js 15 App Router, React 19, TypeScript, Prisma, PostgreSQL, Redis, BullMQ, FFmpeg Worker, Hybrid Storage (Local VPS + S3/Cloudflare R2), and Docker Compose**.

## Features Included
- **Bilingual Support (EN / MY):** `next-intl` with persistent cookie + user profile preference and Myanmar Unicode font (`Padauk`).
- **4 Video Visibility Modes:** `PUBLIC`, `PRIVATE`, `UNLISTED`, `ADMIN_ONLY` enforced server-side.
- **Protected HLS Streaming:** Signed short-lived HMAC-SHA256 tokens for HLS manifests and `.ts` segments.
- **Background FFmpeg Worker:** Separate Docker worker (`src/worker/index.ts`) powered by BullMQ + Redis generating 360p/480p/720p HLS streams and thumbnails.
- **Hybrid Storage Manager:** Unified `IStorageProvider` supporting Local VPS Storage and S3/R2 with SHA-256 verified safe migration.
- **Security:** Argon2id password hashing, HTTP-only DB-backed sessions, RBAC, rate limiting, security headers.
- **Legacy Migration Utility:** Read-only SQLite inspection + SHA-256 verified media copy scripts (`scripts/legacy/`).
- **Monetization & SEO:** Policy-compliant `AdSlot`, dynamic XML sitemap excluding private videos, `robots.txt`.

## Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: CHILL MALL streaming platform"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/chill-mall.git
git push -u origin main
```

## Ubuntu VPS Production Deployment (Docker Compose)
1. Clone repository & create `.env`:
   ```bash
   cp .env.example .env
   nano .env
   ```
2. Place SSL certificates (`fullchain.pem`, `privkey.pem`) in `docker/nginx/certs/`.
3. Build & start all services:
   ```bash
   docker compose up -d --build
   ```
4. Run database migrations & initial seed (creates Super Admin):
   ```bash
   docker compose exec web npx prisma migrate deploy
   docker compose exec web npm run prisma:seed
   ```
5. Verify health:
   ```bash
   curl -k https://localhost/api/health
   ```

## Backup & Restore
- **Database Backup:** `./scripts/backup/backup-db.sh`
- **Database Restore:** `./scripts/backup/restore-db.sh ./backups/<file>.sql.gz`
- **Media Backup:** Back up `/data/media` (or your S3/R2 bucket) separately using `rclone` or `rsync`.

## Running Tests
```bash
npm install
npm run typecheck
npm test
npm run build
```
