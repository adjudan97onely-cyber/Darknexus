# 📚 Guide Complet: Créer un Projet dans Darknexus

## Pourquoi Ce Guide?
Tu veux apprendre à créer les PROCHAINS projets dans Darknexus de manière efficace sans bugs.

---

## ⚡ Processus en 3 Étapes

### ✅ Étape 1: Préparer la Spécification du Projet

**Avant de toucher à l'interface Darknexus**, crée un document MARKDOWN avec:

```markdown
# [Nom du Projet]

## Description
[Description claire et concise - 2-3 paragraphes]

## Fonctionnalités Principales
- Feature 1
- Feature 2
- Feature 3

## Spécifications Techniques
- Frontend: [Stack]
- Backend: [Stack]
- Database: [Type]

## Endpoints API (si applicable)
- GET /api/route1
- POST /api/route2
- etc.

## Modèles de Données
[Structures principales]

## Dépendances
- [liste packages]
```

**Exemple:** Voir `DARKNEXUS_PROJECT_SPEC.md` ✓

---

### ✅ Étape 2: Créer via l'Interface web

#### A. Accéder à Darknexus
```
http://localhost:3000
```

#### B. Cliquer "+ Nouveau Project"
![Nouveau Project Button]

#### C. Remplir le Formulaire

| Champ | Remplir avec |
|-------|-------------|
| **Nom du Projet** | Exact depuis ton spec |
| **Type de Projet** | Application Web |
| **Stack Technique** | Selon ton spec |
| **Modèle IA** | GPT-5.1 (Recommandé) |
| **Description Détaillée** | Tout ton spec complet |

#### D. Configuration Options Importants

**À COCHER:**
- ☑️ Application Web (checked)
- ☑️ Application Mobile (si PWA)

**À REMPLIR:**
- Stack: `React + FastAPI + MongoDB`
- AI Model: `GPT-5.1 (Recommandation)`

**Description:** Copier/coller ton spec markdown complet

---

### ✅ Étape 3: Générer le Code

#### Option A: Via Interface (Recommended)
1. Remplir le formulaire
2. Cliquer **"🔮 Générer le Code"**
3. Attendre la génération (2-10 minutes)
4. Code apparraît dans le projet

#### Option B: Via API (Advanced - si interface fail)
```bash
# 1. Créer projet via API
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d @project_config.json

# 2. Lancer génération
curl -X POST http://localhost:5000/api/projects/{PROJECT_ID}/generate
```

---

## 🚨 Erreurs Courants & Solutions

### ❌ "Error creating project: AideError"

**Causes possibles:**
1. Description trop long ou mal formatée
2. Stack technique non reconnu
3. Backend Darknexus en crash

**Solutions:**
```bash
# 1. Vérifier que Darknexus tourne
curl http://localhost:3000

# 2. Simplifier la description (max 11237 caractères)
# 3. Vérifier le Stack (doit être: "React + FastAPI" ou similaire)
# 4. Redémarrer Darknexus:
cd /path/to/darknexus
npm run dev
```

### ❌ "Project generation timeout"

**Solution:**
- Attendre plus longtemps (10-15 minutes)
- Vérifier la console du backend pour les logs

### ❌ "Cannot connect to localhost:5000"

**Solution:**
```bash
# Vérifier que Darknexus backend tourne
ps aux | grep "server.py"  # Linux/Mac
tasklist | findstr "python"  # Windows

# Si pas actif, redémarrer
python backend/server.py
```

---

## 📋 Checklist: Avant de Générer

- [ ] As-tu vérifié que Darknexus tourne? (`curl localhost:3000`)
- [ ] Ton spec est-il complet et clair?
- [ ] Description < 11237 caractères?
- [ ] Stack tech reconnu? (React, FastAPI, MongoDB, etc)
- [ ] Type de projet sélectionné? (Web App)
- [ ] Modèle IA choisi? (GPT-5.1)

---

## 🎯 Workflow Optimal pour Tes Projets

