# backend/storage/oss.py
"""
Alibaba OSS client for artefact storage.

Bucket: prismos-artefacts
Key pattern: sessions/{session_id}/package.json

Used to persist the final package JSON after a run completes.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

import oss2

from config import get_settings

logger = logging.getLogger("prismos.storage")

_bucket: Optional[oss2.Bucket] = None


def _get_bucket() -> oss2.Bucket:
    """Return a cached OSS bucket instance."""
    global _bucket
    if _bucket is None:
        settings = get_settings()
        if not settings.OSS_ACCESS_KEY_ID:
            raise RuntimeError("OSS credentials not configured")
        auth = oss2.Auth(settings.OSS_ACCESS_KEY_ID, settings.OSS_ACCESS_KEY_SECRET)
        _bucket = oss2.Bucket(auth, settings.OSS_ENDPOINT, settings.OSS_BUCKET)
        logger.info("OSS bucket initialised: %s", settings.OSS_BUCKET)
    return _bucket


async def upload_package(
    session_id: str,
    package: Dict[str, Any],
) -> str:
    """
    Upload the final package JSON to OSS.

    Returns the OSS object URL.
    """
    key = f"sessions/{session_id}/package.json"
    content = json.dumps(package, ensure_ascii=False, indent=2)

    try:
        bucket = _get_bucket()
        bucket.put_object(key, content.encode("utf-8"))
        url = f"https://{get_settings().OSS_BUCKET}.{get_settings().OSS_ENDPOINT.replace('https://', '')}/{key}"
        logger.info("Package uploaded: %s", key)
        return url
    except RuntimeError:
        logger.warning("OSS not configured — skipping upload")
        return ""
    except Exception as e:
        logger.error("OSS upload failed: %s", e)
        return ""


async def download_package(session_id: str) -> Optional[Dict[str, Any]]:
    """Download and parse a package JSON from OSS."""
    key = f"sessions/{session_id}/package.json"
    try:
        bucket = _get_bucket()
        result = bucket.get_object(key)
        content = result.read().decode("utf-8")
        return json.loads(content)
    except Exception as e:
        logger.error("OSS download failed: %s", e)
        return None
