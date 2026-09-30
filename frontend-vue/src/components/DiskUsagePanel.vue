<script setup>
// Uso de disco do TTWtools (ttwtools.storage.disk_usage): cópias de trabalho e cache, com botão de limpar.
// Com `banner`, só mostra o aviso quando há resto grande (ao iniciar) e some quando não há.
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../api/index.js'

const props = defineProps({ banner: Boolean })
const { t } = useI18n()
const usage = ref(null)
const error = ref(null)
const note = ref('')
const BIG = 1024 ** 3                              // resto acima de 1 GB merece aviso
const mb = (b) => (b / 1e6).toFixed(b >= 1e9 ? 0 : 1)
const load = async () => { try { usage.value = await api.utils.diskUsage() } catch (err) { error.value = err.message } }
onMounted(load)
const bigLeftover = computed(() => usage.value && (usage.value.orphans_bytes >= BIG || usage.value.last_purge.bytes >= BIG))
const clear = async () => {
  error.value = null
  try {
    const r = await api.utils.diskClear()
    note.value = t('disk.cleared', { mb: mb(r.cache_freed + r.workdirs_freed) })
    await load()
  } catch (err) { error.value = err.message }
}
const state = (w) => (w.mine || w.alive ? t('disk.in_use') : w.alive === false ? t('disk.abandoned') : t('disk.no_owner'))
</script>

<template>
  <div v-if="banner && bigLeftover" role="status" class="alert alert-warning text-sm flex flex-wrap items-center gap-2" data-testid="disk-warning">
    <span class="flex-1 min-w-48">{{ usage.last_purge.bytes >= BIG ? t('disk.warn_purged', { mb: mb(usage.last_purge.bytes) }) : t('disk.warn_orphans', { mb: mb(usage.orphans_bytes) }) }}</span>
    <button v-if="usage.orphans_bytes >= BIG" class="btn btn-xs" @click="clear">{{ t('disk.clear') }}</button>
  </div>
  <div v-else-if="!banner" class="flex flex-col gap-3" data-testid="disk-usage">
    <p class="text-sm opacity-80">{{ t('disk.intro') }}</p>
    <p v-if="error" role="alert" class="text-error text-sm">{{ error }}</p>
    <template v-if="usage">
      <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt class="text-text-muted">{{ t('disk.free') }}</dt><dd>{{ mb(usage.free_bytes) }} MB</dd>
        <dt class="text-text-muted">{{ t('disk.workdirs') }}</dt><dd>{{ mb(usage.workdirs_bytes) }} MB</dd>
        <dt class="text-text-muted">{{ t('disk.cache') }}</dt><dd>{{ mb(usage.cache_bytes) }} MB {{ t('disk.of_limit', { mb: mb(usage.cache_limit_bytes) }) }}</dd>
      </dl>
      <details v-if="usage.workdirs.length || usage.cache.length" class="text-xs">
        <summary class="cursor-pointer opacity-80">{{ t('modules.details') }}</summary>
        <ul class="mt-1 flex flex-col gap-1">
          <li v-for="w in usage.workdirs" :key="w.path"><code>{{ w.kind }}</code> · {{ mb(w.bytes) }} MB · {{ state(w) }}</li>
          <li v-for="c in usage.cache" :key="c.key"><code>{{ c.key }}</code> · {{ mb(c.bytes) }} MB · {{ t('disk.rebuildable') }}</li>
        </ul>
      </details>
      <div class="flex flex-wrap items-center gap-2">
        <button class="btn btn-sm" data-testid="disk-clear" @click="clear">{{ t('disk.clear') }}</button>
        <span class="text-xs text-text-muted">{{ t('disk.clear_hint') }}</span>
      </div>
      <p v-if="note" role="status" class="text-sm">{{ note }}</p>
    </template>
  </div>
</template>
