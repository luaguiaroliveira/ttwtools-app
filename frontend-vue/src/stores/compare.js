import { defineStore } from 'pinia'
import { api } from '../api/index.js'

const KEY = 'ttw.compare'
const DEFAULT_COLORS = ['#c2500c', '#3b3936']        // os mesmos --chart-1 e --chart-2 do tema claro
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }

// A comparação vale para todas as ferramentas de Comparar (KFA, Palavras-chave, Faixas, Laboratório): qual é o
// corpus 2 (ou dois grupos do mesmo corpus), a métrica da KFA e a cor de cada lado nos gráficos.
export const useCompare = defineStore('compare', {
  state: () => {
    const saved = load()
    return {
      corpus2: '',              // nome do corpus 2, ou '__groups__' = dois grupos do corpus ativo
      groupKey: '', group1: '', group2: '',
      groups: [],               // valores do metadado escolhido (para os seletores de grupo)
      metric: saved.metric === 'wkfa' || saved.metric === 'kfa2' ? 'wkfa' : 'kfa',   // 'kfa2' = nome antigo de 'wkfa'
      colors: Array.isArray(saved.colors) && saved.colors.length === 2 ? saved.colors : [...DEFAULT_COLORS],
    }
  },
  getters: {
    sameCorpus: (s) => s.corpus2 === '__groups__',
    // css com as cores dos lados: as variáveis do tema que os gráficos já usam (classes fill-chart-N e var(--chart-N))
    cssVars: (s) => ({ '--chart-1': s.colors[0], '--chart-2': s.colors[1], '--color-chart-1': s.colors[0], '--color-chart-2': s.colors[1] }),
  },
  actions: {
    persist() { try { localStorage.setItem(KEY, JSON.stringify({ metric: this.metric, colors: this.colors })) } catch { /* */ } },
    setColor(i, v) { this.colors[i] = v; this.persist() },
    resetColors() { this.colors = [...DEFAULT_COLORS]; this.persist() },
    setMetric(m) { this.metric = m; this.persist() },
    // mantém o corpus 2 válido quando o corpus ativo ou a lista de corpora muda
    ensure(corpus, corpora, metadataKeys) {
      const others = corpora.filter((c) => c.name !== corpus).map((c) => c.name)
      const ok = this.corpus2 === '__groups__' ? metadataKeys.length > 0 : others.includes(this.corpus2)
      if (!ok) this.corpus2 = others[0] ?? (metadataKeys.length ? '__groups__' : '')
      if (this.corpus2 === '__groups__' && !metadataKeys.includes(this.groupKey)) this.groupKey = metadataKeys[0] ?? ''
    },
    async loadGroups(corpus) {
      this.groups = this.groupKey ? [...new Set((await api.corpora.documents(corpus, { limit: 1000 })).rows.map((r) => r[this.groupKey]))] : []
      if (!this.groups.includes(this.group1)) this.group1 = this.groups[0] ?? ''
      if (!this.groups.includes(this.group2)) this.group2 = this.groups[1] ?? this.groups[0] ?? ''
    },
    // os dois lados no formato que as rotas pedem: { corpus, where, label }
    sides(corpus) {
      if (this.sameCorpus) {
        return [1, 2].map((n) => ({ corpus, where: { [this.groupKey]: [this[`group${n}`]] }, label: `${this.groupKey}=${this[`group${n}`]}` }))
      }
      return [{ corpus, where: undefined, label: corpus }, { corpus: this.corpus2, where: undefined, label: this.corpus2 }]
    },
  },
})
