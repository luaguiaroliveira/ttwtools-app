// Estado da tela Escrita, guardado fora do componente: o texto (colado ou arquivo) e os
// resultados sobrevivem à navegação (ex.: "ver no corpus" abre o KWIC e volta).
import { defineStore } from 'pinia'
import { api } from '../api/index.js'

const STORAGE = 'ttw.writing'

function b64encode(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export const useWriting = defineStore('writing', {
  state: () => ({
    mode: 'words',                       // words | patterns
    text: '',
    file: null,                          // {name, content_b64}
    reference: '',
    f: { unit: 'form', n: 2, measure: 'log_ratio', min_freq: 2, correction: 'fdr', top: 100, field: 'upos', pn: 3 },
    words: null,
    patterns: null,
    colloc: null,
    examples: null,
    error: null,
    busy: false,
  }),
  getters: {
    data: (s) => (s.mode === 'patterns' ? s.patterns : s.words),
    hasText: (s) => Boolean(s.text.trim() || s.file),
  },
  actions: {
    /** Guarda só o que é pequeno (referência e opções) para a próxima visita. */
    savePrefs() {
      try {
        localStorage.setItem(STORAGE, JSON.stringify({ reference: this.reference, f: this.f, mode: this.mode }))
      } catch { /* */ }
      try {                                   // o texto (colado) sobrevive até a recarga
        sessionStorage.setItem(`${STORAGE}.text`, this.text)
      } catch { /* */ }
    },
    loadPrefs() {
      try {
        const s = JSON.parse(localStorage.getItem(STORAGE) || '{}')
        if (s.reference) this.reference = s.reference
        if (s.f) this.f = { ...this.f, ...s.f }
        if (s.mode) this.mode = s.mode
      } catch { /* */ }
      try {
        const txt = sessionStorage.getItem(`${STORAGE}.text`)
        if (txt && !this.text) this.text = txt
      } catch { /* */ }
    },
    src() {
      return this.file
        ? { filename: this.file.name, content_b64: this.file.content_b64 }
        : { filename: 'texto_colado.txt', content_b64: b64encode(this.text) }
    },
    clearResults() {
      this.words = this.patterns = null
      this.colloc = null
      this.examples = null
      this.error = null
    },
    async run(lang) {
      if (!this.hasText || !this.reference) return
      this.clearResults()
      this.busy = true
      try {
        const src = this.src()
        if (this.mode === 'patterns') {
          this.patterns = await api.writing.patterns({ ...src, reference: this.reference, lang,
            field: this.f.field, n: this.f.pn, measure: this.f.measure, min_freq: this.f.min_freq,
            correction: this.f.correction, top: this.f.top })
        } else {
          this.words = await api.writing.analyze({ ...src, reference: this.reference, lang,
            unit: this.f.unit, n: this.f.n, measure: this.f.measure, min_freq: this.f.min_freq,
            correction: this.f.correction, top: this.f.top })
        }
      } catch (err) { this.error = err.message } finally { this.busy = false }
    },
    async showCollocates(node) {
      if (!this.hasText) return
      this.error = null
      try {
        this.colloc = await api.writing.collocates({ ...this.src(), reference: this.reference, node })
        this.examples = null
      } catch (err) { this.error = err.message }
    },
    async showExamples(item, kind) {
      if (!this.hasText) return
      this.error = null
      try {
        this.examples = await api.writing.examples({ ...this.src(), reference: this.reference, item, kind,
          field: this.f.field, n: this.f.pn })
      } catch (err) { this.error = err.message }
    },
  },
})
