#!/bin/bash
# ============================================
# MISE À JOUR GITHUB - ADJ KILLAGAIN IA 2.0
# ============================================
# Ce script pousse toute l'app actuelle sur GitHub

echo "========================================="
echo "  MISE À JOUR GITHUB"
echo "========================================="
echo ""

# Demander l'URL du repo
read -p "Entre l'URL de ton repo GitHub : " REPO_URL

# Vérifier si Git est installé
if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé !"
    echo "Installe Git depuis : https://git-scm.com/"
    exit 1
fi

echo "✅ Git trouvé"
echo ""

# Initialiser Git si nécessaire
if [ ! -d ".git" ]; then
    echo "📦 Initialisation du repo Git..."
    git init
    git branch -M main
fi

# Ajouter le remote
echo "🔗 Configuration du remote GitHub..."
git remote remove origin 2>/dev/null
git remote add origin $REPO_URL

# Ajouter tous les fichiers
echo "📝 Ajout de tous les fichiers..."
git add .

# Créer le commit
echo "💾 Création du commit..."
git commit -m "🚀 Update: ADJ KILLAGAIN IA 2.0 - Version complète avec agents IA, conscience temporelle, PWA, scraping" -m "Fonctionnalités ajoutées:
- Générateur d'agents IA autonomes
- Conscience temporelle
- Contrôleur d'agent (sécurité)
- Générateur PWA
- Web Scraper
- Animations avancées
- Création Express avec progression temps réel
- Voice commands
- User memory
- N8N generator
- Installation locale Windows"

# Push vers GitHub (force pour écraser)
echo "🚀 Push vers GitHub..."
git push -u origin main --force

echo ""
echo "========================================="
echo "  ✅ GITHUB MIS À JOUR !"
echo "========================================="
echo ""
echo "Ton repo GitHub est maintenant à jour avec TOUTE la nouvelle app !"
echo ""
echo "Tu peux maintenant :"
echo "  1. Aller sur ton PC"
echo "  2. git clone $REPO_URL"
echo "  3. Lancer INSTALL_WINDOWS.ps1"
echo ""
