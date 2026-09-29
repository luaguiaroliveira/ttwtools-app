<script setup>
// Um etiquetador como camada a acrescentar: o que ele dá, se está disponível, atalhos de
// opções e as opções completas num painel recolhido. Não executa: emite `add` com o passo.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
import OptionsForm from './OptionsForm.vue'
import TagsetDrawer from './TagsetDrawer.vue'
import SpotlightCard from './vb/SpotlightCard.vue'
import Collapsible from './Collapsible.vue'

const props = defineProps({
  corpus: { type: String, required: true },
  tagger: { type: Object, required: true },        // item de /api/taggers (id, disponivel, motivo, comando)
  queued: { type: Array, default: () => [] },      // passos já na lista, para avisar repetição
})
const emit = defineEmits(['add'])
const { t, locale } = useI18n()
const descriptor = ref(null)
const values = ref({})
const preset = ref('recomendado')
const showTags = ref(false)

watch(() => [props.tagger.id, locale.value, props.corpus], async () => {
  descriptor.value = await api.taggers.options(props.tagger.id, locale.value, props.corpus).catch(() => null)
  applyPreset(preset.value)
}, { immediate: true })

function applyPreset(name) {   // atalhos já adaptados ao idioma do corpus
  preset.value = name
  const d = descriptor.value
  if (d) values.value = { ...(d.suggested_presets?.[name] ?? d.presets?.[name] ?? d.suggested ?? {}) }
}
// só as opções diferentes do padrão vão no passo
const options = computed(() => {
  const out = {}
  for (const o of descriptor.value?.options ?? []) {
    const v = values.value[o.id]
    if (v !== undefined && JSON.stringify(v) !== JSON.stringify(o.padrao)) out[o.id] = v
  }
  return out
})
const summary = computed(() => {
  const d = descriptor.value
  if (!d) return ''
  return d.options.filter((o) => o.afeta_resultado)
    .map((o) => { const v = values.value[o.id] ?? o.padrao; return `${o.id}=${Array.isArray(v) ? v.join('+') : v}` }).join(' · ')
})
const step = computed(() => ({ kind: 'tag', tagger: props.tagger.id, options: options.value }))
const already = computed(() => props.queued.some((s) => s.kind === 'tag' && s.tagger === props.tagger.id
  && JSON.stringify(s.options ?? {}) === JSON.stringify(options.value)))
</script>

<template>
  <SpotlightCard tag="li" class="ttw-rise bg-base-100 rounded-box p-3 flex flex-col gap-2" :data-testid="`tagger-card-${tagger.id}`">
    <div class="flex flex-wrap items-center gap-2">
      <h4 class="font-bold">{{ descriptor?.name ?? tagger.id }}</h4>
      <span v-if="!tagger.disponivel" class="badge badge-warning badge-sm">{{ t('tag.unavailable') }}</span>
      <button class="btn btn-sm btn-primary ml-auto" :disabled="!tagger.disponivel || already" :data-testid="`add-${tagger.id}`"
              @click="emit('add', step)">{{ already ? t('pipeline.in_list') : t('pipeline.add') }}</button>
    </div>
    <p class="text-sm">{{ descriptor?.about }}</p>
    <p v-if="!tagger.disponivel" class="text-xs text-warning">{{ tagger.motivo }} <code v-if="tagger.comando">{{ tagger.comando }}</code></p>
    <template v-else>
      <fieldset class="flex flex-wrap items-center gap-2">
        <legend class="text-xs opacity-80 mb-1">{{ t('pipeline.preset') }}</legend>
        <div class="join">
          <button v-for="p in ['rapido', 'recomendado', 'preciso']" :key="p" type="button" class="btn btn-xs join-item"
                  :class="{ 'btn-active': preset === p }" :aria-pressed="preset === p" :data-testid="`preset-${tagger.id}-${p}`"
                  @click="applyPreset(p)">{{ t(`tagger.preset.${p}`) }}</button>
        </div>
        <span class="text-xs text-text-muted" data-testid="tag-summary">{{ summary }}</span>
      </fieldset>
      <Collapsible :title="t('pipeline.options')">
        <div class="flex flex-col gap-3">
          <p class="text-xs opacity-80">{{ t('pipeline.options_intro') }}</p>
          <OptionsForm v-if="descriptor" v-model="values" :descriptor="descriptor" />
          <div class="flex gap-2">
            <button class="btn btn-xs" @click="applyPreset('recomendado')">{{ t('tag.restore') }}</button>
            <button class="btn btn-xs" @click="showTags = true">{{ t('tag.see_tags') }}</button>
          </div>
        </div>
      </Collapsible>
    </template>
    <TagsetDrawer :open="showTags" :tagger="tagger.id" @close="showTags = false" />
  </SpotlightCard>
</template>
