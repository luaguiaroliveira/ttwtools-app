<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../api/index.js'
import QueryBox from './QueryBox.vue'
import HelpTip from '../../components/HelpTip.vue'
const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const f = ref({ left: 5, right: 5, unit: 'form', min_freq: 2, sort: 'll' })
const data = ref(null)
const error = ref(null)
async function run(node) {
  error.value = null
  try { data.value = await api.explore.collocates({ corpus: props.corpus, layer: props.layer, node, ...f.value }) }
  catch (err) { error.value = err.message }
}
const fx = (v, d = 2) => (v === null || v === undefined ? '—' : v.toFixed(d))
</script>
<template>
  <section class="flex flex-col gap-3">
    <QueryBox :label="t('explore.node')" @submit="run">
      <label class="form-control"><span class="label-text">{{ t('explore.window') }}</span>
        <span class="flex gap-1"><input v-model.number="f.left" type="number" min="0" max="20" class="input input-sm w-16" :aria-label="t('explore.left')" />
          <input v-model.number="f.right" type="number" min="0" max="20" class="input input-sm w-16" :aria-label="t('explore.right')" /></span></label>
      <label class="form-control"><span class="label-text">{{ t('explore.unit') }}</span>
        <select v-model="f.unit" class="select select-sm"><option v-for="u in ['form', 'lemma', 'word_pos', 'pos']" :key="u" :value="u">{{ t(`explore.unit.${u}`) }}</option></select></label>
      <label class="form-control w-24"><span class="label-text">{{ t('explore.min_freq') }}</span>
        <input v-model.number="f.min_freq" type="number" min="1" class="input input-sm" /></label>
      <label class="form-control"><span class="label-text">{{ t('explore.measure') }}</span>
        <select v-model="f.sort" class="select select-sm"><option value="ll">log-likelihood</option><option value="mi">MI</option><option value="t">T-score</option><option value="freq">freq</option></select></label>
    </QueryBox>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <div v-if="data" class="overflow-x-auto">
      <p class="text-sm mb-1">{{ data.node }} · {{ data.node_freq }}× <HelpTip topic="keyness" /></p>
      <table class="table table-xs"><thead><tr><th>{{ t('explore.collocate') }}</th><th class="text-right">{{ t('explore.freq') }}</th>
        <th class="text-right">LL</th><th class="text-right">MI</th><th class="text-right">T</th><th>{{ t('explore.position') }}</th></tr></thead>
        <tbody><tr v-for="r in data.rows" :key="r.collocate"><td>{{ r.collocate }}</td><td class="text-right tabular-nums">{{ r.freq }}</td>
          <td class="text-right tabular-nums">{{ fx(r.ll) }}</td><td class="text-right tabular-nums">{{ fx(r.mi) }}</td>
          <td class="text-right tabular-nums">{{ fx(r.t_score) }}</td><td>{{ r.position }}</td></tr></tbody></table>
    </div>
  </section>
</template>
