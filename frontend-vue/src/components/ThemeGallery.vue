<script setup>
// Galeria de aparência: cinco escolhas independentes (cores, fontes, cantos, botões, ícones).
// Cada cartão é uma pré-visualização real: recebe as mesmas variáveis CSS que o <html> receberia
// para aquela escolha, herdando o resto do que está ativo. Escolher aplica na hora.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { THEME_DEFS } from '../theme.js'
import { BASIC_PREVIEW, BUTTON_STYLES, FONT_CHOICES, ICON_STYLES, SHAPES, paletteVars, resolveLook, shapeFontVars } from '../themes.js'
import NavIcon from './NavIcon.vue'

const props = defineProps({ open: Boolean, look: { type: Object, required: true } })
const emit = defineEmits(['close', 'select', 'reset'])
const { t } = useI18n()
const el = ref(null)
watch(() => props.open, (v) => { if (!el.value) return; v ? el.value.showModal?.() : el.value.close?.() })

const ICON_SAMPLE = ['file', 'tagging', 'explore', 'compare']
const eff = computed(() => resolveLook(THEME_DEFS.find((d) => d.id === props.look.colors) ?? null, props.look))
const colorCards = [
  { id: 'system', key: 'theme.system', d: BASIC_PREVIEW[0] },
  ...BASIC_PREVIEW.map((d) => ({ id: d.id, key: `theme.${d.id}`, d })),
  ...THEME_DEFS.map((d) => ({ id: d.id, name: d.name, d })),
].map((c) => ({ ...c, style: { ...paletteVars(c.d), background: c.d.b1, color: c.d.tx } }))
const fontCards = FONT_CHOICES.map((c) => ({ ...c, style: shapeFontVars({ font: c }) }))
const shapeCards = SHAPES.map((c) => ({ ...c, style: shapeFontVars({ shape: c }) }))

const sections = [
  ['colors', 'theme.section_colors'], ['font', 'theme.section_fonts'], ['shape', 'theme.section_shapes'],
  ['btn', 'theme.section_buttons'], ['icons', 'theme.section_icons'],
]
const isAuto = (axis) => props.look[axis] === 'auto'
</script>

