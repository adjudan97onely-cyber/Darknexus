@echo off
setlocal
cd /d "%~dp0"

if exist ".\analytics-lottery\LANCER_WARZONE.bat" (
  call ".\analytics-lottery\LANCER_WARZONE.bat"
) else if exist ".\analytics-lottery\warzone\START_WARZONE.bat" (
  call ".\analytics-lottery\warzone\START_WARZONE.bat"
) else if exist ".\warzone\START_WARZONE.bat" (
  call ".\warzone\START_WARZONE.bat"
) else (
  echo Lanceur Warzone introuvable.
  echo Chemins testes:
  echo  - .\analytics-lottery\LANCER_WARZONE.bat
  echo  - .\analytics-lottery\warzone\START_WARZONE.bat
  echo  - .\warzone\START_WARZONE.bat
  pause
)
