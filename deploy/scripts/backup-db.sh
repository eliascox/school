#!/bin/bash
# ==============================================================================
# SchoolPro Automated PostgreSQL Database Backup Script
# Usage: ./backup-db.sh
# Can be scheduled via crontab: 0 2 * * * /opt/schoolpro/deploy/scripts/backup-db.sh
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/schoolpro/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/schoolpro_db_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="${CONTAINER_NAME:-schoolpro-postgres}"
DB_USER="${POSTGRES_USER:-schoolpro_admin}"
DB_NAME="${POSTGRES_DB:-schoolpro_production}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting automated database backup..."

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: PostgreSQL container '${CONTAINER_NAME}' is not running!" >&2
    exit 1
fi

# Execute pg_dump and stream to gzip
docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip -9 > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "✔ Backup completed successfully: ${BACKUP_FILE} (${FILE_SIZE})"

# Prune old backups older than RETENTION_DAYS
echo "Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "schoolpro_db_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete

echo "[$(date '+%Y-%m-%d %H:%M:%S')] All backup maintenance tasks completed."
