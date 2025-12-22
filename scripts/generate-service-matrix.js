#!/usr/bin/env node
/**
 * Service Matrix Generator
 * 
 * Generiert eine umfassende Service-Matrix aus allen package.json Dateien
 * und der services-config.json
 */

const fs = require('fs');
const path = require('path');

const servicesConfigPath = path.join(__dirname, 'services-config.json');
const servicesConfig = JSON.parse(fs.readFileSync(servicesConfigPath, 'utf-8'));

// Zusätzliche Services aus apps/ und packages/ analysieren
const appsDir = path.join(__dirname, '..', 'apps');
const packagesDir = path.join(__dirname, '..', 'packages');

function findPackageJsonFiles(dir, basePath = '') {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const packageJsonPath = path.join(fullPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          files.push({ path: relativePath, fullPath: fullPath, packageJson: packageJsonPath });
        }
        // Rekursiv suchen
        files.push(...findPackageJsonFiles(fullPath, relativePath));
      }
    }
  } catch (err) {
    // Ignorieren wenn Verzeichnis nicht existiert
  }
  return files;
}

// Alle Services sammeln
const allServices = { ...servicesConfig.services };

// Zusätzliche Services aus apps/ finden
const appPackages = findPackageJsonFiles(appsDir, 'apps');
for (const pkg of appPackages) {
  try {
    const pkgJson = JSON.parse(fs.readFileSync(pkg.packageJson, 'utf-8'));
    const serviceName = pkgJson.name?.replace('@wattweiser/', '') || path.basename(pkg.path);
    
    if (!allServices[serviceName]) {
      // Service aus package.json extrahieren
      const scripts = pkgJson.scripts || {};
      const port = extractPort(pkg.path, pkgJson);
      
      allServices[serviceName] = {
        name: serviceName,
        displayName: pkgJson.description || serviceName,
        type: detectType(pkg.path, pkgJson),
        port: port,
        path: pkg.path,
        buildCommand: scripts.build || `cd ${pkg.path} && pnpm build`,
        startCommand: scripts.start || scripts['start:prod'] || `cd ${pkg.path} && pnpm start`,
        healthCheckPath: '/health',
        required: false,
        deploymentPriority: 4,
        dependencies: [],
        infrastructureDependencies: [],
        environmentVariables: extractEnvVars(pkgJson),
        documented: false,
      };
    }
  } catch (err) {
    // Ignorieren bei Fehlern
  }
}

// Packages hinzufügen
const packagePackages = findPackageJsonFiles(packagesDir, 'packages');
for (const pkg of packagePackages) {
  try {
    const pkgJson = JSON.parse(fs.readFileSync(pkg.packageJson, 'utf-8'));
    const packageName = pkgJson.name?.replace('@wattweiser/', '') || path.basename(pkg.path);
    
    if (!allServices[packageName] && pkgJson.scripts?.build) {
      allServices[packageName] = {
        name: packageName,
        displayName: pkgJson.description || packageName,
        type: 'package',
        port: 0,
        path: pkg.path,
        buildCommand: scripts.build || `cd ${pkg.path} && pnpm build`,
        startCommand: null,
        healthCheckPath: null,
        required: false,
        deploymentPriority: 0,
        dependencies: [],
        infrastructureDependencies: [],
        environmentVariables: [],
        documented: false,
      };
    }
  } catch (err) {
    // Ignorieren bei Fehlern
  }
}

function extractPort(servicePath, pkgJson) {
  // Versuche Port aus verschiedenen Quellen zu extrahieren
  const mainFile = pkgJson.main || 'src/main.ts';
  const mainPath = path.join(path.dirname(servicePath), mainFile);
  
  // Standard-Ports basierend auf Service-Name
  const portMap = {
    'gateway': 3001,
    'api-gateway': 3001,
    'chat-service': 3006,
    'rag-service': 3007,
    'agent-service': 3008,
    'llm-gateway': 3009,
    'tool-service': 3005,
    'admin-service': 3020,
    'web': 3000,
    'ingestion-service': 8001,
    'voice-service': 3016,
    'avatar-service': 3017,
    'character-service': 3013,
    'feedback-service': 3018,
    'summary-service': 3019,
    'customer-intelligence-service': 3014,
    'crawler-service': 3015,
    'metaverse-service': 3010,
    'web-chat-service': 3017,
    'phone-bot-service': 3018,
    'whatsapp-bot-service': 3019,
  };
  
  const serviceName = path.basename(servicePath);
  return portMap[serviceName] || 0;
}

function detectType(servicePath, pkgJson) {
  const pathLower = servicePath.toLowerCase();
  if (pathLower.includes('worker')) return 'worker';
  if (pathLower.includes('gateway')) return 'gateway';
  if (pkgJson.dependencies?.['fastapi'] || pkgJson.dependencies?.['uvicorn']) return 'python';
  if (pkgJson.dependencies?.['@nestjs/core']) return 'nestjs';
  if (pkgJson.dependencies?.['next']) return 'nextjs';
  return 'nestjs';
}

