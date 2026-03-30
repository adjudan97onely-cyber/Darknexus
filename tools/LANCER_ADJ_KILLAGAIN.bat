@echo off
title ADJ KILLAGAIN IA 2.0 - LAUNCHER
color 0A
echo.
echo ========================================
echo   ADJ KILLAGAIN IA 2.0
echo   LANCEMENT DE TA MACHINE DE GUERRE
echo ========================================
echo.

REM Verifier si MongoDB est en cours d'execution
echo [1/3] Verification de MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo    MongoDB est deja en cours d'execution ! [OK]
) else (
    echo    ATTENTION: MongoDB ne semble pas etre en cours d'execution !
    echo    Assure-toi que MongoDB Compass est ouvert ou que mongod.exe tourne.
    echo.
    pause
)

echo.
echo [2/3] Demarrage du BACKEND (Serveur API)...
echo    Le backend va s'ouvrir dans une nouvelle fenetre.
echo.

REM Lancer le backend dans une nouvelle fenetre
start "ADJ KILLAGAIN - BACKEND" cmd /k "cd /d %~dp0backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"

REM Attendre 5 secondes pour que le backend demarre
echo    Attente du demarrage du backend (5 secondes)...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Demarrage du FRONTEND (Interface Web)...
echo    Le frontend va s'ouvrir dans une nouvelle fenetre.
echo.

REM Lancer le frontend dans une nouvelle fenetre
start "ADJ KILLAGAIN - FRONTEND" cmd /k "cd /d %~dp0frontend && yarn start"

REM Attendre 10 secondes pour que le frontend compile
echo    Attente de la compilation du frontend (10 secondes)...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo   APPLICATION DEMARREE !
echo ========================================
echo.
echo   Backend:  http://localhost:8001
echo   Frontend: http://localhost:3000
echo.
echo   Ton navigateur va s'ouvrir automatiquement...
echo   Si ce n'est pas le cas, va sur: http://localhost:3000
echo.
echo   IMPORTANT:
echo   - NE FERME PAS les fenetres "BACKEND" et "FRONTEND" !
echo   - Elles doivent rester ouvertes tant que tu utilises l'app.
echo   - Pour arreter l'app: ferme ces deux fenetres.
echo.

REM Ouvrir le navigateur sur l'application
start http://localhost:3000

echo   Bonne utilisation de ta MACHINE DE GUERRE !
echo.
echo ========================================
echo.
pause
