// Temas. Os 4 básicos (`system`, `light`, `dark`, `contrast`) vêm do CSS (style.css);
// os demais vêm do registro abaixo (themes.js) e são aplicados como variáveis CSS no <html>.
// As fontes são empacotadas (fonts.css): o visual é o mesmo em qualquer sistema.
import { THEME_DEFS, themeVars } from './themes.js'

export { THEME_DEFS }
export const BASIC_THEMES = ['system', 'light', 'dark', 'contrast']
export const THEMES = [...BASIC_THEMES, ...THEME_DEFS.map((d) => d.id)]
const STORAGE = 'ttw.theme'
const byId = Object.fromEntries(THEME_DEFS.map((d) => [d.id, d]))

export function themeDef(id) { return byId[id] ?? null }
export function isDarkTheme(id, prefersDark = false) {
  if (id === 'dark' || id === 'contrast') return true
  if (id === 'system') return prefersDark
  return !!byId[id]?.dark
}

export function initialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE)
    if (THEMES.includes(saved)) return saved
  } catch { /* */ }
  return 'system'
}

let applied = []
export function applyTheme(theme) {
  const root = document.documentElement
  for (const name of applied) root.style.removeProperty(name)
  applied = []
  root.removeAttribute('data-btn')
  root.removeAttribute('data-scheme')
  const def = byId[theme]
  if (!def) {
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  } else {
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-scheme', def.dark ? 'dark' : 'light')
    root.setAttribute('data-btn', def.btn)
    for (const [name, value] of Object.entries(themeVars(def))) {
      root.style.setProperty(name, value)
      applied.push(name)
    }
  }
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
