"""
WEB SCRAPER SERVICE - Extraction de données depuis n'importe quel site web
Permet d'extraire du texte, des tableaux, des listes, et des données structurées
"""

import logging
import aiohttp
import asyncio
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)


class WebScraper:
    """Service de web scraping pour extraire des données de sites web"""
    
    def __init__(self):
        self.timeout = aiohttp.ClientTimeout(total=30)
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    
    async def scrape_url(self, url: str, extract_type: str = 'all') -> Dict[str, Any]:
        """
        Scrape une URL et extrait les données selon le type demandé
        
        Args:
            url: L'URL à scraper
            extract_type: Type d'extraction ('all', 'text', 'tables', 'links', 'images')
            
        Returns:
            Dict contenant les données extraites
        """
        try:
            logger.info(f"🌐 Scraping URL: {url}")
            
            # Télécharger la page
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url, headers=self.headers) as response:
                    if response.status != 200:
                        raise Exception(f"HTTP Error {response.status}")
                    
                    html = await response.text()
                    logger.info(f"✅ Page téléchargée: {len(html)} caractères")
            
            # Parser avec BeautifulSoup
            soup = BeautifulSoup(html, 'lxml')
            
            # Extraire selon le type
            result = {
                'url': url,
                'title': self._extract_title(soup),
                'status': 'success'
            }
            
            if extract_type in ['all', 'text']:
                result['text'] = self._extract_text(soup)
                result['paragraphs'] = self._extract_paragraphs(soup)
            
            if extract_type in ['all', 'tables']:
                result['tables'] = self._extract_tables(soup)
            
            if extract_type in ['all', 'links']:
                result['links'] = self._extract_links(soup, url)
            
            if extract_type in ['all', 'images']:
                result['images'] = self._extract_images(soup, url)
            
            if extract_type in ['all', 'lists']:
                result['lists'] = self._extract_lists(soup)
            
            logger.info(f"✅ Extraction terminée: {len(result)} types de données")
            return result
            
        except asyncio.TimeoutError:
            logger.error(f"⏱️ Timeout lors du scraping de {url}")
            return {
                'url': url,
                'status': 'error',
                'error': 'Timeout - Le site met trop de temps à répondre'
            }
        except Exception as e:
            logger.error(f"❌ Erreur lors du scraping: {str(e)}")
            return {
                'url': url,
                'status': 'error',
                'error': str(e)
            }
    
    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extrait le titre de la page"""
        title = soup.find('title')
        return title.get_text().strip() if title else 'Sans titre'
    
    def _extract_text(self, soup: BeautifulSoup) -> str:
        """Extrait tout le texte visible de la page"""
        # Supprimer les scripts et styles
        for script in soup(['script', 'style', 'nav', 'header', 'footer']):
            script.decompose()
        
        text = soup.get_text()
        # Nettoyer le texte
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return text[:5000]  # Limiter à 5000 caractères
    
    def _extract_paragraphs(self, soup: BeautifulSoup) -> List[str]:
        """Extrait tous les paragraphes"""
        paragraphs = soup.find_all('p')
        return [p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 20][:20]
    
    def _extract_tables(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extrait tous les tableaux"""
        tables = []
        for table in soup.find_all('table')[:10]:  # Max 10 tableaux
            table_data = {
                'headers': [],
                'rows': []
            }
            
            # Extraire les en-têtes
            headers = table.find_all('th')
            if headers:
                table_data['headers'] = [h.get_text().strip() for h in headers]
            
            # Extraire les lignes
            rows = table.find_all('tr')
            for row in rows[:50]:  # Max 50 lignes
                cells = row.find_all(['td', 'th'])
                if cells:
                    table_data['rows'].append([cell.get_text().strip() for cell in cells])
            
            if table_data['rows']:
                tables.append(table_data)
        
        return tables
    
    def _extract_links(self, soup: BeautifulSoup, base_url: str) -> List[Dict[str, str]]:
        """Extrait tous les liens"""
        links = []
        for link in soup.find_all('a', href=True)[:100]:  # Max 100 liens
            href = link['href']
            text = link.get_text().strip()
            
            # Convertir les liens relatifs en absolus
            if href.startswith('/'):
                from urllib.parse import urljoin
                href = urljoin(base_url, href)
            
            if href.startswith('http') and text:
                links.append({
                    'text': text,
                    'url': href
                })
        
        return links
    
    def _extract_images(self, soup: BeautifulSoup, base_url: str) -> List[Dict[str, str]]:
        """Extrait toutes les images"""
        images = []
        for img in soup.find_all('img', src=True)[:50]:  # Max 50 images
            src = img['src']
            alt = img.get('alt', 'Sans description')
            
            # Convertir les URLs relatives en absolues
            if src.startswith('/'):
                from urllib.parse import urljoin
                src = urljoin(base_url, src)
            
            if src.startswith('http'):
                images.append({
                    'src': src,
                    'alt': alt
                })
        
        return images
    
    def _extract_lists(self, soup: BeautifulSoup) -> Dict[str, List[str]]:
        """Extrait toutes les listes (ul, ol)"""
        result = {
            'unordered': [],
            'ordered': []
        }
        
        # Listes non ordonnées
        for ul in soup.find_all('ul')[:20]:
            items = [li.get_text().strip() for li in ul.find_all('li') if li.get_text().strip()]
            if items:
                result['unordered'].append(items)
        
        # Listes ordonnées
        for ol in soup.find_all('ol')[:20]:
            items = [li.get_text().strip() for li in ol.find_all('li') if li.get_text().strip()]
            if items:
                result['ordered'].append(items)
        
        return result
    
    async def scrape_multiple_urls(self, urls: List[str], extract_type: str = 'text') -> List[Dict[str, Any]]:
        """
        Scrape plusieurs URLs en parallèle
        
        Args:
            urls: Liste des URLs à scraper
            extract_type: Type d'extraction
            
        Returns:
            Liste des résultats pour chaque URL
        """
        tasks = [self.scrape_url(url, extract_type) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Convertir les exceptions en dict d'erreur
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    'url': urls[i],
                    'status': 'error',
                    'error': str(result)
                })
            else:
                processed_results.append(result)
        
        return processed_results


# Instance globale
web_scraper = WebScraper()
