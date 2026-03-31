@echo off
echo.
echo =============================================
echo         DARKNEXUS - Menu de lancement
echo =============================================
echo.
echo   [1] Analytics Lottery  (backend 5001 / frontend 5173)
echo   [2] Killagain Food     (frontend 5180)
echo   [3] Warzone            (backend 5002 / frontend 5174)
echo   [4] Darknexus Platform (backend 5000 / frontend 3000)
echo   [5] Lancer TOUT
echo   [0] Quitter
echo.
set /p CHOIX=Ton choix:

if "%CHOIX%"=="1" goto :lottery
if "%CHOIX%"=="2" goto :food
if "%CHOIX%"=="3" goto :warzone
if "%CHOIX%"=="4" goto :darknexus
if "%CHOIX%"=="5" goto :all
if "%CHOIX%"=="0" exit /b 0
echo Choix invalide.
pause
goto :eof

:lottery
start "" "%~dp0apps\analytics-lottery\START.bat"
goto :eof

:food
start "" "%~dp0apps\killagain-food\start-app.bat"
goto :eof

:warzone
start "" "%~dp0apps\warzone\START.bat"
goto :eof

:darknexus
start "" "%~dp0apps\darknexus\START.bat"
goto :eof

:all
echo Lancement de toutes les apps...
start "" "%~dp0apps\analytics-lottery\START.bat"
timeout /t 2 /nobreak >nul
start "" "%~dp0apps\killagain-food\start-app.bat"
timeout /t 2 /nobreak >nul
start "" "%~dp0apps\warzone\START.bat"
timeout /t 2 /nobreak >nul
start "" "%~dp0apps\darknexus\START.bat"
echo.
echo Toutes les apps ont ete lancees.
pause
goto :eof
