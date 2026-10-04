<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { api } from '../../api/index.js'
import QueryBox from './QueryBox.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'
import { distinctLabels } from '../../utils/labels.js'
const fig = ref(null)
const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const router = useRouter()
const rowH = ref(14)   // altura de cada linha (px): menor = mais textos visíveis de uma vez
const fontPx = computed(() => Math.max(8, Math.min(12, rowH.value - 3)))
// clicar num texto abre o leitor nele (camada e corpus são os da sessão)
const openInReader = (filename) => router.push({ path: '/leitor', query: { file: filename } })
const data = ref(null)
const error = ref(null)
const busy = ref(false)
const asTable = ref(false)
const labels = computed(() => distinctLabels(data.value?.per_document.map((d) => d.filename) ?? [], 26))
async function run(query) {
  error.value = null
  busy.value = true
  try { data.value = await api.explore.dispersion({ corpus: props.corpus, layer: props.layer, query }) }
  catch (err) { error.value = err.message }
  finally { busy.value = false }
}
const ROW = 13
const f3 = (v) => (v === null || v === undefined ? '—' : v.toFixed(3))
</script>
<template>
  <section class="flex flex-col gap-3">
    <QueryBox :busy="busy" @submit="run" />
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <p role="status" class="font-medium">{{ t('explore.dp', { dp: f3(data.dp), dp_norm: f3(data.dp_norm), range: data.range, documents: data.documents }) }}
        <HelpTip topic="dispersao" /></p>
      <div class="flex items-center gap-1"><CopyCode analysis="dispersion" :params="{ corpus, query: data.query, layer }" />
        <ExportMenu :name="`dispersao_${data.query}`" :rows="data.per_document.map(({ positions, ...r }) => r)" :svg-root="fig" /></div>
      <figure ref="fig" class="flex flex-col gap-1">
        <figcaption class="text-sm flex items-center">{{ t('explore.barcode') }}
          <button class="btn btn-xs btn-ghost ml-auto" @click="asTable = !asTable">{{ asTable ? t('chart.as_chart') : t('chart.as_table') }}</button></figcaption>
        <table v-if="asTable" class="table table-xs"><thead><tr><th>{{ t('explore.file') }}</th><th class="text-right">{{ t('explore.freq') }}</th><th class="text-right">tokens</th></tr></thead>
          <tbody><tr v-for="d in data.per_document" :key="d.filename"><td>{{ d.filename }}</td><td class="text-right">{{ d.freq }}</td><td class="text-right">{{ d.size }}</td></tr></tbody></table>
        <template v-else>
          <label class="flex items-center gap-2 text-xs w-fit">{{ t('chart.row_height') }}
            <input v-model.number="rowH" type="range" min="6" max="30" step="1" class="range range-xs range-primary w-40" data-testid="disp-row-height" />
            <span class="text-text-muted tabular-nums w-8">{{ rowH }}px</span></label>
          <ul class="ttw-scroll rounded-box border border-base-300 p-1" data-testid="disp-rows">
            <li v-for="(d, i) in data.per_document" :key="d.filename">
              <button type="button" class="disp-row" :style="{ height: `${rowH}px`, fontSize: `${fontPx}px` }" :title="`${d.filename}: ${d.freq}`"
                      :aria-label="`${t('explore.open_reader')}: ${d.filename} (${d.freq})`" @click="openInReader(d.filename)">
                <span class="disp-label">{{ labels[i] }}</span>
                <span class="disp-strip"><i v-for="(p, j) in d.positions" :key="j" :style="{ left: `${p * 100}%` }" /></span>
                <span class="disp-n">{{ d.freq }}</span>
              </button>
            </li>
          </ul>
          <!-- cópia em SVG só para exportar (SVG/PNG); fora da tela e escondida dos leitores de tela -->
          <div class="absolute w-0 h-0 overflow-hidden invisible" aria-hidden="true">
            <svg :viewBox="`0 0 640 ${data.per_document.length * ROW + 4}`" width="640" :height="data.per_document.length * ROW + 4">
              <g v-for="(d, i) in data.per_document" :key="d.filename" :transform="`translate(0 ${i * ROW + 2})`">
                <text x="200" :y="ROW - 4" text-anchor="end" class="fill-current text-[10px]">{{ labels[i] }}</text>
                <rect x="208" y="1" width="424" :height="ROW - 3" class="fill-base-200" />
                <rect v-for="(p, j) in d.positions" :key="j" :x="208 + p * 424" y="1" width="1.500" :height="ROW - 3" class="fill-orange-text" />
              </g>
            </svg>
          </div>
        </template>
      </figure>
    </template>
  </section>
</template>
