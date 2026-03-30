@echo off
REM Analytics Lottery Launcher

cd /d "%~dp0"

if exist ".\projects\analytics-lottery\LANCER_ANALYTICS.bat" (
  call ".\projects\analytics-lottery\LANCER_ANALYTICS.bat"
) else (
  echo ERREUR: Analytics launcher introuvable!
  echo Chemin attendu: .\projects\analytics-lottery\LANCER_ANALYTICS.bat
  pause
)
