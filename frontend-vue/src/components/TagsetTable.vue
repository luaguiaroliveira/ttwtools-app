<script setup>
// Tabela de um repertório de tags: tag, grupo, definição, exemplo e a documentação oficial quando houver.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TagDoc from './TagDoc.vue'
const props = defineProps({ data: { type: Object, required: true } })
const { t } = useI18n()
const q = ref('')
const group = ref('')
const groups = computed(() => Object.fromEntries((props.data?.groups ?? []).map((g) => [g.id, g.label])))
const tags = computed(() => (props.data?.tags ?? []).filter((tg) => (!group.value || tg.group === group.value)
  && (!q.value || `${tg.tag} ${tg.definition} ${tg.example} ${tg.doc?.feature ?? ''}`.toLowerCase().includes(q.value.toLowerCase()))))
</script>
<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap gap-2">
      <input v-model="q" class="input input-sm flex-1 min-w-40" :placeholder="t('tagset.search')" :aria-label="t('tagset.search')" />
      <select v-model="group" class="select select-sm" :aria-label="t('tagset.all_groups')">
        <option value="">{{ t('tagset.all_groups') }}</option>
        <option v-for="g in data?.groups ?? []" :key="g.id" :value="g.id">{{ g.label }}</option>
      </select>
    </div>
    <p class="text-xs text-text-muted">{{ t('tagset.count', { n: tags.length }) }}</p>
    <div class="overflow-x-auto" tabindex="0" role="region" :aria-label="data?.name">
      <table class="table table-xs" data-testid="tagset-table">
        <thead><tr>
          <th scope="col">{{ t('tagset.table_tag') }}</th>
          <th scope="col">{{ t('tagset.table_group') }}</th>
          <th scope="col">{{ t('tagset.table_definition') }}</th>
          <th scope="col">{{ t('tagset.table_example') }}</th>
        </tr></thead>
        <tbody>
          <tr v-for="tg in tags" :key="tg.tag">
            <td class="font-mono font-bold align-top whitespace-nowrap">{{ tg.tag }}</td>
            <td class="align-top text-xs text-text-muted whitespace-nowrap">{{ groups[tg.group] }}</td>
            <td class="align-top">{{ tg.definition }}<TagDoc :doc="tg.doc" :version="data?.doc_version" /></td>
            <td class="align-top text-xs italic">{{ tg.example }}</td>
          </tr>
          <tr v-if="!tags.length"><td colspan="4" class="text-text-muted">{{ t('table.empty') }}</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
