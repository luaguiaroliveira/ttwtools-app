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

// Densidade da interface: "comfortable" (padrão) ou "compact" (mais linhas por tela).
export const DENSITIES = ['comfortable', 'compact']
const DENSITY_STORAGE = 'ttw.density'

export function initialDensity() {
  try {
    const saved = localStorage.getItem(DENSITY_STORAGE)
    if (DENSITIES.includes(saved)) return saved
  } catch { /* */ }
  return 'comfortable'
}

export function applyDensity(density) {
  const root = document.documentElement
  if (density === 'compact') root.setAttribute('data-density', 'compact')
  else root.removeAttribute('data-density')
  try { localStorage.setItem(DENSITY_STORAGE, density) } catch { /* */ }
}
