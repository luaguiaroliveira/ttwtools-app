<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useSession } from '../stores/session.js'
import { download } from '../utils/export.js'
import { post } from '../api/client.js'
const props = defineProps({ corpus: { type: String, required: true }, title: { type: String, default: null } })
const { t } = useI18n()
const session = useSession()
const { layers } = storeToRefs(session)   // camada ativa do mesmo corpus (ver `header.layer`)
async function exportLayer(tool, format) {
  const r = await post(`/api/corpora/${encodeURIComponent(props.corpus)}/export`, { format, layer: tool })
  download(`${props.corpus}_${tool}.${format}`, r.content)
}
defineExpose({ reload: () => session.loadLayers() })
</script>
<template>
  <section class="flex flex-col gap-2" :aria-label="t('layers.title')">
    <h2 class="text-xl font-bold">{{ title ?? t('layers.title') }}</h2>
    <p v-if="!layers.length" class="text-sm text-text-muted">{{ t('layers.none') }}</p>
    <ul class="flex flex-col gap-2">
      <li v-for="l in layers" :key="l.tool + l.config_hash" class="bg-base-200 rounded-box p-3 flex flex-wrap gap-2 items-center">
        <span class="layer-dot" :data-tool="l.tool" aria-hidden="true"></span>
        <span class="font-medium">{{ l.tool }}</span>
        <span class="badge badge-ghost">{{ l.model }}</span>
        <span class="text-xs text-text-muted">v{{ l.tool_version }}</span>
        <span class="text-sm">{{ t('layers.coverage', { docs: l.documents, tokens: l.tokens }) }}</span>
        <span class="ml-auto join">
          <button v-for="fm in ['conllu', 'vrt', 'csv']" :key="fm" class="btn btn-xs join-item" :title="t('layers.export')" @click="exportLayer(l.tool, fm)">{{ fm }}</button>
        </span>
        <button class="btn btn-xs" :class="{ 'btn-primary': session.layer === l.tool }" @click="session.setLayer(l.tool)">{{ t('layers.use') }}</button>
        <details class="w-full text-xs"><summary>{{ t('layers.config') }}</summary><pre class="whitespace-pre-wrap">{{ JSON.stringify(l.config, null, 1) }}</pre></details>
      </li>
    </ul>
  </section>
</template>
