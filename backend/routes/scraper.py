"""
ROUTES WEB SCRAPING
API pour scraper des sites web et extraire des données
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from services.web_scraper import web_scraper
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scraper", tags=["web-scraping"])


class ScrapeRequest(BaseModel):
    url: str
    extract_type: Optional[str] = 'all'  # 'all', 'text', 'tables', 'links', 'images', 'lists'


class MultipleScrapeRequest(BaseModel):
    urls: List[str]
    extract_type: Optional[str] = 'text'


@router.post("/scrape")
async def scrape_single_url(request: ScrapeRequest):
    """
    Scrape une seule URL et extrait les données
    
    **Types d'extraction disponibles:**
    - `all`: Tout extraire (texte, tableaux, liens, images, listes)
    - `text`: Texte et paragraphes uniquement
    - `tables`: Tableaux uniquement
    - `links`: Liens uniquement
    - `images`: Images uniquement
    - `lists`: Listes (ul, ol) uniquement
    
    **Exemple:**
    ```json
    {
        "url": "https://example.com",
        "extract_type": "tables"
    }
    ```
    """
    try:
        logger.info(f"📥 Requête de scraping pour: {request.url}")
        result = await web_scraper.scrape_url(request.url, request.extract_type)
        
        if result.get('status') == 'error':
            raise HTTPException(status_code=400, detail=result.get('error', 'Erreur inconnue'))
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Erreur API scraping: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scrape-multiple")
async def scrape_multiple_urls(request: MultipleScrapeRequest):
    """
    Scrape plusieurs URLs en parallèle
    
    **Limite:** Maximum 10 URLs par requête
    
    **Exemple:**
    ```json
    {
        "urls": [
            "https://example.com/page1",
            "https://example.com/page2"
        ],
        "extract_type": "text"
    }
    ```
    """
    try:
        if len(request.urls) > 10:
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 URLs par requête"
            )
        
        logger.info(f"📥 Requête de scraping multiple: {len(request.urls)} URLs")
        results = await web_scraper.scrape_multiple_urls(request.urls, request.extract_type)
        
        return {
            'total': len(results),
            'success': len([r for r in results if r.get('status') == 'success']),
            'errors': len([r for r in results if r.get('status') == 'error']),
            'results': results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur API scraping multiple: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test")
async def test_scraper():
    """
    Teste le scraper avec une page simple
    """
    try:
        result = await web_scraper.scrape_url("https://example.com", "text")
        return {
            'status': 'success',
            'message': 'Le scraper fonctionne correctement !',
            'test_result': result
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Le scraper a rencontré une erreur: {str(e)}'
        }
