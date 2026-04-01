@echo off
REM ═══════════════════════════════════════════════════════════
REM  WARZONE DEV - Version Développement/Admin
REM ═══════════════════════════════════════════════════════════
REM  Cette version est pour le développement et les tests
REM  Version Utilisateur : LANCER_WARZONE.bat

title WARZONE DEV - Port 5180
color 0A
echo.
echo ═══════════════════════════════════════════════════════════
echo   ⚙️  WARZONE DEV - VERSION DEVELOPPEMENT
echo ═══════════════════════════════════════════════════════════
echo.
echo ⚡ INFO:
echo   - Version: DEV/ADMIN
echo   - Port: 5180
echo   - URL: http://127.0.0.1:5180/
echo   - Pour UTILISATEURS: utilise LANCER_WARZONE.bat
echo.

cd /d "%~dp0\projects\warzone-DEV"

if not exist "package.json" (
  echo ❌ ERREUR: package.json non trouve!
  echo Chemin attendu: %cd%
  pause
  exit /b 1
)

echo 📦 Installation des dépendances (si nécessaire)...
if not exist "node_modules" (
  call npm install
  if errorlevel 1 (
    echo ⚠️  Erreur npm install
    pause
    exit /b 1
  )
)

echo.
echo 🚀 Démarrage du serveur de développement...
echo.
npm start

pause
