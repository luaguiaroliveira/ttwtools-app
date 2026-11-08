import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../api/index.js', () => ({
  api: {
    version: vi.fn(),
    health: vi.fn(),
    project: { info: vi.fn(), open: vi.fn(), unsaved: vi.fn() },
    corpora: { list: vi.fn(), layers: vi.fn() },
    jobs: { get: vi.fn() },
  },
}))
import { api } from '../api/index.js'
import { useSession } from '../stores/session.js'

const CORPORA = [{ name: 'a', documents: 1, layers: [] }, { name: 'b', documents: 1, layers: [] }]

// Arquivo compactado: cada abertura usa uma cópia de trabalho num diretório temporário
// diferente (`path`); só `display_path` (o arquivo original) é estável entre aberturas.
function infoFor(workPath) {
  return {
    open: true, path: workPath, display_path: '/projetos/meu.ttwa', compressed: true, unsaved: false,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.clearAllMocks()
  api.version.mockResolvedValue({ app: '0.4.0' })
  api.corpora.list.mockResolvedValue({ corpora: CORPORA })
  api.corpora.layers.mockResolvedValue({ layers: [] })
})

describe('useSession — corpus ativo em projeto compactado', () => {
  it('lembra o corpus escolhido mesmo quando o caminho de trabalho muda a cada abertura', async () => {
    // Sessão 1: projeto com 2 corpora (não escolhe sozinho), usuária ativa "b".
    api.health.mockResolvedValue({ project: '/tmp/ttw_work_aaa/meu.ttwa' })
    api.project.info.mockResolvedValue(infoFor('/tmp/ttw_work_aaa/meu.ttwa'))
    const s1 = useSession()
    await s1.load()
    expect(s1.corpus).toBeNull()
    s1.setCorpus('b')
    expect(s1.corpus).toBe('b')

    // Sessão 2 (novo processo, mesma pasta compactada reaberta noutro diretório temporário):
    // o corpus já etiquetado precisa continuar ativo, não voltar a "nenhum corpus".
    setActivePinia(createPinia())
    api.health.mockResolvedValue({ project: '/tmp/ttw_work_bbb/meu.ttwa' })
    api.project.info.mockResolvedValue(infoFor('/tmp/ttw_work_bbb/meu.ttwa'))
    const s2 = useSession()
    await s2.load()
    expect(s2.projectPath).toBe('/projetos/meu.ttwa')
    expect(s2.corpus).toBe('b')
  })

  it('não restaura um corpus salvo de outro projeto', async () => {
    api.health.mockResolvedValue({ project: '/tmp/ttw_work_aaa/meu.ttwa' })
    api.project.info.mockResolvedValue(infoFor('/tmp/ttw_work_aaa/meu.ttwa'))
    const s1 = useSession()
    await s1.load()
    s1.setCorpus('b')

    setActivePinia(createPinia())
    api.health.mockResolvedValue({ project: '/tmp/ttw_work_ccc/outro.ttwa' })
    api.project.info.mockResolvedValue({ ...infoFor('/tmp/ttw_work_ccc/outro.ttwa'), display_path: '/projetos/outro.ttwa' })
    const s2 = useSession()
    await s2.load()
    expect(s2.corpus).toBeNull()
  })
})

describe('useSession — camadas do corpus ativo', () => {
  it('carrega as camadas ao trocar de corpus, para o seletor do cabeçalho', async () => {
    api.health.mockResolvedValue({ project: '/tmp/ttw_work_aaa/meu.ttwa' })
    api.project.info.mockResolvedValue(infoFor('/tmp/ttw_work_aaa/meu.ttwa'))
    api.corpora.layers.mockResolvedValue({ layers: [{ tool: 'spacy' }, { tool: 'stanza' }] })
    const s = useSession()
    await s.load()
    s.setCorpus('b')
    await s.loadLayers()   // aguarda a chamada disparada por setCorpus
    expect(s.layers.map((l) => l.tool)).toEqual(['spacy', 'stanza'])
  })

  it('esquece a camada escolhida se ela deixar de existir (corpus trocado ou camada removida)', async () => {
    api.health.mockResolvedValue({ project: '/tmp/ttw_work_aaa/meu.ttwa' })
    api.project.info.mockResolvedValue(infoFor('/tmp/ttw_work_aaa/meu.ttwa'))
    api.corpora.layers.mockResolvedValue({ layers: [{ tool: 'spacy' }] })
    const s = useSession()
    await s.load()
    s.setCorpus('b')
    await s.loadLayers()
    s.setLayer('spacy')
    api.corpora.layers.mockResolvedValue({ layers: [{ tool: 'stanza' }] })   // "spacy" saiu
    await s.loadLayers()
    expect(s.layer).toBeNull()
  })

  it('setLayer sinaliza a troca explícita para as telas abertas acompanharem', async () => {
    api.health.mockResolvedValue({ project: '/tmp/ttw_work_aaa/meu.ttwa' })
    api.project.info.mockResolvedValue(infoFor('/tmp/ttw_work_aaa/meu.ttwa'))
    const s = useSession()
    await s.load()
    const before = s.layerEpoch
    s.setLayer('spacy')
    expect(s.layerEpoch).toBe(before + 1)
    await s.loadLayers()                 // restaurar/recarregar camadas não conta como troca do usuário
    expect(s.layerEpoch).toBe(before + 1)
  })
})

describe('useSession — MFTE estendido como camada padrão ao abrir', () => {
  const EXT = { tool: 'mfte', config: { extended: true } }
  const STD = { tool: 'mfte', config: { extended: false } }
  const SPACY = { tool: 'spacy', config: {} }

  async function abrir(layers) {
    api.health.mockResolvedValue({ project: '/tmp/ttw_work_aaa/meu.ttwa' })
    api.project.info.mockResolvedValue(infoFor('/tmp/ttw_work_aaa/meu.ttwa'))
    api.corpora.list.mockResolvedValue({ corpora: [CORPORA[0]] })
    api.corpora.layers.mockResolvedValue({ layers })
    const s = useSession()
    s.corpus = 'a'
    await s.load()
    return s
  }

  it('há camada mfte_ext: ela vira a ativa', async () => {
    expect((await abrir([SPACY, EXT])).layer).toBe('mfte')
  })

  it('projeto migrado: ferramenta mfte_ext vira a ativa', async () => {
    expect((await abrir([SPACY, { tool: 'mfte', config: {} }, { tool: 'mfte_ext', config: {} }])).layer).toBe('mfte_ext')
  })

  it('só mfte padrão ou outras camadas: segue automática', async () => {
    expect((await abrir([SPACY, STD])).layer).toBeNull()
    expect((await abrir([SPACY])).layer).toBeNull()
  })

  it('escolher o corpus depois de abrir (vários corpora): a camada vira mfte_ext', async () => {
    const s = await abrir([SPACY, EXT])
    s.corpus = null
    s.layer = null
    await s.setCorpus('a')
    expect(s.layer).toBe('mfte')
  })

  it('recarregar as camadas depois não impõe de novo (dá para voltar para automática)', async () => {
    const s = await abrir([EXT])
    s.setLayer(null)
    await s.loadLayers()
    expect(s.layer).toBeNull()
  })
})
