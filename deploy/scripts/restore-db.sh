#!/bin/bash
# ==============================================================================
# SchoolPro Automated PostgreSQL Database Restore Script
# Usage: ./restore-db.sh /path/to/schoolpro_db_20261003_120000.sql.gz
# ==============================================================================

set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage: $0 <path-to-backup-file.sql.gz>"
    echo "Example: $0 /opt/schoolpro/backups/schoolpro_db_20261003_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${CONTAINER_NAME:-schoolpro-postgres}"
DB_USER="${POSTGRES_USER:-schoolpro_admin}"
DB_NAME="${POSTGRES_DB:-schoolpro_production}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file '${BACKUP_FILE}' does not exist!" >&2
    exit 1
fi

echo "=================================================================="
echo "  WARNING: YOU ARE ABOUT TO RESTORE A PRODUCTION DATABASE!"
echo "  Target Database : ${DB_NAME} on container ${CONTAINER_NAME}"
echo "  Backup Source   : ${BACKUP_FILE}"
echo "=================================================================="

read -p "Are you sure you want to overwrite all data? (yes/NO): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled by user."
    exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database restoration..."

# Decompress and feed to psql
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "✔ Database restoration completed successfully!"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting API service to refresh connection pool..."
docker compose -f docker-compose.prod.yml restart api
echo "✔ Done."
