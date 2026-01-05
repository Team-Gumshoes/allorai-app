# Multi-stage Dockerfile for web app in monorepo
# Build context should be the monorepo root

# Development Stage
FROM node:20-alpine AS development
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.10.0 --activate

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./

# Copy all package.json files
COPY packages/types/package.json ./packages/types/
COPY packages/ui-components/package.json ./packages/ui-components/
COPY packages/utils/package.json ./packages/utils/
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy workspace packages source
COPY tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/ui-components ./packages/ui-components
COPY packages/utils ./packages/utils

# Copy application source
COPY apps/web ./apps/web

# Set working directory to the app
WORKDIR /app/apps/web

# Expose port
EXPOSE 5173

# Start development server with hot reload
CMD ["pnpm", "run", "dev", "--", "--host"]

# Production Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.10.0 --activate

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./

# Copy all package.json files
COPY packages/types/package.json ./packages/types/
COPY packages/ui-components/package.json ./packages/ui-components/
COPY packages/utils/package.json ./packages/utils/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/ui-components ./packages/ui-components
COPY packages/utils ./packages/utils
COPY apps/web ./apps/web

# Build the application
WORKDIR /app/apps/web
RUN pnpm run build

# Production Runtime Stage (Nginx)
FROM nginx:alpine AS production

# Copy custom nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
