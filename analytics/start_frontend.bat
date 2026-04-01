@echo off
setlocal
set "APP_DIR=%~dp0"
set "FRONTEND_DIR=%APP_DIR%frontend"

echo ========================================
echo   ANALYTICS - FRONTEND
echo ========================================
echo Frontend: http://localhost:5173
echo.

if not exist "%FRONTEND_DIR%\package.json" (
  echo ERREUR: package.json introuvable dans %FRONTEND_DIR%
  pause
  exit /b 1
)

start "Analytics Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && set VITE_API_URL=http://localhost:5001 && npm run dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"
exit /b 0