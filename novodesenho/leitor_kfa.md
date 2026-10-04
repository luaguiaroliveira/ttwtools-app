# Leitor e análise da KFA: sequência de ajustes

Frente de interface. Origem: `novosaprimoramentos.md` (7 pedidos, reorganizados em 7 passos).
Vale para qualquer agente; **um passo por vez**. Regras gerais em `AGENTS.md` e `interface.md`.
Não confundir "atributo" (feature) com "traço" (linha desenhada).

## Como usar este documento (retomar em sessão limpa)

1. Leia **só esta seção e o "Retomar aqui"**; depois o passo indicado.
2. Faça o passo inteiro; rode os testes que ele indica; confira a tela nas três larguras.
3. Marque o passo: troque `- [ ]` por `- [x]` e preencha o slot `Feito:` (data, agente, commit).
4. Atualize o "Retomar aqui" e faça um commit `[passo] mensagem curta em português` (sem coautoria; nunca `git add -A`).
5. Submódulo `libs/ttwtools` antes do app, quando mexer no pacote.

## Retomar aqui

- **Estado:** Passos 1, 2, 3, 4 e 5 **feitos** (5/7).
- **Próximo passo:** Passo 6 (clicar num atributo abre a tela dos textos, em ordem decrescente com arquivo e frequência).
- **Decisões (tomadas em 2026-10-04):** Passo 2 = tela de análise como **rota própria**; Passo 7 = **filtro `filename` novo** no KWIC (reusar `kwic`/`search`, não criar função de sentenças).
- **Ordem:** 1 → 2 → 3 → 4 → 5 → 6 → 7 (3, 4 e 5 são independentes entre si, mas ficam na tela do Passo 2).

## Regras gerais (valem para todo passo)

- **Paridade GUI/pacote:** recurso novo = função pública em `libs/ttwtools/ttwtools` + subcomando em `cli.py` + rota em `app/routes/` + tela. Depois de mexer em função pública: `cd libs/ttwtools && python docs/gerar_referencia.py`.
- **i18n:** todo texto novo por chave em `libs/ttwtools/ttwtools/data/i18n/ui.pt.json` **e** `ui.en.json`.
- **Testes:** `pytest libs/ttwtools/tests -q`, `pytest tests -q`, `cd frontend-vue && npm test`, `npm run e2e` (Playwright, 3 larguras, com axe).
- **Compatibilidade:** Safari 17.6 (macOS 12 Intel), WebView2, WebKitGTK; não usar View Transitions, anchor positioning, `field-sizing`, `interpolate-size`.
- **Commit:** um por passo, `[passo] ...`; parar se o passo não fechar.

---

## Passo 1 — Leitor com ícone próprio na barra lateral

- [x] feito — Feito: 2026-10-04, opencode; sem commit (aguardando confirmação); `npm test` 41/41, `npm run e2e` 27/27, `test_help.py`+`test_routes_new.py` 22/22. Resumo: `ReaderTool.vue` movido para `views/ReaderView.vue` (rota `/leitor`, item `NAV` `reader`); `/explorar/leitor` redireciona preservando a consulta; seletor de corpus (`reader-corpus`) quando não há corpus; ícone `reader` em `NavIcon.vue`; `grid-cols-8` no celular; todos os destinos atualizados; e2e e i18n `nav.reader`. **Falta conferir no Mac Intel** (visual).

**Objetivo.** O Leitor deixa de ser uma aba de Explorar e vira seção própria, reutilizável (corpus, KFA e, no futuro, Escrita).

