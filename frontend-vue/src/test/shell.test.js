import { afterEach, describe, expect, it, vi } from 'vitest'
import { inShell, pickFile, pickSave, saveAs } from '../api/shell.js'

const withShell = (invoke) => { globalThis.__TAURI__ = { core: { invoke } } }
afterEach(() => { delete globalThis.__TAURI__ })

describe('casca Tauri', () => {
  it('só existe com window.__TAURI__', () => {
    expect(inShell()).toBe(false)
    withShell(vi.fn())
    expect(inShell()).toBe(true)
  })
  it('abrir: extensões do tipo, e cancelar vira null', async () => {
    const invoke = vi.fn().mockResolvedValueOnce('/a/b.ttwa').mockResolvedValueOnce(null)
    withShell(invoke)
    expect(await pickFile(undefined, 'project')).toEqual({ path: '/a/b.ttwa' })
    expect(invoke.mock.calls[0][1].extensions).toContain('ttwc')
    expect(await pickFile(undefined, 'csv')).toBeNull()
    expect(invoke.mock.calls[1][1].extensions).toEqual(['csv', 'tsv', 'txt'])
  })
  it('salvar: acrescenta a extensão se faltar', async () => {
    withShell(vi.fn().mockResolvedValue('/x/novo'))
    expect(await pickSave('novo_projeto.ttwa')).toEqual({ path: '/x/novo.ttwa' })
  })
  it('download: pergunta o destino e grava os bytes com o caminho no cabeçalho', async () => {
    const invoke = vi.fn().mockResolvedValueOnce('/tmp/ação.csv').mockResolvedValueOnce(undefined)
    withShell(invoke)
    expect(await saveAs('t.csv', new Blob(['a,b\n']))).toBe('/tmp/ação.csv')
    const [cmd, bytes, opts] = invoke.mock.calls[1]
    expect(cmd).toBe('save_file')
    expect([...bytes]).toEqual([...new TextEncoder().encode('a,b\n')])
    expect(decodeURIComponent(opts.headers.path)).toBe('/tmp/ação.csv')
  })
})
