// Validated environment for the web app. Only browser-safe NEXT_PUBLIC_ values live here.
import { z } from 'zod'

const isProduction = process.env.NODE_ENV === 'production'

// required in production builds; local defaults match `pnpm db:start` and `pnpm dev`
const withLocalDefault = (fallback: string) => (isProduction ? z.string().min(1) : z.string().min(1).default(fallback))

const publicSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: withLocalDefault('http://127.0.0.1:8000/api/v1').pipe(z.string().url()),
  NEXT_PUBLIC_SUPABASE_URL: withLocalDefault('http://127.0.0.1:54321').pipe(z.string().url()),
  // the publishable (anon) key; safe in the browser because RLS decides what it can read
  NEXT_PUBLIC_SUPABASE_ANON_KEY: withLocalDefault('local-anon-key'),
  // the GitHub App's URL name, for the "Install the GitHub App" link
  NEXT_PUBLIC_GITHUB_APP_SLUG: z.string().min(1).default('prismos-app'),
})

// Next inlines NEXT_PUBLIC_ values at build time, so each one is read by its full name
const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
  NEXT_PUBLIC_GITHUB_APP_SLUG: process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || undefined,
})

if (!parsed.success) {
  const names = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')
  throw new Error(`Invalid or missing environment variables: ${names}. See apps/web/.env.example.`)
}

export const env = parsed.data
