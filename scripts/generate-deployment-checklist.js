#!/usr/bin/env node

/**
 * Deployment Checklist Generator (Node.js Version)
 * Generiert eine automatische Deployment-Checkliste basierend auf services-config.json
 * 
 * Usage: node scripts/generate-deployment-checklist.js [staging|production]
 */

const fs = require('fs');
const path = require('path');

// Resolve script directory (handles both direct execution and require)
const SCRIPT_DIR = path.resolve(__dirname);
const CONFIG_FILE = path.join(SCRIPT_DIR, 'services-config.json');
const OUTPUT_FILE = path.join(SCRIPT_DIR, '..', 'docs', 'DEPLOYMENT_CHECKLIST.md');
const ENVIRONMENT = process.argv[2] || 'production';

// Lade Service-Konfiguration
let servicesConfig;
try {
  const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
  servicesConfig = JSON.parse(configContent);
} catch (error) {
  console.error(`Error: Could not read services-config.json: ${error.message}`);
  process.exit(1);
}

// Helper-Funktionen
function getServicesByPriority(priority) {
  return Object.entries(servicesConfig.services)
    .filter(([_, service]) => service.deploymentPriority === priority)
    .map(([key, _]) => key);
}

function getServicesByPriorityRange(min, max) {
  return Object.entries(servicesConfig.services)
    .filter(([_, service]) => service.deploymentPriority >= min && service.deploymentPriority <= max)
    .map(([key, _]) => key);
}

function generateServiceChecklist(serviceKey) {
  const service = servicesConfig.services[serviceKey];
  const lines = [];
  
  lines.push(`### ${service.displayName}`);
  lines.push('');
  lines.push(`- [ ] Railway Service erstellt: \`railway service create ${serviceKey}\``);
  lines.push(`- [ ] Service ausgewählt: \`railway service ${serviceKey}\``);
  
  // Service-Typ Hinweis
  if (service.type === 'python') {
    lines.push('');
    lines.push('> **Python Service** - Erfordert Python Runtime auf Railway');
    lines.push('');
  } else if (service.type === 'worker') {
    lines.push('');
    lines.push('> **Worker Service** - Läuft als Background Worker');
    lines.push('');
  }
  
  // Environment Variables
  const requiredEnvVars = service.environmentVariables?.filter(env => env.required) || [];
  if (requiredEnvVars.length > 0) {
    lines.push('- [ ] **Environment Variables:**');
    requiredEnvVars.forEach(env => {
      const desc = env.description ? `: ${env.description}` : '';
      lines.push(`  - [ ] \`${env.name}\` gesetzt${desc}`);
    });
  }
  
  // Dependencies
  if (service.dependencies && service.dependencies.length > 0) {
    lines.push('- [ ] **Service Dependencies deployed:**');
    service.dependencies.forEach(dep => {
      const depService = servicesConfig.services[dep];
      const depName = depService ? depService.displayName : dep;
      lines.push(`  - [ ] ${depName}`);
    });
  }
  
  // Infrastructure Dependencies
  if (service.infrastructureDependencies && service.infrastructureDependencies.length > 0) {
    lines.push('- [ ] **Infrastructure Dependencies:**');
    service.infrastructureDependencies.forEach(infra => {
      lines.push(`  - [ ] ${infra} Service deployed`);
    });
  }
  
  lines.push(`- [ ] Build Command validiert: \`${service.buildCommand}\``);
  lines.push(`- [ ] Service deployed: \`railway up\``);
  lines.push(`- [ ] Health Check erfolgreich: \`curl <SERVICE_URL>${service.healthCheckPath}\``);
  lines.push('- [ ] Service URL gesetzt in abhängigen Services');
  lines.push('');
  
  return lines.join('\n');
}

// Generiere Checkliste
const output = [];

