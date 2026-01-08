# Docker Image Optimization Guide

Dieser Guide beschreibt Best Practices fÃ¼r optimierte Docker-Images der WattOS Plattform.

## Ãœbersicht

Die WattOS Plattform verwendet Multi-Stage Builds fÃ¼r optimierte Docker-Images.

## Best Practices

### 1. Multi-Stage Builds

Verwende Multi-Stage Builds um Image-GrÃ¶ÃŸe zu reduzieren:

\\\dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
CMD ["node", "dist/main.js"]
\\\

### 2. Layer Caching

Ordne Dockerfile-Befehle nach Ã„nderungshÃ¤ufigkeit:

\\\dockerfile
# Selten geÃ¤nderte Dateien zuerst
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# HÃ¤ufig geÃ¤nderte Dateien zuletzt
COPY . .
RUN pnpm build
\\\

### 3. .dockerignore

Erstelle \.dockerignore\ um unnÃ¶tige Dateien auszuschlieÃŸen:

\\\
node_modules
dist
.git
.env
*.log
coverage
.vscode
.idea
\\\

### 4. Alpine Images

Verwende Alpine-Images fÃ¼r kleinere Image-GrÃ¶ÃŸe:

\\\dockerfile
FROM node:20-alpine
\\\

### 5. Production Dependencies

Installiere nur Production-Dependencies:

\\\dockerfile
RUN pnpm install --prod --frozen-lockfile
\\\

## Image-GrÃ¶ÃŸe Optimierung

### Vorher vs. Nachher

- **Vorher:** ~1.5GB (mit dev dependencies)
- **Nachher:** ~300MB (nur production)

### Optimierungen

1. **Multi-Stage Builds:** Reduziert Image-GrÃ¶ÃŸe um ~70%
2. **Alpine Base:** Reduziert Image-GrÃ¶ÃŸe um ~50%
3. **Production Dependencies:** Reduziert Image-GrÃ¶ÃŸe um ~40%
4. **Layer Caching:** Beschleunigt Builds um ~60%

## Docker Compose Optimierung

### Health Checks

FÃ¼ge Health Checks zu allen Services hinzu:

\\\yaml
services:
  gateway:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health/liveness"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
\\\

### Resource Limits

Setze Resource Limits:

\\\yaml
services:
  gateway:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
\\\

## Build-Performance

### Build Cache

Nutze Build Cache:

\\\ash
# Build mit Cache
docker build --cache-from wattos-gateway:latest -t wattos-gateway:latest .

# Build ohne Cache (fÃ¼r clean builds)
docker build --no-cache -t wattos-gateway:latest .
\\\

### Parallel Builds

Nutze Docker Buildx fÃ¼r Parallel Builds:

\\\ash
docker buildx build --platform linux/amd64,linux/arm64 -t wattos-gateway:latest .
\\\

## Security

### Non-Root User

Verwende Non-Root User:

\\\dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
\\\

### Security Scanning

Scanne Images auf Vulnerabilities:

\\\ash
# Trivy
trivy image wattos-gateway:latest

# Docker Scout
docker scout cves wattos-gateway:latest
\\\

## Monitoring

### Image-GrÃ¶ÃŸe Tracking

Tracke Image-GrÃ¶ÃŸe Ã¼ber Zeit:

\\\ash
docker images wattos-gateway --format "{{.Size}}"
\\\

### Build-Zeit Tracking

Tracke Build-Zeit:

\\\ash
time docker build -t wattos-gateway:latest .
\\\

## Weitere Informationen

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [.dockerignore](https://docs.docker.com/reference/dockerfile/#dockerignore-file)
