# Script pour configurer rapidement l'accès MOBILE

# 1. Trouver l'IP locale
Write-Host "🔍 Recherche de l'adresse IP locale..." -ForegroundColor Cyan

$ipConfig = ipconfig | Select-String "IPv4 Address"
$ips = $ipConfig | ForEach-Object { $_.Line -replace ".*IPv4 Address.*: ", "" }

# Filter out loopback and keep the first WiFi/Ethernet IP
$localIP = $ips | Where-Object { $_ -match '\d+\.\d+\.\d+\.\d+' -and $_ -notmatch '127.0.0.1' } | Select-Object -First 1

if ($localIP) {
    Write-Host "✅ IP trouvée: $localIP" -ForegroundColor Green
} else {
    Write-Host "❌ Impossible de trouver l'IP locale" -ForegroundColor Red
    exit
}

# 2. Vérifier que le backend tourne
Write-Host "`n🔌 Vérification du backend sur port 5001..." -ForegroundColor Cyan
$backendCheck = Test-NetConnection -ComputerName localhost -Port 5001 -WarningAction SilentlyContinue

if ($backendCheck.TcpTestSucceeded) {
    Write-Host "✅ Backend actif sur http://localhost:5001" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend n'est pas lancé!" -ForegroundColor Yellow
    Write-Host "   Commande: cd c:\Darknexus-main\analytics-lottery\lottery\backend && python main.py" -ForegroundColor Gray
}

# 3. Vérifier que le frontend tourne
Write-Host "`n🎨 Vérification du frontend sur port 5173..." -ForegroundColor Cyan
$frontendCheck = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue

if ($frontendCheck.TcpTestSucceeded) {
    Write-Host "✅ Frontend actif sur http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend n'est pas lancé!" -ForegroundColor Yellow
    Write-Host "   Commande: cd c:\Darknexus-main\analytics-lottery\lottery\frontend && npm run dev" -ForegroundColor Gray
}

# 4. Afficher les URLs d'accès mobile
Write-Host "`n" -ForegroundColor White
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📱 ACCÈS DEPUIS TON TÉLÉPHONE (sur le même WiFi):              ║" -ForegroundColor Cyan
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan

Write-Host "║" -NoNewline -ForegroundColor Cyan
Write-Host "  🏠 Page d'accueil:" -ForegroundColor White
Write-Host "║" -ForegroundColor Cyan
Write-Host ("║    http://" + $localIP + ":5173") -ForegroundColor Yellow
Write-Host "║" -ForegroundColor Cyan

Write-Host "║" -NoNewline -ForegroundColor Cyan
Write-Host "  🎮 Mode Jouer:" -ForegroundColor White
Write-Host "║" -ForegroundColor Cyan
Write-Host ("║    http://" + $localIP + ":5173/hub?mode=play") -ForegroundColor Yellow
Write-Host "║" -ForegroundColor Cyan

Write-Host "║" -NoNewline -ForegroundColor Cyan
Write-Host "  📊 Mode Résultats:" -ForegroundColor White
Write-Host "║" -ForegroundColor Cyan
Write-Host ("║    http://" + $localIP + ":5173/hub?mode=results") -ForegroundColor Yellow
Write-Host "║" -ForegroundColor Cyan

Write-Host "║" -NoNewline -ForegroundColor Cyan
Write-Host "  🧠 Mode Analyse:" -ForegroundColor White
Write-Host "║" -ForegroundColor Cyan
Write-Host ("║    http://" + $localIP + ":5173/hub?mode=analysis") -ForegroundColor Yellow
Write-Host "║" -ForegroundColor Cyan

Write-Host "║" -NoNewline -ForegroundColor Cyan
Write-Host "  🎯 Keno:" -ForegroundColor White
Write-Host "║" -ForegroundColor Cyan
Write-Host ("║    http://" + $localIP + ":5173/keno") -ForegroundColor Yellow
Write-Host "║" -ForegroundColor Cyan

Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# 5. Instructions
Write-Host "`n📋 INSTRUCTIONS:" -ForegroundColor Magenta
Write-Host "1. Sur ton TÉLÉPHONE, connecte-toi au MÊME réseau WiFi que ton ordi" -ForegroundColor White
Write-Host "2. Ouvre le navigateur du téléphone" -ForegroundColor White
Write-Host ("3. Tape: http://" + $localIP + ":5173") -ForegroundColor Yellow
Write-Host "4. Appuie sur Entrée" -ForegroundColor White
Write-Host "5. Voilà! 🎉" -ForegroundColor White

Write-Host "`n⚙️  TROUBLESHOOTING:" -ForegroundColor Magenta
Write-Host "❌ Page ne charge pas?" -ForegroundColor Red
Write-Host "   → Vérifie que le backend ET frontend tournent ci-dessus" -ForegroundColor Gray
Write-Host "   → Vérifie que tu es sur le MÊME WiFi" -ForegroundColor Gray
Write-Host "   → Désactive temporairement le pare-feu Windows" -ForegroundColor Gray

Write-Host "`n✅ Prêt? Copie l'URL et colle-la dans ton téléphone!" -ForegroundColor Green

# Copy to clipboard (bonus)
$url = "http://$localIP`:5173"
$url | Set-Clipboard
Write-Host "`n📋 L'URL a été copiée au presse-papier! (Ctrl+V)" -ForegroundColor Cyan