**Onde mexer**
- `frontend-vue/src/router.js`: nova rota `/leitor` (name `reader`) e novo item em `NAV` (`icon: 'reader'`, `label: 'nav.reader'`). Manter a rota antiga `/explorar/leitor` como redirecionamento para `/leitor` **preservando a query** (links antigos e histórico).
- Mover `views/explore/ReaderTool.vue` para `views/ReaderView.vue` (ou criar `ReaderView.vue` que só apresenta o `ReaderTool`). Remover `leitor` de `TOOLS` em `views/ExploreView.vue` e da tablist.
- `frontend-vue/src/components/NavIcon.vue`: variante de ícone `reader` (documento + marca-texto, no mesmo estilo duotone).
- Atualizar todos os destinos do Leitor: `components/ChartGallery.vue:32`, `views/explore/CollocatesTool.vue:15`, `views/explore/DispersionTool.vue:18`, `views/explore/KwicTool.vue:35`, `views/compare/KfaTool.vue:99`.
- `App.vue`: a barra inferior do celular usa `grid-cols-7` → `grid-cols-8`.
- `utils/memory.js` / `kfaMemory`: conferir que abrir o Leitor e voltar restaura a tela de origem (o padrão já funciona por remontagem).
- i18n `nav.reader` (pt/en). Ajustar `e2e/fluxo.spec.js:155` (lista de telas) e `e2e/leitor.spec.js:32` (URL).

**Pronto quando**
- [ ] O Leitor aparece como item próprio na barra lateral (desktop e celular).
- [ ] Abre um texto do corpus, um texto de gráfico/KWIC/colocados/dispersão e um texto da KFA.
- [ ] "Voltar" retorna à tela de origem; `/explorar/leitor?...` continua funcionando (redireciona).
- [ ] `npm test` e `npm run e2e` verdes; axe sem erro.

---

## Passo 2 — KFA: botão "Ver análise" abre a tela de análise isolada

- [x] feito — Feito: 2026-10-04, opencode; rota própria `?tool=kfa&view=analise`. Na tela de configuração ficam o formulário, o aviso de recálculo, o resumo e o botão **Ver análise** (`kfa-view-analysis`); a análise (|d| mínimo, `ChartGallery`, detalhe e tabela) só aparece com `view=analise`, com botão `kfa-back` (`kfa.back_to_setup`). `kfaMemory` restaura sem recalcular. i18n `kfa.view_analysis`/`kfa.back_to_setup`. e2e atualizado. **Falta conferir no Mac Intel.**

**Objetivo.** Separar a configuração/execução da KFA da tela que mostra as visualizações. Clicar em **Ver análise** expande uma tela isolada (com botão de voltar) contendo o seletor de |d| mínimo, os ícones de tipo de visualização, o gráfico e a tabela.

**Onde mexer**
- `views/compare/KfaTool.vue`: na tela principal ficam o formulário, o aviso de recálculo, o resumo e o botão **Ver análise**. Vão para a tela de análise: o seletor de |d| mínimo (campo + controle deslizante), o `ChartGallery`, o `detail` e a tabela.
- **Decisão (tomada):** rota própria (`/comparar?tool=kfa&view=analise`), que permite link/voltar e reaproveita o roteamento por hash.
- Estado em `utils/memory.js` (`kfaMemory`) para voltar sem recalcular.
- i18n: `kfa.view_analysis`, `kfa.back_to_setup`.

**Pronto quando**
- [ ] Rodar a KFA mantém a tela enxuta; **Ver análise** abre a tela isolada.
- [ ] O botão voltar retorna ao resultado sem recalcular; |d| mínimo continua filtrando sem recalcular.
- [ ] Funciona nas três larguras; axe sem erro.

---

## Passo 3 — Barras da KFA em ordem crescente por padrão

- [x] feito — Feito: 2026-10-04, opencode; `memory.js` `galleryMemory.order` e o valor inicial de `ChartGallery.vue` passaram de `'abs'` para `'asc'` (rótulos i18n já corretos). e2e `fluxo.spec.js` agora confere o padrão `'asc'` e a troca para `desc`/`abs`; `npm test` 42/42, `npm run e2e` 30/30. **Falta conferir no Mac Intel** (visual).

**Objetivo.** A visualização padrão (barras divergentes) abre em ordem **crescente** (mais negativo primeiro).

**Onde mexer**
- `frontend-vue/src/utils/memory.js`: `galleryMemory.order: 'abs'` → `'asc'`.
- `components/ChartGallery.vue`: valor inicial `ref(galleryMemory.order ?? 'abs')` → `'asc'`; conferir o rótulo de `gallery.order.asc`.
- Preservar a preferência do usuário entre sessões (o `watch` já grava em `galleryMemory`). Não forçar a ordem se o usuário já escolheu outra.

