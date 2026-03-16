@echo off
chcp 65001 >nul
color 0A
echo.
echo ========================================
echo   🚀 DARK NEXUS AI 2042 🚀
echo   INSTALLATION AUTOMATIQUE
echo ========================================
echo.
echo 💪 MON POTE, JE VAIS TOUT INSTALLER POUR TOI !
echo.
timeout /t 2 >nul

REM Vérification Python
echo [1/7] 🔍 Vérification de Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERREUR: Python n'est pas installé!
    echo.
    echo 📥 Installe Python depuis: https://www.python.org/downloads/
    echo ⚠️  IMPORTANT: Coche "Add Python to PATH" pendant l'installation!
    echo.
    pause
    exit /b 1
)
echo ✅ Python détecté!
echo.

REM Vérification Node.js
echo [2/7] 🔍 Vérification de Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERREUR: Node.js n'est pas installé!
    echo.
    echo 📥 Installe Node.js depuis: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js détecté!
echo.

REM Vérification Yarn
echo [3/7] 🔍 Vérification de Yarn...
yarn --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Yarn non détecté, installation...
    npm install -g yarn
    if errorlevel 1 (
        echo ❌ Impossible d'installer Yarn!
        pause
        exit /b 1
    )
)
echo ✅ Yarn détecté!
echo.

REM Configuration Backend
echo [4/7] ⚙️  Configuration du Backend...
cd backend

REM Création du fichier .env backend
echo 🔧 Création du fichier .env pour le backend...
(
echo MONGO_URL=mongodb://localhost:27017
echo DB_NAME=dark_nexus_local
echo CORS_ORIGINS=*
echo OPENAI_API_KEY=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
echo JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
) > .env
echo ✅ Fichier backend\.env créé avec ta clé OpenAI!
echo.

REM Installation des dépendances Python
echo 📦 Installation des dépendances Python...
pip install -r requirements.txt
if errorlevel 1 (
    echo ⚠️  Erreur lors de l'installation des dépendances Python
    echo Mais on continue...
)
echo ✅ Dépendances Python installées!
echo.

cd ..

REM Configuration Frontend
echo [5/7] ⚙️  Configuration du Frontend...
cd frontend

REM Création du fichier .env frontend
echo 🔧 Création du fichier .env pour le frontend...
(
echo REACT_APP_BACKEND_URL=http://localhost:8001
echo WDS_SOCKET_PORT=3000
echo ENABLE_HEALTH_CHECK=false
) > .env
echo ✅ Fichier frontend\.env créé!
echo.

REM Installation des dépendances Node
echo 📦 Installation des dépendances Node.js...
echo ⏳ Ça peut prendre 2-3 minutes, patience mon frère...
yarn install
if errorlevel 1 (
    echo ⚠️  Erreur lors de l'installation des dépendances Node
    pause
    exit /b 1
)
echo ✅ Dépendances Node.js installées!
echo.

cd ..

REM Création du script de création d'utilisateur admin
echo [6/7] 👤 Création du script d'initialisation...
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
echo     
echo     # Vérifier si l'admin existe déjà
echo     existing = await db.users.find_one^({"email": "admin@darknexus.ai"}^)
echo     if existing:
echo         print^("✅ Utilisateur admin existe déjà!"^)
echo         return
echo     
echo     # Créer l'utilisateur admin
echo     admin = {
echo         "id": str^(uuid4^(^)^),
echo         "email": "admin@darknexus.ai",
echo         "password_hash": pwd_context.hash^("DarkNexus2042!"^),
echo         "role": "admin"
echo     }
echo     await db.users.insert_one^(admin^)
echo     print^("✅ Utilisateur admin créé avec succès!"^)
echo     print^("📧 Email: admin@darknexus.ai"^)
echo     print^("🔑 Mot de passe: DarkNexus2042!"^)
echo.
echo if __name__ == "__main__":
echo     asyncio.run^(create_admin^(^)^)
) > backend\create_admin.py
echo ✅ Script d'initialisation créé!
echo.

REM Création du lanceur
echo [7/7] 🚀 Création du lanceur automatique...
(
echo @echo off
echo chcp 65001 ^>nul
echo color 0A
echo cls
echo.
echo ========================================
echo   🚀 DARK NEXUS AI 2042 🚀
echo   DÉMARRAGE EN COURS...
echo ========================================
echo.
echo 💪 TA MACHINE DE GUERRE DÉMARRE, MON POTE !
echo.
echo ⚠️  IMPORTANT: Ne ferme pas ces fenêtres !
echo.
timeout /t 3 ^>nul
echo.
echo 🔧 Démarrage du Backend...
start "Dark Nexus Backend" cmd /k "cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 5 ^>nul
echo.
echo 🎨 Démarrage du Frontend...
start "Dark Nexus Frontend" cmd /k "cd frontend && yarn start"
echo.
echo ========================================
echo   ✅ DARK NEXUS AI 2042 LANCÉ !
echo ========================================
echo.
echo 🌐 Ton navigateur va s'ouvrir dans quelques secondes...
echo 📍 URL: http://localhost:3000
echo.
echo 👤 CONNEXION:
echo    Email: admin@darknexus.ai
echo    Mot de passe: DarkNexus2042!
echo.
echo ⚠️  Pour ARRÊTER l'application:
echo    Ferme les 2 fenêtres "Dark Nexus Backend" et "Dark Nexus Frontend"
echo.
timeout /t 10 ^>nul
start http://localhost:3000
echo.
echo 🔥 BONNE UTILISATION, CHAMPION ! 💪
echo.
) > LANCER_DARK_NEXUS.bat
echo ✅ Lanceur créé!
echo.

echo.
echo ========================================
echo   🎉 INSTALLATION TERMINÉE ! 🎉
echo ========================================
echo.
echo ✅ Tous les fichiers sont prêts!
echo ✅ Ta clé OpenAI est configurée!
echo ✅ Les dépendances sont installées!
echo.
echo 📋 PROCHAINES ÉTAPES:
echo.
echo 1️⃣  Installe MongoDB si pas encore fait:
echo    📥 https://www.mongodb.com/try/download/community
echo    ⚠️  Ou lance MongoDB Compass
echo.
echo 2️⃣  Lance MongoDB (il doit tourner AVANT l'app)
echo.
echo 3️⃣  Double-clic sur: LANCER_DARK_NEXUS.bat
echo.
echo 4️⃣  Connecte-toi avec:
echo    📧 Email: admin@darknexus.ai
echo    🔑 Mot de passe: DarkNexus2042!
echo.
echo.
echo 💪 T'ES PRÊT À LANCER TA MACHINE DE GUERRE ! 🔥
echo.
pause
