/** Where to go after sign-in: a same-site path only. "//evil.com" and "/\evil.com" are other sites to a browser. */
export function safeNext(next: string | null | undefined, fallback = '/runs/new'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}
