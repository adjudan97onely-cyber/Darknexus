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

REM Le vrai killagain-food est en racine (submodule git)
cd /d "%~dp0\..\..\killagain-food"

if not exist "package.json" (
  echo ERREUR: killagain-food non trouvé en racine!
  echo Chemin recherche: %cd%
  pause
  exit /b 1
)

npm run dev
pause
