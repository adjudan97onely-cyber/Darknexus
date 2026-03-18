#!/usr/bin/env python3
"""
Script pour créer et générer le projet "Analyseur Multi-Loteries" dans Darknexus
Usage: python create_darknexus_project.py
"""

import requests
import json
import time
import sys

# Configuration
DARKNEXUS_API = "http://localhost:5000"
PROJECT_SPEC = {
    "name": "Analyseur Intelligent Multi-Loteries & Paris Sportifs",
    "description": """Application d'analyse statistique intelligente pour loteries (Kéno, Euromillions, Loto) et prédictions de matchs de football.

FONCTIONNALITÉS PRINCIPALES:
- Analyse statistique de fréquences de numéros
- Détection automatique d'anomalies (numéros chauds/froids)
- Recommandations intelligentes avec scores de confiance
- Génération de grilles de jeu optimisées
- Prédictions de matchs de football
- Dashboard interactif avec 5+ pages
- Graphiques en temps réel avec Recharts

ALGORITHMES IMPLÉMENTÉS:
1. Analyse Loteries (LotteryAnalyzer):
   - calculate_frequency(): Pourcentage apparition par numéro
   - calculate_mean_appearance(): Moyenne théorique
   - detect_anomalies(): Hot/Cold numbers via Z-score
   - calculate_time_since_appearance(): Tirages depuis dernière apparition
   - generate_score(): Pondération (40% freq + 30% absence + 30% récence)
   - analyze_balance(): Distribution pair/impair et bas/haut
   - chi_square_test(): Normalité distribution

2. Analyse Sports (SportsAnalyzer):
   - calculate_form(): Score forme équipe (matchs récents)
   - calculate_goal_probability(): Poisson pour Over/Under 2.5
   - generate_prediction(): Prédiction multi-facteurs

SPÉCIFICATIONS TECHNIQUES:
- Frontend: React 18.3 + React Router 7.5 + Vite 5 + Recharts + Tailwind CSS
- Backend: FastAPI 0.110.1 + Uvicorn + Motor (MongoDB async)
- Database: MongoDB (adj_killagain_db) avec collections: draws, analysis, recommendations, matches, predictions
- Dépendances: numpy, scipy pour calculs statistiques

API ENDPOINTS (19 total):
LOTERIES:
- GET /api/lotteries/analyze/{type} - Analyse complète
- GET /api/lotteries/statistics/{type} - Stats globales
- GET /api/lotteries/recommendations/{type}?top_n=10 - Recommandations
- GET /api/lotteries/grids/{type}?num_grids=5 - Grilles générées
- GET /api/lotteries/{keno|euromillions|loto}/analysis - Alias

SPORTS:
- GET /api/sports/matches - Matchs prochains
- GET /api/sports/matches/{home}/vs/{away}/prediction - Prédiction match
- POST /api/sports/matches/predict - Batch prédictions
- GET /api/sports/team/{team}/form - Forme équipe
- GET /api/sports/statistics - Stats globales
- GET /api/sports/recommendations - Recommandations
- GET /api/sports/football/analysis - Analyse complète

PAGES FRONTEND:
- Dashboard: Vue d'ensemble (5 onglets: Overview, Keno, Euro, Loto, Sports)
- KenoAnalyzer: Analyse détaillée Kéno avec graphiques
- EuroMillionsAnalyzer: Analyse Euromillions
- LotoAnalyzer: Analyse Loto avec visualisations
- SportsAnalyzer: Prédictions football avec probabilités

DONNÉES SAMPLE:
- 100 tirages par loterie (généré auto au démarrage)
- 50 matchs simulés
- Tous les calculs et prédictions fonctionnels immédiatement

Le code doit être production-ready avec gestion d'erreurs robuste.""",
    "type": "Application Web",
    "techStack": "React + FastAPI + MongoDB",
    "generatePWA": False,
    "modelAI": "GPT-5.1 (Recommandation)"
}