<template>
  <dialog ref="el" class="modal" :aria-label="t('theme.gallery_title')" data-testid="theme-gallery" @close="emit('close')">
    <div class="modal-box max-w-5xl">
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <h2 class="font-bold text-lg">{{ t('theme.gallery_title') }}</h2>
          <p class="field-help mb-3">{{ t('theme.gallery_hint') }}</p>
        </div>
        <button type="button" class="btn btn-sm" data-testid="theme-reset" @click="emit('reset')">{{ t('theme.reset') }}</button>
      </div>

      <section v-for="[axis, title] in sections" :key="axis" class="mb-5">
        <h3 class="section-title mb-2">{{ t(title) }}</h3>
        <div role="radiogroup" :aria-label="t(title)" class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          <!-- "Do tema" (só nos eixos além das cores) -->
          <label v-if="axis !== 'colors'" class="theme-card" :class="{ 'is-current': isAuto(axis) }" :data-btn="eff.btn" :data-icons="eff.icons">
            <input type="radio" :name="`ttw-${axis}`" class="sr-only" value="auto" :checked="isAuto(axis)" :data-testid="`look-${axis}-auto`" @change="emit('select', axis, 'auto')" />
            <span class="theme-card-name">{{ t('theme.auto') }}</span>
            <span class="text-xs" style="color: var(--ttw-text-muted)">{{ t('theme.auto_hint') }}</span>
          </label>

          <template v-if="axis === 'colors'">
            <label v-for="c in colorCards" :key="c.id" class="theme-card" :class="{ 'is-current': look.colors === c.id }" :style="c.style" :data-btn="eff.btn" :data-icons="eff.icons">
              <input type="radio" name="ttw-colors" class="sr-only" :value="c.id" :checked="look.colors === c.id" :data-testid="`theme-card-${c.id}`" @change="emit('select', 'colors', c.id)" />
              <span class="theme-card-name">{{ c.key ? t(c.key) : c.name }}</span>
              <span class="flex items-center gap-2">
                <span class="btn btn-primary btn-xs pointer-events-none">{{ t('theme.preview_button') }}</span>
                <span class="ml-auto flex gap-1" aria-hidden="true"><i v-for="x in [c.d.b2, c.d.b3, c.d.pr, c.d.ink, c.d.se]" :key="x" class="theme-dot" :style="{ background: x }" /></span>
              </span>
            </label>
          </template>

          <template v-else-if="axis === 'font'">
            <label v-for="c in fontCards" :key="c.id" class="theme-card" :class="{ 'is-current': look.font === c.id }" :style="c.style">
              <input type="radio" name="ttw-font" class="sr-only" :value="c.id" :checked="look.font === c.id" :data-testid="`look-font-${c.id}`" @change="emit('select', 'font', c.id)" />
              <span class="theme-card-name">{{ c.name }}</span>
              <span class="text-sm" style="font-family: var(--font-sans)">{{ t('theme.preview_text') }} 0123</span>
            </label>
          </template>

          <template v-else-if="axis === 'shape'">
            <label v-for="c in shapeCards" :key="c.id" class="theme-card" :class="{ 'is-current': look.shape === c.id }" :style="c.style">
              <input type="radio" name="ttw-shape" class="sr-only" :value="c.id" :checked="look.shape === c.id" :data-testid="`look-shape-${c.id}`" @change="emit('select', 'shape', c.id)" />
              <span class="theme-card-name">{{ t(`theme.shape_${c.id}`) }}</span>
              <span class="flex gap-2 items-center">
                <span class="btn btn-primary btn-sm pointer-events-none">{{ t('theme.preview_button') }}</span>
                <span class="input input-sm w-14 pointer-events-none" aria-hidden="true" />
              </span>
            </label>
          </template>

          <template v-else-if="axis === 'btn'">
            <label v-for="b in BUTTON_STYLES" :key="b" class="theme-card" :class="{ 'is-current': look.btn === b }" :data-btn="b" :data-icons="eff.icons">
              <input type="radio" name="ttw-btn" class="sr-only" :value="b" :checked="look.btn === b" :data-testid="`look-btn-${b}`" @change="emit('select', 'btn', b)" />
              <span class="theme-card-name">{{ t(`theme.btn_${b}`) }}</span>
              <span class="flex gap-2"><span class="btn btn-primary btn-sm pointer-events-none">{{ t('theme.preview_button') }}</span><span class="btn btn-sm pointer-events-none">Aa</span></span>
            </label>
          </template>

          <template v-else>
            <label v-for="i in ICON_STYLES" :key="i" class="theme-card" :class="{ 'is-current': look.icons === i }" :data-icons="i">
              <input type="radio" name="ttw-icons" class="sr-only" :value="i" :checked="look.icons === i" :data-testid="`look-icons-${i}`" @change="emit('select', 'icons', i)" />
              <span class="theme-card-name">{{ t(`theme.icons_${i}`) }}</span>
              <span class="flex gap-2"><NavIcon v-for="n in ICON_SAMPLE" :key="n" :name="n" :size="28" /></span>
            </label>
          </template>
        </div>
      </section>
      <div class="modal-action"><button type="button" class="btn" @click="emit('close')">{{ t('common.close') }}</button></div>
    </div>
  </dialog>
</template>

<style scoped>
.theme-card { display: flex; flex-direction: column; gap: .5rem; padding: .75rem; cursor: pointer; font-family: var(--font-sans);
  background: var(--color-base-100); color: var(--color-base-content);
  border: 2px solid var(--ttw-border-strong); border-radius: var(--radius-box); }
.theme-card:hover { border-color: var(--ttw-orange-text); }
.theme-card:focus-within { outline: 3px solid var(--ttw-orange-text); outline-offset: 2px; }
.theme-card.is-current { border-color: var(--ttw-orange-text); box-shadow: inset 0 0 0 2px var(--ttw-orange-text); }
.theme-card-name { font-family: var(--ttw-font-display, var(--font-sans)); font-size: 1.05rem; font-weight: 700; }
.theme-dot { display: inline-block; width: .8rem; height: .8rem; border-radius: 999px; border: 1px solid var(--ttw-border-strong); }
</style>
