<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { NAV } from './router.js'
import { useSession } from './stores/session.js'
import { LANGS, setLang } from './i18n.js'
import { THEMES, applyTheme, initialTheme } from './theme.js'
import NavIcon from './components/NavIcon.vue'
import TourOverlay from './components/TourOverlay.vue'
import ExplainOverlay from './components/ExplainOverlay.vue'

const { t, locale } = useI18n()
const session = useSession()
const { corpus, layer, layers, corpora, project, projectPath, unsaved } = storeToRefs(session)
const theme = ref(initialTheme())
const loadError = ref(null)
const explaining = ref(false)

onMounted(async () => {
  try { await session.load(); await session.checkPendingOpen() } catch (err) { loadError.value = err }
  window.addEventListener('focus', () => session.checkPendingOpen().catch(() => {}))
})
const changeTheme = (value) => { theme.value = value; applyTheme(value) }
const changeLang = (value) => setLang(value)
</script>

<template>
  <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:m-2 btn btn-sm">{{ t('app.skip') }}</a>
  <div class="min-h-dvh bg-base-100 text-base-content flex flex-col md:flex-row">
    <!-- trilho (tablet) e barra lateral (computador) -->
    <nav class="hidden md:flex flex-col gap-1 border-r border-base-300 bg-base-200 p-2 lg:w-56 md:w-20 shrink-0"
         :aria-label="t('nav.label')">
      <RouterLink to="/" class="font-bold text-lg px-2 py-3" :aria-label="t('app.title')">
        <span class="hidden lg:inline">{{ t('app.title') }}</span><span class="lg:hidden">TTW</span>
      </RouterLink>
      <RouterLink v-for="item in NAV" :key="item.name" :to="item.path"
                  class="btn btn-ghost justify-start gap-3 lg:px-3 md:flex-col lg:flex-row md:h-auto md:py-2"
                  active-class="btn-active">
        <NavIcon :d="item.icon" />
        <span class="text-xs lg:text-sm">{{ t(item.label) }}</span>
      </RouterLink>
    </nav>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="navbar border-b border-base-300 gap-2 px-3 min-h-14">
        <div class="flex-1 min-w-0 flex items-center gap-1 flex-wrap">
          <span class="md:hidden font-bold mr-3">{{ t('app.title') }}</span>
          <span class="text-sm opacity-70 hidden sm:inline">{{ t('header.active_corpus') }}:</span>
          <select v-if="project" class="select select-xs max-w-[10rem] sm:max-w-48" data-testid="active-corpus"
                  :disabled="!corpora.length" :aria-label="t('header.active_corpus')" :value="corpus || ''"
                  @change="session.setCorpus($event.target.value || null)">
            <option value="">{{ t('header.select_corpus') }}</option>
            <option v-for="c in corpora" :key="c.name" :value="c.name">{{ c.name }}</option>
          </select>
          <span v-else class="badge badge-outline ml-1 max-w-48 truncate">{{ t('header.no_corpus') }}</span>
          <span class="hidden sm:inline-flex items-center gap-1 ml-1" :title="t('header.layer_hint')">
            <span class="text-sm opacity-70">{{ t('header.layer') }}:</span>
            <select class="select select-xs" data-testid="header-layer" :disabled="!corpus"
                    :aria-label="t('header.layer')" :value="layer || ''"
                    @change="session.setLayer($event.target.value || null)">
              <option value="">{{ t('header.no_layer') }}</option>
              <option v-for="l in layers" :key="l.tool" :value="l.tool">{{ l.tool }}</option>
            </select>
          </span>
        </div>
        <RouterLink v-if="unsaved" to="/arquivo" class="badge badge-warning gap-1" data-testid="header-unsaved"
                    :title="t('project.unsaved_text')">● {{ t('project.unsaved_badge') }}</RouterLink>
        <button class="btn btn-ghost btn-sm" data-testid="explain" @click="explaining = true">{{ t('explain.button') }}</button>
        <details class="dropdown dropdown-end">
          <summary class="btn btn-ghost btn-sm" :aria-label="t('menu.settings')">⚙︎</summary>
          <div class="dropdown-content z-20 menu bg-base-200 rounded-box w-64 p-3 shadow gap-3">
            <p class="text-xs opacity-70 truncate">{{ projectPath || t('header.no_project') }}</p>
            <label class="form-control">
              <span class="label-text">{{ t('theme.label') }}</span>
              <select class="select select-sm" :value="theme" data-testid="theme-select"
                      @change="changeTheme($event.target.value)">
                <option v-for="th in THEMES" :key="th" :value="th">{{ t(`theme.${th}`) }}</option>
              </select>
            </label>
            <label class="form-control">
              <span class="label-text">{{ t('lang.label') }}</span>
              <select class="select select-sm" :value="locale" data-testid="lang-select"
                      @change="changeLang($event.target.value)">
                <option v-for="l in LANGS" :key="l" :value="l">{{ l === 'pt' ? 'Português' : 'English' }}</option>
              </select>
            </label>
          </div>
        </details>
      </header>

      <main id="main" class="flex-1 p-4 pb-24 md:pb-4 overflow-auto" tabindex="-1">
        <div v-if="loadError" role="alert" class="alert alert-error mb-4">{{ t('api.error.network') }}</div>
        <RouterView />
      </main>
    </div>

    <TourOverlay />
    <ExplainOverlay v-if="explaining" @close="explaining = false" />
    <!-- barra inferior (celular) -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 border-t border-base-300 bg-base-200 grid grid-cols-6 z-10"
         :aria-label="t('nav.label')">
      <RouterLink v-for="item in NAV" :key="item.name" :to="item.path"
                  class="flex flex-col items-center py-2 text-[0.65rem] leading-tight gap-1 min-w-0 px-0.5" active-class="text-primary font-bold">
        <NavIcon :d="item.icon" />
        <span class="max-w-full truncate">{{ t(item.label) }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
