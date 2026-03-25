#!/bin/bash

echo "========================================"
echo "  ADJ KILLAGAIN IA 2.0 - INSTALLATION"
echo "========================================"
echo ""

echo "[1/6] Vérification des prérequis..."
if ! command -v python3 &> /dev/null; then
    echo "ERREUR: Python 3 n'est pas installé!"
    echo "Installe Python depuis: https://www.python.org/downloads/"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "ERREUR: Node.js n'est pas installé!"
    echo "Installe Node.js depuis: https://nodejs.org/"
    exit 1
fi

echo "[2/6] Configuration du Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

if [ ! -f .env ]; then
    echo "[INFO] Copie du fichier .env.example vers .env"
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Édite backend/.env et ajoute ta clé API!"
    echo ""
fi

cd ..

echo "[3/6] Configuration du Frontend..."
cd frontend
yarn install

if [ ! -f .env ]; then
    echo "[INFO] Copie du fichier .env.example vers .env"
    cp .env.example .env
fi

cd ..

echo ""
echo "========================================"
echo "  INSTALLATION TERMINÉE!"
echo "========================================"
echo ""
echo "PROCHAINES ÉTAPES:"
echo "1. Édite backend/.env avec ta clé API"
echo "2. Démarre MongoDB (mongod)"
echo "3. Lance ./start_backend.sh"
echo "4. Lance ./start_frontend.sh"
echo "5. Ouvre http://localhost:3000"
echo ""
