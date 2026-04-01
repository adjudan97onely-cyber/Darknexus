@echo off
setlocal
set "APP_DIR=%~dp0"
set "BACKEND_DIR=%APP_DIR%backend"
set "PYTHON=%APP_DIR%_publish\Darknexus-full\analytics-lottery\backend\venv\Scripts\python.exe"

echo ========================================
echo   DARKNEXUS - BACKEND
echo ========================================
echo Backend: http://localhost:5000
echo.

if not exist "%BACKEND_DIR%\server.py" (
  echo ERREUR: server.py introuvable dans %BACKEND_DIR%
  pause
  exit /b 1
)

start "Darknexus Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && "%PYTHON%" server.py"
exit /b 0