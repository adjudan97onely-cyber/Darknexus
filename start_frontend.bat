@echo off
setlocal
set "APP_DIR=%~dp0"
set "FRONTEND_DIR=%APP_DIR%frontend"

echo ========================================
echo   DARKNEXUS - FRONTEND
echo ========================================
echo Frontend: http://localhost:3000
echo.

if not exist "%FRONTEND_DIR%\package.json" (
  echo ERREUR: package.json introuvable dans %FRONTEND_DIR%
  pause
  exit /b 1
)

start "Darknexus Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && set REACT_APP_BACKEND_URL=http://localhost:5000 && set BROWSER=none && npm start"
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000"
exit /b 0