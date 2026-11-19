#!/usr/bin/env bash
set -euo pipefail
mkdir -p ./backups
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUT_FILE="./backups/chillmall-db-${TIMESTAMP}.sql.gz"
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-chillmall}" "${POSTGRES_DB:-chillmall}" | gzip > "$OUT_FILE"
echo "Database backup created: $OUT_FILE"
echo "NOTE: Media files in /data/media or S3 must be backed up separately (e.g. via rclone/rsync)."
