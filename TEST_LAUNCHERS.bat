@echo off
REM Darknexus - Test tous les launchers

cd /d "%~dp0"
cls
echo.
echo ====================================================
echo   TEST DE TOUS LES LAUNCHERS - DARKNEXUS
echo ====================================================
echo.

echo [1/4] Vérification Warzone...
if exist ".\projects\warzone\LANCER_WARZONE.bat" (
  echo   ✓ Warzone OK
) else (
  echo   ✗ Warzone MANQUANT
)

echo [2/4] Vérification Killagain-Food...
if exist ".\projects\killagain-food\LANCER_KILLAGAIN_FOOD.bat" (
  echo   ✓ Killagain-Food OK
) else if exist ".\killagain-food\package.json" (
  echo   ✓ Killagain-Food (en racine, PREMIUM)
) else (
  echo   ✗ Killagain-Food MANQUANT
)

echo [3/4] Vérification Analytics/Lottery...
if exist ".\projects\analytics-lottery\LANCER_ANALYTICS.bat" (
  echo   ✓ Analytics OK
) else (
  echo   ✗ Analytics MANQUANT
)

echo [4/4] Vérification Chef-IA...
if exist ".\projects\chef-ia" (
  echo   ✓ Chef-IA OK
) else (
  echo   ✗ Chef-IA MANQUANT
)

echo.
echo ====================================================
echo Vous pouvez utiliser:
echo   .\LANCER_WARZONE.bat
echo   .\LANCER_KILLAGAIN_FOOD.bat
echo   .\LANCER_ANALYTICS.bat
echo ====================================================
echo.
pause
