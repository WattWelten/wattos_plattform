# Setup Database Monitoring - Schritt-fÃ¼r-Schritt Anleitung

## Voraussetzungen

1. Docker Desktop muss installiert und gestartet sein
2. Node.js >= 20.9.0 und pnpm >= 9.0.0 installiert
3. Dependencies installiert: pnpm install

## Schritt 1: Docker Desktop starten

1. Ã–ffne Docker Desktop
2. Warte bis Docker Desktop vollstÃ¤ndig gestartet ist
3. PrÃ¼fe Status: Docker Desktop sollte Running anzeigen

## Schritt 2: PostgreSQL starten

docker-compose up -d postgres

## Schritt 3: Migration ausfÃ¼hren

pnpm --filter @wattweiser/db migrate:deploy

## Schritt 4: Prometheus starten

docker-compose -f docker-compose.monitoring.yml up -d

## Schritt 5: Services starten

pnpm dev:mvp

## Schritt 6: Metriken prÃ¼fen

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)