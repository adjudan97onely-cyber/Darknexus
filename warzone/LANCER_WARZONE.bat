@echo off
setlocal
cd /d "%~dp0"
title ZEN HUB PRO — Lancement

echo ========================================
echo   ZEN HUB PRO - WARZONE COMPILER
echo ========================================
echo.

:: === VERIFICATION .env ===
if not exist "backend\.env" (
    echo [ERREUR] backend\.env introuvable.
    echo Cree le fichier warzone\backend\.env avec :
    echo   MONGO_URL=mongodb://localhost:27017
    echo   DB_NAME=warzone_dev
    echo   PORT=5003
    echo   OPENAI_API_KEY=sk-...ta-cle-ici...
    pause
    exit /b 1
)

:: === DEMARRAGE MONGODB ===
echo [1/3] Demarrage MongoDB...
net start MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    :: Peut etre deja en cours — on verifie
    mongosh --eval "db.runCommand({ping:1})" --quiet >nul 2>&1
    if %errorlevel% neq 0 (
        echo [AVERTISSEMENT] MongoDB ne repond pas.
        echo Assure-toi que MongoDB est installe et demarre manuellement si besoin.
        echo.
    ) else (
        echo [OK] MongoDB deja en cours.
    )
) else (
    echo [OK] MongoDB demarre.
)

:: === DEMARRAGE BACKEND ===
echo [2/3] Demarrage backend sur http://localhost:5003 ...
start "ZEN HUB - Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn server:app --host 0.0.0.0 --port 5003 --reload 2>&1"

:: Attendre que le backend soit pret
timeout /t 4 /nobreak >nul
echo [OK] Backend lance.

:: === DEMARRAGE FRONTEND ===
echo [3/3] Demarrage frontend...
start "ZEN HUB - Frontend" cmd /k "cd /d "%~dp0frontend" && set PORT=3001 && npm start"

:: Attendre que le frontend compile
echo En attente du frontend (15 sec)...
timeout /t 15 /nobreak >nul

:: === OUVERTURE NAVIGATEUR ===
echo Ouverture de l'application...
start "" "http://localhost:3001"

echo.
echo ========================================
echo  App lancee sur http://localhost:3001
echo  Backend sur   http://localhost:5003
echo ========================================
echo.
echo Pour fermer : ferme les 2 fenetres de terminal
echo.
pause
endlocal
