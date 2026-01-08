# Health Check Standardisierung

Alle Services sollten den standardisierten HealthController aus \@wattweiser/shared\ verwenden.

## Standardisierte Endpunkte

- \GET /health\ - VollstÃ¤ndiger Health Check
- \GET /health/liveness\ - Liveness Probe
- \GET /health/readiness\ - Readiness Probe
- \GET /health/metrics\ - Prometheus Metrics
- \GET /health/kpi\ - KPI Metrics (JSON)

## Services die noch standardisiert werden mÃ¼ssen

- customer-intelligence-service
- voice-service
- crawler-service
- avatar-service
- llm-gateway

## Migration

1. Importiere HealthController und HealthService aus \@wattweiser/shared\
2. Ersetze lokale Health-Controller
3. Konfiguriere HealthService mit Service-spezifischen Checks
