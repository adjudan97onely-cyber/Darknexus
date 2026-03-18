@echo off
echo ========================================
echo   DEMARRAGE FRONTEND
echo ========================================
setlocal
set FRONTEND_DIR=C:\Darknexus-main\analytics-lottery\frontend
cd /d %FRONTEND_DIR%
start "Frontend Vite" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"
