#!/usr/bin/env bash
set -euo pipefail

LEGACY_DIR="${1:-/opt/chillmal-legacy}"
SQLITE_DB="${2:-$LEGACY_DIR/instance/app.db}"
MEDIA_DIR="${3:-$LEGACY_DIR/media}"
BACKUP_ROOT="./backups/legacy-preflight-$(date +%Y%m%d-%H%M%S)"

echo "=================================================="
echo " CHILL MALL - STAGE 1 LEGACY INSPECTION & BACKUP"
echo "=================================================="

mkdir -p "$BACKUP_ROOT"

if [ -d "$LEGACY_DIR" ]; then
  ls -la "$LEGACY_DIR" > "$BACKUP_ROOT/legacy_dir_listing.txt"
  echo "[1/5] Found legacy directory: $LEGACY_DIR"
else
  echo "[1/5] WARNING: Legacy directory not found at $LEGACY_DIR"
fi

if command -v docker >/dev/null 2>&1; then
  docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" > "$BACKUP_ROOT/docker_containers.txt"
fi

if [ -f "$SQLITE_DB" ]; then
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$SQLITE_DB" ".backup '$BACKUP_ROOT/legacy_backup.db'"
    sha256sum "$SQLITE_DB" "$BACKUP_ROOT/legacy_backup.db" > "$BACKUP_ROOT/db_checksums.txt"
    sqlite3 -readonly "$SQLITE_DB" ".schema" > "$BACKUP_ROOT/legacy_schema.sql"
    echo "[2/5] SQLite online backup & schema dump completed."
  else
    cp -p "$SQLITE_DB" "$BACKUP_ROOT/legacy_backup.db"
    echo "[2/5] Copied SQLite DB."
  fi
else
  echo "[2/5] ERROR: SQLite database not found at $SQLITE_DB"
  exit 1
fi

if [ -d "$MEDIA_DIR" ]; then
  du -sh "$MEDIA_DIR" > "$BACKUP_ROOT/media_size.txt"
  find "$MEDIA_DIR" -type f -exec sha256sum {} + > "$BACKUP_ROOT/media_manifest.sha256"
  echo "[3/5] Generated SHA-256 media manifest."
fi

echo "[Done] Reports & backups saved to: $BACKUP_ROOT"
