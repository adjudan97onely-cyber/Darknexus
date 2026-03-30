@echo off
title KILLAGAIN FOOD - PORT 5180 
color 0A
echo.
echo ===================================
echo   KILLAGAIN FOOD - PORT 5180
echo ===================================
echo.
echo Redirection vers projects/killagain-food/...
echo.

cd /d "%~dp0.."

if exist ".\projects\killagain-food\LANCER_KILLAGAIN_FOOD.bat" (
  call ".\projects\killagain-food\LANCER_KILLAGAIN_FOOD.bat"
) else (
  echo ERREUR: Launcher killagain-food introuvable!
  echo Chemin attendu: .\projects\killagain-food\LANCER_KILLAGAIN_FOOD.bat
  pause
)
