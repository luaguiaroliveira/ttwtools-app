// Rotas por URL com hash (#/corpora, #/explorar/kwic...): "voltar" funciona e
// cada tela é carregada sob demanda.
import { createRouter, createWebHashHistory } from 'vue-router'

export const NAV = [
  { name: 'corpora', path: '/corpora', label: 'nav.corpora', icon: 'M4 5h16v4H4zm0 6h16v8H4z' },
  { name: 'explore', path: '/explorar', label: 'nav.explore', icon: 'M10 4a6 6 0 104.47 10.03l4.25 4.25 1.41-1.41-4.25-4.25A6 6 0 0010 4z' },
  { name: 'compare', path: '/comparar', label: 'nav.compare', icon: 'M5 4h4v16H5zm10 6h4v10h-4z' },
  { name: 'modules', path: '/modulos', label: 'nav.modules', icon: 'M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z' },
  { name: 'learn', path: '/aprender', label: 'nav.learn', icon: 'M12 3L2 8l10 5 8-4v6h2V8z' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
    { path: '/corpora', name: 'corpora', component: () => import('./views/CorporaView.vue') },
    { path: '/explorar/:tool?', name: 'explore', component: () => import('./views/ExploreView.vue') },
    { path: '/comparar', name: 'compare', component: () => import('./views/CompareView.vue') },
    { path: '/modulos', name: 'modules', component: () => import('./views/ModulesView.vue') },
    { path: '/aprender/:topic?', name: 'learn', component: () => import('./views/LearnView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
