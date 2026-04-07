# CLAUDE.md — KILLAGAIN WAR

## CORRECTIONS CRITIQUES — NE JAMAIS REVENIR EN ARRIERE

### Backend (`warzone/backend/server.py`)

1. **DB hardcodée** : `db = client['zen_hub_pro']` (ligne ~37)
   - NE JAMAIS utiliser `os.environ['DB_NAME']` — ça revert à `warzone_dev`
   - NE JAMAIS modifier cette ligne

2. **SYSTEM_PROMPT fermé** : le `"""` fermant DOIT exister AVANT `@api_router.post("/chat")`
   - Si le `"""` est absent, tout le code Python en dessous est piégé dans la chaîne
   - Ça cause `SyntaxError: unterminated string literal` en cascade

3. **SYSTEM_PROMPT contenu** : doit contenir :
   - Date actuelle, Saison 3, BO7
   - Armes du joueur : MK35 ISR (AR, index 101) + VST (SMG, index 102)
   - Architecture du script V8 Predator
   - Instruction "N'invente JAMAIS de noms d'armes"
   - Instruction "Le rapid fire ne doit JAMAIS s'activer sur les AR"

4. **Limites API Groq gratuit** : 12 000 tokens/minute
   - MAX_TOTAL_CHARS = 35000 pour tout le contexte
   - max_tokens = 6000 pour la réponse
   - Tronquer les messages > 25000 chars (début + fin)
   - Timeout 300s backend + 300000ms frontend

5. **Modèle LLM** : `llama-3.3-70b-versatile` dans `.env`
   - NE PAS utiliser `llama-3.1-8b-instant` (trop petit, crash sur gros scripts)

### Frontend (`warzone/frontend/src/App.js`)

6. **BACKEND_URL hardcodé** : `const BACKEND_URL = 'http://localhost:5003'`
   - NE JAMAIS utiliser `process.env.REACT_APP_BACKEND_URL` — ça cause `TypeError: Failed to construct 'URL': Invalid URL`

7. **sessionId persistant** : utilise `localStorage.getItem('warzone_session_id')`
   - NE JAMAIS utiliser `Date.now()` seul — ça recrée un nouvel ID à chaque rechargement et perd l'historique

8. **Timeout sendMessage** : `{ timeout: 300000 }` (5 min)
   - Sans ça, le navigateur coupe au bout de 30s sur les gros scripts

### Script GPC (`test auto detect setting.gpc`)

9. **MK35 ISR RPM** : `weapon_rpm[101] = 750` (PAS 480)
   - 480 RPM collisionne avec Renetti (484 RPM + RF delay 20ms) et active le rapid fire sur l'AR
   - 750 RPM est à >140 RPM de distance de tout arme RF

10. **index_selection < 102** (PAS < 100)
    - Sinon on ne peut pas sélectionner MK35 ISR (101) ni VST (102)

11. **Vehicle mode = SHARE+LEFT** (PAS PAD+LEFT)
    - PAD+LEFT est déjà utilisé par le Menu SETTINGS
    - SHARE+LEFT ne conflit avec rien
    - `vehicle_mode` est session-only (pas sauvegardé en SPVAR) — normal car on n'est plus en véhicule après redémarrage

12. **Save/Load SPVAR** : l'ordre des `save_spvar` et `read_spvar` doit être IDENTIQUE
    - Les 9 nouveaux toggles MOD+ sont sauvegardés APRÈS `humanisation_actif` et AVANT `arv[0]`
    - Ordre : jumpshot, slidecancel, autosprint, hair_trigger, aim_assist, rapid_fire, rapid_fire_user_off, mode_ultra_aggro, anti_recul
    - NE JAMAIS changer l'ordre — ça corrompt toutes les sauvegardes existantes

13. **`rapid_fire_user_off`** : quand le joueur désactive RF dans MOD+ menu, cette variable empêche l'auto-detect de le réactiver
    - NE PAS supprimer ce guard dans la section auto-detect

## Ports

- Backend Warzone : **5003**
- Frontend Warzone : **3001**
- MongoDB : 27017, DB = `zen_hub_pro`

## Commandes

```bash
# Backend
cd warzone/backend && py server.py

# Frontend
cd warzone/frontend && npm start
```
