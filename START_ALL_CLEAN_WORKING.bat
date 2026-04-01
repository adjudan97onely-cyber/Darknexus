@echo off
setlocal enabledelayedexpansion

REM ═══════════════════════════════════════════════════════════════════════════════
REM  DARKNEXUS - Launcher (Services Fonctionnels)
REM  Lance UNIQUEMENT les services qui marchent
REM ═══════════════════════════════════════════════════════════════════════════════

echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo   ^|^|  DARKNEXUS - Services Fonctionnels
echo ════════════════════════════════════════════════════════════════════════════════
echo.

setlocal enabledelayedexpansion
set ROOT=%~dp0

REM Définir les chemins
set ANALYTICS_BACK=%ROOT%apps\analytics-lottery\backend
set ANALYTICS_FRONT=%ROOT%apps\analytics-lottery\frontend
set DARKNEXUS_BACK=%ROOT%apps\darknexus\backend
set DARKNEXUS_FRONT=%ROOT%apps\darknexus\frontend
set KILLAGAIN=%ROOT%killagain-food

REM ───────────────────────────────────────────────────────────────────────────────
REM  1️⃣  ANALYTICS LOTTERY - Backend (Python, port 5001)
REM ───────────────────────────────────────────────────────────────────────────────
echo [1/4] Lancement: Analytics Lottery Backend (port 5001)...
if exist "%ANALYTICS_BACK%\main.py" (
    start "Analytics Backend" cmd /k "cd /d %ANALYTICS_BACK% && python main.py"
    timeout /t 2 /nobreak
) else (
    echo   ⚠️  ERREUR: main.py non trouvé
)
echo.

REM ───────────────────────────────────────────────────────────────────────────────
REM  2️⃣  ANALYTICS LOTTERY - Frontend (Vite, port 5173)
REM ───────────────────────────────────────────────────────────────────────────────
echo [2/4] Lancement: Analytics Lottery Frontend (port 5173)...
if exist "%ANALYTICS_FRONT%\package.json" (
    start "Analytics Frontend" cmd /k "cd /d %ANALYTICS_FRONT% && npm run dev"
    timeout /t 2 /nobreak
) else (
    echo   ⚠️  ERREUR: package.json non trouvé
)
echo.

REM ───────────────────────────────────────────────────────────────────────────────
REM  3️⃣  DARKNEXUS PLATFORM - Backend (Python, port 5000)
REM ───────────────────────────────────────────────────────────────────────────────
echo [3/4] Lancement: Darknexus Platform Backend (port 5000)...
if exist "%DARKNEXUS_BACK%\server.py" (
    start "Darknexus Backend" cmd /k "cd /d %DARKNEXUS_BACK% && python server.py"
    timeout /t 2 /nobreak
) else (
    echo   ⚠️  ERREUR: server.py non trouvé
)
echo.

REM ───────────────────────────────────────────────────────────────────────────────
REM  4️⃣  DARKNEXUS PLATFORM - Frontend (CRA, port 3000)
REM ───────────────────────────────────────────────────────────────────────────────
echo [4/4] Lancement: Darknexus Platform Frontend (port 3000)...
if exist "%DARKNEXUS_FRONT%\package.json" (
    start "Darknexus Frontend" cmd /k "cd /d %DARKNEXUS_FRONT% && npm start"
    timeout /t 2 /nobreak
) else (
    echo   ⚠️  ERREUR: package.json non trouvé
)
echo.

REM ───────────────────────────────────────────────────────────────────────────────
REM  5️⃣  KILLAGAIN FOOD - Frontend (Vite, port 5180)
REM ───────────────────────────────────────────────────────────────────────────────
echo [5/5] Lancement: KillaGain Food (port 5180)...
if exist "%KILLAGAIN%\package.json" (
    start "KillaGain Food" cmd /k "cd /d %KILLAGAIN% && npm run dev"
    timeout /t 1 /nobreak
) else (
    echo   ⚠️  ERREUR: package.json non trouvé
)
echo.

REM ───────────────────────────────────────────────────────────────────────────────
REM  ✅ Résumé
REM ───────────────────────────────────────────────────────────────────────────────
echo ════════════════════════════════════════════════════════════════════════════════
echo ✅ SERVICES LANCÉS (Version Stable)
echo ════════════════════════════════════════════════════════════════════════════════
echo.
echo 📊 ANALYTICS LOTTERY:
echo    Backend:  http://localhost:5001/docs
echo    Frontend: http://localhost:5173
echo.
echo 🌑 DARKNEXUS PLATFORM:
echo    Backend:  http://localhost:5000/docs
echo    Frontend: http://localhost:3000
echo.
echo 🍔 KILLAGAIN FOOD:
echo    Frontend: http://localhost:5180
echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo ℹ️  Note: Warzone n'est pas lancé (problème SQLite/MongoDB à fixer)
echo ════════════════════════════════════════════════════════════════════════════════
echo.

endlocal
