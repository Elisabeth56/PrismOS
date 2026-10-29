export type ThemeChoice = 'system' | 'dark' | 'light'
export const THEME_KEY = 'prismos-theme'

/** Runs before first paint (inlined in the root layout) so the page never flashes the wrong theme. */
export const themeScript = `(() => {
  let choice = 'system'
  try { choice = localStorage.getItem('${THEME_KEY}') || 'system' } catch {}
  const light = choice === 'light' || (choice === 'system' && matchMedia('(prefers-color-scheme: light)').matches)
  document.documentElement.dataset.theme = light ? 'light' : 'dark'
})()`

export function applyTheme(choice: ThemeChoice) {
  try {
    localStorage.setItem(THEME_KEY, choice)
  } catch {}
  const light = choice === 'light' || (choice === 'system' && matchMedia('(prefers-color-scheme: light)').matches)
  document.documentElement.dataset.theme = light ? 'light' : 'dark'
}
