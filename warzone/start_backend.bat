@echo off
setlocal
set "APP_DIR=%~dp0"
set "BACKEND_DIR=%APP_DIR%backend"
set "ROOT_DIR=%APP_DIR%.."
set "PYTHON=%ROOT_DIR%_publish\Darknexus-full\analytics-lottery\backend\venv\Scripts\python.exe"

echo ========================================
echo   WARZONE - BACKEND
echo ========================================
echo Backend: http://localhost:5003
echo.

if not exist "%BACKEND_DIR%\server.py" (
  echo ERREUR: server.py introuvable dans %BACKEND_DIR%
  pause
  exit /b 1
)

start "Warzone Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && "%PYTHON%" -m uvicorn server:app --host 0.0.0.0 --port 5003"
exit /b 0