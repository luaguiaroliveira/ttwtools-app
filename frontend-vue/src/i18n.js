// Traduções: textos vêm do pacote (GET /api/i18n/{lang}), chaves planas com pontos
// (ex.: "nav.corpora"). Compilador próprio: só substitui {parâmetro}, sem a sintaxe
// de links e plural do vue-i18n (os textos têm "@" e "|" literais).
import { createI18n } from 'vue-i18n'
import { api } from './api/index.js'

export const LANGS = ['pt', 'en']
const STORAGE = 'ttw.lang'

function compile(message) {
  return (ctx) => message.replace(/\{(\w+)\}/g, (_, k) => {
    const v = ctx.named?.(k)
    return v === undefined || v === null ? `{${k}}` : String(v)
  })
}

export const i18n = createI18n({
  legacy: false,
  locale: 'pt',
  fallbackLocale: 'en',
  messages: { pt: {}, en: {} },
  messageResolver: (obj, path) => obj?.[path] ?? null,
  messageCompiler: compile,
  missingWarn: false,
  fallbackWarn: false,
})

export function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE)
    if (LANGS.includes(saved)) return saved
  } catch { /* sem armazenamento */ }
  const nav = (globalThis.navigator?.language || 'pt').slice(0, 2)
  return LANGS.includes(nav) ? nav : 'pt'
}

export async function setLang(lang) {
  if (!LANGS.includes(lang)) lang = 'pt'
  const load = async (l) => {
    if (!Object.keys(i18n.global.getLocaleMessage(l)).length) i18n.global.setLocaleMessage(l, await api.i18n(l))
  }
  await Promise.all([load(lang), load('en')])
  i18n.global.locale.value = lang
  document.documentElement.lang = lang
  try { localStorage.setItem(STORAGE, lang) } catch { /* ignora */ }
}