**Pronto quando**
- [ ] Ao abrir a galeria em barras, a ordem é crescente.
- [ ] Trocar para "módulo"/"decrescente" continua funcionando e é lembrado.

---

## Passo 4 — Gráfico à esquerda, tabela à direita, com divisória e botões de ocultar

- [x] feito — Feito: 2026-10-04, opencode; novo `components/SplitPane.vue` (grid com divisória arrastável por mouse/toque, `role="separator"`, `aria-orientation="vertical"`, `aria-valuenow` e ajuste por setas/Home/End); gráfico + detalhe à esquerda, tabela à direita; botões `analysis-toggle-chart`/`analysis-toggle-table`; estado em `galleryMemory` (`split`, `showChart`, `showTable`); i18n `analysis.*` (pt/en); empilha sem divisória em ≤1023px; teste `splitPane.test.js` (3 casos) e e2e do fluxo atualizado. `npm test` 45/45, `npm run e2e` 30/30, `pytest libs/ttwtools/tests` 268/268, `pytest tests` 63/63. **Falta conferir no Mac Intel** (visual).

**Objetivo.** Na tela de análise (Passo 2), o gráfico fica à esquerda e a tabela à direita; uma divisória arrastável regula o espaço de cada lado e dá para ocultar um dos lados.

**Onde mexer**
- Novo `frontend-vue/src/components/SplitPane.vue`: `display: grid`, divisória arrastável (mouse/toque) por variável CSS (ex.: `--split`), com `role="separator"`, `aria-orientation="vertical"`, `aria-valuenow` e ajuste por teclado (setas). Fallback em telas estreitas: empilhar (gráfico em cima, tabela embaixo).
- Persistir largura e visibilidade em `utils/memory.js` (`galleryMemory.split`, `showTable`, `showChart`).
- i18n: `analysis.show_table`, `analysis.hide_table`, `analysis.show_chart`, `analysis.hide_chart`, `analysis.divider`.

**Pronto quando**
- [ ] Arrastar a divisória regula o espaço; o estado é lembrado.
- [ ] Botões ocultam/mostram tabela e gráfico.
- [ ] Teclado acessível ao separador; nas larguras estreitas empilha sem quebrar.

---

## Passo 5 — Realce da linha inteira ao passar o mouse na tabela

- [x] feito — Feito: 2026-10-04, opencode; a 1ª coluna fixa (`.ttw-scroll .table tbody :first-child`) tinha fundo `--color-base-100` opaco com especificidade maior que `tbody tr:hover`, então bloqueava o realce só naquela célula. Agora a 1ª célula acompanha a zebra e o realce (fundo opaco próprio, pois é sticky); o `tr:hover` passou de 10 % para 12 % de `--color-primary`. Vale nos três temas (o build troca `oklab`→`srgb`). e2e `fluxo.spec.js` confere, nos temas claro/escuro/contraste, que o fundo da linha e o da 1ª célula mudam no mouse-over. `npm test` 45/45, `npm run e2e` 30/30 (sem mudança no pacote).

**Objetivo.** Na tabela da análise (Passo 2), passar o mouse destaca a linha inteira.

**Onde mexer**
- Tabela da análise (hoje em `views/compare/KfaTool.vue:101-105`): garantir `tbody tr:hover` com fundo. `style.css` já tem `.table :where(tbody tr:hover)`; conferir se a classe `hover`/`table` está presente e se o realce aparece no tema **escuro** e **alto contraste**.
- A linha clicável deve continuar abrindo o detalhe (Passo 6).

**Pronto quando**
- [ ] Mouse over destaca a linha inteira nos três temas.
- [ ] Clique/Enter na linha continua funcionando; axe sem erro.

---

## Passo 6 — Clicar num atributo abre a tela dos textos

- [ ] feito — Feito: _data / agente / commit / notas_

