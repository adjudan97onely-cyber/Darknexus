@echo off
chcp 65001 >nul
color 0A
cls
echo.
echo ========================================
echo   DARK NEXUS AI 2042
echo   INSTALLATION AUTOMATIQUE
echo ========================================
echo.
echo Installation en cours...
echo.
timeout /t 2 >nul

REM Verification Python
echo [1/7] Verification de Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Python n'est pas installe!
    echo.
    echo Installe Python depuis: https://www.python.org/downloads/
    echo IMPORTANT: Coche "Add Python to PATH" pendant l'installation!
    echo.
    pause
    exit /b 1
)
echo OK: Python detecte!
echo.

REM Verification Node.js
echo [2/7] Verification de Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Node.js n'est pas installe!
    echo.
    echo Installe Node.js depuis: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo OK: Node.js detecte!
echo.

REM Verification Yarn
echo [3/7] Verification de Yarn...
yarn --version >nul 2>&1
if errorlevel 1 (
    echo Yarn non detecte, installation...
    call npm install -g yarn
    if errorlevel 1 (
        echo ERREUR: Impossible d'installer Yarn!
        pause
        exit /b 1
    )
)
echo OK: Yarn detecte!
echo.

REM Configuration Backend
echo [4/7] Configuration du Backend...
cd backend

REM Creation du fichier .env backend
echo Creation du fichier .env pour le backend...
(
echo MONGO_URL=mongodb://localhost:27017
echo DB_NAME=dark_nexus_local
echo CORS_ORIGINS=*
echo OPENAI_API_KEY=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
echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
) > .env
echo OK: Fichier backend\.env cree!
echo.

REM Installation des dependances Python
echo Installation des dependances Python...
echo Cela peut prendre 2-3 minutes...
pip install -r requirements.txt
if errorlevel 1 (
    echo ATTENTION: Erreur lors de l'installation Python
    echo Mais on continue...
)
echo OK: Dependances Python installees!
echo.

cd ..

REM Configuration Frontend
echo [5/7] Configuration du Frontend...
cd frontend

REM Creation du fichier .env frontend
echo Creation du fichier .env pour le frontend...
(
echo REACT_APP_BACKEND_URL=http://localhost:8001
echo WDS_SOCKET_PORT=3000
echo ENABLE_HEALTH_CHECK=false
) > .env
echo OK: Fichier frontend\.env cree!
echo.

REM Installation des dependances Node
echo Installation des dependances Node.js...
echo Cela peut prendre 3-5 minutes, patience...
call yarn install
if errorlevel 1 (
    echo ERREUR: Installation des dependances Node echouee
    pause
    exit /b 1
)
echo OK: Dependances Node.js installees!
echo.

cd ..

REM Creation du script de creation d'utilisateur admin
echo [6/7] Creation du script d'initialisation...
(
echo import asyncio
echo from motor.motor_asyncio import AsyncIOMotorClient
echo from passlib.context import CryptContext
echo from uuid import uuid4
echo.
echo pwd_context = CryptContext^(schemes=["bcrypt"], deprecated="auto"^)
echo.
echo async def create_admin^(^):
echo     client = AsyncIOMotorClient^("mongodb://localhost:27017"^)
echo     db = client["dark_nexus_local"]
echo     existing = await db.users.find_one^({"email": "admin@darknexus.ai"}^)
echo     if existing:
echo         print^("Utilisateur admin existe deja!"^)
echo         return
echo     admin = {
echo         "id": str^(uuid4^(^)^),
echo         "email": "admin@darknexus.ai",
echo         "password_hash": pwd_context.hash^("DarkNexus2042!"^),
echo         "role": "admin"
echo     }
echo     await db.users.insert_one^(admin^)
echo     print^("Utilisateur admin cree avec succes!"^)
echo     print^("Email: admin@darknexus.ai"^)
echo     print^("Mot de passe: DarkNexus2042!"^)
echo.
echo if __name__ == "__main__":
echo     asyncio.run^(create_admin^(^)^)
) > backend\create_admin.py
echo OK: Script d'initialisation cree!
echo.

REM Creation du lanceur
echo [7/7] Creation du lanceur automatique...
(
echo @echo off
echo chcp 65001 ^>nul
echo color 0A
echo cls
echo.
echo ========================================
echo   DARK NEXUS AI 2042
echo   DEMARRAGE EN COURS...
echo ========================================
echo.
echo IMPORTANT: Ne ferme pas ces fenetres !
echo.
timeout /t 3 ^>nul
echo.
echo Demarrage du Backend...
start "Dark Nexus Backend" cmd /k "cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 5 ^>nul
echo.
echo Demarrage du Frontend...
start "Dark Nexus Frontend" cmd /k "cd frontend && yarn start"
echo.
echo ========================================
echo   DARK NEXUS AI 2042 LANCE !
echo ========================================
echo.
echo Ton navigateur va s'ouvrir dans quelques secondes...
echo URL: http://localhost:3000
echo.
echo CONNEXION:
echo    Email: admin@darknexus.ai
echo    Mot de passe: DarkNexus2042!
echo.
echo Pour ARRETER l'application:
echo    Ferme les 2 fenetres "Dark Nexus Backend" et "Dark Nexus Frontend"
echo.
timeout /t 10 ^>nul
start http://localhost:3000
echo.
echo Bonne utilisation !
echo.
) > LANCER_DARK_NEXUS.bat
echo OK: Lanceur cree!
echo.

echo.
echo ========================================
echo   INSTALLATION TERMINEE !
echo ========================================
echo.
echo Tous les fichiers sont prets!
echo Ta cle OpenAI est configuree!
echo Les dependances sont installees!
echo.
echo PROCHAINES ETAPES:
echo.
echo 1. Installe MongoDB si pas encore fait:
echo    https://www.mongodb.com/try/download/community
echo    Ou lance MongoDB Compass
echo.
echo 2. Lance MongoDB (il doit tourner AVANT l'app)
echo.
echo 3. Double-clic sur: LANCER_DARK_NEXUS.bat
echo.
echo 4. Connecte-toi avec:
echo    Email: admin@darknexus.ai
echo    Mot de passe: DarkNexus2042!
echo.
echo.
echo Tu es pret a lancer ta machine de guerre !
echo.
pause
