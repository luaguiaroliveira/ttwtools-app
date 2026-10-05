import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import SplitPane from '../components/SplitPane.vue'

const i18n = createI18n({ legacy: false, locale: 'pt', messages: { pt: { analysis: { divider: 'Divisória' } } } })
const mountPane = (props = {}) => mount(SplitPane, {
  props,
  slots: { default: '<p data-testid="left">L</p>', right: '<p data-testid="right">R</p>' },
  global: { plugins: [i18n] },
})

describe('SplitPane', () => {
  it('separador acessível com a divisória entre os dois lados', () => {
    const w = mountPane({ modelValue: 50 })
    const sep = w.find('[data-testid=split-handle]')
    expect(sep.attributes('role')).toBe('separator')
    expect(sep.attributes('aria-orientation')).toBe('vertical')
    expect(sep.attributes('aria-valuenow')).toBe('50')
    expect(sep.attributes('aria-valuemin')).toBe('20')
    expect(sep.attributes('aria-valuemax')).toBe('80')
    expect(sep.attributes('aria-label')).toBe('Divisória')
    expect(w.find('[data-testid=left]').exists()).toBe(true)
    expect(w.find('[data-testid=right]').exists()).toBe(true)
  })
  it('teclado ajusta a largura dentro dos limites', async () => {
    const w = mountPane({ modelValue: 50 })
    await w.find('[data-testid=split-handle]').trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue').at(-1)).toEqual([52])
    await w.find('[data-testid=split-handle]').trigger('keydown', { key: 'Home' })
    expect(w.emitted('update:modelValue').at(-1)).toEqual([20])
    await w.setProps({ modelValue: 80 })
    await w.find('[data-testid=split-handle]').trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue').at(-1)).toEqual([80])
  })
  it('ocultar um lado tira a divisória e o conteúdo correspondente', async () => {
    const w = mountPane({ modelValue: 50, showLeft: false })
    expect(w.find('[data-testid=left]').exists()).toBe(false)
    expect(w.find('[data-testid=split-handle]').exists()).toBe(false)
    expect(w.find('[data-testid=right]').exists()).toBe(true)
    await w.setProps({ showLeft: true, showRight: false })
    expect(w.find('[data-testid=left]').exists()).toBe(true)
    expect(w.find('[data-testid=right]').exists()).toBe(false)
    expect(w.find('[data-testid=split-handle]').exists()).toBe(false)
  })
})
