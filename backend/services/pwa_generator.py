"""
SERVICE DE GÉNÉRATION PWA (Progressive Web App)
Génère tous les fichiers nécessaires pour transformer une application web en PWA installable
"""

import os
import json
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class PWAGenerator:
    """Générateur de fichiers PWA pour créer des applications mobiles installables"""
    
    def __init__(self):
        pass
    
    def generate_pwa_files(self, project_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Génère tous les fichiers nécessaires pour une PWA
        
        Args:
            project_data: Données du projet (name, description, etc.)
            
        Returns:
            Liste de fichiers générés (manifest.json, service-worker.js, etc.)
        """
        try:
            name = project_data.get('name', 'My PWA App')
            description = project_data.get('description', 'A Progressive Web App')
            theme_color = project_data.get('theme_color', '#6366f1')
            background_color = project_data.get('background_color', '#0f172a')
            
            pwa_files = []
            
            # 1. Générer manifest.json (dans public/ pour structure Vite)
            manifest = self._generate_manifest(name, description, theme_color, background_color)
            pwa_files.append({
                'filename': 'public/manifest.json',
                'language': 'json',
                'content': json.dumps(manifest, indent=2)
            })
            
            # 2. Générer service-worker.js (dans public/ pour accès direct)
            service_worker = self._generate_service_worker(name)
            pwa_files.append({
                'filename': 'public/service-worker.js',
                'language': 'javascript',
                'content': service_worker
            })
            
            # 3. Générer le fichier d'enregistrement du service worker
            sw_register = self._generate_sw_register()
            pwa_files.append({
                'filename': 'src/registerServiceWorker.js',
                'language': 'javascript',
                'content': sw_register
            })
            
            # 4. Générer index.html COMPLET avec PWA meta tags
            html_full = self._generate_pwa_index_html(name, description, theme_color)
            pwa_files.append({
                'filename': 'index.html',
                'language': 'html',
                'content': html_full
            })
            
            # 5. Générer icônes placeholder (instructions)
            icons_instructions = self._generate_icons_instructions()
            pwa_files.append({
                'filename': 'public/ICONS_README.txt',
                'language': 'text',
                'content': icons_instructions
            })
            
            # 6. Instructions d'installation PWA
            instructions = self._generate_installation_instructions(name)
            pwa_files.append({
                'filename': 'PWA_INSTALLATION.md',
                'language': 'markdown',
                'content': instructions
            })
            
            logger.info(f"✅ Generated {len(pwa_files)} PWA files for project: {name}")
            return pwa_files
            
        except Exception as e:
            logger.error(f"Error generating PWA files: {str(e)}")
            raise
    
    def _generate_manifest(self, name: str, description: str, theme_color: str, background_color: str) -> Dict[str, Any]:
        """Génère le fichier manifest.json"""
        return {
            "short_name": name[:12],
            "name": name,
            "description": description,
            "icons": [
                {
                    "src": "/icon-192x192.png",
                    "type": "image/png",
                    "sizes": "192x192",
                    "purpose": "any maskable"
                },
                {
                    "src": "/icon-512x512.png",
                    "type": "image/png",
                    "sizes": "512x512",
                    "purpose": "any maskable"
                }
            ],
            "start_url": "/",
            "display": "standalone",
            "theme_color": theme_color,
            "background_color": background_color,
            "orientation": "portrait-primary",
            "scope": "/",
            "prefer_related_applications": False
        }
    
    def _generate_service_worker(self, app_name: str) -> str:
        """Génère le service worker pour le cache et le mode hors ligne"""
        return f"""/* Service Worker pour {app_name} */
const CACHE_NAME = '{app_name.lower().replace(' ', '-')}-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// Installation du service worker
self.addEventListener('install', (event) => {{
  console.log('[SW] Installation du service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {{
        console.log('[SW] Cache ouvert');
        return cache.addAll(urlsToCache);
      }})
  );
}});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {{
  console.log('[SW] Activation du service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {{
      return Promise.all(
        cacheNames.map((cacheName) => {{
          if (cacheName !== CACHE_NAME) {{
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }}
        }})
      );
    }})
  );
}});

