<script setup>
// Galeria de aparência: cada cartão é uma pré-visualização real do tema (cores, fonte e estilo de botão),
// pois recebe as mesmas variáveis CSS que o <html> receberia. Escolher aplica na hora.
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { THEME_DEFS } from '../theme.js'
import { themeVars } from '../themes.js'

const props = defineProps({ open: Boolean, current: { type: String, default: 'system' } })
const emit = defineEmits(['close', 'select'])
const { t } = useI18n()
const el = ref(null)
watch(() => props.open, (v) => { if (!el.value) return; v ? el.value.showModal?.() : el.value.close?.() })

const cards = THEME_DEFS.map((d) => ({ d, style: { ...themeVars(d), background: d.b1, color: d.tx, fontFamily: 'var(--font-sans)' } }))
</script>

<template>
  <dialog ref="el" class="modal" :aria-label="t('theme.gallery_title')" data-testid="theme-gallery" @close="emit('close')">
    <div class="modal-box max-w-5xl">
      <h2 class="font-bold text-lg">{{ t('theme.gallery_title') }}</h2>
      <p class="field-help mb-3">{{ t('theme.gallery_hint') }}</p>
      <div role="radiogroup" :aria-label="t('theme.label')" class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <label v-for="{ d, style } in cards" :key="d.id" class="theme-card" :class="{ 'is-current': current === d.id }" :data-btn="d.btn" :style="style">
          <input type="radio" name="ttw-theme" class="sr-only" :value="d.id" :checked="current === d.id" :data-testid="`theme-card-${d.id}`" @change="emit('select', d.id)" />
          <span class="flex items-baseline justify-between gap-2">
            <span class="theme-card-name">{{ d.name }}</span>
            <span class="text-xs" style="color: var(--ttw-text-muted)">{{ t(d.dark ? 'theme.mode_dark' : 'theme.mode_light') }} · {{ t(`theme.btn_${d.btn}`) }}</span>
          </span>
          <span class="text-sm" style="color: var(--ttw-text-muted)">{{ t('theme.preview_text') }}</span>
          <span class="flex items-center gap-2 flex-wrap">
            <span class="btn btn-primary btn-sm pointer-events-none">{{ t('theme.preview_button') }}</span>
            <span class="btn btn-secondary btn-sm pointer-events-none">Aa</span>
            <span class="ml-auto flex gap-1" aria-hidden="true">
              <i v-for="c in [d.b2, d.b3, d.pr, d.ink, d.se]" :key="c" class="theme-dot" :style="{ background: c }" />
            </span>
          </span>
        </label>
      </div>
      <div class="modal-action"><button type="button" class="btn" @click="emit('close')">{{ t('common.close') }}</button></div>
    </div>
  </dialog>
</template>

<style scoped>
.theme-card { display: flex; flex-direction: column; gap: .6rem; padding: .9rem; cursor: pointer;
  border: 2px solid var(--ttw-border-strong); border-radius: var(--radius-box); }
.theme-card:hover { border-color: var(--ttw-orange-text); }
.theme-card:focus-within { outline: 3px solid var(--ttw-orange-text); outline-offset: 2px; }
.theme-card.is-current { border-color: var(--ttw-orange-text); box-shadow: inset 0 0 0 2px var(--ttw-orange-text); }
.theme-card-name { font-family: var(--ttw-font-display); font-size: 1.15rem; font-weight: 700; }
.theme-dot { display: inline-block; width: .9rem; height: .9rem; border-radius: 999px; border: 1px solid var(--ttw-border-strong); }
</style>
