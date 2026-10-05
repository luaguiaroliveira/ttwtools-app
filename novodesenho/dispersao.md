# Dispersão: mudanças de 2026-10-05 (canvas, lote e métricas)

Documento de retomada da frente de Dispersão. Cobre as mudanças feitas em 2026-10-05 na branch
`aprimoramentos_out26` (o `preajuste_dispersao` ficou no `3d00410`). Objetivo: retomar/corrigir sem
reler todo o histórico. Para o estado geral, ver `plano.md` seção 1.

## Commits desta rodada

- `a2b35a8` — backend: `dispersion_multi` em lote + métricas por texto (submódulo `80307a6`).
- `02a347f` — frontend: gráfico em `<canvas>` (camadas) + tabela de métricas (submódulo `c283710`).
- `56b91f2` — plano e memória.

## O que mudou

### Backend (pacote `libs/ttwtools/ttwtools`)

- **`idquery.finalize_dispersion(query, docs)`** (novo): fecha o resultado da dispersão — acrescenta
  `expected` (eᵢ), `observed` (oᵢ) e `deviation` (|oᵢ−eᵢ|) a cada documento (métricas "por texto") e
  calcula `dp`/`dp_norm` ("por corpus"). Usado por `idquery.dispersion` e por `query.dispersion`, para
  os dois caminhos (ids e SQL) darem o mesmo.
- **`query.dispersion_multi(project, corpus, queries, layer, where)`** (novo): roda `dispersion` para
  cada consulta **reusando o mesmo objeto de projeto** e, com isso, o mesmo `IdStore` — as colunas da
  camada são decodificadas **uma vez** (antes: `_project()` reabria a cada requisição).
- **CLI:** subcomando `dispersion-multi` (`--query` repetível), em `cli.py` (`COMMANDS`).
- **Rota:** `POST /api/explore/dispersion` (`DispersionMultiRequest`), além do `GET` de uma consulta,
  em `app/routes/api_new.py`.
- `__init__.py`: `dispersion_multi` exportado.
- `libs/ttwtools/docs/referencia.md` regenerado (`cd libs/ttwtools && python docs/gerar_referencia.py`).

### Frontend (`frontend-vue`)

- `src/api/index.js`: `explore.dispersionMulti` (POST).
- `src/views/explore/DispersionTool.vue`: `load()` pede **só as consultas que faltam** numa única POST
  e guarda o resultado em cache; `rows` carrega as métricas por texto; a tabela ganhou colunas
  agrupadas (tokens + freq/esperado/observado/|o−e| por consulta); `ExportMenu` com `canvas-root`.
- `src/components/charts/DispersionChart.vue`: **reescrito** — desenha cada linha num `<canvas>`
  (fundo de densidade + **camadas de traços translúcidos por consulta**), em vez de um elemento DOM por
  ocorrência; o SVG escondido de exportação foi removido.
- `src/components/ExportMenu.vue`: prop `canvas-root` (PNG por composição dos canvases).
- `src/utils/export.js`: `exportPngFromCanvases(canvases, filename)`.
- `src/style.css`: classe `.disp-canvas`.
- `src/views/compare/DispersionCompareTool.vue`: passa `canvas-root`.
- i18n (submódulo): `explore.disp_heat` = "Camadas"/"Layers" + legenda; novas chaves
  `explore.disp_freq/expected/observed/deviation` e `explore.tokens`.
- `e2e/leitor.spec.js`: passou a checar `canvas.disp-canvas` (em vez de `.disp-band`/`.disp-tick`) e a
  presença das métricas na tabela.

## Como retomar / corrigir

- Subir o app: `python -m app --mode web` (servidor de trabalho em `http://127.0.0.1:8791`).
  **Reiniciar o servidor depois de mexer no pacote** (i18n e código ficam em memória).
- Testes: `pytest libs/ttwtools/tests -q && pytest tests -q`;
  `cd frontend-vue && npm run build && npm test && npm run e2e`.
- **O gráfico não desenha:** o canvas mede a largura do pai (`.disp-strip`); sem largura ele sai.
  Verifique também `clientWidth` da linha e se o `ResizeObserver` está observando `disp-rows`
  (redesenho ao arrastar a divisória de largura e ao redimensionar a janela).
- **Cor do fundo errada:** `--disp-band` (cor do lado no Comparar; cinza no Explorar) é lida por
  `getComputedStyle` no próprio canvas, porque canvas não resolve variáveis CSS sozinho.
- **Exportar PNG:** só aparece se `canvas-root` contiver `<canvas>` (visões `heat`/`bars`); a tabela
  exporta CSV/TXT. Outros gráficos seguem usando `svg-root`.
- **Métricas:** `dp`/`dp_norm`/`range` por consulta vêm no topo do gráfico; as métricas por texto
  (`expected`/`observed`/`deviation`) na visão **Tabela** e no CSV/TXT.

## Pendências e riscos

- **Não medido num corpus grande** nesta sessão (o `lemas_tcl2.ttwa` não foi aberto): conferir o tempo
  da primeira busca em lote e o pico de memória do `IdStore`. Se ainda travar, mover a rota para
  **tarefa** (`_maybe_async`, com andamento/cancelamento) em vez de requisição parada.
- **Revisão visual do usuário**: sobreposição das cores das camadas, largura dos traços e leitura dos
  rótulos.
- **Nome interna da visão**: mantido o id `heat` (rótulo "Camadas") para não mexer em
  `data-testid="disp-view-heat"` nem no `DispersionCompareTool`; se renomear para `layers`, atualizar
  esses pontos e o e2e.
- **Não implementados** (o usuário não pediu): frequência ajustada de Gries e ID (índice de dispersão).
- Ao mexer em função pública: regenerar `libs/ttwtools/docs/referencia.md` e commitar/pushar o
  **submódulo antes** do ponteiro no app.
