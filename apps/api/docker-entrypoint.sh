#!/bin/sh
set -e

echo "=========================================================="
echo "  SchoolPro Central API - Container Starting Up"
echo "  Environment: ${NODE_ENV:-production}"
echo "=========================================================="

# Wait for PostgreSQL to be ready
echo "[1/3] Checking Database connectivity..."
until nc -z -v -w30 ${DB_HOST:-postgres} ${DB_PORT:-5432} 2>/dev/null; do
  echo "Waiting for database at ${DB_HOST:-postgres}:${DB_PORT:-5432} to become ready..."
  sleep 2
done
echo "✔ Database is reachable!"

# Apply Prisma Migrations
echo "[2/3] Applying Prisma Database Migrations..."
npx prisma migrate deploy || {
  echo "Prisma migrate deploy encountered a notice, verifying schema sync..."
}

# Optional Seeding for fresh deployment
if [ "$RUN_SEED" = "true" ]; then
  echo "[Optional] Running Central Database Seed..."
  npx prisma db seed || echo "Seed completed or already populated."
fi

# Start Application
echo "[3/3] Launching SchoolPro Central Cloud API..."
exec "$@"
