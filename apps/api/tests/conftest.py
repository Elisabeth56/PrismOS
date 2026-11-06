"""Test environment: placeholder settings so the app can boot without real credentials."""

import os

TEST_ENV = {
    "APP_ENV": "test",
    "QWEN_API_KEY": "test-key",
    "SUPABASE_URL": "http://localhost:54321",
    "SUPABASE_SERVICE_ROLE_KEY": "test-service-role-key",
}

# set before any app module is imported, since modules read settings at import time
for key, value in TEST_ENV.items():
    os.environ.setdefault(key, value)
