@echo off
cd /d "%~dp0"
echo Chemin courant: %cd%
if exist ".\projects\warzone\LANCER_WARZONE.bat" (
  echo ^ Chemin correct trouvé
) else (
  echo ^ Chemin non trouvé
  dir projects\warzone\*.bat
)
