// Validated environment for the web app. Only browser-safe NEXT_PUBLIC_ values live here;
// server-only secrets get their own module when the app needs them (#5).
import { z } from 'zod'

const isProduction = process.env.NODE_ENV === 'production'

const publicSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: isProduction
    ? z.string().url()
    : z.string().url().default('http://127.0.0.1:8000/api/v1'),
})

// Next inlines NEXT_PUBLIC_ values at build time, so each one is read by its full name
const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || undefined,
})

if (!parsed.success) {
  const names = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')
  throw new Error(`Invalid or missing environment variables: ${names}. See apps/web/.env.example.`)
}

export const env = parsed.data
