<script setup>
// Etiquetas da camada ativa para montar a busca: as contagens vêm do corpus e a definição do
// repertório (tagset). Clicar liga/desliga a etiqueta; a combinação (`key=A|B`, editável) volta
// para o campo de consulta pelo evento `apply`.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import { loadTagsetData, mergeTagsets, tagsetIdsFor } from '../../utils/tagInfo.js'
const props = defineProps({
  corpus: { type: String, required: true },
  layer: { type: String, default: null },   // ferramenta da camada ativa (null = automática)
  query: { type: String, default: '' },     // consulta atual, para marcar o que já está na combinação
})
const emit = defineEmits(['apply'])
const { t, locale } = useI18n()
const session = useSession()
const FIELD_OF = { upos: 'upos', ptb: 'xpos', biber: 'tags', mfte: 'tags' }   // repertório → campo da consulta
const KEY_OF = { tags: 'tag', upos: 'pos', xpos: 'pos' }                      // campo → palavra-chave da consulta
const HAS = (l) => (l.fields ?? []).some((f) => f === 'tags' || f === 'upos' || f === 'xpos')
// camada do etiquetador ativo: a escolhida, ou a mais recente que tenha classe/etiqueta
const entry = computed(() => {
  const ls = session.layers ?? []
  if (props.layer) {
    const l = ls.find((x) => x.tool === props.layer)
    return l && HAS(l) ? l : null
  }
  return ls.find(HAS) ?? null
})
const ids = computed(() => tagsetIdsFor(entry.value?.tool ?? '').filter((id) => FIELD_OF[id]))
const sets = ref([])          // [{ id, data }] na ordem dos repertórios
const selected = ref('')
const counts = ref({})        // etiqueta → ocorrências no corpus
const q = ref('')
const group = ref('')
// repertório padrão: o primeiro cujo campo existe na camada (etiqueta > classe > classe fina)
const preferred = computed(() => {
  const fields = entry.value?.fields ?? []
  const wanted = fields.includes('tags') ? 'tags' : fields.includes('upos') ? 'upos' : fields.includes('xpos') ? 'xpos' : null
  return ids.value.find((id) => FIELD_OF[id] === wanted) ?? ids.value[0] ?? ''
})
const field = computed(() => FIELD_OF[selected.value] ?? null)
const key = computed(() => KEY_OF[field.value] ?? 'tag')
const data = computed(() => sets.value.find((s) => s.id === selected.value)?.data ?? null)
const groups = computed(() => Object.fromEntries((data.value?.groups ?? []).map((g) => [g.id, g.label])))
// trecho já presente no campo de busca (ex.: "tag=NN|JJ") para marcar as etiquetas ligadas
const active = computed(() => {
  const m = /(?:^|[\s&])(tag|pos)=([^\s&]+)/.exec(props.query || '')
  return m ? { key: m[1], values: m[2].split('|').filter(Boolean) } : { key: null, values: [] }
})
const chosen = computed(() => new Set(active.value.key ? active.value.values : []))
const rows = computed(() => {
  const defs = mergeTagsets(sets.value.map((s) => s.data).filter(Boolean))
  const out = (data.value?.tags ?? []).map((tg) => ({ tag: tg.tag, group: tg.group, def: defs[tg.tag]?.text ?? tg.definition ?? '', count: counts.value[tg.tag] ?? 0 }))
  for (const [tag, n] of Object.entries(counts.value)) if (!out.some((r) => r.tag === tag)) out.push({ tag, group: '', def: '', count: n })
  return out.filter((r) => !group.value || r.group === group.value)
    .filter((r) => !q.value || `${r.tag} ${r.def}`.toLowerCase().includes(q.value.toLowerCase()))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
})
watch(() => [entry.value?.tool, locale.value, props.corpus, props.layer], async () => {
  if (!entry.value) { sets.value = []; return }
  sets.value = (await Promise.all(ids.value.map(async (id) => ({ id, data: await loadTagsetData(id, locale.value).catch(() => null) })))).filter((s) => s.data)
  if (!sets.value.some((s) => s.id === selected.value)) selected.value = preferred.value
}, { immediate: true })
watch([field, () => props.corpus, () => props.layer], async () => {
  if (!field.value || !props.corpus) { counts.value = {}; return }
  try { counts.value = (await api.corpora.tagCounts(props.corpus, props.layer || undefined, field.value)).counts ?? {} }
  catch { counts.value = {} }
}, { immediate: true })
function toggle(tag) {
  const values = new Set(active.value.key ? active.value.values : [])
  values.has(tag) ? values.delete(tag) : values.add(tag)
  emit('apply', values.size ? `${key.value}=${[...values].join('|')}` : '')
}
</script>
<template>
  <div v-if="entry" class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <label v-if="sets.length > 1" class="flex items-center gap-2 text-xs">
        <span>{{ t('tagset.choose') }}</span>
        <select v-model="selected" class="select select-xs" data-testid="tag-picker-set">
          <option v-for="s in sets" :key="s.id" :value="s.id">{{ s.data.name }}</option>
        </select>
      </label>
      <input v-model="q" class="input input-sm flex-1 min-w-40" :placeholder="t('tagset.search')" :aria-label="t('tagset.search')" data-testid="tag-picker-search" />
      <select v-if="data?.groups?.length" v-model="group" class="select select-sm" :aria-label="t('tagset.all_groups')">
        <option value="">{{ t('tagset.all_groups') }}</option>
        <option v-for="g in data.groups" :key="g.id" :value="g.id">{{ g.label }}</option>
      </select>
    </div>
    <p class="text-xs text-text-muted">{{ t('explore.tags_hint') }}</p>
    <ul class="flex flex-wrap gap-1 ttw-scroll max-h-40 overflow-y-auto" data-testid="tag-picker-list">
      <li v-for="r in rows" :key="r.tag">
        <button type="button" class="badge cursor-pointer font-mono" :class="chosen.has(r.tag) ? 'badge-primary' : 'badge-ghost'"
                :title="[r.def, r.group ? groups[r.group] : ''].filter(Boolean).join(' — ')" :data-tag="r.tag"
                :aria-pressed="chosen.has(r.tag)" @click="toggle(r.tag)">{{ r.tag }}<span v-if="r.count" class="ml-1 opacity-70">{{ r.count }}</span></button>
      </li>
      <li v-if="!rows.length" class="text-xs text-text-muted">{{ t('table.empty') }}</li>
    </ul>
  </div>
  <p v-else class="text-xs text-text-muted">{{ t('explore.tags_none') }}</p>
</template>
