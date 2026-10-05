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

### Layout sem rolagem aninhada (2026-10-05, depois dos commits acima)

- **Problema:** a Dispersão tinha rolagem dentro de rolagem — a área de resultados do `QueryBox` rolava
  e, dentro dela, o gráfico/a tabela tinham o próprio `ttw-scroll` (com `max-height: min(70dvh,46rem)`).
  A parte de cima (chips de consulta, métricas `DP`/`range` e controles de visão) rolava junto com o
  gráfico e se escondia.
- **Correção:** `QueryBox` ganhou a prop **`fit`** — a área de resultados preenche a altura disponível e
  **não rola**; a ferramenta decide o que rola. A Dispersão passa `fit`: o topo (chips, métricas e
  controles) fica **fixo** (`shrink-0`) e só a área de dados (`DispersionChart` ou tabela) rola, uma vez
  só. `DispersionChart` ganhou a prop `fit` e a classe **`.ttw-scroll-fit`** (`max-height: none`), que
  mantém a rolagem/`sticky` sem o teto fixo; ao montar, `DispersionChart` sem `fit` (Comparar) segue igual.
  As demais ferramentas do Explorar (Busca, KWIC, Frequência, Colocados) **não** mudam (sem `fit`, o
  `QueryBox` mantém o comportamento antigo).
- **Como verificar:** rolar o gráfico/a tabela não move as consultas, as métricas nem os controles; a
  página não rola (`#main` fica com `overflow-hidden` no Explorar) e só `[data-testid=disp-rows]`/a tabela
  rolam. No celular o gráfico fica baixo (o topo fixo ocupa quase tudo), mas sem aninhamento.
- Testes desta rodada: `npm run build`, frontend 57/57, e2e `leitor.spec.js` nas 3 larguras e a suíte
  `--project=computador-1280` 11/11.

### Barra de consulta compacta e relatório de DP (2026-10-05, em seguida)

- **Espaço em branco no alto:** vinha do `.ttw-sticky-form` com `top: 3rem`. Como a `main` do Explorar é
  `overflow-hidden` e quem rola é o painel da ferramenta, o `sticky` empurrava o formulário 3 rem para
  baixo. Passou a `top: 0`.
- **Exemplos recolhidos:** a linha de exemplos (`casa · cas* · /regex/ …`) saiu de cena e é aberta por um
  botão **“?”** (`data-testid="query-examples-toggle"`, `aria-expanded`/`aria-controls`, `#query-examples`)
  dentro da barra de consulta, usável em todas as ferramentas do `QueryBox`. O formulário ficou mais
  compacto (`gap-1.5`).
- **Relatório de DP de Gries em tabela:** as linhas `DP de Gries … · normalizado … · range …` viraram uma
  **tabela secundária** (`data-testid="disp-report"`, colunas Consulta · DP de Gries · normalizado · range,
  com a cor da consulta e o `HelpTip`). Ela é uma **visão** do alternador, entre “Código de barras” e a
  tabela por texto (`data-testid="disp-view-dp"`) — a antiga visão “Tabela” passou a se chamar **“O/E”**
  (`explore.disp_table` = “O/E”). Faixas/altura só aparecem nas visões de gráfico (Camadas/Código de
  barras).
- **i18n (submódulo):** novas chaves `explore.disp_dp`, `explore.disp_dp_norm`, `explore.disp_range`,
  `explore.disp_report`, `explore.examples_toggle` (pt/en) e `explore.disp_table` = “O/E”. `explore.dp`
  continua no Comparar.
- **e2e:** a tabela de métricas por texto ganhou `data-testid="disp-table"` e o `leitor.spec.js` passou a
  apontar para ela (antes usava `table.table`, que agora casaria com o relatório); o teste também abre a
  visão `disp-view-dp` e confere a tabela `disp-report`.
- **Sem coluna duplicada:** o DP normalizado é `dp / (1 − min_e)`; com muitos textos o fator fica ~1 e as
  duas colunas coincidem nas 3 casas. A coluna **“normalizado” foi removida** (com a chave
  `explore.disp_dp_norm`); o relatório mostra só `Consulta · DP de Gries · range`. Se a normalização
  voltar a ser útil, ela é recuperável no servidor (`dp_norm` continua no resultado).
- **Exportação por visão:** o **Exportar** acompanha a visão — em **DP de Gries** o CSV/TXT traz o
  relatório (`Consulta`, `DP de Gries`, `range`); em **O/E** traz a tabela por texto; em **Camadas/Código
  de barras** o PNG (canvases). Antes, o CSV era sempre a tabela por texto, mesmo na visão de DP.
- **“?” do cabeçalho:** passou a mostrar o verbete do glossário (`term="dp_gries"`) e a linkar para
  Aprender → Dispersão (DP de Gries e Range) (`topic="dispersao"`); o texto do link do `HelpTip` virou
  **“Aprender →”** (`nav.learn`, era “Ajuda →”), já que é para lá que ele leva.
- Testes: frontend 57/57; e2e `leitor.spec.js` em 1280 e 390, suíte `--project=computador-1280` 11/11 e
  acessibilidade (`fluxo.spec.js -g acessibilidade`) em 390. O e2e da dispersão passou a baixar o CSV da
  visão de DP e conferir as colunas.

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
  rótulos; e agora o novo layout sem rolagem aninhada (topo fixo + área de dados rolando uma vez só) e o
  aproveitamento da faixa superior (métricas e controles).
- **Nome interna da visão**: mantido o id `heat` (rótulo "Camadas") para não mexer em
  `data-testid="disp-view-heat"` nem no `DispersionCompareTool`; se renomear para `layers`, atualizar
  esses pontos e o e2e.
- **Não implementados** (o usuário não pediu): frequência ajustada de Gries e ID (índice de dispersão).
- Ao mexer em função pública: regenerar `libs/ttwtools/docs/referencia.md` e commitar/pushar o
  **submódulo antes** do ponteiro no app.
