# 🎯 Analytics-Lottery - Lancement de l'Application

## Quick Start

### Windows (CMD/PowerShell)
```batch
# Option 1: Lancer tout ensemble (backend + frontend)
LANCER_ANALYTICS.bat

# Option 2: Lancer uniquement le backend
start_backend.bat

# Option 3: Lancer uniquement le frontend
start_frontend.bat
```

### Windows (PowerShell)
```powershell
# Lancer tout ensemble
& ".\LANCER_ANALYTICS.ps1"
```

### Linux/Mac (Bash)
```bash
# Rendre executable
chmod +x LANCER_ANALYTICS.sh

# Lancer tout ensemble
./LANCER_ANALYTICS.sh
```

---

## 📍 URLs Après Lancement

| Composant | URL |
|-----------|-----|
| **Backend** | http://localhost:5000/api |
| **Frontend** | http://localhost:5173 |
| **API Predictions** | http://localhost:5000/api/predictions/with-ia |

---

## ⚙️ Configuration Requise

- Python 3.14+
- Node.js 18+
- npm

### Verify Installation
```bash
python --version
node --version
npm --version
```

---

## 📊 Endpoints Disponibles

### Ligue 1 Predictions
```bash
curl http://localhost:5000/api/predictions/with-ia?league=ligue1
```

### France Predictions
```bash
curl http://localhost:5000/api/predictions/with-ia?country=France
```

### Health Check
```bash
curl http://localhost:5000/api/predictions/enriched/health
```

---

## 📁 Structure

```
analytics-lottery/
├── backend/           # FastAPI server (port 5000)
├── frontend/          # React app (port 5173)  
├── databases/         # TinyDB data storage
├── LANCER_ANALYTICS.bat/.ps1/.sh
├── start_backend.bat/.sh
├── start_frontend.bat/.sh
└── README.md          # This file
```

---

## 🔍 Troubleshooting

### Backend won't start
- Check Python is installed: `python --version`
- Check port 5000 is free: `netstat -an | findstr :5000` (Windows)
- Check .env file has API keys

### Frontend won't start  
- Check Node is installed: `node --version`
- Check npm packages: `npm install`
- Check port 5173 is free

### API returns 0 predictions
- Backend must be running
- API keys configured in `.env`
- Check backend logs for errors

---

## 📝 Notes

- **Real Data**: Uses football-data.org + the-odds-api.com
- **Database**: TinyDB (local JSON storage)
- **AI Model**: Combined signals (team_form + market_odds + trends)
- **Development**: Frontend hot-reload enabled

---

**Status**: ✅ Ready to use | 🚀 Production-ready
