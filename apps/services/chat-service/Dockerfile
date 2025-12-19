# Multi-Stage Build für Chat Service
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/services/chat-service/package.json ./apps/services/chat-service/

RUN pnpm install --frozen-lockfile

FROM base AS build

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages ./packages
COPY --from=dependencies /app/apps/services/chat-service/node_modules ./apps/services/chat-service/node_modules

COPY . .

RUN pnpm --filter chat-service build

FROM node:20-alpine AS production

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=dependencies /app/packages/db/node_modules ./packages/db/node_modules

COPY --from=build /app/apps/services/chat-service/dist ./apps/services/chat-service/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/db/dist ./packages/db/dist

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/services/chat-service/package.json ./apps/services/chat-service/

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3006/health/liveness', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3006

CMD ["node", "apps/services/chat-service/dist/main"]











