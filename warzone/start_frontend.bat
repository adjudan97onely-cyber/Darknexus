@echo off
setlocal
set "APP_DIR=%~dp0"
set "FRONTEND_DIR=%APP_DIR%frontend"

echo ========================================
echo   WARZONE - FRONTEND
echo ========================================
echo Frontend: http://localhost:3001
echo.

if not exist "%FRONTEND_DIR%\package.json" (
  echo ERREUR: package.json introuvable dans %FRONTEND_DIR%
  pause
  exit /b 1
)

start "Warzone Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && set REACT_APP_BACKEND_URL=http://localhost:5003 && set PORT=3001 && set BROWSER=none && npm start"
timeout /t 4 /nobreak >nul
start "" "http://localhost:3001"
exit /b 0