# backend/context_ingestion/url_crawler.py
"""
Crawl a product URL for stack hints.

Does a simple GET request and extracts technology signals from:
  - HTML meta tags
  - Script/link src attributes
  - Response headers (X-Powered-By, Server)
  - Common framework fingerprints

Target: < 2s. No JavaScript execution.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List

import httpx

logger = logging.getLogger("prismos.context.crawler")

# Framework detection patterns in HTML source
FRAMEWORK_SIGNALS = {
    "Next.js": [r"_next/", r"__next", r"next/dist"],
    "React": [r"react\.production", r"reactDOM", r"__REACT"],
    "Vue.js": [r"vue\.js", r"__vue", r"v-cloak"],
    "Angular": [r"ng-version", r"angular\.js", r"ng-app"],
    "Svelte": [r"svelte", r"__svelte"],
    "Nuxt": [r"__nuxt", r"nuxt\.js"],
    "Remix": [r"remix", r"__remix"],
    "Laravel": [r"laravel", r"csrf-token"],
    "Rails": [r"csrf-token.*authenticity", r"rails-ujs"],
    "Django": [r"csrfmiddlewaretoken", r"django"],
    "WordPress": [r"wp-content", r"wp-includes"],
    "Tailwind CSS": [r"tailwindcss", r"tw-"],
    "Bootstrap": [r"bootstrap\.min", r"bootstrap\.css"],
}


async def crawl_url(product_url: str) -> Dict[str, Any]:
    """
    Crawl a product URL and extract technology signals.

    Returns:
      - url: the crawled URL
      - status: HTTP status code
      - detected_tech: list of detected technologies
      - headers_info: relevant response headers
      - meta_tags: extracted meta descriptions/titles
    """
    result: Dict[str, Any] = {
        "url": product_url,
        "status": None,
        "detected_tech": [],
        "headers_info": {},
        "meta_tags": {},
    }

    try:
        async with httpx.AsyncClient(
            timeout=5.0,
            follow_redirects=True,
            headers={"User-Agent": "PrismOS/1.0 ContextCrawler"},
        ) as client:
            resp = await client.get(product_url)
            result["status"] = resp.status_code

            if resp.status_code != 200:
                return result

            # Extract relevant headers
            for header in ["X-Powered-By", "Server", "X-Frame-Options"]:
                if header in resp.headers:
                    result["headers_info"][header] = resp.headers[header]

            # Scan HTML for framework signals
            html = resp.text[:50000]  # cap at 50KB
            detected: List[str] = []
            for tech, patterns in FRAMEWORK_SIGNALS.items():
                for pattern in patterns:
                    if re.search(pattern, html, re.IGNORECASE):
                        detected.append(tech)
                        break
            result["detected_tech"] = detected

            # Extract meta tags
            title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE)
            if title_match:
                result["meta_tags"]["title"] = title_match.group(1).strip()[:200]

            desc_match = re.search(
                r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']',
                html, re.IGNORECASE,
            )
            if desc_match:
                result["meta_tags"]["description"] = desc_match.group(1).strip()[:300]

    except Exception as e:
        logger.warning("URL crawl failed for %s: %s", product_url, e)
        result["error"] = str(e)

    logger.info(
        "URL crawl: %s — status=%s, detected=%s",
        product_url, result["status"], result["detected_tech"],
    )
    return result
