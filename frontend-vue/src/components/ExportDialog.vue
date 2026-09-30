<script setup>
// Exportar: um corpus (.ttwc, texto dentro; .ttwcl, texto ao lado) ou um pacote leve com vários corpora
// (.ttwal, texto ao lado). É uma cópia: o projeto aberto não muda.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialog from './AppDialog.vue'
const props = defineProps({ open: Boolean, corpora: { type: Array, default: () => [] }, busy: Boolean })
const emit = defineEmits(['close', 'export'])
const { t } = useI18n()
const KINDS = ['ttwc', 'ttwcl', 'ttwal']
const kind = ref('ttwc')
const corpus = ref('')
const picked = ref([])
watch(() => props.open, (v) => {
  if (!v) return
  corpus.value = props.corpora[0]?.name ?? ''
  picked.value = props.corpora.map((c) => c.name)
})
const multi = computed(() => kind.value === 'ttwal')
const ready = computed(() => (multi.value ? picked.value.length > 0 : Boolean(corpus.value)))
const toggle = (name) => { picked.value = picked.value.includes(name) ? picked.value.filter((n) => n !== name) : [...picked.value, name] }
const go = () => emit('export', multi.value ? { kind: kind.value, corpora: picked.value } : { kind: kind.value, corpus: corpus.value })
</script>
<template>
  <AppDialog :open="open" :title="t('export.title')" @close="emit('close')">
    <div class="flex flex-col gap-3" data-testid="export-dialog">
      <fieldset class="flex flex-col gap-2">
        <legend class="ttw-label mb-1">{{ t('export.kind') }}</legend>
        <label v-for="k in KINDS" :key="k" class="flex items-start gap-2 p-2 rounded-box border cursor-pointer"
               :class="kind === k ? 'border-orange-text bg-base-200' : 'border-base-300'">
          <input v-model="kind" type="radio" name="export-kind" class="radio radio-sm mt-0.5" :value="k" :data-testid="`export-kind-${k}`" />
          <span class="flex flex-col"><span class="font-medium">{{ t(`export.${k}.title`) }}</span>
            <span class="text-xs text-text-muted">{{ t(`export.${k}.desc`) }}</span></span>
        </label>
      </fieldset>
      <label v-if="!multi" class="ttw-field"><span class="ttw-label">{{ t('export.corpus') }}</span>
        <select v-model="corpus" class="select select-sm" data-testid="export-corpus"><option v-for="c in corpora" :key="c.name" :value="c.name">{{ c.name }}</option></select></label>
      <fieldset v-else class="flex flex-col gap-1">
        <legend class="ttw-label mb-1 flex items-center gap-2">{{ t('export.corpora') }}
          <button type="button" class="btn btn-xs btn-ghost" @click="picked = corpora.map((c) => c.name)">{{ t('export.all') }}</button>
          <button type="button" class="btn btn-xs btn-ghost" @click="picked = []">{{ t('export.none') }}</button></legend>
        <label v-for="c in corpora" :key="c.name" class="ttw-check"><input type="checkbox" class="checkbox checkbox-sm" :checked="picked.includes(c.name)"
               :data-testid="`export-pick-${c.name}`" @change="toggle(c.name)" />{{ c.name }}</label>
      </fieldset>
      <p class="text-xs text-text-muted">{{ t('export.note') }}</p>
      <button type="button" class="btn btn-primary btn-sm w-fit" :disabled="busy || !ready" data-testid="export-go" @click="go">{{ t('export.go') }}</button>
    </div>
  </AppDialog>
</template>
