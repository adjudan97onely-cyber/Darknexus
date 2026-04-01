param(
    [string]$InstallPath = "C:\"
)

# Setup Darknexus Clone Propre - PC Portable
# Crée un NOUVEAU clone sans risque de mélanger ancien code

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SETUP DARKNEXUS - CLONE PROPRE (PC PORTABLE)            " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Crée un dossier unique avec timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$FolderName = "Darknexus_CLEAN_$timestamp"
$FullPath = Join-Path $InstallPath $FolderName

Write-Host "📁 Création du dossier: $FullPath" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $FullPath -Force | Out-Null

Write-Host ""
Write-Host "[1/5] 📥 Clonage du repo..." -ForegroundColor Green

try {
    cd $FullPath
    git clone https://github.com/adjudan97onely-cyber/Darknexus.git .
    Write-Host "[✓] Repo cloné!" -ForegroundColor Green
} catch {
    Write-Host "[✗] ERREUR: Clone échoué" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/5] 🐍 Setup Backend Principal..." -ForegroundColor Green

try {
    cd backend
    python -m venv venv
    & .\venv\Scripts\Activate.ps1
    pip install --upgrade pip | Out-Null
    pip install -r requirements.txt 2>&1 | Select-String "Successfully|ERROR" | ForEach-Object { Write-Host "  $_" }
    deactivate
    cd ..
    Write-Host "[✓] Backend setup!" -ForegroundColor Green
} catch {
    Write-Host "[⚠] Backend setup incomplet (continue)" -ForegroundColor Yellow
    cd ..
}

Write-Host ""
Write-Host "[3/5] 🎨 Setup Frontend Principal..." -ForegroundColor Green

try {
    cd frontend
    npm install --silent
    Write-Host "[✓] Frontend packages installés!" -ForegroundColor Green
    cd ..
} catch {
    Write-Host "[⚠] Frontend npm incomplet (continue)" -ForegroundColor Yellow
    cd ..
}

Write-Host ""
Write-Host "[4/5] 🛠️  Setup Warzone Backend..." -ForegroundColor Green

try {
    cd warzone\backend
    python -m venv venv
    & .\venv\Scripts\Activate.ps1
    pip install --upgrade pip | Out-Null
    pip install fastapi uvicorn motor python-dotenv openai 2>&1 | Select-String "Successfully|ERROR" | ForEach-Object { Write-Host "  $_" }
    deactivate
    cd ..\..
    Write-Host "[✓] Warzone Backend setup!" -ForegroundColor Green
} catch {
    Write-Host "[⚠] Warzone Backend setup incomplet (continue)" -ForegroundColor Yellow
    cd ..\..
}

Write-Host ""
Write-Host "[5/5] 🎮 Setup Warzone Frontend..." -ForegroundColor Green

try {
    cd warzone\frontend
    npm install --silent
    Write-Host "[✓] Warzone Frontend packages installés!" -ForegroundColor Green
    cd ..\..
} catch {
    Write-Host "[⚠] Warzone Frontend npm incomplet (continue)" -ForegroundColor Yellow
    cd ..\..
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ SETUP TERMINÉ!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📂 Chemin d'accès: $FullPath" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1. Copie tes fichiers .env depuis PC Bureau :" -ForegroundColor White
Write-Host "     - backend\.env" -ForegroundColor Gray
Write-Host "     - frontend\.env.local" -ForegroundColor Gray
Write-Host "     - warzone\backend\.env" -ForegroundColor Gray
Write-Host "     - warzone\frontend\.env.local" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Lance les apps avec:" -ForegroundColor White
Write-Host "     - LANCER_WARZONE.bat" -ForegroundColor Gray
Write-Host "     - LANCER_LOTTERY.bat" -ForegroundColor Gray
Write-Host "     - LANCER_KILLAGAIN_FOOD.bat" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Accès: " -ForegroundColor Cyan
Write-Host "  - Warzone: http://localhost:3000" -ForegroundColor Gray
Write-Host "  - Lottery: http://localhost:5173" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Conseil: Ajoute ce dossier à VS Code pour continuer le dev!" -ForegroundColor Yellow
Write-Host ""

Write-Host "Appuie sur une touche pour terminer..."
Read-Host
