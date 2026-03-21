# Release Notes - 2026-03-21

## Resume
Cette release consolide la base produit de Killagain Food avec une phase complete de stabilisation + hardening runtime.
Objectif atteint: application plus fiable, coherente apres refresh/changement de role, et prete pour utilisation reelle.

## Commits inclus
- `ec34530` - stabilization and production hardening
- `07a1461` - feat: transform app into unlimited AI nutrition coach
- `a894b40` - chore: initialize standalone Killagain Food project

## Points majeurs

### 1. Stabilisation qualite
- Correction des erreurs ESLint et nettoyage des imports inutilises.
- Correction des dependances `useEffect` / `useMemo` sur les zones critiques.
- Validation complete:
  - `npm run lint`: OK
  - `npm run build`: OK

### 2. Robustesse runtime (production hardening)
- Ajout d'une couche de fiabilisation du storage: `src/services/runtimeStateService.js`.
- Nettoyage des anciennes cles legacy `killagain-food:*` non reconnues.
- Normalisation des donnees persistees pour eviter les etats incoherents:
  - profil utilisateur
  - memoire utilisateur
  - tracking nutrition
  - contenu admin
  - images recettes
  - favoris
- Gestion propre du changement de role avec preparation runtime avant reload.
- Meilleure resilience de l'acces localStorage (lecture/ecriture protegee).

### 3. Coherence metier apres refresh
- Etat applicatif rehydrate sur une base assainie.
- Restrictions de role appliquees de maniere plus fiable apres reload.
- Alignement du role par defaut en mode `free`.

## Verification fonctionnelle ciblee
- Changement de role: coherent apres reload.
- Scan ingredients: stable et aligne avec limites de role.
- Recommandations: recalcul coherent apres changement de contexte.
- Planner semaine: persistance du tracking nettoyee et bornee.

## Impact
- Pas de nouvelle feature dans cette phase.
- Focus strict sur robustesse, coherence runtime, et reduction des regressions.

## Notes de deploiement
- Compatible avec le workflow actuel (`main`).
- Aucun pre-requis supplementaire pour build/lint.
- Recommande de faire un test manuel smoke rapide post-deploiement:
  - Home -> Scanner -> Recettes -> Regime -> Favoris -> Admin(local)
  - refresh navigateur
  - bascule de role (free/premium/admin en local)
