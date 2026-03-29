@echo off
REM ═══════════════════════════════════════════════════════════════
REM  Chef IA - Lanceur Automatique
REM  Démarrage du chef assistant culinaire
REM ═══════════════════════════════════════════════════════════════

chcp 65001 > nul
setlocal enabledelayedexpansion

cd /d "%~dp0"

REM Couleurs
for /F %%A in ('echo prompt $H ^| cmd') do set "BS=%%A"
set "GREEN=[92m"
set "BLUE=[94m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

echo.
echo !BLUE!╔═══════════════════════════════════════════════════════════╗!RESET!
echo !BLUE!║         👨‍🍳 CHEF IA - Lanceur 2026                        ║!RESET!
echo !BLUE!╚═══════════════════════════════════════════════════════════╝!RESET!
echo.

REM Vérifier Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo !RED!✗ Node.js non trouvé. Veuillez installer Node.js 18+!RESET!
    pause
    exit /b 1
)

echo !GREEN!✓ Node.js détecté!RESET!
node --version
echo.

REM Vérifier les dépendances
if not exist node_modules (
    echo !YELLOW!📦 Installation des dépendances...!RESET!
    call npm install
)

echo.
echo !GREEN!✓ Démarrage de Chef IA...!RESET!
echo.

REM Démarrer le serveur
npm run dev

pause