def log(msg, status="ℹ️"):
    """Affiche un message formaté"""
    print(f"{status} {msg}")

def check_connection():
    """Vérifie la connexion avec Darknexus"""
    try:
        resp = requests.get(f"{DARKNEXUS_API}/health", timeout=5)
        if resp.status_code == 200:
            log("Connexion à Darknexus établie", "✅")
            return True
    except Exception as e:
        log(f"Impossible de se connecter à {DARKNEXUS_API}: {e}", "❌")
        return False

def create_project():
    """Crée le projet dans Darknexus"""
    try:
        log("Création du projet...", "🔨")
        
        response = requests.post(
            f"{DARKNEXUS_API}/api/projects",
            json=PROJECT_SPEC,
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            project_data = response.json()
            project_id = project_data.get("id") or project_data.get("_id")
            log(f"Projet créé avec succès! ID: {project_id}", "✅")
            return project_id
        else:
            log(f"Erreur création (code {response.status_code}): {response.text}", "❌")
            return None
    except Exception as e:
        log(f"Erreur lors de la création: {e}", "❌")
        return None

def generate_code(project_id):
    """Lance la génération du code"""
    try:
        log("Lancement de la génération du code...", "🚀")
        
        response = requests.post(
            f"{DARKNEXUS_API}/api/projects/{project_id}/generate",
            timeout=60
        )
        
        if response.status_code in [200, 201, 202]:
            log("Génération lancée!", "✅")
            return True
        else:
            log(f"Erreur génération (code {response.status_code}): {response.text}", "❌")
            return False
    except Exception as e:
        log(f"Erreur lors de la génération: {e}", "❌")
        return False

def get_project_status(project_id):
    """Récupère le statut du projet"""
    try:
        response = requests.get(
            f"{DARKNEXUS_API}/api/projects/{project_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            status = data.get("status", "unknown")
            generated = data.get("generated", False)
            code_files = len(data.get("code_files", []))
            
            return {
                "status": status,
                "generated": generated,
                "files_count": code_files
            }
    except Exception as e:
        log(f"Erreur statut: {e}", "⚠️")
    
    return None

def monitor_generation(project_id, max_wait=120):
    """Monitore la génération du projet"""
    log(f"Monitoring génération (max {max_wait}s)...", "⏱️")
    
    start = time.time()
    while time.time() - start < max_wait:
        status = get_project_status(project_id)
        
        if status:
            if status["generated"]:
                log(f"✅ Génération complète! {status['files_count']} fichiers créés", "🎉")
                return True
            else:
                elapsed = int(time.time() - start)
                log(f"En cours... ({elapsed}s) - Status: {status['status']}", "⏳")
        
        time.sleep(5)
    
    log("Timeout atteint", "⚠️")
    return False

def main():
    """Workflow principal"""
    print("\n" + "="*60)
    print("🎰 DARKNEXUS PROJECT GENERATOR")
    print("Analyseur Intelligent Multi-Loteries & Paris Sportifs")
    print("="*60 + "\n")
    
    # 1. Vérifier connexion
    if not check_connection():
        log("Assurez-vous que Darknexus tourne sur localhost:5000", "📍")
        return False
    
    # 2. Créer projet
    project_id = create_project()
    if not project_id:
        return False
    
    time.sleep(2)
    
    # 3. Générer code
    if not generate_code(project_id):
        return False
    
    # 4. Monitorer
    success = monitor_generation(project_id)
    
    if success:
        log(f"\n📊 Projet disponible: http://localhost:3000/projects/{project_id}", "🌐")
        print("\n" + "="*60)
        print("✅ SUCCÈS!")
        print("="*60 + "\n")
        return True
    else:
        log("\n⚠️ Génération peut-être incomplète, vérifiez le statut", "🔴")
        log(f"URL: http://localhost:3000/projects/{project_id}", "🌐")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