function extractEnvVars(pkgJson) {
  // Versuche ENV-Variablen aus README oder anderen Quellen zu extrahieren
  // Für jetzt: Standard-Variablen
  return [
    {
      name: 'NODE_ENV',
      required: false,
      description: 'Node.js Environment',
      default: 'production',
    },
    {
      name: 'DEPLOYMENT_PLATFORM',
      required: false,
      description: 'Deployment Platform',
      default: 'railway',
    },
  ];
}

// Markdown generieren
function generateMarkdown() {
  let md = `# WattOS Plattform - Service Matrix

**Generiert am**: ${new Date().toISOString()}
**Anzahl Services**: ${Object.keys(allServices).length}

## Übersicht

Diese Matrix enthält alle Services, Packages und Workers der WattOS Plattform mit ihren Konfigurationen, Ports, Environment-Variablen und Abhängigkeiten.

## Services

| Name | Display Name | Typ | Port | Pfad | Build Script | Start Script | Health Check | Required | Priority |
|------|--------------|-----|------|------|--------------|--------------|--------------|----------|----------|
`;

  // Services sortieren nach Priority
  const sortedServices = Object.values(allServices).sort((a, b) => {
    if (a.deploymentPriority !== b.deploymentPriority) {
      return a.deploymentPriority - b.deploymentPriority;
    }
    return a.name.localeCompare(b.name);
  });

  for (const service of sortedServices) {
    if (service.type === 'package') continue; // Packages separat
    
    md += `| ${service.name} | ${service.displayName} | ${service.type} | ${service.port || '-'} | \`${service.path}\` | \`${service.buildCommand?.substring(0, 50) || '-'}...\` | \`${service.startCommand?.substring(0, 50) || '-'}...\` | ${service.healthCheckPath || '-'} | ${service.required ? '✅' : '❌'} | ${service.deploymentPriority} |\n`;
  }

  md += `\n## Packages\n\n`;
  md += `| Name | Display Name | Pfad | Build Script |\n`;
  md += `|------|--------------|------|--------------|\n`;

  for (const service of sortedServices) {
    if (service.type === 'package') {
      md += `| ${service.name} | ${service.displayName} | \`${service.path}\` | \`${service.buildCommand?.substring(0, 50) || '-'}...\` |\n`;
    }
  }

  md += `\n## Environment Variables\n\n`;

  // ENV-Variablen nach Service gruppieren
  for (const service of sortedServices) {
    if (service.type === 'package' || !service.environmentVariables?.length) continue;
    
    md += `### ${service.displayName} (${service.name})\n\n`;
    md += `| Variable | Required | Description | Default |\n`;
    md += `|----------|----------|-------------|----------|\n`;
    
    for (const envVar of service.environmentVariables) {
      md += `| \`${envVar.name}\` | ${envVar.required ? '✅' : '❌'} | ${envVar.description || '-'} | ${envVar.default || '-'} |\n`;
    }
    md += `\n`;
  }

  md += `## Dependencies\n\n`;

  for (const service of sortedServices) {
    if (service.type === 'package') continue;
    
    if (service.dependencies?.length || service.infrastructureDependencies?.length) {
      md += `### ${service.displayName} (${service.name})\n\n`;
      
      if (service.dependencies?.length) {
        md += `**Service Dependencies**: ${service.dependencies.join(', ')}\n\n`;
      }
      
      if (service.infrastructureDependencies?.length) {
        md += `**Infrastructure Dependencies**: ${service.infrastructureDependencies.join(', ')}\n\n`;
      }
    }
  }

  md += `## Deployment Priority\n\n`;
  md += `- **Priority 1**: Kritische Services (API Gateway, LLM Gateway)\n`;
  md += `- **Priority 2**: Wichtige Services (Chat, RAG, Agent, Tool)\n`;
  md += `- **Priority 3**: Optionale Services (Customer Intelligence, Crawler, Voice)\n`;
  md += `- **Priority 4**: Zusätzliche Services (Admin, Character, Summary, Feedback, Avatar, Ingestion)\n`;
  md += `- **Priority 5**: Workers und Metaverse\n`;
  md += `- **Priority 0**: Packages (nur Build, kein Deployment)\n`;

  return md;
}

// Markdown schreiben
const markdown = generateMarkdown();
const outputPath = path.join(__dirname, '..', 'reports', 'service-matrix.md');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, markdown, 'utf-8');

console.log(`✅ Service Matrix generiert: ${outputPath}`);
console.log(`📊 ${Object.keys(allServices).length} Services gefunden`);






