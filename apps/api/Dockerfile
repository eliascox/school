# ==============================================================================
# Multi-Stage Production Dockerfile for SchoolPro Central API
# ==============================================================================

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder
WORKDIR /app

# Install native compilation dependencies for bcrypt / crypto
RUN apk add --no-cache python3 make g++ openssl

# Copy root workspace configuration
COPY package.json package-lock.json* ./
COPY packages/shared-types ./packages/shared-types
COPY packages/crypto-utils ./packages/crypto-utils
COPY apps/api ./apps/api

# Install workspace dependencies
RUN npm install

# Build shared library dependencies
RUN npm run build --workspace=@sms/shared-types
RUN npm run build --workspace=@sms/crypto-utils

# Generate Prisma Client & Build NestJS API
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Stage 2: Lean Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime utilities for healthcheck & network wait
RUN apk add --no-cache curl netcat-openbsd openssl

ENV NODE_ENV=production
ENV PORT=3000

# Create secure non-root service account
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy root and workspace node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh

# Set working directory to API
WORKDIR /app/apps/api

# Fix execution permissions
RUN chmod +x docker-entrypoint.sh && \
    mkdir -p uploads && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
