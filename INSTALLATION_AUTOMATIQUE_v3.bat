@echo off
chcp 65001 >nul
color 0A
cls

REM Creation du fichier de log
set LOGFILE=installation_log.txt
echo Installation de Dark Nexus AI 2042 > %LOGFILE%
echo Date: %date% %time% >> %LOGFILE%
echo. >> %LOGFILE%

echo.
echo ========================================
echo   DARK NEXUS AI 2042
echo   INSTALLATION AUTOMATIQUE V3
echo ========================================
echo.
echo Ce script ne se fermera pas automatiquement
echo Tu pourras voir toutes les erreurs
echo Un fichier de log sera cree: installation_log.txt
echo.
echo Appuie sur une touche pour commencer...
pause >nul
cls

echo.
echo [ETAPE 1/7] Verification de Python...
echo [ETAPE 1/7] Verification de Python... >> %LOGFILE%
python --version
if errorlevel 1 (
    echo. >> %LOGFILE%
    echo ERREUR: Python n'est pas installe ou pas dans PATH ! >> %LOGFILE%
    echo.
    echo ==================================================
    echo ERREUR: Python n'est pas installe ou pas dans PATH !
    echo ==================================================
    echo.
    echo Solutions:
    echo 1. Installe Python depuis: https://www.python.org/downloads/
    echo 2. IMPORTANT: Coche "Add Python to PATH" pendant l'installation
    echo 3. Redémarre ton PC après l'installation
    echo.
    echo Appuie sur une touche pour continuer quand meme...
    pause >nul
) else (
    python --version >> %LOGFILE%
    echo OK: Python est installe !
    echo OK: Python est installe ! >> %LOGFILE%
)
echo.
echo Appuie sur une touche pour continuer...
pause >nul

echo.
echo [ETAPE 2/7] Verification de Node.js...
echo [ETAPE 2/7] Verification de Node.js... >> %LOGFILE%
node --version
if errorlevel 1 (
    echo. >> %LOGFILE%
    echo ERREUR: Node.js n'est pas installe ou pas dans PATH ! >> %LOGFILE%
    echo.
    echo ==================================================
    echo ERREUR: Node.js n'est pas installe ou pas dans PATH !
    echo ==================================================
    echo.
    echo Solutions:
    echo 1. Installe Node.js depuis: https://nodejs.org/
    echo 2. Redémarre ton PC après l'installation
    echo.
    echo Appuie sur une touche pour continuer quand meme...
    pause >nul
) else (
    node --version >> %LOGFILE%
    echo OK: Node.js est installe !
    echo OK: Node.js est installe ! >> %LOGFILE%
)
echo.
echo Appuie sur une touche pour continuer...
pause >nul

echo.
echo [ETAPE 3/7] Verification de Yarn...
echo [ETAPE 3/7] Verification de Yarn... >> %LOGFILE%
yarn --version >nul 2>&1
if errorlevel 1 (
    echo Yarn n'est pas installe, installation en cours...
    echo Yarn n'est pas installe, installation en cours... >> %LOGFILE%
    call npm install -g yarn
    if errorlevel 1 (
        echo ATTENTION: Installation de Yarn echouee >> %LOGFILE%
        echo ATTENTION: Installation de Yarn echouee
        echo Mais on continue...
    ) else (
        echo OK: Yarn installe ! >> %LOGFILE%
        echo OK: Yarn installe !
    )
) else (
    yarn --version >> %LOGFILE%
    echo OK: Yarn est deja installe !
    echo OK: Yarn est deja installe ! >> %LOGFILE%
)
echo.
echo Appuie sur une touche pour continuer...
pause >nul

echo.
echo [ETAPE 4/7] Configuration du Backend...
echo [ETAPE 4/7] Configuration du Backend... >> %LOGFILE%

if not exist backend (
    echo ERREUR: Le dossier "backend" n'existe pas !
    echo ERREUR: Le dossier "backend" n'existe pas ! >> %LOGFILE%
    echo.
    echo Es-tu bien dans le bon dossier ?
    echo Le script doit etre lance depuis la racine du projet.
    echo.
    echo Appuie sur une touche pour quitter...
    pause >nul
    exit /b 1
)

cd backend