output.push('# Deployment Checklist');
output.push('');
output.push('> **Automatisch generiert** - Diese Checkliste wird automatisch aus `scripts/services-config.json` generiert.');
output.push(`> **Letzte Aktualisierung:** ${new Date().toLocaleString('de-DE')}`);
output.push('> **Umgebung:** ' + ENVIRONMENT);
output.push('');
output.push('## Übersicht');
output.push('');
output.push('Diese Checkliste führt durch das vollständige Deployment der WattOS KI Plattform.');
output.push('Alle Schritte müssen in der angegebenen Reihenfolge ausgeführt werden.');
output.push('');
output.push('## Voraussetzungen');
output.push('');
output.push('- [ ] Railway Account erstellt und eingeloggt');
output.push('- [ ] Railway CLI installiert: `npm i -g @railway/cli`');
output.push('- [ ] Railway Login durchgeführt: `railway login`');
output.push('- [ ] Projekt verlinkt: `railway link <PROJECT_ID>`');
output.push('- [ ] GitHub Secrets konfiguriert (siehe [SECRETS_SETUP.md](SECRETS_SETUP.md))');
output.push('');
output.push('## Phase 0: Infrastructure Setup');
output.push('');
output.push('### Infrastructure Services');
output.push('');

// Infrastructure Dependencies sammeln
const allInfraDeps = new Set();
Object.values(servicesConfig.services).forEach(service => {
  if (service.infrastructureDependencies) {
    service.infrastructureDependencies.forEach(dep => allInfraDeps.add(dep));
  }
});

if (allInfraDeps.has('postgresql')) {
  output.push('- [ ] **PostgreSQL Service** erstellt: `railway add postgresql`');
  output.push('  - [ ] `DATABASE_URL` automatisch gesetzt (Railway)');
}

if (allInfraDeps.has('redis')) {
  output.push('- [ ] **Redis Service** erstellt: `railway add redis`');
  output.push('  - [ ] `REDIS_URL` automatisch gesetzt (Railway)');
}

output.push('');
output.push('### Shared Environment Variables');
output.push('');
output.push('- [ ] `NODE_ENV=production` gesetzt (shared)');
output.push('');

// Phase 1: Priority 1 Services
output.push('## Phase 1: Core Services (Priority 1)');
output.push('');

const priority1Services = getServicesByPriority(1);
if (priority1Services.length > 0) {
  priority1Services.forEach(serviceKey => {
    output.push(generateServiceChecklist(serviceKey));
  });
} else {
  output.push('*Keine Priority-1 Services*');
  output.push('');
}

// Phase 2: Priority 2 Services
output.push('## Phase 2: Essential Services (Priority 2)');
output.push('');

const priority2Services = getServicesByPriority(2);
if (priority2Services.length > 0) {
  priority2Services.forEach(serviceKey => {
    output.push(generateServiceChecklist(serviceKey));
  });
} else {
  output.push('*Keine Priority-2 Services*');
  output.push('');
}

// Phase 3: Priority 3 Services
output.push('## Phase 3: Advanced Services (Priority 3)');
output.push('');

const priority3Services = getServicesByPriority(3);
if (priority3Services.length > 0) {
  priority3Services.forEach(serviceKey => {
    output.push(generateServiceChecklist(serviceKey));
  });
} else {
  output.push('*Keine Priority-3 Services*');
  output.push('');
}

// Phase 4: Priority 4-5 Services
output.push('## Phase 4: Supporting Services (Priority 4-5)');
output.push('');

const priority4_5Services = getServicesByPriorityRange(4, 5);
if (priority4_5Services.length > 0) {
  priority4_5Services.forEach(serviceKey => {
    output.push(generateServiceChecklist(serviceKey));
  });
} else {
  output.push('*Keine Priority-4/5 Services*');
  output.push('');
}

