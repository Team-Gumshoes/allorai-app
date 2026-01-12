# Multi-stage Dockerfile for API Gateway
# Build context should be the monorepo root

# Development Stage
FROM node:20-alpine AS development
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.10.0 --activate

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY nx.json ./

# Copy all package.json files
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy workspace packages source
COPY tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils

# Copy application source
COPY apps/api-gateway ./apps/api-gateway

# Set working directory to the app
WORKDIR /app/apps/api-gateway

# Expose port
EXPOSE 3001

# Start development server with hot reload
CMD ["pnpm", "run", "dev"]

# Production Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.10.0 --activate

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy all package.json files
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY apps/api-gateway ./apps/api-gateway

# Build packages
WORKDIR /app/packages/types
RUN pnpm run build

WORKDIR /app/packages/utils
RUN pnpm run build

# Build application
WORKDIR /app/apps/api-gateway
RUN pnpm run build

# Production Runtime Stage
FROM node:20-alpine AS production
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.10.0 --activate

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built artifacts
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/apps/api-gateway/dist ./apps/api-gateway/dist

# Set working directory
WORKDIR /app/apps/api-gateway

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"]
