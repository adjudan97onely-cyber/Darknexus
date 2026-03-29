@echo off
REM Chef IA - Start backend and frontend quickly
setlocal enabledelayedexpansion

echo ========================================
echo   Chef IA - Machine de Guerre
echo ========================================
echo.

set ROOT_DIR=C:\Darknexus-main\chef-ia
set BACKEND_DIR=%ROOT_DIR%\backend
set FRONTEND_DIR=%ROOT_DIR%\frontend
set PYTHON=C:\Darknexus-main\analytics-lottery\backend\venv\Scripts\python.exe

if not exist "%PYTHON%" (
    echo [ERROR] Python venv not found: %PYTHON%
    pause
    exit /b 1
)

echo [OK] Python detected
echo.

echo [CLEAN] Killing old python/node processes...
taskkill /F /IM python.exe 2>nul >nul
taskkill /F /IM node.exe 2>nul >nul
timeout /t 1 /nobreak >nul

echo [RUN] Starting Chef IA backend on port 5002...
start "Chef IA Backend" cmd /k "cd /d %BACKEND_DIR% && %PYTHON% start_simple.py"
timeout /t 3 /nobreak >nul

echo [RUN] Starting Chef IA frontend on port 5174...
start "Chef IA Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo [WAIT] Waiting frontend availability...
set READY=
for /L %%i in (1,1,40) do (
    powershell -NoProfile -Command "try { $r = Invoke-WebRequest 'http://localhost:5174' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
    if !errorlevel! EQU 0 (
        set READY=1
        goto :frontend_ready
    )
    timeout /t 1 /nobreak >nul
)

:frontend_ready
if defined READY (
    echo [OK] Frontend ready. Opening browser...
    start "" "http://localhost:5174"
) else (
    echo [WARN] Frontend not detected in time. Open http://localhost:5174 manually.
)

echo.
echo Backend health: http://localhost:5002/health
echo Frontend:       http://localhost:5174
echo.
pause