```
1. SPEC
   └─ Créer document spec.md
   └─ Inclure: description, features, endpoints, models

2. CRÉATION
   └─ Aller sur localhost:3000
   └─ Cliquer "+ Nouveau Project"
   └─ Remplir formulaire avec spec

3. GÉNÉRATION
   └─ Cliquer "Générer le Code"
   └─ Attendre 5-10 minutes
   └─ Voir les fichiers générés

4. VÉRIFICATION
   └─ Télécharger/voir le code
   └─ Vérifier structure
   └─ Tester si ça compile

5. TEST & DEPLOY
   └─ Lancer le projet
   └─ Tester fonctionnalités
   └─ Déployer si OK
```

---

## 📊 Comparaison: Notre Approche vs Darknexus

| Aspect | Notre Approche (Manual) | Darknexus (Generated) |
|--------|------------------------|----------------------|
| **Temps** | 2-3h | 10-20 min |
| **Qualité** | ⭐⭐⭐⭐⭐ (optimisée) | ⭐⭐⭐⭐ (bonne) |
| **Personnalisation** | Total | Modifiée après |
| **Apprendre** | Oui (code expliqué) | Non (black box) |
| **Maintenance** | Plus facile | Dépend de qualité |

---

## 💡 Bonnes Pratiques

### Pour Écrire une Bonne Spec:

✅ **Faire:**
- Être PRÉCIS et DÉTAILLÉ
- Lister TOUS les endpoints
- Décrire les MODÈLES de données
- Inclure les DÉPENDANCES

❌ **NE PAS Faire:**
- Trop vague ("une app de gestion")
- Trop long (>10k caractères)
- Mélanger plusieurs projets
- Oublier les détails techniques

### Exemple de Bonne Description:

```
APPLICATION WEB: Gestionnaire de Tâches Collaboratif

FONCTIONNALITÉS:
- Créer/éditer/supprimer tâches
- Partager avec d'autres utilisateurs
- Assigner des priorités
- Tracker le temps

STACK:
- Frontend: React + Vite
- Backend: FastAPI
- DB: MongoDB
- Auth: JWT

ENDPOINTS:
GET /api/tasks - Lister
POST /api/tasks - Créer
PUT /api/tasks/{id} - Modifier
DELETE /api/tasks/{id} - Supprimer
```

---

## 🔄 Processus Recommandé Pour Tes Projets Futurs

### Projet 1: Analytics App ✅ (On fait ça maintenant)
1. ✅ Spec créée: `DARKNEXUS_PROJECT_SPEC.md`
2. ⏳ À générer avec Darknexus
3. ⏳ À comparer avec notre version manual

### Projet 2+: Autres Projets
1. Écrire une SPEC complète
2. Créer dans Darknexus (10 min via l'interface)
3. Attendre génération (10 min)
4. Télécharger le code

---

## 📞 Template Spec à Réutiliser

```markdown
# [PROJECT_NAME]

## Vue d'Ensemble
[1 paragraph description claire]

## Objectif Principal
[Quel problème ça résout?]

## Fonctionnalités

### Core Features
- [Feature 1]
- [Feature 2]

### Advanced Features
- [Feature 3]

## Stack Technique

**Frontend:**
- Framework: React/Vue/etc
- Build: Vite/Webpack
- Styles: Tailwind/Material-UI
- State: Redux/Context

**Backend:**
- Framework: FastAPI/Express/Django
- Database: MongoDB/PostgreSQL
- Cache: Redis (optional)

**DevOps:**
- Container: Docker
- Deploy: Vercel/Heroku

## API Endpoints

### Users
- `GET /api/users` - Lister
- `POST /api/users` - Créer
- etc.

## Modèles

### User
```json
{
  "id": "string",
  "name": "string",
  "email": "string"
}
```

## Dépendances
- react@18
- fastapi@0.110
- etc.

## Notes
[Contraintes spéciales, considérations]
```

---

## ✨ Prochaine Étape

Maintenant qu'on a:
1. ✅ Notre app "analytics-lottery" créée (référence)
2. ✅ Une spec complète pour Darknexus
3. ✅ Ce guide pour créer d'autres projets

**On va:**
1. Tester notre app analytics-lottery → Voir si ça marche
2. Créer le projet dans Darknexus → Voir ce qu'il génère
3. Comparer les deux → Savoir si Darknexus est bon

Tu ready? 🚀