echo Creation du fichier .env pour le backend...
echo Creation du fichier .env pour le backend... >> ..\%LOGFILE%
(
echo MONGO_URL=mongodb://localhost:27017
echo DB_NAME=dark_nexus_local
echo CORS_ORIGINS=*
echo OPENAI_API_KEY=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
echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
) > .env
echo OK: Fichier backend\.env cree !
echo OK: Fichier backend\.env cree ! >> ..\%LOGFILE%
echo.

echo Installation des dependances Python...
echo Cela peut prendre 2-3 minutes, patience...
echo Installation des dependances Python... >> ..\%LOGFILE%
pip install -r requirements.txt >> ..\%LOGFILE% 2>&1
if errorlevel 1 (
    echo ATTENTION: Certaines dependances Python ont echoue
    echo ATTENTION: Certaines dependances Python ont echoue >> ..\%LOGFILE%
    echo Regarde le fichier installation_log.txt pour plus de details
    echo.
) else (
    echo OK: Dependances Python installees !
    echo OK: Dependances Python installees ! >> ..\%LOGFILE%
)
echo.
echo Appuie sur une touche pour continuer...
pause >nul

cd ..

echo.
echo [ETAPE 5/7] Configuration du Frontend...
echo [ETAPE 5/7] Configuration du Frontend... >> %LOGFILE%

if not exist frontend (
    echo ERREUR: Le dossier "frontend" n'existe pas !
    echo ERREUR: Le dossier "frontend" n'existe pas ! >> %LOGFILE%
    echo.
    echo Es-tu bien dans le bon dossier ?
    echo.
    echo Appuie sur une touche pour quitter...
    pause >nul
    exit /b 1
)

cd frontend

echo Creation du fichier .env pour le frontend...
echo Creation du fichier .env pour le frontend... >> ..\%LOGFILE%
(
echo REACT_APP_BACKEND_URL=http://localhost:8001
echo WDS_SOCKET_PORT=3000
echo ENABLE_HEALTH_CHECK=false
) > .env
echo OK: Fichier frontend\.env cree !
echo OK: Fichier frontend\.env cree ! >> ..\%LOGFILE%
echo.

echo Installation des dependances Node.js...
echo ATTENTION: Cela peut prendre 5-10 minutes !
echo Ne ferme pas la fenetre, laisse faire...
echo.
echo Installation des dependances Node.js... >> ..\%LOGFILE%
call yarn install >> ..\%LOGFILE% 2>&1
if errorlevel 1 (
    echo.
    echo ERREUR: Installation des dependances Node.js echouee !
    echo ERREUR: Installation des dependances Node.js echouee ! >> ..\%LOGFILE%
    echo.
    echo Regarde le fichier installation_log.txt pour plus de details
    echo.
    echo Appuie sur une touche pour continuer quand meme...
    pause >nul
) else (
    echo.
    echo OK: Dependances Node.js installees !
    echo OK: Dependances Node.js installees ! >> ..\%LOGFILE%
)
echo.
echo Appuie sur une touche pour continuer...
pause >nul

cd ..

echo.
echo [ETAPE 6/7] Creation du script d'initialisation...
echo [ETAPE 6/7] Creation du script d'initialisation... >> %LOGFILE%
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
echo OK: Script d'initialisation cree !
echo OK: Script d'initialisation cree ! >> %LOGFILE%
echo.

echo.
echo [ETAPE 7/7] Creation du lanceur automatique...
echo [ETAPE 7/7] Creation du lanceur automatique... >> %LOGFILE%
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
pause
) > LANCER_DARK_NEXUS.bat
echo OK: Lanceur cree !
echo OK: Lanceur cree ! >> %LOGFILE%
echo.

echo.
echo ========================================
echo   INSTALLATION TERMINEE !
echo ========================================
echo.
echo Tous les fichiers sont prets !
echo Ta cle OpenAI est configuree !
echo Les dependances sont installees !
echo.
echo Un fichier de log a ete cree: installation_log.txt
echo Si tu as eu des erreurs, regarde ce fichier.
echo.
echo ========================================
echo   PROCHAINES ETAPES
echo ========================================
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
echo ========================================
echo.
echo Appuie sur une touche pour fermer cette fenetre...
pause >nul
