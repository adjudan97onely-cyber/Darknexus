@echo off
setlocal
set "APP_DIR=%~dp0"
set "BACKEND_DIR=%APP_DIR%backend"
set "ROOT_DIR=%APP_DIR%.."
set "PYTHON=%ROOT_DIR%_publish\Darknexus-full\analytics-lottery\backend\venv\Scripts\python.exe"

echo ========================================
echo   ANALYTICS - BACKEND
echo ========================================
echo Backend: http://localhost:5001
echo.

if not exist "%BACKEND_DIR%\main.py" (
  echo ERREUR: main.py introuvable dans %BACKEND_DIR%
  pause
  exit /b 1
)

start "Analytics Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && "%PYTHON%" -m uvicorn main:app --host 0.0.0.0 --port 5001"
exit /b 0