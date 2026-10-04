// Rotas por URL com hash (#/arquivo, #/explorar/kwic...): "voltar" funciona e
// cada tela é carregada sob demanda.
import { createRouter, createWebHashHistory } from 'vue-router'

export const NAV = [
  { name: 'corpora', path: '/arquivo', label: 'nav.corpora', icon: 'file' },
  { name: 'tagging', path: '/etiquetagem', label: 'nav.tagging', icon: 'tagging' },
  { name: 'explore', path: '/explorar', label: 'nav.explore', icon: 'explore' },
  { name: 'reader', path: '/leitor', label: 'nav.reader', icon: 'reader' },
  { name: 'compare', path: '/comparar', label: 'nav.compare', icon: 'compare' },
  { name: 'writing', path: '/escrita', label: 'nav.writing', icon: 'writing' },
  { name: 'modules', path: '/modulos', label: 'nav.modules', icon: 'modules' },
  { name: 'learn', path: '/aprender', label: 'nav.learn', icon: 'learn' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/arquivo' },
    { path: '/inicio', name: 'home', component: () => import('./views/HomeView.vue') },
    { path: '/arquivo', name: 'corpora', component: () => import('./views/CorporaView.vue') },
    { path: '/corpora', redirect: '/arquivo' },
    { path: '/etiquetagem', name: 'tagging', component: () => import('./views/TaggingView.vue') },
    { path: '/explorar/leitor', redirect: (to) => ({ path: '/leitor', query: to.query }) },
    { path: '/explorar/:tool?', name: 'explore', component: () => import('./views/ExploreView.vue') },
    { path: '/leitor', name: 'reader', component: () => import('./views/ReaderView.vue') },
    { path: '/comparar', name: 'compare', component: () => import('./views/CompareView.vue') },
    { path: '/escrita', name: 'writing', component: () => import('./views/WritingView.vue') },
    { path: '/modulos', name: 'modules', component: () => import('./views/ModulesView.vue') },
    { path: '/aprender/:topic?', name: 'learn', component: () => import('./views/LearnView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Telas carregadas sob demanda: se a interface foi recompilada com a janela aberta, os
// arquivos antigos somem e a navegação falharia em silêncio. Recarrega no destino pedido
// (uma vez por destino, para não entrar em laço se o servidor realmente não tiver o arquivo).
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically/i
router.onError((err, to) => {
  if (!CHUNK_ERROR.test(String(err?.message ?? err))) return
  const key = `ttw.reload.${to.fullPath}`
  try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1') } catch { /* */ }
  window.location.assign(`${window.location.pathname}#${to.fullPath}`)
  window.location.reload()
})
router.afterEach((to) => { try { sessionStorage.removeItem(`ttw.reload.${to.fullPath}`) } catch { /* */ } })
