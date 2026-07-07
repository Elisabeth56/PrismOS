import asyncio
from supabase import create_client
import os

supabase = create_client(os.environ.get("SUPABASE_URL", "http://127.0.0.1:8000"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "dummy"))

async def run():
    res = supabase.table("agent_outputs").select("*").order("created_at", desc=True).limit(5).execute()
    for row in res.data:
        print(f"Agent: {row['agent']}")
        print(row['output'][:500])
        print("-" * 40)

if __name__ == "__main__":
    asyncio.run(run())
