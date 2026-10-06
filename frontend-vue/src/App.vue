<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { NAV } from './router.js'
import { useSession } from './stores/session.js'
import { LANG_NAMES, setLang } from './i18n.js'
import { applyDensity, applyTheme, initialDensity, initialTheme } from './theme.js'
import NavIcon from './components/NavIcon.vue'
import TextType from './components/vb/TextType.vue'
import MenuButton from './components/MenuButton.vue'
import TagTip from './components/TagTip.vue'
import TourOverlay from './components/TourOverlay.vue'
import ExplainOverlay from './components/ExplainOverlay.vue'
import AboutDialog from './components/AboutDialog.vue'

const { t, locale } = useI18n()
const session = useSession()
const { corpus, layer, layers, corpora, project, projectPath, unsaved } = storeToRefs(session)
const route = useRoute()
const section = computed(() => NAV.find((n) => n.name === route.name) ?? (route.name === 'home' ? { icon: 'learn', label: 'nav.info' } : null))
// Telas com divisões (painéis que rolam sozinhos): a área principal não rola; só os painéis.
const SPLIT_ROUTES = ['explore', 'reader']
const isSplit = computed(() => SPLIT_ROUTES.includes(route.name))
const theme = ref(initialTheme())
const loadError = ref(null)
const explaining = ref(false)
globalThis.addEventListener?.('ttw:explain', () => { explaining.value = true })
const about = ref(false)

onMounted(async () => {
  try { await session.load(); await session.checkPendingOpen() } catch (err) { loadError.value = err }
  window.addEventListener('focus', () => session.checkPendingOpen().catch(() => {}))
})
const prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
const isDark = computed(() => theme.value === 'dark' || theme.value === 'contrast' || (theme.value === 'system' && prefersDark))
const changeTheme = (value) => { theme.value = value; applyTheme(value) }
const compact = ref(initialDensity() === 'compact')
const changeDensity = (on) => { compact.value = on; applyDensity(on ? 'compact' : 'comfortable') }
const THEME_OPTIONS = ['system', 'light', 'dark', 'contrast']
const changeLang = (value) => setLang(value)
</script>