**Objetivo.** Clicar num atributo (barra do gráfico ou linha da tabela) abre uma tela que desliza à direita (sempre com botão de voltar) listando os textos em que aquele atributo ocorre, **em ordem decrescente**, com o **nome do arquivo** e a **frequência do atributo naquele arquivo**.

**Onde mexer**
- Dados: já existem. `api.compare.feature({ corpus, layer, feature, name })` → `values: [{ filename, value, words }]` (`value` = ocorrências por 1000 palavras; `feature_values` em `libs/ttwtools/ttwtools/features.py:198`). Ordenar decrescente. **Decidir** o que exibir: por 1000 palavras e/ou frequência absoluta (`value * words / 1000`). Se faltar a contagem absoluta crua, avaliar saída nova em `feature_values` (função pública já existente) + teste em `libs/ttwtools/tests/test_features.py`.
- UI: tela/painel à direita, mesmo padrão do Passo 2 (rota ou painel), com o `@select` do `DivergingBars` e o clique da linha da tabela apontando para ela. Guardar o atributo escolhido em `kfaMemory`.
- i18n: `kfa.tag_texts`, `kfa.freq_per_1000`, `kfa.freq_abs`, `kfa.no_texts`, `kfa.back`.

**Pronto quando**
- [ ] Clicar numa barra **e** numa linha da tabela abre a lista.
- [ ] Lista decrescente com arquivo + frequência; voltar retorna à análise.
- [ ] Funciona nas duas línguas e nas três larguras; axe sem erro.

---

## Passo 7 — Por texto: abrir no Leitor e ver as sentenças do atributo (KWIC)

- [ ] feito — Feito: _data / agente / commit / notas_

**Objetivo.** Em cada linha da lista do Passo 6, duas ações: (1) ver o texto no Leitor; (2) abrir um visualizador tipo KWIC com as **sentenças daquele texto em que o atributo aparece**.

**Onde mexer**
- (1) Leitor: `push` para o Passo 1 (`/leitor?corpus=...&layer=...&file=...&color=tags&highlight=<atributo>`).
- (2) KWIC por atributo: a consulta já aceita `upos=`, `xpos=` e `pos=` (ver `libs/ttwtools/ttwtools/query.py`, cabeçalho) e `kwic` já devolve a frase (`with_sentence`). Falta **restringir a um arquivo**. **Decisão (tomada):** adicionar `filename` opcional a `kwic`/`search` (função pública + subcomando `--file` + parâmetro na rota `/api/explore/kwic`) e abrir `/explorar/kwic?q=<campo>=<atributo>&file=<arquivo>`. Paridade: conferir subcomando e rota.
- Escolher o campo (`tags`/`upos`/`xpos`) conforme o `colorBy` do Leitor/da KFA.
- i18n: `kfa.open_reader` (existe), `kfa.view_sentences`.

**Pronto quando**
- [ ] Cada texto da lista abre no Leitor no arquivo certo.
- [ ] "Ver sentenças" mostra só as sentenças daquele arquivo com o atributo destacado.
- [ ] Testes do pacote e da rota atualizados; e2e verde; axe sem erro.

---

## Mapa dos 7 pedidos originais → passos

| Pedido (`novosaprimoramentos.md`) | Passo |
|---|---|
| 1. Leitor com ícone próprio na barra lateral | 1 |
| 2. Tela isolada de visualizações, expansível por "Ver análise" | 2 |
| 3. Barras padrão crescentes | 3 |
| 4. Gráfico à esquerda + tabela à direita, com divisória e ocultar | 4 |
| 5. Realce da linha no mouse-over da tabela | 5 |
| 6. Clicar num atributo → textos em ordem decrescente com arquivo e frequência | 6 |
| 7. Nessa tela: abrir no Leitor e ver as sentenças do atributo (KWIC) | 7 |

## Verificação final da frente

- [ ] `e2e` verde nas três larguras, temas claro/escuro/contraste, axe sem erro.
- [ ] Conferir no **Mac Intel (macOS 12/Safari 17.6)**, Windows e Linux (as telas mudam; ver `macintel.md`).
- [ ] `novosaprimoramentos.md` pode ser removido só quando o usuário pedir (não apagar por conta própria).
