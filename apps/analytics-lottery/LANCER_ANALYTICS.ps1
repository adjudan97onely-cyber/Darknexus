# ====================================
# Launch Analytics-Lottery (All)
# ====================================

Write-Host ""
Write-Host "╔═════════════════════════════════════════╗"
Write-Host "║    ANALYTICS-LOTTERY (Ligue 1)          ║"
Write-Host "║    Real-time Predictions + Odds         ║"
Write-Host "╚═════════════════════════════════════════╝"
Write-Host ""

# Check Python
try {
    python --version | Out-Null
} catch {
    Write-Host "❌ Python non trouvé"
    exit
}

# Check Node
try {
    node --version | Out-Null
} catch {
    Write-Host "❌ Node.js non trouvé"
    exit
}

Write-Host "✅ Dépendances OK"
Write-Host ""

# Start Backend in background
Write-Host "Démarrage du backend (port 5000)..."
$backend = Start-Process -FilePath "python" -ArgumentList "server.py" -WorkingDirectory "$PSScriptRoot\backend" -PassThru -NoNewWindow

# Wait for backend
Start-Sleep -Seconds 3

# Start Frontend in background
Write-Host "Démarrage du frontend (port 5173)..."
$frontend = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "$PSScriptRoot\frontend" -PassThru -NoNewWindow

Write-Host ""
Write-Host "╔═════════════════════════════════════════╗"
Write-Host "║  Application démarrée!                  ║"
Write-Host "║                                         ║"
Write-Host "║  Backend:  http://localhost:5000       ║"
Write-Host "║  Frontend: http://localhost:5173       ║"
Write-Host "║                                         ║"
Write-Host "║  Prédictions Ligue 1 disponibles!      ║"
Write-Host "╚═════════════════════════════════════════╝"
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter..."

Wait-Process -Id $backend.Id
