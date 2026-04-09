"""Web search service V2 isolated from the legacy web search service."""

from typing import Dict, Any


class WebSearchServiceV2:
    """Minimal V2 search placeholder."""

    async def search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        return {
            "success": True,
            "version": "v2",
            "query": query,
            "num_results": num_results,
            "results": [],
            "source": "web_search_service_v2_placeholder",
        }


web_search_service_v2 = WebSearchServiceV2()
