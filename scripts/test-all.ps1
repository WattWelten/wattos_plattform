# Comprehensive Test Script für alle Services (PowerShell)
# Führt alle Test-Suites aus und generiert Reports

$ErrorActionPreference = "Stop"

Write-Host "🧪 WattOS Plattform - Comprehensive Test Suite" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Test Results
$script:Passed = 0
$script:Failed = 0
$script:Skipped = 0

# Function to run test and track results
function Run-Test {
    param(
        [string]$TestName,
        [string]$TestCommand
    )
    
    Write-Host "▶ Running: $TestName" -ForegroundColor Yellow
    try {
        Invoke-Expression $TestCommand
        if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) {
            Write-Host "✅ $TestName PASSED" -ForegroundColor Green
            $script:Passed++
            return $true
        } else {
            Write-Host "❌ $TestName FAILED" -ForegroundColor Red
            $script:Failed++
            return $false
        }
    } catch {
        Write-Host "❌ $TestName FAILED: $_" -ForegroundColor Red
        $script:Failed++
        return $false
    }
}

# Start Mock-API Server in background
Write-Host "🚀 Starting Mock-API Server..." -ForegroundColor Cyan
$mockJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    pnpm mock:start
}
Start-Sleep -Seconds 3

# Check if Mock-API is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4001/health" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Mock-API Server running (Job ID: $($mockJob.Id))" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Mock-API Server failed to start" -ForegroundColor Red
    Stop-Job $mockJob -ErrorAction SilentlyContinue
    Remove-Job $mockJob -ErrorAction SilentlyContinue
    exit 1
}
Write-Host ""

# 1. Lint
Write-Host "📝 Step 1: Linting..." -ForegroundColor Cyan
Run-Test "Lint" "pnpm lint" | Out-Null
Write-Host "⚠️  Lint warnings (non-blocking)" -ForegroundColor Yellow

# 2. Type Check
Write-Host ""
Write-Host "🔷 Step 2: Type Checking..." -ForegroundColor Cyan
Run-Test "Type Check" "pnpm type-check" | Out-Null
Write-Host "⚠️  Type check warnings (non-blocking)" -ForegroundColor Yellow

# 3. Build
Write-Host ""
Write-Host "🔨 Step 3: Building..." -ForegroundColor Cyan
Run-Test "Build" "pnpm build" | Out-Null
Write-Host "⚠️  Build warnings (non-blocking)" -ForegroundColor Yellow

# 4. Unit Tests
Write-Host ""
Write-Host "🧪 Step 4: Unit Tests..." -ForegroundColor Cyan
Run-Test "Unit Tests" "pnpm test:unit" | Out-Null
Write-Host "⚠️  Unit tests failed (non-blocking)" -ForegroundColor Yellow

# 5. Integration Tests
Write-Host ""
Write-Host "🔗 Step 5: Integration Tests..." -ForegroundColor Cyan
Run-Test "Integration Tests" "pnpm test:integration" | Out-Null
Write-Host "⚠️  Integration tests failed (non-blocking)" -ForegroundColor Yellow

# 6. E2E Tests (optional)
Write-Host ""
Write-Host "🎭 Step 6: E2E Tests..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2
    Run-Test "E2E Tests" "pnpm test:e2e" | Out-Null
    Write-Host "⚠️  E2E tests failed (non-blocking)" -ForegroundColor Yellow
} catch {
    Write-Host "⏭️  E2E Tests SKIPPED (Frontend not running on port 3000)" -ForegroundColor Yellow
    $script:Skipped++
}

# 7. Performance Tests
Write-Host ""
Write-Host "⚡ Step 7: Performance Tests..." -ForegroundColor Cyan
Run-Test "Performance Tests" "pnpm test:perf" | Out-Null
Write-Host "⚠️  Performance tests failed (non-blocking)" -ForegroundColor Yellow

# Stop Mock-API Server
Write-Host ""
Write-Host "🛑 Stopping Mock-API Server..." -ForegroundColor Cyan
Stop-Job $mockJob -ErrorAction SilentlyContinue
Remove-Job $mockJob -ErrorAction SilentlyContinue

# Summary
Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✅ Passed: $script:Passed" -ForegroundColor Green
Write-Host "❌ Failed: $script:Failed" -ForegroundColor Red
Write-Host "⏭️  Skipped: $script:Skipped" -ForegroundColor Yellow
Write-Host ""

if ($script:Failed -eq 0) {
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some tests failed. Check logs above." -ForegroundColor Red
    exit 1
}

