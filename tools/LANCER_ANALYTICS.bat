@echo off
REM Analytics Lottery Launcher - Redirection vers projects/analytics-lottery/

cd /d "%~dp0.."

if exist ".\projects\analytics-lottery\LANCER_ANALYTICS.bat" (
  echo Lancement Analytics depuis projects/analytics-lottery/...
  call ".\projects\analytics-lottery\LANCER_ANALYTICS.bat"
) else (
  echo ERREUR: Analytics launcher introuvable!
  echo Chemin attendu: .\projects\analytics-lottery\LANCER_ANALYTICS.bat
  pause
)
