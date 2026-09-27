import { describe, expect, it } from 'vitest'
import { tableToCsv, tableToTxt } from '../utils/export.js'
describe('export', () => {
  const rows = [{ item: 'cat', freq: 3 }, { item: 'a, "b"', freq: 10 }]
  it('CSV com aspas quando preciso', () => {
    expect(tableToCsv(rows)).toBe('item,freq\ncat,3\n"a, ""b""",10\n')
  })
  it('TXT alinhado', () => {
    expect(tableToTxt(rows, ['item', 'freq']).split('\n')[0]).toBe('item    freq')
  })
})