<template>
  <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:m-2 btn btn-sm">{{ t('app.skip') }}</a>
  <div class="h-dvh overflow-hidden bg-base-100 text-base-content flex flex-col">
  <header class="ttw-context navbar border-b border-base-300 gap-2 px-3 min-h-12 sticky top-0 z-30 bg-base-200">
        <button type="button" class="ttw-wordmark shrink-0 text-lg tracking-tight px-1" data-testid="about-open"
                :aria-label="`${t('app.title')} — ${t('about.authors')}`" :title="t('about.authors')" @click="about = true"><TextType :parts="[{ text: 'TTW', class: 'text-orange-text font-black' }, { text: 'tools', class: 'text-base-content font-normal' }]" /></button>
        <span v-if="section" class="hidden sm:inline-flex items-center gap-2 text-lg font-semibold pl-3 ml-1 border-l border-base-300" data-testid="header-section">
          <NavIcon :name="section.icon" :size="24" />{{ t(section.label) }}</span>
        <div class="flex-1" />
        <!-- camada ativa e corpus ativo, como chips com ícone; o seletor fica dentro do chip -->
        <label class="ttw-chip hidden sm:inline-flex" :title="t('header.layer_hint')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3.500 12.500V4.500a1 1 0 0 1 1-1h8l8 8a1.500 1.500 0 0 1 0 2.100l-6.300 6.300a1.500 1.500 0 0 1-2.100 0z" /><circle cx="8" cy="8" r="1.300" /></svg>
          <select class="ttw-chip-select" data-testid="header-layer" :disabled="!corpus" :aria-label="t('header.layer')" :value="layer || ''"
                  @change="session.setLayer($event.target.value || null)">
            <option value="">{{ t('header.no_layer') }}</option>
            <option v-for="l in layers" :key="l.tool" :value="l.tool">{{ l.tool }}</option>
          </select>
        </label>
        <label v-if="project" class="ttw-chip">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /></svg>
          <select class="ttw-chip-select max-w-[9rem] sm:max-w-56" data-testid="active-corpus" :disabled="!corpora.length" :aria-label="t('header.active_corpus')" :value="corpus || ''"
                  @change="session.setCorpus($event.target.value || null)">
            <option value="">{{ t('header.select_corpus') }}</option>
            <option v-for="c in corpora" :key="c.name" :value="c.name">{{ c.name }}{{ c.layers?.length ? ` · ${t('header.corpus_layers', { n: c.layers.length })}` : '' }}</option>
          </select>
        </label>
        <span v-else class="badge badge-outline max-w-48 truncate">{{ t('header.no_corpus') }}</span>
        <RouterLink v-if="unsaved" to="/arquivo" class="badge badge-warning gap-1" data-testid="header-unsaved"
                    :title="t('project.unsaved_text')">● {{ t('project.unsaved_badge') }}</RouterLink>
        <!-- "Explicar esta tela" fica fora do cabeçalho por ora; o recurso segue ativo e será usado pelos guias de Aprender (evento `ttw:explain` na janela) -->
        <MenuButton :label="t('lang.label')">
          <template #button>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.500 2.700 3.700 5.700 3.700 9s-1.200 6.300-3.700 9c-2.500-2.700-3.700-5.700-3.700-9S9.500 5.700 12 3z" /></svg>
            <span class="font-bold text-xs" data-testid="lang-toggle">{{ locale.toUpperCase() }}</span>
          </template>
          <template #default="{ close }">
            <button v-for="l in LANG_NAMES" :key="l.code" type="button" role="menuitemradio" :aria-checked="locale === l.code" class="ttw-menu-item"
                    :data-testid="`lang-${l.code}`" @click="changeLang(l.code); close()">
              <span class="w-5 text-orange-text">{{ locale === l.code ? '✓' : '' }}</span>{{ l.name }}<span class="ml-auto text-xs text-text-muted pl-4">{{ l.code.toUpperCase() }}</span>
            </button>
          </template>
        </MenuButton>
        <MenuButton :label="t('theme.label')">
          <template #button>
            <svg v-if="isDark" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" fill-opacity=".25" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-testid="theme-toggle">
              <path d="M20 14.500A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500z" /></svg>
            <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor" fill-opacity=".25" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-testid="theme-toggle">
              <circle cx="12" cy="12" r="4" /><path d="M12 2.500v2.200M12 19.300v2.200M2.500 12h2.200M19.300 12h2.200M5.300 5.300l1.500 1.500M17.200 17.200l1.500 1.500M5.300 18.700l1.500-1.500M17.200 6.800l1.500-1.500" /></svg>
          </template>
          <template #default="{ close }">
            <button v-for="o in THEME_OPTIONS" :key="o" type="button" role="menuitemradio" :aria-checked="theme === o" class="ttw-menu-item"
                    :data-testid="`theme-${o}`" @click="changeTheme(o); close()">
              <span class="w-5 text-orange-text">{{ theme === o ? '✓' : '' }}</span>{{ t(`theme.${o}`) }}
            </button>
            <div class="my-1 border-t border-base-300" role="separator" />
            <label class="ttw-menu-item cursor-pointer">
              <input type="checkbox" class="checkbox checkbox-xs" data-testid="density-toggle" :checked="compact" @change="changeDensity($event.target.checked)" />{{ t('density.label') }}
            </label>
          </template>
        </MenuButton>
  </header>
    <div class="flex flex-1 min-h-0 flex-col md:flex-row min-w-0">
    <!-- menu lateral: ícone grande com o nome embaixo; o item ativo fica em destaque -->
    <nav class="ttw-rail hidden md:flex flex-col items-stretch gap-1 border-r border-base-300 bg-base-200 py-2 px-2 w-16 shrink-0 sticky top-12 self-start h-[calc(100dvh-3rem)] z-20"
         :aria-label="t('nav.label')">
      <RouterLink v-for="item in NAV" :key="item.name" :to="item.path" class="nav-item rail-item" active-class="nav-active" :aria-label="t(item.label)">
        <NavIcon :name="item.icon" :size="30" />
        <span class="rail-tip" aria-hidden="true">{{ t(item.label) }}</span>
      </RouterLink>
      <RouterLink to="/inicio" class="nav-item rail-item mt-auto" active-class="nav-active" :aria-label="t('nav.info')">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17h.01" /></svg>
        <span class="rail-tip" aria-hidden="true">{{ t('nav.info') }}</span>
      </RouterLink>
    </nav>

    <div class="flex-1 flex flex-col min-w-0 min-h-0">

      <main id="main" class="flex-1 min-h-0 p-4 pb-24 md:pb-4" :class="isSplit ? 'overflow-hidden' : 'overflow-y-auto'" tabindex="-1">
        <div v-if="loadError" role="alert" class="alert alert-error mb-4">{{ t('api.error.network') }}</div>
        <RouterView />
      </main>
    </div>

    </div>
    <AboutDialog :open="about" @close="about = false" />
    <TagTip />
    <TourOverlay />
    <ExplainOverlay v-if="explaining" @close="explaining = false" />
    <!-- barra inferior (celular) -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 border-t border-base-300 bg-base-200 grid grid-cols-8 z-10"
         :aria-label="t('nav.label')">
      <RouterLink v-for="item in NAV" :key="item.name" :to="item.path"
                  class="nav-item flex flex-col items-center py-2 text-[0.65rem] leading-tight gap-1 min-w-0 px-0.5" active-class="text-primary font-bold">
        <NavIcon :name="item.icon" :size="22" />
        <span class="max-w-full truncate">{{ t(item.label) }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
