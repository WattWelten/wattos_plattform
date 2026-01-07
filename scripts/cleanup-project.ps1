param([switch]$DryRun = $false)
$projectRoot = Split-Path -Parent $PSScriptRoot
Write-Host "WattOS_Plattform Cleanup" -ForegroundColor Cyan
if ($DryRun) { Write-Host "DRY-RUN Modus" -ForegroundColor Yellow }
$cleanedCount = 0; $totalSize = 0
$analysisDirs = Get-ChildItem -Path $projectRoot -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^-analysis-|^log-analysis-|^railway-analysis-' }
foreach ($dir in $analysisDirs) {
    $size = (Get-ChildItem $dir.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($size / 1MB, 2); $totalSize += $size
    if ($DryRun) { Write-Host "[DRY-RUN] Wuerde loeschen: $($dir.Name) ($sizeMB MB)" -ForegroundColor Gray } else { Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "Geloescht: $($dir.Name) ($sizeMB MB)" -ForegroundColor Green; $cleanedCount++ }
}
$buildDirs = Get-ChildItem -Path $projectRoot -Recurse -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^(dist|build|\.next|\.turbo|out)$' -and $_.FullName -notmatch 'node_modules' }
foreach ($dir in $buildDirs) {
    $size = (Get-ChildItem $dir.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($size / 1MB, 2); $totalSize += $size
    if ($DryRun) { Write-Host "[DRY-RUN] Wuerde loeschen: $($dir.FullName.Replace($projectRoot, '.')) ($sizeMB MB)" -ForegroundColor Gray } else { Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "Geloescht: $($dir.FullName.Replace($projectRoot, '.')) ($sizeMB MB)" -ForegroundColor Green; $cleanedCount++ }
}
$tsbuildinfoFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter "*.tsbuildinfo" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch 'node_modules' }
foreach ($file in $tsbuildinfoFiles) { $size = $file.Length; $totalSize += $size; if ($DryRun) { Write-Host "[DRY-RUN] Wuerde loeschen: $($file.FullName.Replace($projectRoot, '.'))" -ForegroundColor Gray } else { Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue; Write-Host "Geloescht: $($file.FullName.Replace($projectRoot, '.'))" -ForegroundColor Green; $cleanedCount++ } }
$logFiles = Get-ChildItem -Path $projectRoot -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '\.log$|^-logs-|^install\.log$|^github-workflow-logs-' }
foreach ($file in $logFiles) { $size = $file.Length; $totalSize += $size; if ($DryRun) { Write-Host "[DRY-RUN] Wuerde loeschen: $($file.Name)" -ForegroundColor Gray } else { Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue; Write-Host "Geloescht: $($file.Name)" -ForegroundColor Green; $cleanedCount++ } }
Write-Host "Zusammenfassung: $(if($DryRun){'Wuerde bereinigen'}else{'Bereinigt'}) $cleanedCount Elemente, $([math]::Round($totalSize / 1MB, 2)) MB" -ForegroundColor Cyan
