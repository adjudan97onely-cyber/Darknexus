# 🔍 PROMPT POUR EMERGENT - DEBUG LIVE PREVIEW

## CONTEXTE: Projet Darknexus IA - Générateur d'applications web

**Stack Technique:**
- Frontend: React 18.3 + React Router + Axios
- Backend: FastAPI 0.110.1 async
- BD: MongoDB 4.5
- URL locale: http://localhost:3000/project/8326ae3b-4d26-45c5-a174-fa016dbd381b

---

## 🔴 PROBLÈME CRITIQUE: Live Preview affiche une page BLANCHE

### Observations confirmées:
- ✅ Tous les projets générés fonctionnent normalement
- ✅ Endpoint backend `/api/projects/{id}/preview-html` répond avec **status 200**
- ✅ Le HTML retourné est **syntaxiquement valide** et complet (DOCTYPE + head + CSS + body)
- ✅ Le HTML contient un beau design avec gradient violet et données du projet
- ✅ Le React component charge sans erreur
- ❌ **L'iframe affiche absolument RIEN. Complètement blanc.**
- ❌ Ce problème existe sur **TOUS les projets**

---

## 🏗️ ARCHITECTURE DU LIVE PREVIEW

### Frontend Component: `/frontend/src/components/LivePreview.jsx`
```
État principal:
- previewHtml: useState(null) // Contient le HTML brut en string
- isLoading: useState(false)
- deviceMode: useState('desktop')

Rendu critique (ligne ~260):
<iframe
  ref={iframeRef}
  srcDoc={previewHtml}
  title="Live Preview"
  className="w-full h-full border-0"
  sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
/>
```

### Backend Endpoint: `/backend/routes/projects.py`
```
Route: GET /{project_id}/preview-html (ligne 158)

Comportement:
1. Récupère le projet de MongoDB
2. Extrait données sûres (name, description, fichiers, etc)
3. Génère du HTML vanilla COMPLET en template string
4. HTML inclut:
   - DOCTYPE html
   - Head avec charset UTF-8, viewport, style inline complet
   - Body avec gradient CSS et contenu
   - Boutons JavaScript simples (onclick)
5. Retourne HTMLResponse(content=html_preview)

Caractéristiques:
- PAS de React CDN
- PAS d'imports ESM
- PAS de Tailwind CDN
- TOUT est inline (CSS + HTML)
- Escape des caractères dangereux (" ' \)
```

### Flow complet:
```
1. useEffect déclenché au chargement du component
2. Appelle generatePreview()
3. Fetch POST: GET /api/projects/{project_id}/preview-html
4. Response.text() → parse HTML
5. setPreviewHtml(html) → met à jour state
6. React re-render → iframe srcDoc={previewHtml}
7. NORMALEMENT: iframe affiche l'HTML
8. RÉELLEMENT: iframe RESTE BLANC
```

---

## 🔑 INFORMATIONS CRUCIALES POUR LE DEBUG

### Ce qui fonctionne ✅
- Le fetch arrive à bon port (status 200)
- Le HTML est parsé correctement comme string
- Le component state se met à jour (previewHtml !== null)
- Le iframe se rend dans le DOM (visible mais vide)
- Pas d'erreur JavaScript dans la console

### Ce qui ne fonctionne PAS ❌
- Le contenu du HTML n'apparaît pas à l'écran
- L'iframe reste blanc/vide
- Aucun message d'erreur CSP ou sandbox violation

---

## 📂 FICHIERS À VÉRIFIER

### 1. Frontend Component
**Fichier:** `frontend/src/components/LivePreview.jsx`
**Lignes importantes:**
- 13: État previewHtml
- 40-60: Fonction generatePreview()
- 70-120: Fonction generatePreviewClientSide() (fallback)
- 155-170: Fonction refreshPreview() et openInNewTab()
- 255-270: Rendu iframe avec srcDoc

### 2. Backend Endpoint
**Fichier:** `backend/routes/projects.py`
**Lignes importantes:**
- 158: Décorateur @router.get("/{project_id}/preview-html")
- 165-180: Récupération données project
- 185-250: Génération du HTML template
- 390: Return HTMLResponse(content=html_preview)

---

## 🤔 QUESTIONS DE DEBUG

**Qu'est-ce qui pourrait causer un iframe vide même avec srcDoc valide?**

Cherche ces pistes:
1. **srcDoc vs src** - Y a-t-il une confusion entre les deux attributs?
2. **Sandbox restrictions** - Le sandbox `allow-scripts allow-same-origin` bloque-t-il quelque chose?
3. **HTML encoding** - Le HTML a-t-il des caractères mal encodés (UTF-8)?
4. **Caractères spéciaux** - Y a-t-il des backslashes ou quotes non-échappées?
5. **Race conditions** - Est-ce que le state se met à jour APRÈS que React rend?
6. **CSP headers** - Le serveur envoie-t-il des headers Content-Security-Policy restrictifs?
7. **XSS filters** - Certains navigateurs ont des XSS filters qui peuvent bloquer innerHTML dynamique
8. **React key/rendering** - Est-ce que le component key force un re-render du iframe?
9. **HTML vide** - Est-ce que le HTML reçu est réellement vide ou rempli?
10. **Timing** - Y a-t-il un lag entre le fetch et le rendu?

---

## ⚠️ CONTRAINTES

**NE MODIFIE PAS LE CODE** pour l'instant. 

**Juste:**
1. ✅ Analyse le code fourni
2. ✅ Identifie le VRAI problème root cause
3. ✅ Explique clairement ce qui se passe ligne par ligne
4. ✅ Propose une solution spécifique et testée
5. ✅ Donne le code exact à changer ET pourquoi

**Objectif:** Comprendre le problème exactement avant de le fixer.

---

## 📋 CHECKLIST POUR EMERGENT

- [ ] Vérifier que srcDoc accepte du HTML brut (pas seulement des URLs)
- [ ] Vérifier le contenu exact du HTML reçu du backend
- [ ] Tester manuellement srcDoc avec du HTML hardcoded
- [ ] Vérifier si le problème existe aussi avec le fallback (generatePreviewClientSide)
- [ ] Vérifier les headers CORS du backend
- [ ] Vérifier si le charset UTF-8 est présent dans le HTML
- [ ] Tester dans le navigateur console: `document.querySelector('iframe').outerHTML`
- [ ] Vérifier les DevTools Network tab pour voir la réponse complète
