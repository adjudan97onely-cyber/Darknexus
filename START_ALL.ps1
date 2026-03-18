#!/usr/bin/env pwsh
<#
    Analytics Lottery - Script de démarrage tout-en-un
    Lance Backend + Frontend dans des processus séparés
#>

param(
    [switch]$Backend = $false,
    [switch]$Frontend = $false,
    [switch]$All = $true  # Par défaut, démarr tout
)

$BackendDir = "C:\Darknexus-main\analytics-lottery\backend"
$FrontendDir = "C:\Darknexus-main\analytics-lottery\frontend"
$PythonExe = "$BackendDir\venv\Scripts\python.exe"

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Analytics Lottery - Démarrage" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier Python
if (-not (Test-Path $PythonExe)) {
    Write-Host "❌ Python venv non trouvé: $PythonExe" -ForegroundColor Red
    Write-Host "   Créez le venv avec: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Python: $PythonExe" -ForegroundColor Green
Write-Host ""

# Nettoyer les anciens processus
Write-Host "🧹 Nettoyage des anciens processus..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Démarrer Backend
if ($All -or $Backend) {
    Write-Host "🚀 Démarrage Backend (FastAPI) sur port 5001..." -ForegroundColor Blue
    $BackendScript = {
        Set-Location $args[0]
        & $args[1] $args[0]\start_simple.py
    }
    Start-Process pwsh -ArgumentList "-Command", { param($bd, $py) Set-Location $bd; & $py .\start_simple.py }, $BackendDir, $PythonExe -NoNewWindow
    Start-Sleep -Seconds 2
}

# Démarrer Frontend  
if ($All -or $Frontend) {
    Write-Host "🎨 Démarrage Frontend (React + Vite) sur port 5173..." -ForegroundColor Blue
    Start-Process pwsh -ArgumentList "-Command", { param($fd) Set-Location $fd; npm run dev }, $FrontendDir -NoNewWindow
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Services en cours de démarrage" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔗 Backend API: http://localhost:5001" -ForegroundColor Cyan
Write-Host "❤️  Health Check: http://localhost:5001/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Les processus tournent en arrière-plan" -ForegroundColor Yellow
Write-Host "   Pour arrêter, utilisez: taskkill /IM python.exe /F" -ForegroundColor Yellow
Write-Host ""
