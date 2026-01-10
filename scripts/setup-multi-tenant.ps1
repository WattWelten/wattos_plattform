# PowerShell Script für automatisiertes Multi-Tenant Setup
# Prüft Environment, führt Migration und Seeds aus

param(
    [string]$DatabaseUrl = $env:DATABASE_URL
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Multi-Tenant Setup Script" -ForegroundColor Cyan
Write-Host ""

# 1. Prüfe DATABASE_URL
if (-not $DatabaseUrl) {
    Write-Host "❌ DATABASE_URL nicht gesetzt!" -ForegroundColor Red
    Write-Host "Bitte setze DATABASE_URL Environment Variable oder übergebe als Parameter:" -ForegroundColor Yellow
    Write-Host "  `$env:DATABASE_URL = 'postgresql://user:password@localhost:5432/wattweiser'" -ForegroundColor Yellow
    Write-Host "  Oder: .\scripts\setup-multi-tenant.ps1 -DatabaseUrl 'postgresql://...'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ DATABASE_URL gefunden" -ForegroundColor Green
Write-Host ""

# 2. Prüfe Datenbank-Verbindung
Write-Host "🔍 Prüfe Datenbank-Verbindung..." -ForegroundColor Cyan
try {
    $env:DATABASE_URL = $DatabaseUrl
    node --import tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } }); p.`$connect().then(() => { console.log('✅ Verbindung erfolgreich'); process.exit(0); }).catch((e) => { console.error('❌ Verbindung fehlgeschlagen:', e.message); process.exit(1); });"
    if ($LASTEXITCODE -ne 0) {
        throw "Datenbank-Verbindung fehlgeschlagen"
    }
    Write-Host "✅ Datenbank-Verbindung erfolgreich" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Datenbank-Verbindung fehlgeschlagen: $_" -ForegroundColor Red
    exit 1
}

# 3. Führe Migration aus
Write-Host "📝 Führe Migration aus..." -ForegroundColor Cyan
try {
    $env:DATABASE_URL = $DatabaseUrl
    pnpm migrate:manual
    if ($LASTEXITCODE -ne 0) {
        throw "Migration fehlgeschlagen"
    }
    Write-Host "✅ Migration erfolgreich" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Migration fehlgeschlagen: $_" -ForegroundColor Red
    exit 1
}

# 4. Führe Seeds aus
Write-Host "🌱 Führe Seeds aus..." -ForegroundColor Cyan
try {
    $env:DATABASE_URL = $DatabaseUrl
    pnpm seed:tenants
    if ($LASTEXITCODE -ne 0) {
        throw "Seeds fehlgeschlagen"
    }
    Write-Host "✅ Seeds erfolgreich" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Seeds fehlgeschlagen: $_" -ForegroundColor Red
    exit 1
}

# 5. Verifiziere Setup
Write-Host "🔍 Verifiziere Setup..." -ForegroundColor Cyan
try {
    $env:DATABASE_URL = $DatabaseUrl
    node --import tsx -e "
        import { PrismaClient } from '@prisma/client';
        const p = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
        p.tenant.count().then(count => {
            console.log(`✅ ${count} Tenants gefunden`);
            if (count >= 4) {
                console.log('✅ Setup erfolgreich!');
                process.exit(0);
            } else {
                console.log('⚠️  Erwartet: 4 Tenants, gefunden:', count);
                process.exit(1);
            }
        }).catch(e => {
            console.error('❌ Verifikation fehlgeschlagen:', e.message);
            process.exit(1);
        });
    "
    if ($LASTEXITCODE -ne 0) {
        throw "Verifikation fehlgeschlagen"
    }
    Write-Host "✅ Setup-Verifikation erfolgreich" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Verifikation fehlgeschlagen: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Multi-Tenant Setup erfolgreich abgeschlossen!" -ForegroundColor Green
Write-Host ""
Write-Host "Nächste Schritte:" -ForegroundColor Cyan
Write-Host "  1. Starte die Anwendung: pnpm dev:mvp" -ForegroundColor Yellow
Write-Host "  2. Öffne Dashboard: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  3. Führe Tests aus: pnpm test:all" -ForegroundColor Yellow
