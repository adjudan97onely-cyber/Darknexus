@echo off
REM Copie les fichiers .env du PC Bureau vers PC Portable
REM Execute cette script sur le PC PORTABLE apres avoir configure SETUP_PORTABLE_AUTO.bat

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  SYNC ENV FILES
echo ========================================
echo.
echo Ce script va copier tes fichiers .env depuis le PC Bureau.
echo.
echo IMPORTANT: 
echo - Assure-toi que le PC Bureau est accessible en reseau
echo - Ou copie les fichiers manuellement via USB/Cloud
echo.

set /p SOURCE_PATH="Chemin du Darknexus sur PC Bureau (ex: \\BUREAU\C$\Darknexus-main ou C:\Darknexus-main): "

if not exist "%SOURCE_PATH%\backend\.env" (
    echo ERREUR: backend\.env non trouve dans %SOURCE_PATH%
    echo Copie les fichiers manuellement depuis le PC Bureau.
    pause
    exit /b 1
)

echo.
echo [1/4] Copie backend\.env...
copy "%SOURCE_PATH%\backend\.env" backend\.env
if errorlevel 1 echo ERREUR lors de la copie backend\.env

echo [2/4] Copie frontend\.env.local...
copy "%SOURCE_PATH%\frontend\.env.local" frontend\.env.local
if errorlevel 1 echo ATTENTION: frontend\.env.local pas trouve (c'est optional)

echo [3/4] Copie warzone\backend\.env...
copy "%SOURCE_PATH%\warzone\backend\.env" warzone\backend\.env
if errorlevel 1 echo ATTENTION: warzone\backend\.env pas trouve

echo [4/4] Copie warzone\frontend\.env.local...
copy "%SOURCE_PATH%\warzone\frontend\.env.local" warzone\frontend\.env.local
if errorlevel 1 echo ATTENTION: warzone\frontend\.env.local pas trouve

echo.
echo ========================================
echo  SYNC TERMINE!
echo ========================================
echo.
echo Tes fichiers .env sont maintenant synchronises.
echo Tu peux maintenant lancer les apps avec les batch scripts.
echo.
pause
