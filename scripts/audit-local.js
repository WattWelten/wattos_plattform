/**
 * Local Audit Script
 * Führt pnpm audit und pnpm outdated aus und generiert Reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');

// Erstelle reports-Verzeichnis falls nicht vorhanden
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

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

function runCommand(command, description) {
  log(`\n${description}...`, 'blue');
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stdout || error.message, error: error.stderr };
  }
}

function generateSecurityAuditReport(auditResult) {
  const reportPath = path.join(REPORTS_DIR, 'security-audit.md');
  const timestamp = new Date().toISOString();

  let content = `# Security Audit Report\n\n`;
  content += `**Datum**: ${timestamp}\n`;
  content += `**Befehl**: \`pnpm audit\`\n\n`;

  if (auditResult.success) {
    // Parse audit output
    const lines = auditResult.output.split('\n');
    const vulnerabilities = lines.filter((line) =>
      line.includes('vulnerability') || line.includes('moderate') || line.includes('high') || line.includes('critical')
    );

    if (vulnerabilities.length === 0) {
      content += `## ✅ Status: Keine Sicherheitslücken gefunden\n\n`;
      content += `Alle Dependencies sind sicher.\n`;
    } else {
      content += `## ⚠️ Status: Sicherheitslücken gefunden\n\n`;
      content += `### Gefundene Vulnerabilities:\n\n`;
      content += `\`\`\`\n${auditResult.output}\n\`\`\`\n`;
    }
  } else {
    content += `## ❌ Status: Audit fehlgeschlagen\n\n`;
    content += `\`\`\`\n${auditResult.error || auditResult.output}\n\`\`\`\n`;
  }

  fs.writeFileSync(reportPath, content, 'utf-8');
  log(`✅ Security Audit Report erstellt: ${reportPath}`, 'green');
}

function generateDependencyAuditReport(outdatedResult) {
  const reportPath = path.join(REPORTS_DIR, 'dependency-audit.md');
  const timestamp = new Date().toISOString();

  let content = `# Dependency Audit Report\n\n`;
  content += `**Datum**: ${timestamp}\n`;
  content += `**Befehl**: \`pnpm outdated\`\n\n`;

  if (outdatedResult.success) {
    const lines = outdatedResult.output.split('\n').filter((line) => line.trim());
    
    if (lines.length <= 2) {
      // Nur Header, keine outdated packages
      content += `## ✅ Status: Alle Dependencies sind aktuell\n\n`;
      content += `Keine veralteten Dependencies gefunden.\n`;
    } else {
      content += `## ⚠️ Status: Veraltete Dependencies gefunden\n\n`;
      content += `### Veraltete Packages:\n\n`;
      content += `\`\`\`\n${outdatedResult.output}\n\`\`\`\n`;
    }
  } else {
    content += `## ❌ Status: Audit fehlgeschlagen\n\n`;
    content += `\`\`\`\n${outdatedResult.error || outdatedResult.output}\n\`\`\`\n`;
  }

  fs.writeFileSync(reportPath, content, 'utf-8');
  log(`✅ Dependency Audit Report erstellt: ${reportPath}`, 'green');
}

function generateAuditSummary(securityResult, dependencyResult) {
  const reportPath = path.join(REPORTS_DIR, 'audit-summary.md');
  const timestamp = new Date().toISOString();

  let content = `# Audit Summary\n\n`;
  content += `**Datum**: ${timestamp}\n\n`;
  content += `## Zusammenfassung\n\n`;

  // Security Audit Status
  if (securityResult.success) {
    const hasVulnerabilities = securityResult.output.includes('vulnerability') ||
                               securityResult.output.includes('moderate') ||
                               securityResult.output.includes('high') ||
                               securityResult.output.includes('critical');
    
    if (hasVulnerabilities) {
      content += `- **Security Audit**: ⚠️ Sicherheitslücken gefunden\n`;
    } else {
      content += `- **Security Audit**: ✅ Keine Sicherheitslücken\n`;
    }
  } else {
    content += `- **Security Audit**: ❌ Fehlgeschlagen\n`;
  }

  // Dependency Audit Status
  if (dependencyResult.success) {
    const lines = dependencyResult.output.split('\n').filter((line) => line.trim());
    if (lines.length <= 2) {
      content += `- **Dependency Audit**: ✅ Alle Dependencies aktuell\n`;
    } else {
      content += `- **Dependency Audit**: ⚠️ Veraltete Dependencies gefunden\n`;
    }
  } else {
    content += `- **Dependency Audit**: ❌ Fehlgeschlagen\n`;
  }

  content += `\n## Detaillierte Reports\n\n`;
  content += `- [Security Audit Report](./security-audit.md)\n`;
  content += `- [Dependency Audit Report](./dependency-audit.md)\n`;

  fs.writeFileSync(reportPath, content, 'utf-8');
  log(`✅ Audit Summary erstellt: ${reportPath}`, 'green');
}

// Main execution
function main() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('🔍 Local Audit Script', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('');

  // Security Audit
  const securityResult = runCommand('pnpm audit --audit-level=moderate', 'Security Audit');
  
  // Dependency Audit
  const dependencyResult = runCommand('pnpm outdated', 'Dependency Audit');

  // Generate Reports
  generateSecurityAuditReport(securityResult);
  generateDependencyAuditReport(dependencyResult);
  generateAuditSummary(securityResult, dependencyResult);

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('✅ Audit abgeschlossen', 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('');
  log(`📁 Reports-Verzeichnis: ${REPORTS_DIR}`, 'blue');
  log('📄 Reports:', 'blue');
  log('  - reports/security-audit.md', 'blue');
  log('  - reports/dependency-audit.md', 'blue');
  log('  - reports/audit-summary.md', 'blue');
  log('');
}

main();





