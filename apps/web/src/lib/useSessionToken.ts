// src/lib/useSessionToken.ts
'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'session_token'

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generates or retrieves an anonymous session token from localStorage.
 * Used to tie browser sessions to backend data (X-Session-Token header).
 *
 * Returns the token string once available (empty string during SSR).
 */
export function useSessionToken(): string {
  const [token, setToken] = useState('')

  useEffect(() => {
    let existing = localStorage.getItem(STORAGE_KEY)
    if (!existing) {
      existing = generateUUID()
      localStorage.setItem(STORAGE_KEY, existing)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(existing)
  }, [])

  return token
}

/**
 * Imperative (non-hook) accessor for the session token.
 * Safe to call from api.ts's `request()` helper since it only runs client-side.
 * Returns null during SSR or before the token has been initialised.
 */
export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  let token = localStorage.getItem(STORAGE_KEY)
  if (!token) {
    token = generateUUID()
    localStorage.setItem(STORAGE_KEY, token)
  }
  return token
}
