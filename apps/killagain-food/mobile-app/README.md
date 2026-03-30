# Killagain Food - Version mobile sans PC

Objectif: utiliser l'application sur telephone meme quand le PC est eteint.

## Option recommandee (rapide): PWA installee depuis le web

1. Deployer l'application sur Vercel depuis GitHub.
2. Ouvrir l'URL Vercel sur le telephone (Chrome Android ou Safari iOS).
3. Ajouter a l'ecran d'accueil:
   - Android: menu navigateur > Installer l'application
   - iPhone: Partager > Sur l'ecran d'accueil

Resultat:
- Icône comme une vraie application
- Ouverture plein ecran
- Cache offline de base deja actif (service worker)

## Option "APK Android" (vraie app installable)

1. Prendre l'URL de production (Vercel)
2. Aller sur PWABuilder: https://www.pwabuilder.com/
3. Coller l'URL et generer le package Android
4. Telecharger le fichier APK
5. Installer l'APK sur ton telephone

Avantage:
- Installation comme une app Android classique
- Partage simple de l'APK

## Important

Telecharger un ZIP GitHub directement sur mobile ne donne pas une app installable.
Le ZIP est utile pour le code, pas pour l'installation utilisateur finale.
