# Próximos passos (hub): Leitor/KFA + Aprender

Hub único para retomar o trabalho em **sessão limpa ou com outro agente**. O detalhe dos 7 ajustes
de interface está em `leitor_kfa.md`; os pedidos de conteúdo estão em `aprimoramentos.md` (na raiz,
ao lado de `materiais_para_aprimoramentos/`). Regras em `AGENTS.md`.

## Retomar aqui (2026-10-04)

- **Feito:** Leitor/KFA **passos 1, 2, 3, 4 e 5**; Aprender **item 3** (tags dos etiquetadores).
- **Próximo recomendado:** Leitor/KFA **passo 6** (clicar num atributo → tela dos textos, decrescente,
  arquivo + frequência). Em seguida, passo 7 (sentenças no KWIC).
- **Trilha paralela (Aprender):** itens 1 e 2 de `aprimoramentos.md` (conteúdo didático a partir
  dos PDFs). Podem ser feitos em sessões separadas; dependem de `materiais_para_aprimoramentos/`.
- **Pendências transversais:** confirmar a correção visual no **Mac Intel** (color-mix/justificação)
  e abrir a gaveta de tags nos quatro locais; revisar o tópico novo no Mac Intel/Windows/Linux.

## Como retomar numa sessão limpa

1. `git fetch --all && git switch aprimoramentos_out26 && git pull`
   (`git submodule update --init --recursive`, precisa de `git lfs install`).
2. Ambiente (ver `CONTRIBUTING.md`): `conda env create -f environment.yml -n ttw314`;
   `pip install --no-deps -e libs/ttwtools -e . && pip install pytest`; `cd frontend-vue && npm ci`.
3. App para testar sem empacotar: `python -m app --mode web --port <livre>` (serve o build em
   `frontend/`). Ao mexer no frontend, rode `npm run build` para o servidor pegar.
4. Testes: `cd frontend-vue && npm test && npm run e2e` (o e2e usa Chrome e sobe o servidor sozinho;
   `PYTHON=...` se o `python` não tiver FastAPI); `pytest libs/ttwtools/tests -q && pytest tests -q`.
5. Encerrar: atualizar este "Retomar aqui", **submódulo antes do app**, commit `[passo]` em
   `aprimoramentos_out26` (sem coautoria de agente; nunca `git add -A`).

## Trilha A — Leitor e KFA (`leitor_kfa.md`, passos 1–7)

- [x] **1. Leitor com ícone próprio** — `/leitor`, item `NAV`; `/explorar/leitor` redireciona.
- [x] **2. KFA: "Ver análise" em rota própria** — `?tool=kfa&view=analise`; `kfaMemory` restaura.
- [x] **3. Barras em ordem crescente por padrão** — `galleryMemory.order` `'abs'` → `'asc'` (feito 2026-10-04).
- [x] **4. Gráfico à esquerda + tabela à direita** (`SplitPane.vue`), com divisória arrastável
  (mouse/toque/teclado) e botões de ocultar; estado em `galleryMemory`; empilha em ≤1023px (feito 2026-10-04).
- [x] **5. Realce da linha inteira no mouse-over** da tabela da análise (3 temas) — a 1ª coluna fixa
  bloqueava o realce; agora acompanha a linha (feito 2026-10-04).
- [ ] **6. Clicar num atributo** abre a tela dos textos (decrescente, arquivo + frequência).
- [ ] **7. Por texto: abrir no Leitor e ver as sentenças** com o atributo (filtro `filename` no KWIC).

## Trilha B — Aprender (`aprimoramentos.md`)

- [ ] **1. Conteúdo didático** sobre conceitos/técnicas de linguística de corpus, referenciando os
  livros. Fonte: `.md` e PDFs em `materiais_para_aprimoramentos/` (ignorada no Git); converta os
  PDFs com o skill `/pdf-para-md`. Um tópico por vez, revisão interativa com o usuário.
- [ ] **2. Começar por KFA / d de Cohen** e ir melhorando. Já existem os tópicos
  `metodos/kfa.md` e `metricas/cohens_d.md` e o visual `CohenDVisual.vue` — **revisar/expandir**
  antes de escrever novos.
- [x] **3. Lista de tags por etiquetador** — tópico `conceitos/tags_etiquetadores` (pt/en) com
  tabela **Tag · Grupo · Definição · Exemplo** por etiquetador/repertório, e ícone de informação
  (`TagsetInfoButton`) no Leitor, Etiquetagem, lista de camadas e cabeçalho da KFA. Componentes
  reutilizáveis `TagsetTable`/`TagsetExplorer`; `TagsetDrawer` reusa o explorador.

## Correções já feitas (para não refazer)

- **Mac Intel (Safari 17.6):** `color-mix()` reescrito para `srgb` no build
  (`frontend-vue/vite.config.js`, plugin `ttw-safari-color-mix`); `SpotlightCard` em `srgb`;
  justificação do Leitor com `white-space: pre-line`. **A confirmar no Mac Intel.**
- **Acessibilidade:** markdown de lista com fórmula indentada virou `<p>` fora do `<li>` em
  `help/*/metricas/cohens_d.md` (corrigido); tabela com rolagem horizontal com `tabindex=0
  role=region`; cuidado com `text-text-muted` sob `opacity-80`.

## Decisões tomadas

- Passo 2 = **rota própria** (não painel). Passo 7 = **filtro `filename` novo** no KWIC
  (reusar `kwic`/`search`, não criar função de sentenças).
