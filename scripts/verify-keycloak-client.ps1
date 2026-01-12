# scripts/verify-keycloak-client.ps1
# Prüft und korrigiert den Keycloak Gateway-Client

$ErrorActionPreference = "Continue"

Write-Host "=== Keycloak Gateway-Client prüfen ===" -ForegroundColor Cyan
Write-Host ""

# Konfiguration
$keycloakUrl = "http://localhost:8080"
$realm = "wattos"
$adminUser = "admin"
$adminPassword = "admin"
$clientId = "gateway"
$expectedSecret = "gateway-secret"

# 1. Warte auf Keycloak
Write-Host "1. Warte auf Keycloak..." -ForegroundColor Yellow
$maxRetries = 30
$retryCount = 0
$keycloakReady = $false

while ($retryCount -lt $maxRetries -and -not $keycloakReady) {
    try {
        $response = Invoke-WebRequest -Uri "$keycloakUrl/health/ready" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $keycloakReady = $true
            Write-Host "   ✅ Keycloak ist bereit" -ForegroundColor Green
        }
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Start-Sleep -Seconds 2
            Write-Host "   ⏳ Warte auf Keycloak... ($retryCount/$maxRetries)" -ForegroundColor Gray
        }
    }
}

if (-not $keycloakReady) {
    Write-Host "   ❌ Keycloak ist nicht erreichbar" -ForegroundColor Red
    exit 1
}

# 2. Hole Admin-Token
Write-Host ""
Write-Host "2. Hole Admin-Token..." -ForegroundColor Yellow
try {
    $tokenResponse = Invoke-RestMethod -Uri "$keycloakUrl/realms/master/protocol/openid-connect/token" `
        -Method Post `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{
            grant_type = "password"
            client_id = "admin-cli"
            username = $adminUser
            password = $adminPassword
        }
    
    $accessToken = $tokenResponse.access_token
    Write-Host "   ✅ Admin-Token erhalten" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Fehler beim Abrufen des Admin-Tokens: $_" -ForegroundColor Red
    exit 1
}

# 3. Prüfe ob Realm existiert
Write-Host ""
Write-Host "3. Prüfe Realm '$realm'..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }
    
    $realms = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms" `
        -Method Get `
        -Headers $headers
    
    $realmExists = $realms | Where-Object { $_.realm -eq $realm }
    
    if ($realmExists) {
        Write-Host "   ✅ Realm '$realm' existiert" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Realm '$realm' existiert nicht!" -ForegroundColor Red
        Write-Host "   💡 Starte Keycloak mit --import-realm neu:" -ForegroundColor Yellow
        Write-Host "      docker-compose -f docker-compose.dev.yml restart keycloak" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "   ❌ Fehler beim Prüfen des Realms: $_" -ForegroundColor Red
    exit 1
}

# 4. Prüfe Client
Write-Host ""
Write-Host "4. Prüfe Client '$clientId'..." -ForegroundColor Yellow
try {
    $clients = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/clients?clientId=$clientId" `
        -Method Get `
        -Headers $headers
    
    if ($clients.Count -eq 0) {
        Write-Host "   ❌ Client '$clientId' existiert nicht!" -ForegroundColor Red
        Write-Host "   💡 Realm-Export wurde nicht korrekt importiert" -ForegroundColor Yellow
        exit 1
    }
    
    $client = $clients[0]
    Write-Host "   ✅ Client '$clientId' existiert (ID: $($client.id))" -ForegroundColor Green
    
    # Prüfe Client-Secret
    Write-Host ""
    Write-Host "5. Prüfe Client-Secret..." -ForegroundColor Yellow
    $secretResponse = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/clients/$($client.id)/client-secret" `
        -Method Get `
        -Headers $headers
    
    $actualSecret = $secretResponse.value
    
    if ($actualSecret -eq $expectedSecret) {
        Write-Host "   ✅ Client-Secret ist korrekt" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Client-Secret stimmt nicht überein!" -ForegroundColor Yellow
        Write-Host "      Erwartet: $expectedSecret" -ForegroundColor Gray
        Write-Host "      Tatsächlich: $actualSecret" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   💡 Setze Client-Secret auf '$expectedSecret'..." -ForegroundColor Yellow
        
        # Setze Secret
        $secretBody = @{
            value = $expectedSecret
            temporary = $false
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/clients/$($client.id)/client-secret" `
                -Method Put `
                -Headers $headers `
                -Body $secretBody | Out-Null
            Write-Host "   ✅ Client-Secret wurde aktualisiert" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Fehler beim Setzen des Secrets: $_" -ForegroundColor Red
            exit 1
        }
    }
    
    # Prüfe directAccessGrantsEnabled
    Write-Host ""
    Write-Host "6. Prüfe directAccessGrantsEnabled..." -ForegroundColor Yellow
    if ($client.directAccessGrantsEnabled -eq $true) {
        Write-Host "   ✅ directAccessGrantsEnabled ist aktiviert" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  directAccessGrantsEnabled ist deaktiviert!" -ForegroundColor Yellow
        Write-Host "   💡 Aktiviere directAccessGrantsEnabled..." -ForegroundColor Yellow
        
        $clientBody = @{
            directAccessGrantsEnabled = $true
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/clients/$($client.id)" `
                -Method Put `
                -Headers $headers `
                -Body $clientBody | Out-Null
            Write-Host "   ✅ directAccessGrantsEnabled wurde aktiviert" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Fehler beim Aktivieren: $_" -ForegroundColor Red
            exit 1
        }
    }
    
} catch {
    Write-Host "   ❌ Fehler beim Prüfen des Clients: $_" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   💡 Client existiert nicht - Realm-Export wurde nicht korrekt importiert" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host ""
Write-Host "✅ Keycloak Gateway-Client ist korrekt konfiguriert!" -ForegroundColor Green
Write-Host ""
Write-Host "Konfiguration:" -ForegroundColor Cyan
Write-Host "   Realm: $realm" -ForegroundColor White
Write-Host "   Client ID: $clientId" -ForegroundColor White
Write-Host "   Client Secret: $expectedSecret" -ForegroundColor White
Write-Host "   directAccessGrantsEnabled: true" -ForegroundColor White
Write-Host ""
