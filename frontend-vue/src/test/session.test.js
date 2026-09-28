import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../api/index.js', () => ({
  api: {
    version: vi.fn(),
    health: vi.fn(),
    project: { info: vi.fn(), open: vi.fn(), unsaved: vi.fn() },
    corpora: { list: vi.fn() },
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
