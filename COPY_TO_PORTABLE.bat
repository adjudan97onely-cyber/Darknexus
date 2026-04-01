@echo off
REM Copie COMPLET Darknexus - PC Bureau -> PC Portable
REM Simple, direct, sans prise de tete

setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════
echo  COPY DARKNEXUS COMPLET
echo ════════════════════════════════════════
echo.

set /p DEST_PATH="Chemin destination sur PC Portable (ex: D:\ ou C:\): "

if "%DEST_PATH%"=="" (
    echo Erreur: Path obligatoire
    pause
    exit /b 1
)

echo.
echo Copie en cours... (peut prendre 1-2 min)
echo.

REM Copie tout
xcopy "C:\Darknexus-main" "%DEST_PATH%Darknexus-main" /E /I /Y /Q

if errorlevel 1 (
    echo ERREUR: Copie echouee
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════
echo  ✅ COPIE TERMINEE!
echo ════════════════════════════════════════
echo.
echo Darknexus est maintenant sur: %DEST_PATH%Darknexus-main
echo.
echo Tu peux lancer les apps directement:
echo   - LANCER_WARZONE.bat
echo   - LANCER_LOTTERY.bat
echo   - LANCER_KILLAGAIN_FOOD.bat
echo.
pause
