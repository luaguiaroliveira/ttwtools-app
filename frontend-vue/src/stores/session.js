// Estado global mínimo: projeto aberto, corpus ativo, camada ativa, versão, lista de corpora.
import { defineStore } from 'pinia'
import { api } from '../api/index.js'

const STORAGE = 'ttw.session'

export const useSession = defineStore('session', {
  state: () => ({
    version: null,          // {app, ttwtools, commit}
    projectPath: null,
    project: null,          // /api/project/info
    corpora: [],            // /api/corpora
    corpus: null,           // corpus ativo
    layer: null,            // ferramenta da camada ativa (null = formas)
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
      this.projectPath = health.project
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}')
        if (saved.projectPath === this.projectPath) { this.corpus = saved.corpus; this.layer = saved.layer }
      } catch { /* */ }
      if (this.projectPath) await this.refresh()
    },
    async refresh() {
      const info = await api.project.info()
      this.project = info.open ? info : null
      this.unsaved = Boolean(info.unsaved)
      this.watchUnsaved()
      this.projectPath = info.open ? info.path : null
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
        this.opening = null
      }
      this.corpus = null
      this.layer = null
      await this.refresh()
      if (this.corpora.length === 1) this.corpus = this.corpora[0].name   // um corpus só: já fica ativo
      this.save()
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
    setCorpus(corpus) {
      this.corpus = corpus
      this.layer = null
      this.save()
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
