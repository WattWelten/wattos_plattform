/**
 * Comprehensive Test Runner für alle Services
 * Führt Unit, Integration, E2E und Performance Tests aus
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MOCK_API_URL = process.env.MOCK_API_URL || 'http://localhost:4001';
const TEST_TIMEOUT = 300000; // 5 Minuten

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function waitForService(url, maxRetries = 30, delay = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = async () => {
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${url}/health`);
        if (response.ok) {
          log(`✅ Service verfügbar: ${url}`, 'green');
          resolve(true);
          return;
        }
      } catch (error) {
        // Ignore
      }
      retries++;
      if (retries >= maxRetries) {
        log(`❌ Service nicht verfügbar nach ${maxRetries} Versuchen: ${url}`, 'red');
        reject(new Error(`Service nicht verfügbar: ${url}`));
        return;
      }
      setTimeout(check, delay);
    };
    check();
  });
}

async function startMockAPI() {
  log('🚀 Starte Mock-API Server...', 'cyan');
  const mockProcess = spawn('pnpm', ['mock:start'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
  });

  mockProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Mock API Server running')) {
      log('✅ Mock-API Server gestartet', 'green');
    }
  });

  mockProcess.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('DeprecationWarning')) {
      log(`⚠️  Mock-API: ${error}`, 'yellow');
    }
  });

  // Warte auf Mock-API
  try {
    await waitForService(MOCK_API_URL, 30, 2000);
  } catch (error) {
    log(`❌ Mock-API konnte nicht gestartet werden: ${error.message}`, 'red');
    mockProcess.kill();
    throw error;
  }

  return mockProcess;
}

async function runCommand(command, description, options = {}) {
  log(`\n📋 ${description}...`, 'blue');
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: 'inherit',
      timeout: options.timeout || TEST_TIMEOUT,
      cwd: options.cwd || process.cwd(),
    });
    log(`✅ ${description} erfolgreich`, 'green');
    return { success: true, output: result };
  } catch (error) {
    log(`❌ ${description} fehlgeschlagen: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  const results = {
    unit: { success: false, error: null },
    integration: { success: false, error: null },
    e2e: { success: false, error: null },
    perf: { success: false, error: null },
  };

  // 1. Unit Tests
  log('\n🧪 ===== UNIT TESTS =====', 'cyan');
  results.unit = await runCommand('pnpm test:unit', 'Unit Tests');

  // 2. Integration Tests
  log('\n🔗 ===== INTEGRATION TESTS =====', 'cyan');
  results.integration = await runCommand('pnpm test:integration', 'Integration Tests', {
    timeout: 60000,
  });

  // 3. E2E Tests
  log('\n🎭 ===== E2E TESTS =====', 'cyan');
  results.e2e = await runCommand('cd apps/web && pnpm test:e2e', 'E2E Tests (Playwright)', {
    timeout: 180000,
  });

  // 4. Performance Tests
  log('\n⚡ ===== PERFORMANCE TESTS =====', 'cyan');
  results.perf = await runCommand('pnpm test:perf', 'Performance Tests', {
    timeout: 30000,
  });

  return results;
}

function generateReport(results) {
  const reportPath = path.join(process.cwd(), 'reports', 'test-results.json');
  const reportDir = path.dirname(reportPath);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter((r) => r.success).length,
      failed: Object.values(results).filter((r) => !r.success).length,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📊 Test-Report gespeichert: ${reportPath}`, 'cyan');

  // Zusammenfassung
  log('\n📊 ===== TEST-ZUSAMMENFASSUNG =====', 'cyan');
  log(`Total: ${report.summary.total}`, 'blue');
  log(`✅ Erfolgreich: ${report.summary.passed}`, 'green');
  log(`❌ Fehlgeschlagen: ${report.summary.failed}`, 'red');

  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅' : '❌';
    log(`${status} ${test.toUpperCase()}: ${result.success ? 'OK' : result.error}`, result.success ? 'green' : 'red');
  });

  return report;
}

async function main() {
  log('🚀 ===== WATTOS PLATTFORM - INTENSIVE TESTS =====', 'cyan');
  log(`Zeitstempel: ${new Date().toISOString()}`, 'blue');

  let mockProcess = null;

  try {
    // 1. Mock-API starten
    mockProcess = await startMockAPI();

    // 2. Tests ausführen
    const results = await runTests();

    // 3. Report generieren
    const report = generateReport(results);

    // 4. Exit Code basierend auf Ergebnissen
    const allPassed = report.summary.failed === 0;
    if (allPassed) {
      log('\n✅ Alle Tests erfolgreich!', 'green');
      process.exit(0);
    } else {
      log('\n❌ Einige Tests fehlgeschlagen!', 'red');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Kritischer Fehler: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup
    if (mockProcess) {
      log('\n🛑 Stoppe Mock-API Server...', 'yellow');
      mockProcess.kill();
    }
  }
}

// Error Handling
process.on('unhandledRejection', (error) => {
  log(`❌ Unhandled Rejection: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

process.on('SIGINT', () => {
  log('\n⚠️  Tests abgebrochen (SIGINT)', 'yellow');
  process.exit(130);
});

// Start
main();
