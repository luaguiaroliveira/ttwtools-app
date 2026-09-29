<script setup>
// Lista de arquivos abertos recentemente: abrir, tirar da lista ou esvaziar.
import { useI18n } from 'vue-i18n'
defineProps({ files: { type: Array, default: () => [] }, disabled: Boolean })
const emit = defineEmits(['open', 'remove', 'clear'])
const { t } = useI18n()
</script>
<template>
  <div class="flex flex-col gap-1" data-testid="recent-list">
    <p v-if="!files.length" class="text-sm opacity-70 px-2 py-1">{{ t('project.recent_empty') }}</p>
    <ul v-else class="flex flex-col">
      <li v-for="f in files" :key="f.path" class="flex items-center gap-1 group">
        <button type="button" class="flex-1 min-w-0 flex items-center gap-2 text-left rounded px-2 py-1.5 hover:bg-base-300 disabled:opacity-50 disabled:hover:bg-transparent"
                :disabled="disabled || !f.exists" :title="f.exists ? f.path : t('project.recent_missing')" @click="emit('open', f.path)">
          <span class="badge badge-outline badge-sm font-mono shrink-0">{{ f.ext }}</span>
          <span class="min-w-0 flex flex-col leading-tight">
            <span class="text-sm font-medium truncate" :class="{ 'line-through': !f.exists }">{{ f.name }}</span>
            <span class="text-xs opacity-60 truncate">{{ f.exists ? f.folder : t('project.recent_missing') }}</span>
          </span>
        </button>
        <button type="button" class="btn btn-ghost btn-xs btn-square opacity-60 hover:opacity-100" :title="t('project.recent_remove')"
                :aria-label="`${t('project.recent_remove')}: ${f.name}`" @click="emit('remove', f.path)">✕</button>
      </li>
    </ul>
    <button v-if="files.length" type="button" class="btn btn-ghost btn-xs self-start" @click="emit('clear')">{{ t('project.recent_clear') }}</button>
  </div>
</template>
