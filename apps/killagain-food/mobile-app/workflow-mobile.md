# Workflow mobile recommandé

## Boucle de test

1. Dev rapide PC + mobile (meme Wi-Fi):
   - lancer start-mobile.bat
2. Test quasi production mobile:
   - lancer mobile-app/start-mobile-production.bat
3. Si ok:
   - push GitHub
   - deploy Vercel
4. Installation finale sur mobile:
   - ouvrir URL Vercel
   - Installer l'application (PWA)

## Pourquoi ce workflow

- Test rapide pendant les modifications
- Validation proche production avant publication
- App utilisable sans PC une fois deployee