// Stratégie: Cache First, puis Network
self.addEventListener('fetch', (event) => {{
  event.respondWith(
    caches.match(event.request)
      .then((response) => {{
        // Si trouvé dans le cache, retourner
        if (response) {{
          console.log('[SW] Fichier trouvé dans le cache:', event.request.url);
          return response;
        }}
        
        // Sinon, faire la requête réseau
        console.log('[SW] Fichier demandé au réseau:', event.request.url);
        return fetch(event.request).then((response) => {{
          // Vérifier si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {{
            return response;
          }}
          
          // Cloner la réponse et la mettre en cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {{
              cache.put(event.request, responseToCache);
            }});
          
          return response;
        }});
      }}
    )
  );
}});
"""
    
    def _generate_sw_register(self) -> str:
        """Génère le fichier pour enregistrer le service worker"""
        return """/* Enregistrement du Service Worker */

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('✅ Service Worker enregistré avec succès:', registration);
          
          // Vérifier les mises à jour toutes les heures
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error('❌ Erreur lors de l\\'enregistrement du Service Worker:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
"""
    
    def _generate_html_head(self, name: str, description: str, theme_color: str) -> str:
        """Génère les meta tags à ajouter dans le <head> du HTML"""
        return f"""<!-- À ajouter dans le <head> de votre index.html -->

<!-- Meta tags PWA -->
<meta name="application-name" content="{name}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="{name}">
<meta name="description" content="{description}">
<meta name="format-detection" content="telephone=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="{theme_color}">

<!-- Liens PWA -->
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png">
<link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.png">

<!-- Splash screens iOS (optionnel) -->
<link rel="apple-touch-startup-image" href="/splash-screen.png">
"""
    
    def _generate_pwa_index_html(self, name: str, description: str, theme_color: str) -> str:
        """Génère un index.html COMPLET avec toutes les meta tags PWA"""
        return f"""<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Meta tags PWA -->
    <meta name="application-name" content="{name}">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="{name}">
    <meta name="description" content="{description}">
    <meta name="format-detection" content="telephone=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="{theme_color}">
    
    <!-- Liens PWA -->
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png">
    <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png">
    <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.png">
    
    <title>{name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
"""
    
    def _generate_icons_instructions(self) -> str:
        """Instructions pour créer les icônes PWA"""
        return """📱 ICÔNES PWA REQUISES

Placez les fichiers suivants dans le dossier public/:

1. icon-192x192.png (192x192 pixels)
2. icon-512x512.png (512x512 pixels)

Générateurs d'icônes en ligne:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/
- https://favicon.io/

Astuce: Utilisez un logo carré avec fond uni pour un meilleur rendu.
"""
    
    def _generate_installation_instructions(self, name: str) -> str:
        """Génère les instructions d'installation de la PWA"""
        return f"""# 📱 Installation de {name} (PWA)

## ✅ Votre application est maintenant installable !

### Installation sur Android (Chrome/Edge)

1. Ouvrez l'application dans Chrome ou Edge
2. Cliquez sur le menu (⋮) en haut à droite
3. Sélectionnez **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**
4. Confirmez l'installation
5. L'icône apparaîtra sur votre écran d'accueil ! 🎉

### Installation sur iOS (Safari)

1. Ouvrez l'application dans Safari
2. Cliquez sur le bouton **Partager** (⬆️) en bas de l'écran
3. Faites défiler et sélectionnez **"Sur l'écran d'accueil"**
4. Donnez un nom à l'application
5. Cliquez sur **"Ajouter"**
6. L'icône apparaîtra sur votre écran d'accueil ! 🎉

### Installation sur PC (Chrome/Edge)

1. Ouvrez l'application dans Chrome ou Edge
2. Regardez dans la barre d'URL, une icône d'installation apparaîtra (⊕)
3. Cliquez sur cette icône
4. Confirmez l'installation
5. L'application s'ouvrira dans sa propre fenêtre ! 🎉

---

## 🎨 Personnalisation des Icônes

Pour personnaliser les icônes de votre PWA :

1. Créez deux images PNG :
   - **icon-192x192.png** (192x192 pixels)
   - **icon-512x512.png** (512x512 pixels)

2. Placez-les dans le dossier `public/` de votre application

3. Redéployez l'application

**Astuce** : Utilisez un générateur d'icônes PWA en ligne :
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

---

## 🚀 Fonctionnalités PWA Activées

✅ **Installation sur mobile et desktop**
✅ **Mode plein écran** (sans barre d'URL)
✅ **Cache intelligent** (chargement rapide)
✅ **Fonctionne hors ligne** (après première visite)
✅ **Mises à jour automatiques**

---

## 🔧 Intégration dans votre code React

Ajoutez ceci dans votre `src/index.js` :

```javascript
import {{ register }} from './registerServiceWorker';

// ... votre code existant ...

// Enregistrer le service worker
register();
```

---

## 📝 Notes Importantes

- **HTTPS requis** : Les PWA nécessitent HTTPS (sauf localhost)
- **Icônes** : Créez vos icônes aux bonnes dimensions
- **Test** : Testez sur un vrai appareil mobile pour la meilleure expérience
- **Lighthouse** : Utilisez l'outil Lighthouse de Chrome pour vérifier votre score PWA

---

## 🎉 Félicitations !

Votre application est maintenant une **Progressive Web App** complète !

Vos utilisateurs peuvent l'installer comme une vraie application native. 🚀
"""


# Instance globale
pwa_generator = PWAGenerator()
