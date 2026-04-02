@echo off
setlocal enabledelayedexpansion

echo.
echo =============================================
echo   Analytics Lottery - Demarrage
echo   Backend: http://localhost:5001
echo   Frontend: http://localhost:5173
echo =============================================
echo.

set APP_DIR=%~dp0
set BACKEND_DIR=%APP_DIR%backend
set FRONTEND_DIR=%APP_DIR%frontend
set PYTHON=%BACKEND_DIR%\venv\Scripts\python.exe

REM Verifier Python venv
if not exist "%PYTHON%" (
    echo [!] venv non trouve. Lancement avec python systeme...
    set PYTHON=python
)

REM Tuer anciens processus sur les ports
echo [1/3] Nettoyage des ports 5001 et 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 2^>nul') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 2^>nul') do taskkill /F /PID %%a >nul 2>nul
timeout /t 1 /nobreak >nul

REM Lancer Backend
echo [2/3] Demarrage Backend FastAPI sur port 5001...
start "Analytics Lottery - Backend" cmd /k "cd /d %BACKEND_DIR% && %PYTHON% start_simple.py"
timeout /t 3 /nobreak >nul

REM Lancer Frontend
echo [3/3] Demarrage Frontend React sur port 5173...
start "Analytics Lottery - Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

REM Attendre et ouvrir navigateur
echo.
echo Attente du serveur frontend...
set READY=
for /L %%i in (1,1,40) do (
    powershell -NoProfile -Command "try { $r = Invoke-WebRequest 'http://localhost:5173' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
    if !errorlevel! EQU 0 (
        set READY=1
        goto :open
    )
    timeout /t 1 /nobreak >nul
)

:open
if defined READY (
    echo OK - Ouverture du navigateur...
    start "" "http://localhost:5173"
) else (
    echo Ouvre manuellement: http://localhost:5173
)

echo.
echo  Backend:  http://localhost:5001
echo  Frontend: http://localhost:5173
echo.
pause
