@echo off
setlocal
cd /d "%~dp0"

if exist ".\projects\warzone\LANCER_WARZONE.bat" (
  echo Lancement Warzone depuis projects/warzone/...
  call ".\projects\warzone\LANCER_WARZONE.bat"
) else (
  echo ERREUR: Lanceur Warzone introuvable!
  echo Chemin attendu: .\projects\warzone\LANCER_WARZONE.bat
  pause
)
