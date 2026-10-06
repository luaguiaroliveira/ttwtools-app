// Temas. Os 4 básicos (`system`, `light`, `dark`, `contrast`) vêm do CSS (style.css);
// os demais vêm do registro abaixo (themes.js) e são aplicados como variáveis CSS no <html>.
// As fontes são empacotadas (fonts.css): o visual é o mesmo em qualquer sistema.
import { AUTO_LOOK, AXES, FONT_CHOICES, ICON_STYLES, SHAPES, BUTTON_STYLES, THEME_DEFS, paletteVars, resolveLook, shapeFontVars } from './themes.js'

export { THEME_DEFS, AUTO_LOOK, AXES }
export const BASIC_THEMES = ['system', 'light', 'dark', 'contrast']
export const THEMES = [...BASIC_THEMES, ...THEME_DEFS.map((d) => d.id)]
const STORAGE = 'ttw.theme'          // cores (como antes: guarda só o id)
const LOOK_STORAGE = 'ttw.look'      // demais eixos: fonte, cantos, botões, ícones
const byId = Object.fromEntries(THEME_DEFS.map((d) => [d.id, d]))
const VALID = {
  colors: THEMES,
  font: ['auto', ...FONT_CHOICES.map((c) => c.id)],
  shape: ['auto', ...SHAPES.map((c) => c.id)],
  btn: ['auto', ...BUTTON_STYLES],
  icons: ['auto', ...ICON_STYLES],
}

export function themeDef(id) { return byId[id] ?? null }
export function isDarkTheme(id, prefersDark = false) {
  if (id === 'dark' || id === 'contrast') return true
  if (id === 'system') return prefersDark
  return !!byId[id]?.dark
}

export function initialLook() {
  const look = { ...AUTO_LOOK }
  try {
    const saved = JSON.parse(localStorage.getItem(LOOK_STORAGE) || '{}')
    for (const k of AXES.slice(1)) if (VALID[k].includes(saved[k])) look[k] = saved[k]
    const colors = localStorage.getItem(STORAGE)
    if (THEMES.includes(colors)) look.colors = colors
  } catch { /* */ }
  return look
}
export function initialTheme() { return initialLook().colors }

let applied = []
export function applyLook(look) {
  const root = document.documentElement
  for (const name of applied) root.style.removeProperty(name)
  applied = []
  const def = byId[look.colors]
  const r = resolveLook(def, look)
  if (!def) {
    if (look.colors === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', look.colors)
    root.removeAttribute('data-scheme')
  } else {
    root.setAttribute('data-theme', look.colors)
    root.setAttribute('data-scheme', def.dark ? 'dark' : 'light')
  }
  root.setAttribute('data-btn', r.btn)
  root.setAttribute('data-icons', r.icons)
  const vars = { ...(def ? paletteVars(def) : {}), ...shapeFontVars(r) }
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value)
    applied.push(name)
  }
  try {
    localStorage.setItem(STORAGE, look.colors)
    localStorage.setItem(LOOK_STORAGE, JSON.stringify({ font: look.font, shape: look.shape, btn: look.btn, icons: look.icons }))
  } catch { /* */ }
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
