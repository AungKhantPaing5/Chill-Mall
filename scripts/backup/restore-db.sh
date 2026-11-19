#!/usr/bin/env bash
set -euo pipefail
BACKUP_FILE="${1:?Usage: ./scripts/backup/restore-db.sh ./backups/file.sql.gz}"
gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U "${POSTGRES_USER:-chillmall}" "${POSTGRES_DB:-chillmall}"
echo "Database restored from: $BACKUP_FILE"
