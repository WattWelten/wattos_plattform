#!/usr/bin/env node

/**
 * Comprehensive Health Check Script for WattOS Plattform
 * Prüft alle Services, Database, Redis und Port-Verfügbarkeit
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI Color Codes für Terminal-Ausgabe
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Service-Konfiguration basierend auf proxy.service.ts und dev:mvp
const services = [
  { name: 'Gateway', url: 'http://localhost:3001/health', port: 3001, required: true },
  { name: 'Web', url: 'http://localhost:3000', port: 3000, required: true },
  { name: 'Chat Service', url: 'http://localhost:3006/health', port: 3006, required: false },
  { name: 'RAG Service', url: 'http://localhost:3005/health', port: 3005, required: false },
  { name: 'Agent Service', url: 'http://localhost:3003/health', port: 3003, required: false },
  { name: 'Tool Service', url: 'http://localhost:3004/health', port: 3004, required: false },
  { name: 'Admin Service', url: 'http://localhost:3007/health', port: 3007, required: false },
  { name: 'Avatar Service', url: 'http://localhost:3009/health', port: 3009, required: false },
  { name: 'Voice Service', url: 'http://localhost:3016/health', port: 3016, required: false },
  { name: 'Crawler Service', url: 'http://localhost:3015/health', port: 3015, required: false },
  { name: 'LLM Gateway', url: 'http://localhost:3009/health', port: 3009, required: false },
];

// Database und Redis Konfiguration
const infrastructure = [
  { name: 'PostgreSQL', host: 'localhost', port: 5432, type: 'tcp' },
  { name: 'Redis', host: 'localhost', port: 6379, type: 'tcp' },
];

/**
 * Prüft ob ein Port verfügbar ist
 */
async function checkPort(host, port, timeout = 2000) {
  return new Promise((resolve) => {
    import('net').then((net) => {
      const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
      socket.once('error', () => {
        resolve(false);
      });
      
      socket.connect(port, host);
    }).catch(() => resolve(false));
  });
}

/**
 * Prüft HTTP-Endpunkt
 */
async function checkHttp(url, timeout = 5000) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(timeout),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Prüft Database Connectivity
 */
async function checkDatabase() {
  try {
    // Versuche .env zu lesen
    const envPath = join(__dirname, '..', '.env');
    let databaseUrl = 'postgresql://wattos:wattos_dev_password@localhost:5432/wattos_plattform';
    
    try {
      const envContent = readFileSync(envPath, 'utf-8');
      const match = envContent.match(/DATABASE_URL=(.+)/);
      if (match) {
        databaseUrl = match[1].trim();
      }
    } catch {
      // .env nicht gefunden, verwende Default
    }
    
    // Prüfe nur ob Port verfügbar ist (vollständige DB-Verbindung würde pg benötigen)
    return await checkPort('localhost', 5432);
  } catch {
    return false;
  }
}

/**
 * Prüft Redis Connectivity
 */
async function checkRedis() {
  return await checkPort('localhost', 6379);
}

/**
 * Hauptfunktion
 */
async function main() {
  console.log(`${colors.cyan}${colors.bright}WattOS Plattform Health Check${colors.reset}\n`);
  
  let allHealthy = true;
  const results = {
    services: [],
    infrastructure: [],
  };
  
  // Prüfe Infrastructure
  console.log(`${colors.blue}Infrastructure:${colors.reset}`);
  for (const infra of infrastructure) {
    const isHealthy = await checkPort(infra.host, infra.port);
    const status = isHealthy ? '✓' : '✗';
    const color = isHealthy ? colors.green : colors.red;
    console.log(`  ${color}${status}${colors.reset} ${infra.name} (${infra.host}:${infra.port})`);
    
    results.infrastructure.push({
      name: infra.name,
      healthy: isHealthy,
    });
    
    if (!isHealthy) {
      allHealthy = false;
    }
  }
  
  console.log();
  
  // Prüfe Services
  console.log(`${colors.blue}Services:${colors.reset}`);
  for (const service of services) {
    // Prüfe zuerst Port-Verfügbarkeit
    const portAvailable = await checkPort('localhost', service.port);
    
    if (!portAvailable) {
      const status = service.required ? '✗' : '○';
      const color = service.required ? colors.red : colors.yellow;
      console.log(`  ${color}${status}${colors.reset} ${service.name} (Port ${service.port} nicht verfügbar)`);
      
      results.services.push({
        name: service.name,
        healthy: false,
        portAvailable: false,
        httpAvailable: false,
      });
      
      if (service.required) {
        allHealthy = false;
      }
      continue;
    }
    
    // Prüfe HTTP-Endpunkt
    const httpAvailable = await checkHttp(service.url);
    const status = httpAvailable ? '✓' : (service.required ? '✗' : '○');
    const color = httpAvailable ? colors.green : (service.required ? colors.red : colors.yellow);
    console.log(`  ${color}${status}${colors.reset} ${service.name} (${service.url})`);
    
    results.services.push({
      name: service.name,
      healthy: httpAvailable,
      portAvailable: true,
      httpAvailable,
    });
    
    if (service.required && !httpAvailable) {
      allHealthy = false;
    }
  }
  
  console.log();
  
  // Zusammenfassung
  const healthyServices = results.services.filter(s => s.healthy).length;
  const totalServices = results.services.length;
  const healthyInfra = results.infrastructure.filter(i => i.healthy).length;
  const totalInfra = results.infrastructure.length;
  
  console.log(`${colors.cyan}Zusammenfassung:${colors.reset}`);
  console.log(`  Infrastructure: ${healthyInfra}/${totalInfra} healthy`);
  console.log(`  Services: ${healthyServices}/${totalServices} healthy`);
  console.log();
  
  if (allHealthy) {
    console.log(`${colors.green}${colors.bright}✓ Alle erforderlichen Services sind healthy!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bright}✗ Einige Services sind nicht verfügbar${colors.reset}`);
    console.log(`${colors.yellow}Hinweis: Optional Services (○) werden nicht als Fehler gewertet${colors.reset}`);
    process.exit(1);
  }
}

// Führe Health Check aus
main().catch((error) => {
  console.error(`${colors.red}Fehler beim Health Check:${colors.reset}`, error);
  process.exit(1);
});
