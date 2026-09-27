<script setup>
// Tabela ligada a uma rota paginada: `fetchPage({offset, limit})` devolve {rows, total}.
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({
  columns: { type: Array, required: true },        // [{key, label, numeric?}]
  fetchPage: { type: Function, required: true },
  pageSize: { type: Number, default: 50 },
  caption: { type: String, default: '' },
})
const { t } = useI18n()
const rows = ref([])
const total = ref(0)
const offset = ref(0)
const limit = ref(props.pageSize)
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const page = await props.fetchPage({ offset: offset.value, limit: limit.value })
    rows.value = page.rows
    total.value = page.total
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
}
function go(delta) {
  offset.value = Math.max(0, Math.min(offset.value + delta * limit.value, Math.max(0, total.value - 1)))
  load()
}
watch(() => props.fetchPage, () => { offset.value = 0; load() })
watch(limit, () => { offset.value = 0; load() })
onMounted(load)
defineExpose({ reload: load })
</script>
<template>
  <div class="flex flex-col gap-2">
    <div class="overflow-x-auto">
      <table class="table table-sm table-zebra" :aria-busy="loading">
        <caption v-if="caption" class="text-left text-sm opacity-70">{{ caption }}</caption>
        <thead><tr><th v-for="c in columns" :key="c.key" scope="col" :class="{ 'text-right': c.numeric }">{{ c.label }}</th></tr></thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="i">
            <td v-for="c in columns" :key="c.key" :class="{ 'text-right tabular-nums': c.numeric }">
              <slot :name="`cell-${c.key}`" :row="row">{{ row[c.key] }}</slot>
            </td>
          </tr>
          <tr v-if="!loading && !rows.length"><td :colspan="columns.length" class="opacity-70">{{ t('table.empty') }}</td></tr>
        </tbody>
      </table>
    </div>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error.message }}</p>
    <div class="flex items-center gap-2 text-sm">
      <button class="btn btn-sm" :disabled="offset === 0 || loading" @click="go(-1)">{{ t('table.previous') }}</button>
      <span data-testid="table-range">{{ total ? t('table.range', { from: offset + 1, to: Math.min(offset + limit, total), total }) : '' }}</span>
      <button class="btn btn-sm" :disabled="offset + limit >= total || loading" @click="go(1)">{{ t('table.next') }}</button>
      <label class="ml-auto flex items-center gap-2">
        {{ t('table.page_size') }}
        <select v-model.number="limit" class="select select-sm"><option v-for="n in [25, 50, 100]" :key="n">{{ n }}</option></select>
      </label>
    </div>
  </div>
</template>
