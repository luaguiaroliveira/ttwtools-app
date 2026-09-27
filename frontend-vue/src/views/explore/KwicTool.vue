<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { api } from '../../api/index.js'
import QueryBox from './QueryBox.vue'
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
</script>
<template>
  <section class="flex flex-col gap-3">
    <QueryBox :initial="String(route.query.q || '')" @submit="submit">
      <label class="form-control w-24"><span class="label-text">{{ t('explore.context') }}</span>
        <input v-model.number="context" type="number" min="1" max="30" class="input input-sm" @change="query && load()" /></label>
      <label class="form-control"><span class="label-text">{{ t('explore.sort') }}</span>
        <select v-model="sort" class="select select-sm" @change="query && submit(query)">
          <option v-for="s in ['position', 'left', 'right']" :key="s" :value="s">{{ t(`explore.sort.${s}`) }}</option></select></label>
    </QueryBox>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="data">
      <p role="status" class="text-sm" data-testid="kwic-total">{{ t('table.range', { from: data.total ? offset + 1 : 0, to: Math.min(offset + limit, data.total), total: data.total }) }}</p>
      <!-- computador e tablet: tabela alinhada no centro -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="table table-xs" :aria-busy="loading">
          <thead><tr><th scope="col" class="text-right">{{ t('explore.left') }}</th><th scope="col">{{ t('explore.match') }}</th>
            <th scope="col">{{ t('explore.right') }}</th><th scope="col">{{ t('explore.pos') }}</th><th scope="col">{{ t('explore.file') }}</th></tr></thead>
          <tbody>
            <tr v-for="(l, i) in data.lines" :key="i" class="hover cursor-pointer" tabindex="0" :title="l.sentence"
                @click="open(l)" @keydown.enter="open(l)">
              <td class="text-right whitespace-nowrap overflow-hidden max-w-[20rem]" style="direction: rtl"><bdi>{{ l.left }}</bdi></td>
              <td class="font-bold text-primary whitespace-nowrap">{{ l.match }}</td>
              <td class="whitespace-nowrap overflow-hidden max-w-[20rem]">{{ l.right }}</td>
              <td class="text-xs opacity-70">{{ l.pos }}</td>
              <td class="text-xs opacity-70 whitespace-nowrap">{{ l.filename }}:{{ l.start_char }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- celular: cartões -->
      <ul class="sm:hidden flex flex-col gap-2">
        <li v-for="(l, i) in data.lines" :key="i">
          <button class="card bg-base-200 p-2 text-left w-full" @click="open(l)">
            <span class="text-sm">{{ l.left }} <b class="text-primary">{{ l.match }}</b> {{ l.right }}</span>
            <span class="text-xs opacity-60">{{ l.filename }} · {{ l.pos }}</span>
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
