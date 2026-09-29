<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { NAV } from './router.js'
import { useSession } from './stores/session.js'
import { setLang } from './i18n.js'
import { applyTheme, initialTheme } from './theme.js'
import NavIcon from './components/NavIcon.vue'
import TourOverlay from './components/TourOverlay.vue'
import ExplainOverlay from './components/ExplainOverlay.vue'
import AboutDialog from './components/AboutDialog.vue'

const { t, locale } = useI18n()
const session = useSession()
const { corpus, layer, layers, corpora, project, projectPath, unsaved } = storeToRefs(session)
const theme = ref(initialTheme())
const loadError = ref(null)
const explaining = ref(false)
const about = ref(false)

onMounted(async () => {
  try { await session.load(); await session.checkPendingOpen() } catch (err) { loadError.value = err }
  window.addEventListener('focus', () => session.checkPendingOpen().catch(() => {}))
})
const prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
const isDark = computed(() => theme.value === 'dark' || theme.value === 'contrast' || (theme.value === 'system' && prefersDark))
const changeTheme = (value) => { theme.value = value; applyTheme(value) }
const changeLang = (value) => setLang(value)
</script>

<template>
  <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:m-2 btn btn-sm">{{ t('app.skip') }}</a>
  <div class="min-h-dvh bg-base-100 text-base-content flex flex-col md:flex-row">
    <!-- trilho lateral mínimo: só ícones (o nome aparece ao passar o mouse ou focar) -->
    <nav class="hidden md:flex flex-col items-center gap-1 border-r border-base-300 bg-base-200 py-2 px-1.5 w-14 shrink-0"
         :aria-label="t('nav.label')">
      <button type="button" class="flex flex-col items-center leading-none py-2 mb-1 hover:text-primary" data-testid="about-open"
              :aria-label="`${t('app.title')} — ${t('about.authors')}`" :title="t('app.title')" @click="about = true">
        <span class="font-black text-sm tracking-tight">TTW</span><span class="text-[0.6rem] font-semibold opacity-80">tools</span>
      </button>
      <RouterLink v-for="item in NAV" :key="item.name" :to="item.path" :aria-label="t(item.label)"
                  class="nav-item tooltip tooltip-right btn btn-ghost btn-square w-11 h-11 min-h-0 p-0"
                  active-class="nav-active" :data-tip="t(item.label)">
        <NavIcon :name="item.icon" />
      </RouterLink>
      <RouterLink to="/inicio" :aria-label="t('nav.info')" class="nav-item tooltip tooltip-right btn btn-ghost btn-square w-11 h-11 min-h-0 p-0 mt-auto"
                  active-class="nav-active" :data-tip="t('nav.info')">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17h.01" /></svg>
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
            <option v-for="c in corpora" :key="c.name" :value="c.name">{{ c.name }}{{ c.layers?.length ? ` · ${t('header.corpus_layers', { n: c.layers.length })}` : '' }}</option>
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
          <div class="dropdown-content z-20 bg-base-200 rounded-box w-64 p-3 shadow flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <button type="button" class="btn btn-sm flex-1 font-bold" data-testid="lang-toggle"
                      :title="t('lang.label')" :aria-label="t('lang.label')" @click="changeLang(locale === 'pt' ? 'en' : 'pt')">{{ locale.toUpperCase() }}</button>
              <button type="button" class="btn btn-sm flex-1" data-testid="theme-toggle" :title="t('theme.label')" :aria-label="t('theme.label')"
                      :aria-pressed="!isDark" @click="changeTheme(isDark ? 'light' : 'dark')">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
                     :fill="isDark ? 'none' : 'currentColor'" :fill-opacity="isDark ? 0 : 0.35">
                  <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.5 1 1.200 1 2.100h5c0-.9.4-1.600 1-2.100A6 6 0 0 0 12 3z" /></svg>
              </button>
            </div>
            <label class="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" class="checkbox checkbox-xs" data-testid="contrast-toggle" :checked="theme === 'contrast'"
                     @change="changeTheme($event.target.checked ? 'contrast' : (prefersDark ? 'dark' : 'light'))" />{{ t('theme.contrast') }}
            </label>
            <p class="text-xs opacity-60 truncate" :title="projectPath || ''">{{ projectPath || t('header.no_project') }}</p>
          </div>
        </details>
      </header>

      <main id="main" class="flex-1 p-4 pb-24 md:pb-4 overflow-auto" tabindex="-1">
        <div v-if="loadError" role="alert" class="alert alert-error mb-4">{{ t('api.error.network') }}</div>
        <RouterView />
      </main>
    </div>

    <AboutDialog :open="about" @close="about = false" />
    <TourOverlay />
    <ExplainOverlay v-if="explaining" @close="explaining = false" />
    <!-- barra inferior (celular) -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 border-t border-base-300 bg-base-200 grid grid-cols-7 z-10"
         :aria-label="t('nav.label')">
      <RouterLink v-for="item in NAV" :key="item.name" :to="item.path"
                  class="nav-item flex flex-col items-center py-2 text-[0.65rem] leading-tight gap-1 min-w-0 px-0.5" active-class="text-primary font-bold">
        <NavIcon :name="item.icon" :size="22" />
        <span class="max-w-full truncate">{{ t(item.label) }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
