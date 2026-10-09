// Estado global mínimo: projeto aberto, corpus ativo, camada ativa, versão, lista de corpora.
import { defineStore } from 'pinia'
import { api } from '../api/index.js'
import { clearExploreCache } from '../api/cache.js'

const STORAGE = 'ttw.session'

export const useSession = defineStore('session', {
  state: () => ({
    version: null,          // {app, ttwtools, commit}
    projectPath: null,
    project: null,          // /api/project/info
    corpora: [],            // /api/corpora
    corpus: null,           // corpus ativo
    layer: null,            // ferramenta da camada ativa (null = automática, ver `loadLayers`)
    layers: [],             // camadas do corpus ativo (/api/corpora/{c}/layers)
    opening: null,          // progresso ao abrir um arquivo compactado ou antigo
    unsaved: false,         // arquivo compactado com alterações ainda não gravadas
  }),
  getters: {
    hasProject: (s) => Boolean(s.projectPath),
    activeCorpus: (s) => s.corpora.find((c) => c.name === s.corpus) || null,
  },
  actions: {
    async load() {
      const [version, health] = await Promise.all([api.version(), api.health()])
      this.version = version
      if (health.project) {
        // `health.project` é a cópia de trabalho (arquivo compactado): muda a cada
        // abertura, então não serve para identificar o projeto. `refresh()` traz o
        // caminho estável (`display_path`) antes de tentar restaurar o corpus salvo.
        await this.refresh()
        this.restoreSaved()
        await this.loadLayers()
        this.preferExtendedMfte()
      }
    },
    async refresh() {
      clearExploreCache()                 // projeto, camadas ou corpora podem ter mudado
      const info = await api.project.info()
      this.project = info.open ? info : null
      this.unsaved = Boolean(info.unsaved)
      this.watchUnsaved()
      this.projectPath = info.open ? info.display_path : null
      this.corpora = info.open ? (await api.corpora.list()).corpora : []
      if (this.corpus && !this.corpora.some((c) => c.name === this.corpus)) this.setCorpus(null)
    },
    async openProject(path) {
      const r = await api.project.open(path)
      if (['decompressing', 'migrating'].includes(r?.status)) {   // .ttwt ou projeto antigo: tarefa com progresso
        this.opening = { status: 'running' }
        for (;;) {
          const job = await api.jobs.get(r.job_id)
          this.opening = job
          if (!['queued', 'running'].includes(job.status)) break
          await new Promise((res) => setTimeout(res, 300))
        }
        if (this.opening.status === 'cancelled') { this.opening = null; return }
        if (this.opening.status !== 'done') throw new Error(this.opening.error || 'erro ao abrir')
        this.opening = { id: r.job_id, status: 'running', stage: 'finish', done: 0, total: 0 }   // ainda lendo o projeto para a tela
      }
      try {
        this.corpus = null
        this.layer = null
        await this.refresh()
        if (!this.restoreSaved() && this.corpora.length === 1) this.corpus = this.corpora[0].name   // um corpus só: já fica ativo
        await this.loadLayers()
        this.preferExtendedMfte()
        this.save()
      } finally {
        this.opening = null
      }
    },
    /** Camadas do corpus ativo (para o seletor no cabeçalho e na tela Etiquetagem);
     * esquece a camada escolhida se ela não existir mais (corpus trocado, camada removida). */
    async loadLayers() {
      this.layers = this.corpus ? (await api.corpora.layers(this.corpus)).layers : []
      if (this.layer && !this.layers.some((l) => l.tool === this.layer)) this.layer = null
    },
    /** Ao abrir um arquivo: sem camada escolhida e com camada MFTE estendida, ela vira a ativa. A estendida é a
     * ferramenta `mfte_ext` (projetos migrados do formato antigo) ou `mfte` com `config.extended` (camadas novas).
     * Só na abertura: depois o usuário pode voltar para "automática". */
    preferExtendedMfte() {
      if (this.layer) return
      if (this.layers.some((l) => l.tool === 'mfte_ext')) this.layer = 'mfte_ext'
      else if (this.layers.some((l) => l.tool === 'mfte' && l.config?.extended)) this.layer = 'mfte'
    },
    /** Corpus/camada guardados para este mesmo projeto (por `display_path`), se ainda existirem. */
    restoreSaved() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}')
        if (saved.projectPath === this.projectPath && saved.corpus
            && this.corpora.some((c) => c.name === saved.corpus)) {
          this.corpus = saved.corpus
          this.layer = saved.layer
          return true
        }
      } catch { /* */ }
      return false
    },
    async createProject(path, overwrite = false) {
      await api.project.create(path, overwrite)
      await this.openProject(path)
    },
    /** Arquivo pedido pelo sistema (duplo clique, --open): abre se houver. */
    async checkPendingOpen() {
      const { path } = await api.project.pendingOpen()
      if (path) await this.openProject(path)
    },
    /** Consulta leve a cada 3 s enquanto o arquivo está compactado (aviso "não salvo"). */
    watchUnsaved() {
      clearInterval(this._unsavedTimer)
      if (!this.project?.compressed) { this.unsaved = false; return }
      this._unsavedTimer = setInterval(async () => {
        try { this.unsaved = (await api.project.unsaved()).unsaved } catch { /* */ }
      }, 3000)
    },
    /** Troca o corpus ativo (projeto com vários corpora: é a primeira escolha depois de abrir); a camada volta
     * a "automática" ou, havendo MFTE estendido, a ele. Devolve a promessa do carregamento das camadas. */
    setCorpus(corpus) {
      this.corpus = corpus
      this.layer = null
      this.save()
      return this.loadLayers().then(() => { this.preferExtendedMfte(); this.save() })
    },
    setLayer(layer) {
      this.layer = layer
      this.save()
    },
    save() {
      try { localStorage.setItem(STORAGE, JSON.stringify({ projectPath: this.projectPath, corpus: this.corpus, layer: this.layer })) } catch { /* */ }
    },
  },
})
