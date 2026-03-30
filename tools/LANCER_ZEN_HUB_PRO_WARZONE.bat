@echo off
setlocal
cd /d "%~dp0"

if exist ".\projects\warzone\LANCER_ZEN_HUB_PRO_WARZONE.bat" (
  echo Lancement Zen Hub Pro Warzone depuis projects/warzone/...
  call ".\projects\warzone\LANCER_ZEN_HUB_PRO_WARZONE.bat"
) else (
  echo ERREUR: Lanceur Warzone introuvable!
  echo Chemin attendu: .\projects\warzone\LANCER_ZEN_HUB_PRO_WARZONE.bat
  pause
)

endlocal
