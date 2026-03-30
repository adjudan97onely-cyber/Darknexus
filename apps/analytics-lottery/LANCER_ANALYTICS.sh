#!/bin/bash

# ===================================
# Launch Analytics-Lottery (All)
# ===================================

echo ""
echo "╔═════════════════════════════════════════╗"
echo "║    ANALYTICS-LOTTERY (Ligue 1)          ║"
echo "║    Real-time Predictions + Odds         ║"
echo "╚═════════════════════════════════════════╝"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 non trouvé"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trouvé"
    exit 1
fi

echo "✅ Dépendances OK"
echo ""

# Start Backend
echo "Démarrage du backend (port 5000)..."
cd backend
python3 server.py &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Start Frontend
echo "Démarrage du frontend (port 5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "╔═════════════════════════════════════════╗"
echo "║  Application démarrée!                  ║"
echo "║                                         ║"
echo "║  Backend:  http://localhost:5000       ║"
echo "║  Frontend: http://localhost:5173       ║"
echo "║                                         ║"
echo "║  Prédictions Ligue 1 disponibles!      ║"
echo "╚═════════════════════════════════════════╝"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter..."

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
