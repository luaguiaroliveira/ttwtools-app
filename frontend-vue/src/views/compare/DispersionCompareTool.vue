<script setup>
// Dispersão de Gries comparada: dois quadros (lado 1 × lado 2, corpus 2 ou dois grupos do corpus ativo),
// cada um com o mapa de calor por faixa na cor do lado, e ordenação dos textos (nome, frequência ou DP contribuído).
// A consulta sai do mesmo seletor do Explorar (etiquetas coloridas): os traços usam a cor da etiqueta e o
// lado fica no fundo (faixas) e no rótulo; em consultas de texto livre, o traço mantém a cor do lado.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { api } from '../../api/index.js'
import { useSession } from '../../stores/session.js'
import { useCompare } from '../../stores/compare.js'
import { useTagColors } from '../../stores/tagColors.js'
import QueryBox from '../explore/QueryBox.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import DispersionChart from '../../components/charts/DispersionChart.vue'
import { clauseOf, sortRows, tagOf } from '../../utils/dispersion.js'
const props = defineProps({ corpus: String })
const { t } = useI18n()
const router = useRouter()
const { layer } = storeToRefs(useSession())
const cmp = useCompare()
const tagColors = useTagColors()
const query = ref('')
const order = ref('name')
const data = ref(null)
const error = ref(null)
const busy = ref(false)
const charts = ref([])
const setChart = (el, si) => { if (el) charts.value[si] = el }
const sides = computed(() => (props.corpus ? cmp.sides(props.corpus) : []))
const f3 = (v) => (v === null || v === undefined ? '—' : v.toFixed(3))
// A cor do traço: a etiqueta vence quando a consulta é uma etiqueta; senão, a cor do lado.
const strokeOf = (si) => { const tg = tagOf(query.value); return tg ? tagColors.color(tg) : cmp.colors[si] }

async function run(q) {
  const v = q.trim()
  if (!v) return
  query.value = v
  const [s1, s2] = sides.value
  error.value = null
  busy.value = true
  try {
    data.value = await api.compare.dispersion({
      corpus: props.corpus, query: v, layer: layer.value,
      where: s1.where, reference: cmp.sameCorpus ? props.corpus : s2.corpus, reference_where: s2.where,
    })
  } catch (err) { error.value = err.message; data.value = null }
  finally { busy.value = false }
}

// Cada lado vira uma linha por texto com uma consulta só (cells[0]).
const toRows = (side) => side.per_document.map((d) => ({ filename: d.filename, size: d.size, cells: [{ freq: d.freq, positions: d.positions }] }))
const dataSides = computed(() => (data.value ? [data.value.target, data.value.reference] : []))
const orderedRows = computed(() => dataSides.value.map((side) => {
  const totalSize = side.per_document.reduce((s, d) => s + d.size, 0)
  return sortRows(toRows(side), order.value, side.freq, totalSize)
}))
const exportRows = computed(() => dataSides.value.flatMap((side, si) =>
  side.per_document.map((d) => ({ side: sides.value[si]?.label ?? side.corpus, file: d.filename, tokens: d.size, freq: d.freq }))))

function open(si, filename) {
  const side = sides.value[si]
  const params = { corpus: side?.corpus ?? props.corpus, file: filename }
  if (layer.value) params.layer = layer.value
  const cl = clauseOf(query.value)
  if (cl) { params.highlight = [cl.value]; if (cl.kind === 'pos') params.color = 'upos' }
  else params.q = query.value
  router.push({ path: '/leitor', query: params })
}
</script>
<template>
  <section class="flex flex-col gap-3">
    <p class="text-sm opacity-80">{{ t('disp_compare.intro') }}</p>
    <QueryBox :busy="busy" :corpus="corpus" :layer="layer" tags @submit="run">
      <label class="ttw-field"><span class="ttw-label">{{ t('disp_compare.order') }}</span>
        <select v-model="order" class="select select-sm" data-testid="disp-compare-order">
          <option value="name">{{ t('disp_compare.order.name') }}</option>
          <option value="freq">{{ t('disp_compare.order.freq') }}</option>
          <option value="dp">{{ t('disp_compare.order.dp') }}</option></select></label>
      <HelpTip topic="dispersao" />
    </QueryBox>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <div class="flex flex-wrap items-center gap-1">
        <CopyCode analysis="dispersion_compare" :params="{ corpus, query: data.query, layer, where: sides[0]?.where, reference: data.reference.corpus, reference_where: sides[1]?.where }" />
        <ExportMenu name="dispersao_comparada" :rows="exportRows" :canvas-root="charts[0]" />
      </div>
      <div class="grid gap-3 lg:grid-cols-2">
        <figure v-for="(side, si) in dataSides" :key="si" class="flex flex-col gap-1 rounded-box border border-base-300 p-2" :style="{ '--disp-band': cmp.colors[si] }">
          <figcaption class="text-sm font-medium flex flex-wrap items-baseline gap-x-2">
            <span class="inline-flex items-center gap-1.5"><span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: cmp.colors[si] }" aria-hidden="true" />{{ sides[si]?.label ?? side.corpus }}</span>
            <span class="text-text-muted text-xs font-normal">{{ t('explore.dp', { dp: f3(side.dp), dp_norm: f3(side.dp_norm), range: side.range, documents: side.documents }) }}</span>
          </figcaption>
          <p class="text-xs text-text-muted flex items-center gap-1.5">
            <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: strokeOf(si) }" aria-hidden="true" data-testid="disp-compare-stroke" />
            <span class="font-mono">{{ data.query }}</span>
            <span>{{ t('disp_compare.caption') }}</span>
          </p>
          <DispersionChart :ref="(el) => setChart(el, si)" :rows="orderedRows[si]" :colors="[strokeOf(si)]" :bands="10" :row-h="14" view="heat" @open="(f) => open(si, f)" />
        </figure>
      </div>
    </template>
  </section>
</template>
