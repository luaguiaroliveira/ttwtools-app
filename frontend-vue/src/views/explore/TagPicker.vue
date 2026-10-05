<script setup>
// Etiquetas da camada ativa para montar a busca: as contagens vêm do corpus e a definição do
// repertório (tagset). Clicar liga/desliga a etiqueta; a combinação (`key=A|B`, editável) volta
// para o campo de consulta pelo evento `apply`. Cada etiqueta tem uma cor (uma etiqueta = uma
// consulta/camada): o menu à direita troca só a cor, no mesmo visual do seletor do Leitor.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import { useTagColors } from '../../stores/tagColors.js'
import { isPlausibleTag, loadTagsetData, mergeTagsets, tagsetIdsFor } from '../../utils/tagInfo.js'
import { PALETTES, readableOn as fg } from '../../utils/colorPalettes.js'
import ColorPicker from '../../components/ColorPicker.vue'
const props = defineProps({
  corpus: { type: String, required: true },
  layer: { type: String, default: null },   // ferramenta da camada ativa (null = automática)
  query: { type: String, default: '' },     // consulta atual, para marcar o que já está na combinação
  mode: { type: String, default: 'query' }, // 'query' (monta tag=A|B no campo) | 'layers' (emite toggle por etiqueta)
  selected: { type: Array, default: () => [] },   // etiquetas já ativas (modo 'layers')
})
const emit = defineEmits(['apply', 'toggle', 'color'])
const { t, locale } = useI18n()
const session = useSession()
const tagColors = useTagColors()
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
const chosen = computed(() => props.mode === 'layers'
  ? new Set(props.selected ?? [])
  : new Set(active.value.key ? active.value.values : []))
const rows = computed(() => {
  const defs = mergeTagsets(sets.value.map((s) => s.data).filter(Boolean))
  const out = (data.value?.tags ?? []).map((tg) => ({ tag: tg.tag, group: tg.group, def: defs[tg.tag]?.text ?? tg.definition ?? '', count: counts.value[tg.tag] ?? 0 }))
  for (const [tag, n] of Object.entries(counts.value)) if (!out.some((r) => r.tag === tag)) out.push({ tag, group: '', def: '', count: n })
  return out.filter((r) => isPlausibleTag(r.tag))      // esconde lixo da camada (URL, "palavra_TAG"...)
    .filter((r) => !group.value || r.group === group.value)
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
  if (props.mode === 'layers') { emit('toggle', { tag, key: key.value, field: field.value }); return }
  const values = new Set(active.value.key ? active.value.values : [])
  values.has(tag) ? values.delete(tag) : values.add(tag)
  emit('apply', values.size ? `${key.value}=${[...values].join('|')}` : '')
}

// --- cor por etiqueta (menu à direita, só troca de cor) -------------------------------
const colorOf = (tag) => tagColors.color(tag)
const menu = ref(null)
const menuPos = ref({ x: 0, y: 0 })
function openMenu(tag, el) {
  if (menu.value === tag) { menu.value = null; return }
  const r = el.getBoundingClientRect()
  menuPos.value = { x: Math.max(8, Math.min(r.left, globalThis.innerWidth - 232)), y: Math.min(r.bottom + 4, globalThis.innerHeight - 344) }
  menu.value = tag
}
function setColor(tag, hex) { tagColors.set(tag, hex); emit('color', { tag, color: hex }) }
function resetColor(tag) { tagColors.reset(tag); emit('color', { tag, color: colorOf(tag) }) }
function onDocDown(e) { if (!e.target?.closest?.('[data-tag-color-menu]')) menu.value = null }
const onEsc = (e) => { if (e.key === 'Escape' && menu.value) { menu.value = null; e.stopPropagation(); e.preventDefault() } }
watch(menu, (v) => {
  const m = v ? 'addEventListener' : 'removeEventListener'
  globalThis[m]('pointerdown', onDocDown)
  globalThis[m]('keydown', onEsc, true)
})
onBeforeUnmount(() => {
  globalThis.removeEventListener('pointerdown', onDocDown)
  globalThis.removeEventListener('keydown', onEsc, true)
})
</script>
<template>
  <div v-if="entry" class="flex flex-col gap-2 min-h-0">
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
    <p class="text-xs text-text-muted">{{ t(mode === 'layers' ? 'explore.tags_hint_layers' : 'explore.tags_hint') }}</p>
    <ul class="flex flex-col gap-1 ttw-scroll max-h-56 overflow-y-auto pr-1" data-testid="tag-picker-list">
      <li v-for="r in rows" :key="r.tag" class="flex items-center gap-2" data-tag-color-menu>
        <span class="badge badge-lg p-0 gap-0 overflow-visible flex-1 justify-between min-w-0" :class="{ 'badge-outline': !chosen.has(r.tag) }"
              :style="{ borderColor: colorOf(r.tag), borderWidth: '2px', color: chosen.has(r.tag) ? fg(colorOf(r.tag)) : 'var(--color-base-content)', background: chosen.has(r.tag) ? colorOf(r.tag) : '' }">
          <button type="button" class="pl-2.5 pr-1.5 h-full cursor-pointer flex-1 text-left truncate" :data-tag="r.tag"
                  :title="[r.def, r.group ? groups[r.group] : ''].filter(Boolean).join(' — ')" :aria-pressed="chosen.has(r.tag)" @click="toggle(r.tag)">
            <span class="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle border" :style="{ background: colorOf(r.tag), borderColor: chosen.has(r.tag) ? fg(colorOf(r.tag)) : colorOf(r.tag) }" aria-hidden="true" />{{ r.tag }}<span v-if="r.count" class="ml-1 opacity-70">{{ r.count }}</span>
          </button>
          <button type="button" class="pr-2 pl-1 h-full cursor-pointer border-l border-current/30" :aria-label="`${t('reader.color')}: ${r.tag}`"
                  :aria-expanded="menu === r.tag" :title="t('reader.color')" :data-testid="`tag-color-${r.tag}`"
                  @click.stop="openMenu(r.tag, $event.currentTarget.parentElement)">
            <span class="block w-3.5 h-3.5 rounded-full border border-current/40" :style="{ background: colorOf(r.tag) }" />
          </button>
        </span>
      </li>
      <li v-if="!rows.length" class="text-xs text-text-muted">{{ t('table.empty') }}</li>
    </ul>
    <!-- menu da etiqueta: só a cor (o Leitor tem também os estilos de marcação) -->
    <div v-if="menu" role="menu" data-tag-color-menu class="fixed z-50 flex flex-col gap-2 p-2 rounded-box bg-base-100 border border-base-300 shadow-lg text-base-content overflow-y-auto"
         :style="{ left: `${menuPos.x}px`, top: `${menuPos.y}px`, maxHeight: `calc(100dvh - ${menuPos.y}px - 8px)` }" data-testid="tag-color-menu">
      <ColorPicker :model-value="colorOf(menu)" :palettes="PALETTES" @update:model-value="setColor(menu, $event)">
        <button type="button" class="btn btn-xs btn-ghost ml-auto" :disabled="!tagColors.custom[menu]" @click="resetColor(menu)">{{ t('reader.color_reset') }}</button>
      </ColorPicker>
    </div>
  </div>
  <p v-else class="text-xs text-text-muted">{{ t('explore.tags_none') }}</p>
</template>
