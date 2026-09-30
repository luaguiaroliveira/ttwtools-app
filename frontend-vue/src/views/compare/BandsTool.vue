<script setup>
import BusyModal from '../../components/BusyModal.vue'
// Faixas de frequência lexical do corpus contra uma referência (lista do catálogo ou outro corpus).
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import BarChart from '../../components/BarChart.vue'
const props = defineProps({ corpus: String })
const { t } = useI18n()
const { corpora, layer } = storeToRefs(useSession())
const refs = ref([])
const f = ref({ reference: '', unit: 'form', limits: '1000, 2000, 3000, 5000, 10000' })
const data = ref(null)
const error = ref(null)
const lastParams = ref(null)
const chart = ref(null)
const options = computed(() => [
  ...[...new Map(refs.value.map((r) => [r.ref, r])).values()].map((r) => ({ value: r.ref, label: `${r.name} · ${r.version}` })),
  ...corpora.value.filter((c) => c.name !== props.corpus).map((c) => ({ value: c.name, label: c.name })),
])
onMounted(async () => {
  refs.value = (await api.compare.references()).references
  f.value.reference = options.value[0]?.value ?? ''
})
const label = (r) => (r.band === 'off_list' ? t('bands.off_list') : r.to ? `${r.from}–${r.to}` : t('bands.beyond', { n: r.from - 1 }))
const busy = ref(false)
async function run() {
  error.value = null
  const bands = f.value.limits.split(/[,;\s]+/).map(Number).filter((n) => n > 0)
  lastParams.value = { corpus: props.corpus, reference: f.value.reference, unit: f.value.unit, layer: layer.value }
  busy.value = true
  try {
    data.value = await api.compare.bands({ ...lastParams.value, bands })
  } catch (err) { error.value = err.message } finally { busy.value = false }
}
</script>
<template>
  <section class="flex flex-col gap-3">
    <BusyModal :open="busy" :delay="350" :title="t('compare.calculating')" :message="t('compare.calculating_hint')" />
    <p class="text-sm opacity-80">{{ t('bands.intro') }}</p>
    <form class="flex flex-wrap items-end gap-2" @submit.prevent="run">
      <label class="ttw-field"><span class="ttw-label">{{ t('compare.reference') }}</span>
        <select v-model="f.reference" class="select select-sm" data-testid="bands-ref">
          <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option></select></label>
      <label class="ttw-field"><span class="ttw-label">{{ t('explore.unit') }}</span>
        <select v-model="f.unit" class="select select-sm"><option v-for="u in ['form', 'lemma', 'word_pos']" :key="u" :value="u">{{ t(`explore.unit.${u}`) }}</option></select></label>
      <label class="ttw-field w-56"><span class="ttw-label">{{ t('bands.limits') }}</span><input v-model="f.limits" class="input input-sm" /></label>
      <button class="btn btn-sm btn-primary" :disabled="!f.reference" data-testid="bands-run">{{ t('compare.run') }}</button>
      <HelpTip topic="faixas_frequencia" />
    </form>
    <p v-if="!refs.length" class="text-sm text-text-muted">{{ t('compare.ref.none_installed') }}</p>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <p class="text-sm font-medium">{{ t('bands.summary', { tokens: data.tokens, types: data.types, target: data.target, reference: data.reference, rw: data.reference_words }) }}</p>
      <div class="flex gap-1"><CopyCode analysis="bands" :params="lastParams" /><ExportMenu name="faixas" :rows="data.rows" :svg-root="chart" /></div>
      <div ref="chart"><BarChart :title="t('bands.tokens') + ' (%)'" :items="data.rows.map((r) => ({ label: label(r), value: r.pct_tokens }))" value-label="%" /></div>
      <div class="ttw-scroll">
        <table class="table table-xs" data-testid="bands-table">
          <thead><tr><th>{{ t('bands.band') }}</th><th class="text-right">{{ t('bands.tokens') }}</th><th class="text-right">%</th>
            <th class="text-right">{{ t('bands.types') }}</th><th class="text-right">%</th><th>{{ t('bands.examples') }}</th></tr></thead>
          <tbody><tr v-for="r in data.rows" :key="r.band">
            <td class="font-medium">{{ label(r) }}</td><td class="text-right tabular-nums">{{ r.tokens }}</td><td class="text-right tabular-nums">{{ r.pct_tokens.toFixed(1) }}</td>
            <td class="text-right tabular-nums">{{ r.types }}</td><td class="text-right tabular-nums">{{ r.pct_types.toFixed(1) }}</td>
            <td class="text-xs opacity-80">{{ r.examples.join(', ') }}</td></tr></tbody>
        </table>
      </div>
    </template>
  </section>
</template>
