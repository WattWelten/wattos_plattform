# scripts/create-keycloak-user.ps1
# Erstellt einen Benutzer in Keycloak für Development

$ErrorActionPreference = "Continue"

Write-Host "=== Keycloak Benutzer erstellen ===" -ForegroundColor Cyan
Write-Host ""

# Konfiguration
$keycloakUrl = "http://localhost:8080"
$realm = "wattos"
$adminUser = "admin"
$adminPassword = "admin"
$username = "admin@wattweiser.com"
$email = "admin@wattweiser.com"
$password = "admin123"

# 1. Hole Admin-Token
Write-Host "1. Hole Admin-Token von Keycloak..." -ForegroundColor Yellow
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
    Write-Host ""
    Write-Host "💡 Stelle sicher, dass Keycloak läuft:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.dev.yml up -d keycloak" -ForegroundColor Gray
    exit 1
}

# 2. Prüfe ob Benutzer bereits existiert
Write-Host ""
Write-Host "2. Prüfe ob Benutzer bereits existiert..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }
    
    $existingUsers = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users?username=$username" `
        -Method Get `
        -Headers $headers
    
    if ($existingUsers.Count -gt 0) {
        Write-Host "   ⚠️  Benutzer '$username' existiert bereits" -ForegroundColor Yellow
        Write-Host "   💡 Um das Passwort zu ändern, lösche den Benutzer zuerst in der Keycloak Admin-Console" -ForegroundColor Gray
        Write-Host "      http://localhost:8080/admin -> Realm 'wattos' -> Users -> $username -> Delete" -ForegroundColor Gray
        exit 0
    }
} catch {
    # Benutzer existiert nicht, das ist OK
    Write-Host "   ✅ Benutzer existiert noch nicht" -ForegroundColor Green
}

# 3. Erstelle Benutzer
Write-Host ""
Write-Host "3. Erstelle Benutzer '$username'..." -ForegroundColor Yellow
try {
    $userBody = @{
        username = $username
        email = $email
        emailVerified = $true
        enabled = $true
    } | ConvertTo-Json
    
    $createResponse = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users" `
        -Method Post `
        -Headers $headers `
        -Body $userBody
    
    # Hole User-ID aus Location-Header
    $locationHeader = $createResponse.Headers.Location
    if (-not $locationHeader) {
        # Versuche User-ID über GET zu finden
        Start-Sleep -Seconds 1
        $createdUsers = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users?username=$username" `
            -Method Get `
            -Headers $headers
        $userId = $createdUsers[0].id
    } else {
        $userId = $locationHeader -replace ".*/users/", ""
    }
    
    Write-Host "   ✅ Benutzer erstellt (ID: $userId)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Fehler beim Erstellen des Benutzers: $_" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "   💡 Benutzer existiert bereits" -ForegroundColor Yellow
    }
    exit 1
}

# 4. Setze Passwort
Write-Host ""
Write-Host "4. Setze Passwort..." -ForegroundColor Yellow
try {
    $passwordBody = @{
        type = "password"
        value = $password
        temporary = $false
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users/$userId/reset-password" `
        -Method Put `
        -Headers $headers `
        -Body $passwordBody | Out-Null
    
    Write-Host "   ✅ Passwort gesetzt" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Fehler beim Setzen des Passworts: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Benutzer erfolgreich erstellt!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Login-Daten:" -ForegroundColor Cyan
Write-Host "   Username: $username" -ForegroundColor White
Write-Host "   Password: $password" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Keycloak Admin-Console:" -ForegroundColor Cyan
Write-Host "   http://localhost:8080/admin" -ForegroundColor White
Write-Host "   (Login: admin / admin)" -ForegroundColor Gray
Write-Host ""
