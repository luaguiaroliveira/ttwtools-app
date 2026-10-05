import { defineStore } from 'pinia'
import { queryColor } from '../utils/dispersion.js'

// Cor de cada etiqueta (por nome), escolhida no seletor de etiquetas do painel lateral. Uma etiqueta
// equivale a uma consulta/camada na Dispersão: a cor escolhida colore os traços no mapa. A escolha é
// persistida; a cor padrão (ainda não escolhida) é estável por etiqueta, derivada do nome.
const KEY = 'ttw.tagColors'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }
const defaultIndex = (tag) => { let h = 0; for (const ch of String(tag)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 8 }

export const useTagColors = defineStore('tagColors', {
  state: () => ({ custom: load() }),
  actions: {
    color(tag) { return this.custom[tag] || queryColor(defaultIndex(tag)) },
    set(tag, hex) { this.custom[tag] = hex; this.persist() },
    reset(tag) { delete this.custom[tag]; this.persist() },
    persist() { try { localStorage.setItem(KEY, JSON.stringify(this.custom)) } catch { /* */ } },
  },
})
