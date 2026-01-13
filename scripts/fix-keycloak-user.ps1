# scripts/fix-keycloak-user.ps1
# Löscht, erstellt und konfiguriert den Keycloak-Benutzer für Development

$ErrorActionPreference = "Continue"

Write-Host "=== Keycloak Benutzer komplett neu einrichten ===" -ForegroundColor Cyan
Write-Host ""

# Konfiguration
$keycloakUrl = "http://localhost:8080"
$realm = "wattos"
$adminUser = "admin"
$adminPassword = "admin"
$username = "admin@wattweiser.com"
$email = "admin@wattweiser.com"
$password = "wattwelten"

# 1. Hole Admin-Token
Write-Host "1. Hole Admin-Token..." -ForegroundColor Yellow
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
    Write-Host "   OK: Admin-Token erhalten" -ForegroundColor Green
} catch {
    Write-Host "   FEHLER: Fehler beim Abrufen des Admin-Tokens: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

# 2. Lösche vorhandenen Benutzer
Write-Host ""
Write-Host "2. Lösche vorhandenen Benutzer..." -ForegroundColor Yellow
try {
    $existingUsers = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users?username=$username" `
        -Method Get `
        -Headers $headers `
        -ErrorAction SilentlyContinue
    
    if ($existingUsers -and $existingUsers.Count -gt 0) {
        foreach ($user in $existingUsers) {
            Write-Host "   Lösche Benutzer: $($user.username) (ID: $($user.id))" -ForegroundColor Gray
            Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users/$($user.id)" `
                -Method Delete `
                -Headers $headers `
                -ErrorAction Stop | Out-Null
        }
        Write-Host "   OK: Benutzer geloescht" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "   Info: Kein vorhandener Benutzer gefunden" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Warnung: Fehler beim Loeschen (moeglicherweise existiert kein Benutzer): $_" -ForegroundColor Yellow
}

# 3. Erstelle Benutzer neu
Write-Host ""
Write-Host "3. Erstelle Benutzer neu..." -ForegroundColor Yellow
try {
    $userBody = @{
        username = $username
        email = $email
        emailVerified = $true
        enabled = $true
        firstName = "Admin"
        lastName = "User"
    } | ConvertTo-Json
    
    $createResponse = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users" `
        -Method Post `
        -Headers $headers `
        -Body $userBody
    
    Start-Sleep -Seconds 2
    
    # Hole User-ID
    $createdUsers = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users?username=$username" `
        -Method Get `
        -Headers $headers
    
    if ($createdUsers.Count -eq 0) {
        throw "Benutzer wurde nicht erstellt"
    }
    
    $userId = $createdUsers[0].id
    Write-Host "   OK: Benutzer erstellt (ID: $userId)" -ForegroundColor Green
} catch {
    Write-Host "   FEHLER: Fehler beim Erstellen des Benutzers: $_" -ForegroundColor Red
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
    
    Write-Host "   OK: Passwort gesetzt" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "   FEHLER: Fehler beim Setzen des Passworts: $_" -ForegroundColor Red
    exit 1
}

# 5. Entferne Required Actions
Write-Host ""
Write-Host "5. Entferne Required Actions..." -ForegroundColor Yellow
try {
    $updateBody = @{
        requiredActions = @()
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/users/$userId" `
        -Method Put `
        -Headers $headers `
        -Body $updateBody | Out-Null
    
    Write-Host "   OK: Required Actions entfernt" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "   Warnung: Fehler beim Entfernen der Required Actions: $_" -ForegroundColor Yellow
}

# 6. Teste Login mit Gateway-Client
Write-Host ""
Write-Host "6. Teste Login mit Gateway-Client..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$keycloakUrl/realms/$realm/protocol/openid-connect/token" `
        -Method Post `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{
            grant_type = "password"
            client_id = "gateway"
            client_secret = "gateway-secret"
            username = $username
            password = $password
        }
    
    Write-Host "   ERFOLG! LOGIN FUNKTIONIERT!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Access Token erhalten (Laenge: $($loginResponse.access_token.Length) Zeichen)" -ForegroundColor Green
    Write-Host "   Token Type: $($loginResponse.token_type)" -ForegroundColor Gray
    Write-Host "   Expires In: $($loginResponse.expires_in) Sekunden" -ForegroundColor Gray
} catch {
    Write-Host "   FEHLER: Login fehlgeschlagen!" -ForegroundColor Red
    Write-Host ""
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            if ($responseBody) {
                Write-Host "   Response: $responseBody" -ForegroundColor Red
                $errorJson = $responseBody | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($errorJson) {
                    Write-Host "   Error: $($errorJson.error)" -ForegroundColor Red
                    Write-Host "   Description: $($errorJson.error_description)" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "   Fehler beim Lesen der Response" -ForegroundColor Red
        }
    }
    exit 1
}

# 7. Teste Login mit Web-Client
Write-Host ""
Write-Host "7. Teste Login mit Web-Client..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$keycloakUrl/realms/$realm/protocol/openid-connect/token" `
        -Method Post `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{
            grant_type = "password"
            client_id = "web"
            username = $username
            password = $password
        }
    
    Write-Host "   OK: Login mit Web-Client erfolgreich!" -ForegroundColor Green
} catch {
    Write-Host "   Warnung: Login mit Web-Client fehlgeschlagen (nicht kritisch)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Setup abgeschlossen! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Login-Daten:" -ForegroundColor Cyan
Write-Host "   Username: $username" -ForegroundColor White
Write-Host "   Password: $password" -ForegroundColor White
Write-Host ""
Write-Host "Teste jetzt den Login:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/de/login" -ForegroundColor White
Write-Host ""
