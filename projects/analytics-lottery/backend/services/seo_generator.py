"""
SERVICE SEO AUTOMATIQUE (NIVEAU E5)
Génère automatiquement les meta tags, sitemap, robots.txt pour SEO optimal
"""

import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


class SEOGenerator:
    """Générateur de SEO automatique"""
    
    def generate_meta_tags(self, project_data: Dict[str, Any]) -> str:
        """
        Génère les meta tags HTML pour SEO
        
        Returns:
            HTML des meta tags à insérer dans <head>
        """
        project_name = project_data.get('name', 'Mon App')
        description = project_data.get('description', 'Application générée avec ADJ KILLAGAIN IA 2.0')
        
        # Nettoyer la description (max 160 caractères pour SEO)
        description_clean = description.replace('\n', ' ')[:160]
        
        meta_tags = f'''<!-- Meta Tags SEO (Auto-généré par ADJ KILLAGAIN IA 2.0) -->
<meta name="description" content="{description_clean}">
<meta name="keywords" content="{project_name}, app, web application">
<meta name="author" content="ADJ KILLAGAIN IA 2.0">
<meta name="robots" content="index, follow">

<!-- Open Graph (Facebook, LinkedIn) -->
<meta property="og:type" content="website">
<meta property="og:title" content="{project_name}">
<meta property="og:description" content="{description_clean}">
<meta property="og:site_name" content="{project_name}">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{project_name}">
<meta name="twitter:description" content="{description_clean}">

<!-- Mobile Optimization -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
<meta name="theme-color" content="#3b82f6">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="{project_name}">

<!-- Performance -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://fonts.googleapis.com">'''
        
        return meta_tags
    
    def generate_robots_txt(self, project_name: str) -> str:
        """Génère le fichier robots.txt"""
        return f'''# robots.txt - {project_name}
# Auto-généré par ADJ KILLAGAIN IA 2.0

User-agent: *
Allow: /

# Sitemap
Sitemap: /sitemap.xml

# Performance
Crawl-delay: 1
'''
    
    def generate_sitemap_xml(self, project_name: str, base_url: str = 'https://example.com') -> str:
        """Génère le sitemap.xml"""
        today = datetime.utcnow().strftime('%Y-%m-%d')
        
        return f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{base_url}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>'''
    
    def generate_manifest_json_enhanced(self, project_data: Dict[str, Any]) -> str:
        """Génère un manifest.json enrichi pour PWA + SEO"""
        project_name = project_data.get('name', 'Mon App')
        description = project_data.get('description', 'Application générée avec ADJ KILLAGAIN IA 2.0')
        
        manifest = {
            "name": project_name,
            "short_name": project_name[:12],
            "description": description[:140],
            "start_url": "/",
            "display": "standalone",
            "background_color": "#ffffff",
            "theme_color": "#3b82f6",
            "orientation": "portrait-primary",
            "categories": ["productivity", "utilities"],
            "icons": [
                {
                    "src": "/icon-192.png",
                    "sizes": "192x192",
                    "type": "image/png",
                    "purpose": "any maskable"
                },
                {
                    "src": "/icon-512.png",
                    "sizes": "512x512",
                    "type": "image/png",
                    "purpose": "any maskable"
                }
            ],
            "screenshots": [
                {
                    "src": "/screenshot-mobile.png",
                    "sizes": "540x720",
                    "type": "image/png",
                    "form_factor": "narrow"
                },
                {
                    "src": "/screenshot-desktop.png",
                    "sizes": "1280x720",
                    "type": "image/png",
                    "form_factor": "wide"
                }
            ]
        }
        
        import json
        return json.dumps(manifest, indent=2)
    
    def inject_seo_in_html(self, html_content: str, project_data: Dict[str, Any]) -> str:
        """
        Injecte les meta tags SEO dans le fichier HTML existant
        
        Returns:
            HTML modifié avec SEO intégré
        """
        meta_tags = self.generate_meta_tags(project_data)
        
        # Trouver la position de </head> et insérer avant
        if '</head>' in html_content:
            html_content = html_content.replace(
                '</head>',
                f'\n    {meta_tags}\n  </head>'
            )
        
        logger.info("✅ Meta tags SEO injectés dans index.html")
        return html_content
    
    def generate_structured_data(self, project_data: Dict[str, Any]) -> str:
        """
        Génère les données structurées JSON-LD pour SEO
        
        Returns:
            Script JSON-LD à insérer dans <head>
        """
        project_name = project_data.get('name', 'Mon App')
        description = project_data.get('description', 'Application')
        
        structured_data = {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": project_name,
            "description": description[:160],
            "applicationCategory": "WebApplication",
            "operatingSystem": "Any",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            }
        }
        
        import json
        json_ld = json.dumps(structured_data, indent=2)
        
        return f'''<script type="application/ld+json">
{json_ld}
</script>'''
    
    def enhance_project_with_seo(self, files: List[Dict[str, Any]], project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Améliore un projet avec SEO automatique
        
        Returns:
            Fichiers avec SEO intégré
        """
        enhanced_files = []
        seo_files_added = []
        
        for file in files:
            if file['filename'] == 'index.html':
                # Injecter SEO dans index.html
                enhanced_content = self.inject_seo_in_html(file['content'], project_data)
                enhanced_files.append({
                    **file,
                    'content': enhanced_content
                })
                seo_files_added.append('Meta tags SEO dans index.html')
            else:
                enhanced_files.append(file)
        
        # Ajouter robots.txt
        enhanced_files.append({
            'filename': 'public/robots.txt',
            'language': 'text',
            'content': self.generate_robots_txt(project_data.get('name', 'App'))
        })
        seo_files_added.append('robots.txt')
        
        # Ajouter sitemap.xml
        enhanced_files.append({
            'filename': 'public/sitemap.xml',
            'language': 'xml',
            'content': self.generate_sitemap_xml(project_data.get('name', 'App'))
        })
        seo_files_added.append('sitemap.xml')
        
        logger.info(f"✅ SEO ajouté: {', '.join(seo_files_added)}")
        
        return enhanced_files


# Instance globale
seo_generator = SEOGenerator()
