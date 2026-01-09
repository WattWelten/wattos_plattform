import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { join } from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🛑 Stopping Docker Compose stack...');
  
  try {
    const rootDir = join(__dirname, '../../..');
    execSync('docker compose down -v', { 
      stdio: 'inherit', 
      cwd: rootDir,
    });
    
    console.log('✅ Docker Compose stack stopped');
  } catch (error) {
    console.error('⚠️ Failed to stop Docker Compose stack:', error);
    // Nicht beenden, da Tests möglicherweise bereits beendet sind
  }
}

export default globalTeardown;
