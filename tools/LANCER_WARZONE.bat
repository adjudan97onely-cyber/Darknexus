@echo off
REM Warzone Launcher - Redirection vers projects/warzone/

cd /d "%~dp0"

if exist ".\projects\warzone\LANCER_WARZONE.bat" (
  echo Lancement Warzone depuis projects/warzone/...
  call ".\projects\warzone\LANCER_WARZONE.bat"
) else (
  echo ERREUR: Warzone launcher introuvable!
  echo Chemin attendu: .\projects\warzone\LANCER_WARZONE.bat
  pause
  exit /b 1
)
