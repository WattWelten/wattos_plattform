import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { join } from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Docker Compose stack for E2E tests...');
  
  try {
    // Starte Docker Compose Stack (PostgreSQL, Redis, Keycloak)
    const rootDir = join(__dirname, '../../..');
    execSync('pnpm dev:stack', { 
      stdio: 'inherit', 
      cwd: rootDir,
      env: { ...process.env, CI: 'true' },
    });
    
    // Warte auf Services
    console.log('⏳ Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 Sekunden warten
    
    console.log('✅ Docker Compose stack started successfully');
  } catch (error) {
    console.error('❌ Failed to start Docker Compose stack:', error);
    process.exit(1);
  }
}

export default globalSetup;
