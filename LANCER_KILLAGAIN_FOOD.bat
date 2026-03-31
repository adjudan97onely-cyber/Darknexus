@echo off
title KILLAGAIN FOOD - PORT 5180 
color 0A
echo.
echo ===================================
echo   KILLAGAIN FOOD - PREMIUM
echo ===================================
echo.
echo Demarrage du serveur de developpement...
echo URL: http://127.0.0.1:5180/
echo.

cd /d "%~dp0\killagain-food"

if not exist "package.json" (
  echo ERREUR: killagain-food non trouve en racine!
  echo Chemin: %cd%
  pause
  exit /b 1
)

echo Démarrage npm run dev...
npm run dev
pause
