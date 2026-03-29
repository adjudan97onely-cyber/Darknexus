@echo off
title KILLAGAIN FOOD - PORT 5180
color 0A
echo.
echo ===================================
echo   KILLAGAIN FOOD - PORT 5180
echo ===================================
echo.
echo Demarrage du serveur de developpement...
echo URL: http://127.0.0.1:5180/
echo.
cd /d "%~dp0"
npm run dev
pause
