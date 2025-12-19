# Multi-Stage Build für API Gateway
FROM node:20-alpine AS base

# Installiere pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Dependencies Stage
FROM base AS dependencies

# Kopiere Package Files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/gateway/package.json ./apps/gateway/

# Installiere Dependencies
RUN pnpm install --frozen-lockfile

# Build Stage
FROM base AS build

# Kopiere alle Source Files
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages ./packages
COPY --from=dependencies /app/apps/gateway/node_modules ./apps/gateway/node_modules

COPY . .

# Build
RUN pnpm --filter @wattweiser/gateway build

# Production Stage
FROM node:20-alpine AS production

WORKDIR /app

# Kopiere nur Production Dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=dependencies /app/packages/db/node_modules ./packages/db/node_modules

# Kopiere Build Output
COPY --from=build /app/apps/gateway/dist ./apps/gateway/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/db/dist ./packages/db/dist

# Kopiere Package Files für Runtime
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/gateway/package.json ./apps/gateway/

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health/liveness', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3001

CMD ["node", "apps/gateway/dist/main"]











