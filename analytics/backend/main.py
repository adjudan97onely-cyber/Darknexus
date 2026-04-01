"""
Application FastAPI principale pour Analytics Lottery
Migration SQLite complétée
"""
import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging

# Charger les variables d'environnement
load_dotenv()

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Créer l'app FastAPI
app = FastAPI(
    title="Analytics Lottery API",
    description="API pour l'analyse intelligente des loteries et paris sportifs",
    version="1.0.0"
)

# Configuration CORS
ALLOWED_ORIGINS = [
    # Développement local
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    # IP locale (192.168.x.x)
    "http://192.168.1.130:5173",
    "http://192.168.1.130:5001",
    # Production
    "https://analytics-lottery.vercel.app",
    "https://analytics-lottery-frontend.vercel.app",
    # Render (backend lui-même)
    "https://analytics-lottery-backend.onrender.com",
]

# Ajouter les URLs depuis variables d'environnement
if os.getenv("FRONTEND_URL"):
    ALLOWED_ORIGINS.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variables globales
db = None


@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage de l'application"""
    global db
    
    try:
        logger.info("🚀 Démarrage de l'application...")
        
        # Import après le on_event pour éviter les erreurs circulaires
        from config.database import connect_db
        from services.data_service import DataService
        from routes.lotteries import router as lotteries_router
        from routes.sports import router as sports_router
        from routes.dashboard import router as dashboard_router
        
        # Connexion à la base de données
        db = await connect_db()
        logger.info("✅ Connexion à la base de données établie")
        
        # Enregistrer les routes (simples imports, pas des fonctions)
        app.include_router(lotteries_router)
        app.include_router(sports_router)
        app.include_router(dashboard_router)
        
        logger.info("🚀 Application démarrée avec succès sur le port 5001")
    except Exception as e:
        logger.error(f"❌ Erreur au démarrage: {str(e)}", exc_info=True)
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup au fermeture de l'application"""
    global db
    if db:
        from config.database import close_db
        await close_db()
        logger.info("📧 Connexion à la base de données fermée")


@app.get("/")
async def root():
    """Endpoint racine"""
    return {
        "name": "Analytics Lottery API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "lotteries": "/api/lotteries/",
            "sports": "/api/sports/",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Vérification de santé de l'application"""
    try:
        # Vérifier que la DB est accessible
        if db:
            return {
                "status": "healthy",
                "database": "connected",
                "message": "API fonctionnelle"
            }
        else:
            return {
                "status": "degraded",
                "database": "not_connected",
                "message": "Base de données non disponible"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }, 500


# Main
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    logger.info(f"🎯 Démarrage Uvicorn sur port {port}...")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=debug,
        log_level="info"
    )
