@echo off
REM Script de démarrage complet - Analytics Lottery App
REM Lance backend et frontend en parallel dans des fenêtres séparées

setlocal enabledelayedexpansion

echo ========================================
echo   Analytics Lottery - Démarrage Rapide
echo ========================================
echo.

set BACKEND_DIR=C:\Darknexus-main\analytics-lottery\backend
set FRONTEND_DIR=C:\Darknexus-main\analytics-lottery\frontend
set PYTHON=%BACKEND_DIR%\venv\Scripts\python.exe

REM Vérifier que Python dans venv existe
if not exist "%PYTHON%" (
    echo ❌ Erreur: Python venv non trouvé
    echo    Créez le venv avec: python -m venv venv
    pause
    exit /b 1
)

echo ✅ Python trouvé: %PYTHON%
echo.

REM Tuer les anciens processus sur les ports
echo 🧹 Nettoyage des anciens processus...
taskkill /F /IM python.exe 2>nul >nul
taskkill /F /IM node.exe 2>nul >nul
timeout /t 1 /nobreak >nul
echo.

REM Lancer Backend
echo 🚀 Démarrage Backend (FastAPI) sur port 5001...
start "Analytics Lottery Backend" cmd /k "cd /d %BACKEND_DIR% && %PYTHON% start_simple.py"
timeout /t 3 /nobreak >nul

REM Lancer Frontend
echo 🎨 Démarrage Frontend (React + Vite) sur port 5173...
start "Analytics Lottery Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo ⏳ Attente disponibilité frontend...
set READY=
for /L %%i in (1,1,40) do (
    powershell -NoProfile -Command "try { $r = Invoke-WebRequest 'http://localhost:5173' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
    if !errorlevel! EQU 0 (
        set READY=1
        goto :frontend_ready
    )
    timeout /t 1 /nobreak >nul
)

:frontend_ready
if defined READY (
    echo ✅ Frontend disponible, ouverture automatique du navigateur...
    start "" "http://localhost:5173"
) else (
    echo ⚠️ Frontend non détecté à temps. Ouvrez manuellement: http://localhost:5173
)

echo.
echo ========================================
echo   ✅ Services en cours de démarrage
echo ========================================
echo.
echo 📍 Ouvrez votre navigateur:
echo    http://localhost:5173
echo.
echo 🔗 Backend API:
echo    http://localhost:5001/health
echo.
echo 💡 Appuyez sur Ctrl+C dans chaque fenêtre pour arrêter
echo.
pause
