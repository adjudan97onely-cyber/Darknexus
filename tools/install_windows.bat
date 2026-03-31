@echo off
echo ========================================
echo   ADJ KILLAGAIN IA 2.0 - INSTALLATION
echo ========================================
echo.

echo [1/6] Verification des pre-requis...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Python n'est pas installe!
    echo Installe Python depuis: https://www.python.org/downloads/
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Node.js n'est pas installe!
    echo Installe Node.js depuis: https://nodejs.org/
    pause
    exit /b 1
)

echo [2/6] Configuration du Backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt

if not exist .env (
    echo [INFO] Copie du fichier .env.example vers .env
    copy .env.example .env
    echo.
    echo IMPORTANT: Edite backend\.env et ajoute ta cle API!
    echo.
)

cd ..

echo [3/6] Configuration du Frontend...
cd frontend
call yarn install

if not exist .env (
    echo [INFO] Copie du fichier .env.example vers .env
    copy .env.example .env
)

cd ..

echo.
echo ========================================
echo   INSTALLATION TERMINEE!
echo ========================================
echo.
echo PROCHAINES ETAPES:
echo 1. Edite backend\.env avec ta cle API
echo 2. Demarre MongoDB (mongod)
echo 3. Lance start_backend.bat
echo 4. Lance start_frontend.bat
echo 5. Ouvre http://localhost:3000
echo.
pause
