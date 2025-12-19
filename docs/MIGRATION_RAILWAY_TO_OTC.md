# Migration von Railway zu OpenTelekomCloud Kubernetes

## Übersicht

Dieser Guide beschreibt die Migration der WattOS KI Plattform von Railway zu OpenTelekomCloud (OTC) Kubernetes (CCE).

## Voraussetzungen

- OTC Account mit TechBoost-Guthaben
- CCE (Cloud Container Engine) Cluster erstellt
- SWR (Software Repository) Container Registry konfiguriert
- kubectl konfiguriert für OTC CCE
- Docker für lokale Image-Builds

## Vorteile der Migration

1. **DSGVO-konform**: EU-Hosting in Deutschland
2. **TechBoost-Guthaben**: Bis zu 100.000€ für OTC-Services
3. **Skalierbarkeit**: Automatische Skalierung mit HPA
4. **Service Discovery**: Automatische Service-Registrierung über DNS
5. **Zero-Downtime**: Rolling Updates
6. **Self-Healing**: Automatischer Restart bei Fehlern

## Migration-Strategie

### Phase 1: Vorbereitung

1. **Service Discovery Migration**
   - Alle Services verwenden bereits `ServiceDiscoveryService`
   - Keine Code-Änderungen notwendig
   - Nur Plattform-Konfiguration ändern: `DEPLOYMENT_PLATFORM=kubernetes`

2. **Docker Images erstellen**
   - Alle Services haben bereits Dockerfiles
   - Images zu OTC SWR pushen

3. **Kubernetes Manifeste erstellen**
   - Deployment-Manifeste für alle Services
   - Service-Manifeste für Service Discovery
   - ConfigMaps und Secrets

### Phase 2: Parallel-Betrieb

1. **Kubernetes Cluster aufsetzen**
   - CCE Cluster erstellen
   - Namespaces (production, staging, development)
   - Infrastructure Services (PostgreSQL, Redis)

2. **Services parallel deployen**
   - Services auf Kubernetes deployen
   - Railway-Services weiterlaufen lassen
   - Traffic schrittweise umleiten

### Phase 3: Cutover

1. **DNS umstellen**
   - API Gateway URL auf Kubernetes umstellen
   - Health Checks durchführen

2. **Railway Services stoppen**
   - Nach erfolgreichem Cutover
   - Kosten sparen

## Schritt-für-Schritt Anleitung

### Schritt 1: Service Discovery konfigurieren

Die Plattform verwendet bereits `ServiceDiscoveryService`. Für Kubernetes muss nur die Plattform-Konfiguration geändert werden:

```bash
# In Kubernetes ConfigMap
DEPLOYMENT_PLATFORM=kubernetes
```

Service Discovery erkennt automatisch Kubernetes über `KUBERNETES_SERVICE_HOST` Variable.

### Schritt 2: OTC SWR Container Registry Setup

```bash
# SWR Login
docker login swr.eu-de.otc.t-systems.com

# Images bauen und pushen
docker build -t swr.eu-de.otc.t-systems.com/wattos-ki/api-gateway:latest -f apps/gateway/Dockerfile .
docker push swr.eu-de.otc.t-systems.com/wattos-ki/api-gateway:latest

# Für alle Services wiederholen
```

### Schritt 3: Kubernetes Manifeste erstellen

Siehe [Kubernetes Integration Plan](../kubernetes-opentelekomcloud-integration.plan.md) für detaillierte Anleitung.

**Wichtig**: Service-Namen müssen konsistent sein:
- `chat-service` → Kubernetes Service: `chat-service`
- `llm-gateway` → Kubernetes Service: `llm-gateway`

### Schritt 4: Secrets und ConfigMaps erstellen

```bash
# Secrets aus Railway exportieren
railway variables --service api-gateway > railway-secrets.txt

# Secrets in Kubernetes erstellen
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL=$DATABASE_URL \
  --from-literal=REDIS_URL=$REDIS_URL \
  --from-literal=JWT_SECRET=$JWT_SECRET \
  -n production
```

### Schritt 5: Services deployen

```bash
# Namespace erstellen
kubectl create namespace production

# Infrastructure Services
kubectl apply -f infra/k8s/infrastructure/postgresql/ -n production
kubectl apply -f infra/k8s/infrastructure/redis/ -n production

# Application Services
kubectl apply -f infra/k8s/services/api-gateway/ -n production
kubectl apply -f infra/k8s/services/chat-service/ -n production
# ... etc.
```

### Schritt 6: Health Checks durchführen

```bash
# Services prüfen
kubectl get pods -n production
kubectl get services -n production

# Health Checks
kubectl port-forward svc/api-gateway 3001:3001 -n production
curl http://localhost:3001/health
```

### Schritt 7: Traffic umleiten

1. **DNS umstellen**
   - API Gateway URL auf Kubernetes LoadBalancer umstellen
   - TTL kurz halten für schnelles Rollback

2. **Monitoring**
   - Metriken überwachen
   - Fehlerrate prüfen
   - Performance vergleichen

3. **Rollback-Plan**
   - Bei Problemen DNS zurückstellen
   - Railway Services weiterlaufen lassen

## Service Discovery Unterschiede

### Railway

```typescript
// ENV-Variablen
CHAT_SERVICE_URL=https://chat-service-production.up.railway.app
LLM_GATEWAY_URL=https://llm-gateway-production.up.railway.app
```

### Kubernetes

```typescript
// DNS-basierte URLs
http://chat-service:3006
http://llm-gateway:3009
```

**Keine Code-Änderungen notwendig!** Service Discovery erkennt automatisch die Plattform.

## Rollback-Strategie

Falls Probleme auftreten:

1. **DNS zurückstellen** auf Railway URL
2. **Kubernetes Services skalieren** auf 0 Replicas
3. **Railway Services hochfahren** (falls gestoppt)
4. **Probleme analysieren** und beheben
5. **Erneut migrieren** nach Fix

## Post-Migration

1. **Railway Services stoppen**
   - Nach erfolgreichem Cutover
   - Kosten sparen

2. **Monitoring einrichten**
   - Prometheus ServiceMonitor
   - Grafana Dashboards

3. **Backup-Strategie**
   - PostgreSQL Backups
   - Redis Persistence

4. **Dokumentation aktualisieren**
   - Deployment-Guides
   - Runbooks

## Troubleshooting

### Service Discovery funktioniert nicht

1. Prüfe `DEPLOYMENT_PLATFORM=kubernetes`
2. Prüfe Kubernetes Service-Namen
3. Prüfe DNS-Auflösung: `nslookup chat-service`

### Services können sich nicht erreichen

1. Prüfe Kubernetes Services: `kubectl get svc`
2. Prüfe Network Policies
3. Prüfe Service-Namen (müssen exakt übereinstimmen)

### Performance-Probleme

1. Prüfe Resource Limits
2. Prüfe HPA-Konfiguration
3. Prüfe Database Connection Pooling

## Weitere Informationen

- [Service Discovery Dokumentation](SERVICE_DISCOVERY.md)
- [Kubernetes Integration Plan](../kubernetes-opentelekomcloud-integration.plan.md)
- [OTC CCE Dokumentation](https://docs.otc.t-systems.com/container-engine-cce/)










