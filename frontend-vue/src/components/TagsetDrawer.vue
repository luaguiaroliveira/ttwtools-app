<script setup>
// Painel "ver tags": repertório do tagger com busca e grupos (gaveta lateral).
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'
const props = defineProps({ open: Boolean, tagger: { type: String, required: true } })
const emit = defineEmits(['close'])
const { t, locale } = useI18n()
const data = ref(null)
const q = ref('')
const group = ref('')
watch(() => [props.open, props.tagger, locale.value], async ([open]) => {
  if (open) data.value = await api.taggers.tagset(props.tagger, locale.value)
}, { immediate: true })
const groups = computed(() => Object.fromEntries((data.value?.groups ?? []).map((g) => [g.id, g.label])))
const tags = computed(() => (data.value?.tags ?? []).filter((tg) => (!group.value || tg.group === group.value)
  && (!q.value || `${tg.tag} ${tg.definition} ${tg.example}`.toLowerCase().includes(q.value.toLowerCase()))))
</script>
<template>
  <div v-if="open" class="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" :aria-label="data?.name"
       @keydown.esc="emit('close')">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
    <aside class="relative bg-base-100 w-full max-w-lg h-full overflow-auto p-4 flex flex-col gap-3 shadow-xl">
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-bold">{{ data?.name }}</h2>
        <button class="btn btn-sm btn-ghost ml-auto" autofocus @click="emit('close')">{{ t('common.close') }}</button>
      </div>
      <p class="text-sm opacity-80">{{ data?.about }}</p>
      <div class="flex gap-2">
        <input v-model="q" class="input input-sm flex-1" :placeholder="t('tagset.search')" :aria-label="t('tagset.search')" />
        <select v-model="group" class="select select-sm" :aria-label="t('tagset.all_groups')">
          <option value="">{{ t('tagset.all_groups') }}</option>
          <option v-for="g in data?.groups ?? []" :key="g.id" :value="g.id">{{ g.label }}</option>
        </select>
      </div>
      <p class="text-xs text-text-muted">{{ t('tagset.count', { n: tags.length }) }}</p>
      <dl class="flex flex-col gap-2">
        <div v-for="tg in tags" :key="tg.tag" class="bg-base-200 rounded p-2">
          <dt class="font-mono font-bold">{{ tg.tag }} <span class="font-sans font-normal text-xs text-text-muted">{{ groups[tg.group] }}</span></dt>
          <dd class="text-sm">{{ tg.definition }}<span v-if="tg.example" class="block text-xs text-text-muted italic">{{ tg.example }}</span></dd>
        </div>
      </dl>
    </aside>
  </div>
</template>
