// Tema: "system" segue prefers-color-scheme; a escolha fica guardada.
export const THEMES = ['system', 'light', 'dark', 'contrast']
const STORAGE = 'ttw.theme'

export function initialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE)
    if (THEMES.includes(saved)) return saved
  } catch { /* */ }
  return 'system'
}

export function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
  try { localStorage.setItem(STORAGE, theme) } catch { /* */ }
}
