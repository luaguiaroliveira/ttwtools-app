// Carrega uma tela sob demanda. Se o arquivo sumiu porque a interface foi recompilada com a janela
// aberta (404 no import), recarrega uma vez; se continuar falhando, mostra o aviso com botão de recarregar
// em vez de deixar a área em branco.
import { defineAsyncComponent } from 'vue'
import ToolLoadError from '../components/ToolLoadError.vue'

const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically/i

export const lazyTool = (loader) => defineAsyncComponent({
  loader,
  errorComponent: ToolLoadError,
  onError(err, _retry, fail) {
    const key = `ttw.reload.tool.${globalThis.location.hash}`
    if (CHUNK_ERROR.test(String(err?.message ?? err))) {
      try {
        if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); globalThis.location.reload(); return }
      } catch { /* sem armazenamento: só mostra o aviso */ }
    }
    fail()
  },
})
