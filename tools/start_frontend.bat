@echo off
echo ========================================
echo   DEMARRAGE FRONTEND
echo ========================================
setlocal
set "ROOT_DIR=%~dp0"
set "FRONTEND_DIR=%ROOT_DIR%analytics-lottery\frontend"

if not exist "%FRONTEND_DIR%\package.json" (
	echo [ERROR] Frontend introuvable: %FRONTEND_DIR%
	exit /b 1
)

cd /d %FRONTEND_DIR%
start "Frontend Vite" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"
