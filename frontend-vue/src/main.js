import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router.js'
import { i18n, initialLang, setLang } from './i18n.js'
import { applyTheme, initialTheme } from './theme.js'
import './style.css'

applyTheme(initialTheme())
const app = createApp(App).use(createPinia()).use(router).use(i18n)
setLang(initialLang()).finally(() => app.mount('#app'))
