<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { api } from '../../api/index.js'
import QueryBox from './QueryBox.vue'
import HelpTip from '../../components/HelpTip.vue'
import CopyCode from '../../components/CopyCode.vue'
import ExportMenu from '../../components/ExportMenu.vue'

const props = defineProps({ corpus: String, layer: String })
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const query = ref('')
const context = ref(5)
const sort = ref('position')
const limit = ref(50)
const offset = ref(0)
const data = ref(null)
const error = ref(null)
const loading = ref(false)
async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await api.explore.kwic({ corpus: props.corpus, layer: props.layer, query: query.value, context: context.value,
      sort: sort.value, limit: limit.value, offset: offset.value })
  } catch (err) { error.value = err.message } finally { loading.value = false }
}
function submit(q) { query.value = q; offset.value = 0; load() }
onMounted(() => { if (route.query.q) submit(String(route.query.q)) })
function page(d) { offset.value = Math.max(0, offset.value + d * limit.value); load() }
function open(line) { router.push({ path: '/explorar/leitor', query: { file: line.filename, pos: line.start_char, end: line.end_char } }) }
// Cor da classe gramatical (tokens em style.css); UPOS e tags do Penn começam com a mesma letra
const posBucket = (p) => {
  p = p || ''   // camadas sem UPOS/XPOS trazem null
  const c = p[0]
  return c === 'N' ? 'noun' : c === 'V' ? 'verb' : (c === 'J' || p.startsWith('ADJ')) ? 'adj' : (c === 'R' || p.startsWith('ADV')) ? 'adv' : 'other'
}
</script>
<template>
  <section id="busca-kwic" class="flex flex-col gap-3">
    <div class="flex justify-end gap-1">
      <template v-if="data"><CopyCode analysis="kwic" :params="{ corpus, query, layer, context, limit, offset, sort }" />
        <ExportMenu :name="`kwic_${query}`" :rows="data.lines" :columns="['filename', 'start_char', 'left', 'match', 'right', 'pos', 'lemma']" /></template>
      <HelpTip topic="kwic" /></div>
    <QueryBox :initial="String(route.query.q || '')" :busy="loading" @submit="submit">
      <label class="ttw-field w-24"><span class="ttw-label">{{ t('explore.context') }}</span>
        <input v-model.number="context" type="number" min="1" max="30" class="input input-sm" @change="query && load()" /></label>
      <label class="ttw-field"><span class="ttw-label">{{ t('explore.sort') }}</span>
        <select v-model="sort" class="select select-sm" @change="query && submit(query)">
          <option v-for="s in ['position', 'left', 'right']" :key="s" :value="s">{{ t(`explore.sort.${s}`) }}</option></select></label>
    </QueryBox>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <p role="status" class="text-sm" data-testid="kwic-total">{{ t('table.range', { from: data.total ? offset + 1 : 0, to: Math.min(offset + limit, data.total), total: data.total }) }}</p>
      <!-- computador e tablet: tabela alinhada no centro. A frase inteira (title) fica em todas as células menos a Classe, que tem a própria dica -->
      <div class="hidden sm:block ttw-scroll">
        <table class="table table-xs" :aria-busy="loading">
          <thead><tr><th scope="col" class="text-right">{{ t('explore.left') }}</th><th scope="col">{{ t('explore.match') }}</th>
            <th scope="col">{{ t('explore.right') }}</th><th scope="col">{{ t('explore.pos') }}</th><th scope="col">{{ t('explore.file') }}</th></tr></thead>
          <tbody>
            <tr v-for="(l, i) in data.lines" :key="i" class="hover cursor-pointer" tabindex="0"
                @click="open(l)" @keydown.enter="open(l)">
              <td class="text-right whitespace-nowrap overflow-hidden max-w-[20rem]" style="direction: rtl" :title="l.sentence"><bdi>{{ l.left }}</bdi></td>
              <td class="font-bold text-primary whitespace-nowrap" :title="l.sentence">{{ l.match }}</td>
              <td class="whitespace-nowrap overflow-hidden max-w-[20rem]" :title="l.sentence">{{ l.right }}</td>
              <td class="text-xs"><span v-if="l.pos" class="pos-tag" :data-bucket="posBucket(l.pos)">{{ l.pos }}</span></td>
              <td class="text-xs text-text-muted whitespace-nowrap" :title="l.sentence">{{ l.filename }}:{{ l.start_char }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- celular: cartões -->
      <ul class="sm:hidden flex flex-col gap-2">
        <li v-for="(l, i) in data.lines" :key="i">
          <button class="card bg-base-200 p-2 text-left w-full" @click="open(l)">
            <span class="text-sm">{{ l.left }} <b class="text-primary">{{ l.match }}</b> {{ l.right }}</span>
            <span class="text-xs text-text-muted">{{ l.filename }}<template v-if="l.pos"> · {{ l.pos }}</template></span>
          </button>
        </li>
      </ul>
      <div class="flex gap-2">
        <button class="btn btn-sm" :disabled="offset === 0" @click="page(-1)">{{ t('table.previous') }}</button>
        <button class="btn btn-sm" :disabled="offset + limit >= data.total" data-testid="kwic-next" @click="page(1)">{{ t('table.next') }}</button>
      </div>
    </template>
  </section>
</template>
