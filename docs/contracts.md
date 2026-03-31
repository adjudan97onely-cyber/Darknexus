# Contracts - CodeForge AI

## Vue d'ensemble
Plateforme de génération de code par IA permettant aux utilisateurs de créer des projets illimités sans restrictions de crédits.

## API Contracts

### 1. POST /api/projects
**Description**: Créer un nouveau projet et générer le code via IA

**Request Body**:
```json
{
  "name": "string (required)",
  "description": "string (required, min 20 chars)",
  "type": "string (required)",
  "tech_stack": "string (optional)"
}
```

**Response**: 
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "type": "string",
  "tech_stack": ["string"],
  "status": "in-progress",
  "created_at": "ISO date",
  "code_files": []
}
```

### 2. GET /api/projects
**Description**: Récupérer tous les projets de l'utilisateur

**Response**:
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "type": "string",
    "tech_stack": ["string"],
    "status": "string",
    "created_at": "ISO date",
    "code_files": [...]
  }
]
```

### 3. GET /api/projects/{project_id}
**Description**: Récupérer les détails d'un projet spécifique

**Response**:
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "type": "string",
  "tech_stack": ["string"],
  "status": "string",
  "created_at": "ISO date",
  "code_files": [
    {
      "filename": "string",
      "language": "string",
      "content": "string"
    }
  ]
}
```

### 4. POST /api/projects/{project_id}/generate
**Description**: Générer ou regénérer le code pour un projet

**Response**:
```json
{
  "status": "completed",
  "code_files": [...]
}
```

### 5. DELETE /api/projects/{project_id}
**Description**: Supprimer un projet

**Response**: 204 No Content

## Base de Données - MongoDB Models

### Project Model
```python
{
  "_id": ObjectId,
  "name": str,
  "description": str,
  "type": str,  # web-app, python-script, excel-automation, game-script, ai-app, api
  "tech_stack": List[str],
  "status": str,  # pending, in-progress, completed, error
  "created_at": datetime,
  "updated_at": datetime,
  "code_files": [
    {
      "filename": str,
      "language": str,
      "content": str
    }
  ]
}
```

## Mock Data à Remplacer

### Frontend: /app/frontend/src/mock/mockData.js
- **mockProjects**: Sera remplacé par les appels GET /api/projects
- **projectTypes**: Restera statique (définitions des types)
- **templates**: Restera statique (templates pré-définis)

### Modifications Frontend Nécessaires

1. **CreateProjectPage.jsx**:
   - Remplacer la simulation de génération par l'appel POST /api/projects
   - Afficher un loader pendant la génération
   - Rediriger vers /project/{id} après création

2. **ProjectsPage.jsx**:
   - Remplacer mockProjects par un fetch de GET /api/projects
   - Ajouter un useEffect pour charger les projets au montage

3. **ProjectDetailPage.jsx**:
   - Remplacer la recherche locale par GET /api/projects/{id}
   - Gérer l'état de chargement
   - Gérer les erreurs 404

## Intégration IA

### Prompt System pour Génération de Code

Le système utilisera emergentintegrations avec GPT-5.2 (ou GPT-5.1) pour générer le code.

**Prompt Template**:
```
Tu es un expert développeur qui génère du code de haute qualité.

Type de projet: {type}
Nom: {name}
Description: {description}
Stack technique: {tech_stack or "à choisir"}

Génère le code complet pour ce projet. Réponds UNIQUEMENT au format JSON suivant:
{
  "files": [
    {
      "filename": "nom_du_fichier.ext",
      "language": "python|javascript|etc",
      "content": "contenu du fichier"
    }
  ],
  "tech_stack": ["liste", "des", "technologies"]
}

Assure-toi que le code est:
- Fonctionnel et prêt à l'emploi
- Bien commenté
- Suit les bonnes pratiques
- Complet (pas de TODO ou placeholder)
```

## Implémentation Backend

### Fichiers à Créer/Modifier

1. **/app/backend/models/project.py**: Modèle Pydantic pour Project
2. **/app/backend/services/ai_service.py**: Service pour générer le code via IA
3. **/app/backend/routes/projects.py**: Routes API pour les projets
4. **/app/backend/.env**: Ajouter EMERGENT_LLM_KEY
5. **/app/backend/requirements.txt**: Ajouter emergentintegrations

### Ordre d'Implémentation

1. ✅ Installer emergentintegrations
2. ✅ Ajouter EMERGENT_LLM_KEY au .env
3. ✅ Créer les modèles Pydantic
4. ✅ Créer le service IA
5. ✅ Créer les routes API
6. ✅ Intégrer les routes dans server.py
7. ✅ Tester avec curl
8. ✅ Modifier le frontend pour utiliser les vraies APIs
9. ✅ Tests end-to-end

## Notes Importantes

- La génération de code par IA peut prendre 10-30 secondes selon la complexité
- Implémenter un système de polling ou WebSocket si nécessaire pour le statut
- Limiter la taille des projets générés (max 10 fichiers, max 500 lignes par fichier)
- Gérer les timeouts et erreurs de l'API IA
- Valider les entrées utilisateur côté backend
