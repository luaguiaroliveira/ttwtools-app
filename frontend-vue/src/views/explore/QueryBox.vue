<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import HelpTip from '../../components/HelpTip.vue'
const props = defineProps({ initial: { type: String, default: '' }, label: { type: String, default: '' } })
const emit = defineEmits(['submit'])
const { t } = useI18n()
const q = ref(props.initial)
</script>
<template>
  <form class="flex flex-wrap items-end gap-2" @submit.prevent="q.trim() && emit('submit', q.trim())">
    <label class="form-control flex-1 min-w-56">
      <span class="label-text flex items-center gap-1">{{ label || t('explore.query') }}<HelpTip term="query" /></span>
      <input v-model="q" class="input input-sm" data-testid="query-input" autocomplete="off" />
      <span class="label-text-alt opacity-60 flex items-center gap-1">{{ t('explore.query_hint') }}<HelpTip term="query" /></span>
    </label>
    <slot />
    <button class="btn btn-sm btn-primary" type="submit" data-testid="query-go">{{ t('explore.go') }}</button>
  </form>
</template>
