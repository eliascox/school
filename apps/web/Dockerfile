# ==============================================================================
# Multi-Stage Production Dockerfile for SchoolPro Super Admin & Web Portal
# ==============================================================================

# Stage 1: Build Static Export
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace configuration
COPY package.json package-lock.json* ./
COPY packages/shared-types ./packages/shared-types
COPY packages/crypto-utils ./packages/crypto-utils
COPY apps/web ./apps/web

# Install dependencies
RUN npm install

# Build static Next.js export
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Ultra-Lean Production Nginx Server (<25MB)
FROM nginx:alpine AS runner

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/apps/web/out /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
