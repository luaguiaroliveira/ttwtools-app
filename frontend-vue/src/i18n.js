// Traduções: textos vêm do pacote (GET /api/i18n/{lang}), chaves planas com pontos
// (ex.: "nav.corpora"). Compilador próprio: só substitui {parâmetro}, sem a sintaxe
// de links e plural do vue-i18n (os textos têm "@" e "|" literais).
import { createI18n } from 'vue-i18n'
import { api } from './api/index.js'

export const LANGS = ['pt', 'en']
// nomes de cada idioma na própria língua (não são traduzidos); novos idiomas entram aqui e em LANGS
export const LANG_NAMES = [{ code: 'pt', name: 'Português' }, { code: 'en', name: 'English' }]
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
  // Público-alvo é brasileiro: português por padrão; o inglês fica em Configurações.
  return 'pt'
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
