# Killagain Food

Application PWA cuisine + nutrition, pensee pour les debutants et les amateurs de cuisine antillaise.

## Vision produit

- Scanner IA d'ingredients (mode mock intelligent)
- Recommandations recettes creoles selon le frigo
- Fiches recettes ultra detaillees (etapes, conseils, erreurs a eviter)
- Assistant IA pedagogique
- Onglet regime intelligent (objectif poids + plan repas)
- Favoris sauvegardes localement
- Section marque createur avec liens Instagram

## Stack technique

- React 18
- Vite 5
- Tailwind CSS
- vite-plugin-pwa (offline + installable)
- Architecture modulaire: `components`, `hooks`, `services`, `pages`, `data`

## Installation

```bash
cd killagain-food
npm install
npm run dev
```

Application: `http://127.0.0.1:5180`

## Lancement ultra simple (Windows)

Double-cliquer sur `start-app.bat`

Le script:

1. installe les dependances si necessaire,
2. lance le serveur dev,
3. ouvre le navigateur automatiquement.

## Test sur mobile (meme Wi-Fi)

1. Double-cliquer sur `start-mobile.bat`
2. Le script affiche l'adresse du type `http://IP_DU_PC:5180`
3. Ouvrir cette adresse sur ton telephone (meme reseau Wi-Fi)

Exemple: `http://192.168.1.25:5180`

## Dossier mobile-app

Le dossier [mobile-app](mobile-app) contient les guides et scripts mobile:

1. [Guide principal](mobile-app/README.md)
2. [Workflow mobile](mobile-app/workflow-mobile.md)
3. [Preview production mobile](mobile-app/start-mobile-production.bat)

## Build production

```bash
npm run build
npm run preview
```

## Deploiement Vercel

Le fichier `vercel.json` est inclus (fallback SPA).

## Structure

```text
killagain-food/
	public/
		icons/
	src/
		components/
		hooks/
		services/
		data/
		pages/
```

## Suggestions d'amelioration

1. Brancher une vraie API vision (ex: OpenAI Vision ou Roboflow) pour remplacer le scanner mock.
2. Ajouter auth cloud + synchro favoris multi-appareils.
3. Ajouter planning hebdo complet avec suivi calories/macro journalier.
4. Integrer notifications push PWA (rappel hydratation et prep repas).
