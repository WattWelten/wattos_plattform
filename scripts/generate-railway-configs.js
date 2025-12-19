#!/usr/bin/env node

// Node.js-Version von generate-railway-configs.sh
// Funktioniert ohne jq-Dependency

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const CONFIG_FILE = path.join(SCRIPT_DIR, 'services-config.json');

console.log('🔧 Generating Railway configuration files...');
console.log('');

// Prüfe Config-Datei
if (!fs.existsSync(CONFIG_FILE)) {
  console.error('❌ Error: services-config.json not found');
  process.exit(1);
}

// Lade Config
let config;
try {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
} catch (error) {
  console.error('❌ Error: Invalid JSON in services-config.json');
  console.error('   ', error.message);
  process.exit(1);
}

// Funktion zum Bestimmen der Scaling-Konfiguration
function getScalingConfig(serviceType, priority) {
  switch (serviceType) {
    case 'gateway':
      return { minReplicas: 2, maxReplicas: 5, targetCPU: 70, targetMemory: 80 };
    case 'nestjs':
      if (priority <= 2) {
        return { minReplicas: 2, maxReplicas: 10, targetCPU: 70, targetMemory: 80 };
      }
      return { minReplicas: 1, maxReplicas: 3, targetCPU: 70, targetMemory: 80 };
    case 'python':
      return { minReplicas: 1, maxReplicas: 3, targetCPU: 70, targetMemory: 80 };
    case 'worker':
      return { minReplicas: 1, maxReplicas: 2, targetCPU: 50, targetMemory: 60 };
    default:
      return { minReplicas: 1, maxReplicas: 3, targetCPU: 70, targetMemory: 80 };
  }
}

// Funktion zum Generieren der railway.json für einen Service
function generateRailwayConfig(serviceName, servicePath, buildCommand, startCommand, healthCheckPath, serviceType, priority) {
  const railwayJsonPath = path.join(PROJECT_ROOT, servicePath, 'railway.json');
  const railwayDir = path.dirname(railwayJsonPath);
  
  // Erstelle Verzeichnis falls nicht vorhanden
  if (!fs.existsSync(railwayDir)) {
    fs.mkdirSync(railwayDir, { recursive: true });
  }
  
  // Bestimme Scaling-Konfiguration
  const scalingConfig = getScalingConfig(serviceType, priority);
  
  // Generiere railway.json
  const railwayJson = {
    $schema: 'https://railway.app/railway.schema.json',
    build: {
      builder: 'NIXPACKS',
      buildCommand: buildCommand
    },
    deploy: {
      startCommand: startCommand,
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 10,
      healthcheckPath: healthCheckPath,
      healthcheckTimeout: 100,
      healthcheckInterval: 10,
      scaling: scalingConfig
    }
  };
  
  // Schreibe Datei
  fs.writeFileSync(railwayJsonPath, JSON.stringify(railwayJson, null, 2) + '\n');
  
  return railwayJsonPath;
}

// Lese alle Services aus der Config
const services = Object.keys(config.services || {});
let generatedCount = 0;
let failedCount = 0;

for (const serviceName of services) {
  console.log(`📦 Processing: ${serviceName}`);
  
  const service = config.services[serviceName];
  
  if (!service) {
    console.log('  ⚠️  Service not found in config, skipping...');
    failedCount++;
    continue;
  }
  
  // Extrahiere Felder
  const servicePath = service.path || '';
  const buildCommand = service.buildCommand || '';
  const startCommand = service.startCommand || '';
  const healthCheckPath = service.healthCheckPath || '/health';
  const serviceType = service.type || 'nestjs';
  const priority = service.deploymentPriority || 5;
  
  // Validiere erforderliche Felder
  if (!servicePath || !buildCommand || !startCommand) {
    console.log('  ⚠️  Missing required fields (path, buildCommand, or startCommand), skipping...');
    failedCount++;
    continue;
  }
  
  // Generiere railway.json
  try {
    const railwayJsonPath = generateRailwayConfig(
      serviceName,
      servicePath,
      buildCommand,
      startCommand,
      healthCheckPath,
      serviceType,
      priority
    );
    console.log(`  ✅ Generated: ${path.relative(PROJECT_ROOT, railwayJsonPath)}`);
    generatedCount++;
  } catch (error) {
    console.log(`  ❌ Error generating config: ${error.message}`);
    failedCount++;
  }
  
  console.log('');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Summary:');
console.log(`  ✅ Generated: ${generatedCount} railway.json files`);
console.log(`  ❌ Failed: ${failedCount} services`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (failedCount > 0) {
  console.log('');
  console.log('⚠️  Some services could not be processed. Check the errors above.');
  process.exit(1);
}

console.log('');
console.log('✅ Railway configuration files generated successfully!');
console.log('');
console.log('💡 Next steps:');
console.log('   1. Review generated railway.json files');
console.log('   2. Run: ./scripts/validate-pre-deployment.sh');
console.log('   3. Run: ./scripts/deploy-railway.sh <environment>');









