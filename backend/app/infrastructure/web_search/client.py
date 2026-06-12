"""Web search adapter with mock mode for dev/tests."""

from app.core.config import get_settings
from app.domain.models import ExternalCitation


class WebSearchClient:
    async def search(self, merchant_id: str, country: str) -> list[ExternalCitation]:
        settings = get_settings()
        if settings.web_search_mock:
            return [
                ExternalCitation(
                    url=f"https://security.example.com/alerts/{merchant_id}",
                    summary=f"Recent fraud alert associated with merchant {merchant_id} in {country}",
                )
            ]
        # Real Tavily/Bing integration would go here
        return []
