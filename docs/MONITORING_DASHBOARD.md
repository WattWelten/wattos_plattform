# Monitoring Dashboard Setup

## Übersicht

Dieses Dokument beschreibt die Einrichtung eines Custom Monitoring Dashboards für die WattOS KI Plattform.

## Option 1: Railway Dashboard (Basis)

Railway bietet ein integriertes Dashboard mit:

- Service Status Overview
- Resource Usage (CPU, Memory)
- Request Metrics
- Error Rates
- Logs

**Zugriff:**
- Railway Dashboard → Project → Services
- Automatisch verfügbar für alle Services

## Option 2: Grafana + Prometheus (Erweitert)

### Setup

1. **Prometheus Service** in Railway erstellen
2. **Grafana Service** in Railway erstellen
3. **Metrics Export** in Services implementieren

### Metrics Collection

**Service Metrics:**
- Request Count
- Response Time (p50, p95, p99)
- Error Rate
- Active Connections

**Business Metrics:**
- LLM API Calls
- LLM API Costs
- User Activity
- Chat Messages

### Grafana Dashboards

**Pre-built Dashboards:**
- Service Health Dashboard
- API Performance Dashboard
- Cost Tracking Dashboard
- User Activity Dashboard

## Option 3: GitHub Actions Dashboard

GitHub Actions bietet ein integriertes Dashboard:

- CI/CD Pipeline Status
- Test Results
- Deployment History
- Security Scan Results

**Zugriff:**
- GitHub → Actions → Workflows

## Custom Metrics Endpoint

Jeder Service kann einen Metrics-Endpoint bereitstellen:

```typescript
@Controller('metrics')
export class MetricsController {
  @Get()
  getMetrics() {
    return {
      requests: this.metricsService.getRequestCount(),
      responseTime: this.metricsService.getResponseTime(),
      errors: this.metricsService.getErrorCount(),
      uptime: this.metricsService.getUptime(),
    };
  }
}
```

## Monitoring Scripts

### `scripts/collect-metrics.sh`

Sammelt Metriken von allen Services:

```bash
#!/bin/bash
# Collects metrics from all services
# Outputs JSON for dashboard consumption
```

## Integration mit Monitoring Services

### Optional: Sentry

- Error Tracking
- Performance Monitoring
- Release Tracking

### Optional: Datadog

- APM (Application Performance Monitoring)
- Infrastructure Monitoring
- Log Management

### Optional: Logtail

- Centralized Logging
- Log Analysis
- Alerting

## Dashboard URLs

Nach Setup verfügbar unter:

- **Railway Dashboard**: https://railway.app/project/{project-id}
- **Grafana** (falls eingerichtet): https://grafana.{domain}
- **GitHub Actions**: https://github.com/{org}/{repo}/actions

## Nächste Schritte

1. Railway Dashboard nutzen (sofort verfügbar)
2. Custom Metrics Endpoints implementieren
3. Optional: Grafana + Prometheus Setup
4. Optional: Externe Monitoring-Services integrieren












