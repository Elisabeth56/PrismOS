import { createBrowserClient } from '@supabase/ssr'

import { env } from '@/lib/env'

/** Supabase client for client components; reads the session from cookies set by the server. */
export function createClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
