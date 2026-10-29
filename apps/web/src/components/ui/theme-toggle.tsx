'use client'

import { useSyncExternalStore } from 'react'

import { applyTheme, THEME_KEY, type ThemeChoice } from '@/lib/theme'

const NEXT: Record<ThemeChoice, ThemeChoice> = { system: 'dark', dark: 'light', light: 'system' }
const LABEL: Record<ThemeChoice, string> = { system: 'Theme: system', dark: 'Theme: dark', light: 'Theme: light' }

const listeners = new Set<() => void>()

function read(): ThemeChoice {
  try {
    return (localStorage.getItem(THEME_KEY) as ThemeChoice) || 'system'
  } catch {
    return 'system'
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, read, () => 'system' as ThemeChoice)

  return (
    <button
      type="button"
      className="px-btn px-btn--ghost px-btn--sm"
      onClick={() => {
        applyTheme(NEXT[choice])
        listeners.forEach((listener) => listener())
      }}
    >
      {LABEL[choice]}
    </button>
  )
}
