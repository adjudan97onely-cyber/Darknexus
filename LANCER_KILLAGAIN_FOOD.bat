@echo off
REM Killagain Food - Lancer l'app
REM Frontend React + Vite sur port 5180

cd /d "%~dp0"
echo.
echo ===================================
echo   KILLAGAIN FOOD - PORT 5180
echo ===================================
echo.
echo Demarrage du serveur de developpement...
echo URL: http://127.0.0.1:5180/
echo.

npm run dev

pause
