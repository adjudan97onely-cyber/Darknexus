@echo off
setlocal
cd /d "%~dp0"

if exist ".\warzone\LANCER_ZEN_HUB_PRO_WARZONE.bat" (
  call ".\warzone\LANCER_ZEN_HUB_PRO_WARZONE.bat"
) else (
  echo Lanceur Warzone introuvable: .\warzone\LANCER_ZEN_HUB_PRO_WARZONE.bat
  pause
)

endlocal
