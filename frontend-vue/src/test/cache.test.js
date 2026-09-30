import { describe, expect, it, vi } from 'vitest'
import { clearExploreCache, memoized } from '../api/cache.js'

describe('memoized (consultas de exploração)', () => {
  it('mesmos parâmetros não voltam ao servidor; parâmetros diferentes ou cache limpo, sim', async () => {
    clearExploreCache()
    const fn = vi.fn(async (p) => ({ total: p.q.length, rows: [1, 2] }))
    const call = memoized('t', fn)
    const a = await call({ q: 'the' })
    a.rows.push(3)                                   // quem recebe uma cópia não suja o que ficou guardado
    expect((await call({ q: 'the' })).rows).toEqual([1, 2])
    await call({ q: 'of' })
    expect(fn).toHaveBeenCalledTimes(2)
    clearExploreCache()
    await call({ q: 'the' })
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
