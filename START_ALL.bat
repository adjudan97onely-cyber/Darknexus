@echo off
setlocal enabledelayedexpansion

echo.
echo ═══════════════════════════════════════════════════════════
echo              DARKNEXUS - Menu de lancement  
echo ═══════════════════════════════════════════════════════════
echo.
echo   [1] Analytics Lottery   (backend 5001 / frontend 5173)
echo   [2] Killagain Food      (frontend 5180)
echo   [3] Warzone DEV ⭐      (ta version mise a jour)
echo   [4] Warzone Stable      (version pour utilisateurs)
echo   [5] Darknexus Platform  (backend 5000 / frontend 3000)
echo   [6] Lancer TOUT
echo   [0] Quitter
echo.
set /p CHOIX=Ton choix:

if "%CHOIX%"=="1" goto :lottery
if "%CHOIX%"=="2" goto :food
if "%CHOIX%"=="3" goto :warzone_dev
if "%CHOIX%"=="4" goto :warzone_stable
if "%CHOIX%"=="5" goto :darknexus
if "%CHOIX%"=="6" goto :all
if "%CHOIX%"=="0" exit /b 0
echo Choix invalide.
pause
goto :eof

:lottery
echo.
echo [1/6] Lancement ANALYTICS LOTTERY...
start "" "%~dp0projects\analytics-lottery\START.bat"
goto :eof

:food
echo.
echo [2/6] Lancement KILLAGAIN FOOD...
start "" "%~dp0killagain-food\start-app.bat"
goto :eof

:warzone_dev
echo.
echo [3/6] Lancement WARZONE DEV (ta mise a jour)...
start "" "%~dp0projects\warzone-DEV\START.bat"
goto :eof

:warzone_stable
echo.
echo [4/6] Lancement WARZONE STABLE (utilisateurs)...
start "" "%~dp0projects\warzone\START.bat"
goto :eof

:darknexus
echo.
echo [5/6] Lancement DARKNEXUS PLATFORM...
start "" "%~dp0apps\darknexus\START.bat"
goto :eof

:all
echo.
echo ╔═════════════════════════════════════════════════════════╗
echo ║     Lancement de TOUTES les applications...            ║
echo ╚═════════════════════════════════════════════════════════╝
echo.

echo [1/4] Lancement Analytics Lottery...
start "" "%~dp0projects\analytics-lottery\START.bat"
timeout /t 3 /nobreak >nul

echo [2/4] Lancement Killagain Food...
start "" "%~dp0killagain-food\start-app.bat"
timeout /t 3 /nobreak >nul

echo [3/4] Lancement Warzone DEV...
start "" "%~dp0projects\warzone-DEV\START.bat"
timeout /t 3 /nobreak >nul

echo [4/4] Lancement Darknexus Platform...
start "" "%~dp0apps\darknexus\START.bat"

echo.
echo =======================================================
echo  ✅ Toutes les apps ont ete lancees!
echo =======================================================
echo.
pause
goto :eof