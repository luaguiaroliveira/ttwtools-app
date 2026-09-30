import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressBar from '../components/ProgressBar.vue'

describe('ProgressBar', () => {
  it('determinada: largura = valor, limitada a 0–100, com aria', () => {
    const w = mount(ProgressBar, { props: { value: 42.4 } })
    expect(w.find('[role=progressbar]').attributes('aria-valuenow')).toBe('42')
    expect(w.find('.bg-primary').attributes('style')).toContain('width: 42.4%')
    expect(mount(ProgressBar, { props: { value: 250 } }).find('.bg-primary').attributes('style')).toContain('width: 100%')
    expect(mount(ProgressBar, { props: { value: -5 } }).find('.bg-primary').attributes('style')).toContain('width: 0%')
  })
  it('indeterminada: faixa animada e sem aria-valuenow', () => {
    const w = mount(ProgressBar)
    expect(w.find('.ttw-bar-busy').exists()).toBe(true)
    expect(w.find('[role=progressbar]').attributes('aria-valuenow')).toBeUndefined()
  })
})
