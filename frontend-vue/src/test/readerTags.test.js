import { describe, expect, it } from 'vitest'
import { chosenTag, tokenLabel, tokenTags } from '../utils/readerTags.js'

describe('readerTags', () => {
  it('BiberPlus/MFTE: todas as tags do token, não só a primeira', () => {
    const tok = { tags: ['PIN', 'TO', 'PREP'] }
    expect(tokenTags(tok, 'tags')).toEqual(['PIN', 'TO', 'PREP'])
    expect(tokenLabel(tok, 'tags')).toBe('PIN')
    expect(chosenTag(tok, 'tags', new Set(['TO']))).toBe('TO')
    expect(chosenTag(tok, 'tags', new Set(['VPRT']))).toBeNull()
  })

  it('UPOS e XPOS continuam com um valor só', () => {
    const tok = { tags: ['PIN', 'TO', 'PREP'], upos: 'ADP', xpos: 'IN' }
    expect(tokenTags(tok, 'upos')).toEqual(['ADP'])
    expect(tokenTags(tok, 'xpos')).toEqual(['IN'])
    expect(tokenTags({ tags: [] }, 'tags')).toEqual([])
  })
})