// Post-Deployment
output.push('## Phase 5: Post-Deployment Validation');
output.push('');
output.push('- [ ] **Database Migration ausgeführt:**');
output.push('  - [ ] Prisma Client generiert: `cd packages/db && npx prisma generate`');
output.push('  - [ ] Migrationen deployed: `npx prisma migrate deploy`');
output.push('');
output.push('- [ ] **Service URLs synchronisiert:**');
output.push('  - [ ] Alle Service-URLs in Railway abgerufen');
output.push('  - [ ] Service-URLs in abhängigen Services gesetzt');
output.push(`  - [ ] Script ausgeführt: \`./scripts/sync-service-urls.sh ${ENVIRONMENT}\``);
output.push('');
output.push('- [ ] **Health Checks durchgeführt:**');
output.push('  - [ ] Alle Services Health Checks erfolgreich');
output.push(`  - [ ] Script ausgeführt: \`./scripts/health-check.sh ${ENVIRONMENT}\``);
output.push('');
output.push('- [ ] **Smoke Tests durchgeführt:**');
output.push('  - [ ] Alle Smoke Tests erfolgreich');
output.push(`  - [ ] Script ausgeführt: \`./scripts/smoke-tests.sh ${ENVIRONMENT}\``);
output.push('');
output.push('- [ ] **Deployment Validation:**');
output.push('  - [ ] Vollständige Validierung erfolgreich');
output.push(`  - [ ] Script ausgeführt: \`./scripts/validate-deployment.sh ${ENVIRONMENT}\``);
output.push('');
output.push('- [ ] **Monitoring aktiviert:**');
output.push('  - [ ] Railway Monitoring für alle Services aktiviert');
output.push('  - [ ] Alerts konfiguriert');
output.push('  - [ ] Logs überprüft');
output.push('');
output.push('- [ ] **Frontend Integration:**');
output.push('  - [ ] Frontend deployed (Vercel)');
output.push('  - [ ] `NEXT_PUBLIC_API_URL` auf API Gateway URL gesetzt');
output.push('  - [ ] CORS korrekt konfiguriert');
output.push('  - [ ] Frontend-Backend Integration getestet');
output.push('');
output.push('## Service-Status Übersicht');
output.push('');
output.push('| Service | Status | Health Check | URL |');
output.push('|---------|--------|--------------|-----|');

// Service-Status-Tabelle
Object.keys(servicesConfig.services).forEach(serviceKey => {
  const service = servicesConfig.services[serviceKey];
  output.push(`| ${service.displayName} | ⬜ Nicht deployed | - | - |`);
});

output.push('');
output.push('**Legende:**');
output.push('- ✅ Deployed und gesund');
output.push('- ⚠️ Deployed, aber Probleme');
output.push('- ❌ Deployment fehlgeschlagen');
output.push('- ⬜ Nicht deployed');
output.push('');

// Undokumentierte Services
output.push('## Fehlende Services in Dokumentation');
output.push('');
output.push('Die folgenden Services sind im Code vorhanden, aber noch nicht vollständig in der Deployment-Dokumentation:');
output.push('');

const undocumented = Object.entries(servicesConfig.services)
  .filter(([_, service]) => !service.documented)
  .map(([key, service]) => `- **${service.displayName}** (${key}) - Typ: ${service.type}`);

if (undocumented.length > 0) {
  output.push(...undocumented);
} else {
  output.push('*Alle Services sind dokumentiert*');
}

output.push('');
output.push('## Nächste Schritte');
output.push('');
output.push('Nach erfolgreichem Deployment:');
output.push('');
output.push('1. Vollständige Integration Tests durchführen');
output.push('2. Performance Monitoring aktivieren');
output.push('3. Cost Monitoring einrichten');
output.push('4. Dokumentation aktualisieren mit tatsächlichen Service-URLs');
output.push('5. Team über Deployment informieren');
output.push('');
output.push('## Troubleshooting');
output.push('');
output.push('Bei Problemen siehe:');
output.push('- [Deployment Railway Guide](DEPLOYMENT_RAILWAY.md)');
output.push('- [First Deployment Guide](FIRST_DEPLOYMENT.md)');
output.push('- [Runbooks](runbooks/)');
output.push('');
output.push('---');
output.push('');
output.push('**Hinweis:** Diese Checkliste wird automatisch generiert. Bei Änderungen an Services-Konfiguration die Checkliste neu generieren:');
output.push('```bash');
output.push('node scripts/generate-deployment-checklist.js [staging|production]');
output.push('# oder');
output.push('./scripts/generate-deployment-checklist.sh [staging|production]');
output.push('```');

// Schreibe Output-Datei
try {
  fs.writeFileSync(OUTPUT_FILE, output.join('\n'), 'utf8');
  console.log(`✅ Deployment checklist generated: ${OUTPUT_FILE}`);
  console.log('');
  console.log('Summary:');
  console.log(`  - Total services: ${Object.keys(servicesConfig.services).length}`);
  const documented = Object.values(servicesConfig.services).filter(s => s.documented).length;
  const undocumented = Object.values(servicesConfig.services).filter(s => !s.documented).length;
  console.log(`  - Documented: ${documented}`);
  console.log(`  - Undocumented: ${undocumented}`);
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Review generated checklist: ${OUTPUT_FILE}`);
  console.log('  2. Update services-config.json for any missing services');
  console.log('  3. Re-generate checklist after updates');
} catch (error) {
  console.error(`Error writing output file: ${error.message}`);
  process.exit(1);
}

