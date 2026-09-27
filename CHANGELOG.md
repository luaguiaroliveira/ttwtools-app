# Changelog — ttwtools-app

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões: [SemVer](https://semver.org/lang/pt-BR/); a regra está em `RELEASING.md`. O pacote `ttwtools` (submódulo) tem changelog próprio.

## [Unreleased]

### Adicionado

- **Etiquetagem**: tela própria para acrescentar camadas ao corpus (estatísticas básicas e etiquetadores, com as opções de cada um); as escolhas vão para uma lista "A executar" guardada no projeto e executada numa etapa só, que pode ser ampliada depois; `ttwtools pipeline` faz o mesmo na linha de comando (6.2a).
- Andamento de "Executar análise e etiquetagem": porcentagem geral e por tarefa, passo atual, tempo decorrido e estimativa (6.2a).
- **Módulos**: área própria para modelos de etiquetagem (spaCy e Stanza, em inglês e português) e corpora do catálogo, com o que cada um faz, fonte, licença, dados de treino e tamanho; `ttwtools catalog models` mostra as mesmas fichas (6.2a).

### Alterado

- "Corpora" passa a se chamar **Arquivo**, com Novo, Abrir, Salvar e Salvar como; projetos .ttwt têm Salvar de verdade e pergunta antes de trocar de projeto (6.2a).
- Corpora não calcula nem etiqueta mais: a visão geral mostra o que já foi calculado e aponta para Etiquetagem (6.2a).
- Assistente "Adicionar corpus" em dois passos: as informações sobre os textos (metadados) viraram um painel opcional recolhido, com os pedaços do nome de um arquivo real, pré-visualização e planilha CSV como alternativa (6.2a).
- Projeto com **Novo projeto…**, **Abrir projeto…** e **Salvar cópia…** pelos diálogos do sistema; digitar o caminho fica num painel recolhido (6.2a).

### Corrigido

- "Novo projeto…" sobre um arquivo existente falhava mesmo depois de o diálogo do sistema confirmar a substituição; no caminho digitado, a tela oferece "Substituir" (6.2a).
- Depois de recompilar a interface com a janela aberta, as telas carregadas sob demanda (Explorar, Comparar...) não abriam; agora a página recarrega no destino (6.2a).
- Projetos de versões anteriores grandes pareciam não abrir: a atualização de formato agora mostra o progresso, pode ser cancelada e retoma de onde parou, e ficou bem mais rápida (6.2a).
- "Salvar como" podia deixar de fora as alterações mais recentes (ainda no WAL do SQLite); trabalho feito num projeto aberto de .ttwt se perdia ao abrir outro projeto (6.2a).
- Caminhos com `~` (ex.: `~/projeto.ttwa`) davam "unable to open database file" (6.2a).
- Depois de instalar um corpus ou baixar um modelo, a lista só se atualiza quando a tarefa termina (6.2a).

## [0.4.0-rc.1] — 2026-09-27

### Adicionado

- Catálogo de corpora: pacotes com ficha e licença conferida, instalação com conferência de hash, remoção e aviso de atualização, pela interface (Corpora → Catálogo) e por `ttwtools catalog` (4.1–4.2).
- Download de modelos spaCy e Stanza sob demanda para a pasta de dados do usuário, fora do binário (4.2).
- Scripts de preparo dos corpora do catálogo em `tools/corpora/`: demonstração (Gutenberg), Brown, UD English EWT e receita do LOB (4.3).
- Listas de referência do catálogo (`catalog:<id>`) nas palavras-chave, pacotes só de listas e **faixas de frequência lexical** (Comparar → Faixas de frequência; `ttwtools bands`) (4.4).
- **Laboratório** (experimental) em Comparar: N grupos por metadado ou corpus — um contra todos, par a par, Kruskal-Wallis, PCA, dendrograma e "meu texto contra referências"; `ttwtools compare --group-by/--group` (5.1).
- Importadores de **TEI XML/BNC XML** e do standoff **GrAF (OANC/MASC)**, pela linha de comando (`import --format tei|graf`) e pelo assistente "Adicionar corpus"; receita `tools/corpora/masc.py` (5.2).
- **Português**: modelos spaCy `pt_core_news_*` e Stanza em português, sugeridos automaticamente para corpora em português; idioma do corpus detectado para as palavras funcionais; UD Portuguese Bosque como referência (`tools/corpora/ud.py`) (5.3).
- Documentação: LEIAME/README para quem usa, `CONTRIBUTING.md`, `RELEASING.md` revisto; no pacote, guia rápido e referência de todas as funções (6.1).

### Removido

- Interface antiga (`frontend-src/`, JS puro) e o build dela versionado em `frontend/`; a interface Vue é a única, e o build dela passa a sair em `frontend/` (fora do git). Rotas sem uso na interface nova: `/api/analysis`, `/api/quickrun`, `/api/tags`, `/api/viz` (3.11).

### Corrigido

- Testes da interface (Vitest) não tentam mais rodar o teste de ponta a ponta do Playwright (4.4).
- Buscas por lema ou classe sem camada escolhida usam a camada que tem esse campo (antes podiam cair numa camada sem lema e dar zero) (6.1).

- Pacote `ttwtools` 0.2.0.dev0 (commit `1d318a8`).

## [0.4.0-alpha.1] — 2026-09-26

Linha nova **0.4.0** (reformulação; plano em `novodesenho/plano_implementacao.md`).

### Adicionado
- Versão única: `pyproject.toml` é a fonte; `app/_version.py` expõe `__version__`, `python -m app --version` e `GET /api/version` (app, `ttwtools`, commit). `RELEASING.md` com a regra de versão. (passo 0.2)
- Build único `build/build.py` (macOS arm64/Intel, Windows, Linux) com `--selftest` no binário, `build/check_macos_min.py` e pacotes `TTWtools-<versão>-<so>-<arq>`. Mínimo: macOS 12.0 (Intel) e 12.3 (Apple Silicon). (passo 0.3)
- CI a cada push (testes, frontend) e pipeline de release em 4 sistemas (macOS arm64 e Intel, Windows, Linux) com autoteste do binário e release em rascunho. (passo 0.4)
- Pacote `ttwtools`: testes, linha de comando `ttwtools` (passo 1.1); esquema de projeto v0.3 com camadas, tokens e projetos leves `.ttwl` (passo 1.2). Importação de corpus com metadados por documento, filtros e tokenização simples (passo 1.3). Etiquetagem com cache de camadas: não reprocessa o que já foi feito (passo 1.4). Opções e tagsets dos taggers descritos em dados, com explicações em pt/en, predefinições e disponibilidade por sistema (passo 1.5). Formatos CoNLL-U, VRT, palavra/TAG e tabelas de tokens (passo 1.6). Estatísticas descritivas do corpus com cache (passo 1.7). Busca, KWIC, frequência, colocados e dispersão, também sem tagger (passo 1.8). Palavras-chave contra referência com avisos de comparabilidade (passo 1.9). Ajuda em pt/en no pacote e `ttwtools help` (passo 1.10).
- Servidor: registro único de tarefas com cancelamento (`/api/jobs`), `/api/health`, importação por fonte de corpus (`/api/corpora/import`), projetos `.ttwl` nas rotas; corrigido o erro 500 com NaN nas tabelas de traços. (passo 2.1)
- Rotas dos recursos novos (taggers, visão geral, explorar, palavras-chave, ajuda, traduções) e "copiar como código" (`/api/code`). (passo 2.2)
- Processo de release: `build/release.py` (com `--dry-run`), `RELEASING.md` completo e `build/release_github.sh` para pacotes feitos localmente. (passo 0.5)
- Interface nova em Vue 3 (`frontend-vue/`, `TTW_UI=vue`): casca responsiva com corpus ativo, tema claro/escuro/alto contraste, pt/en, tarefas com progresso e cancelamento, tela Corpora (projeto, importar com metadados, visão geral, camadas). (passos 3.1–3.4)
- Tela de etiquetagem: escolha de tagger, "ver tags", "Personalizar" gerado do descritor, predefinições e aviso de reaproveitamento. (passo 3.5)
- Tela Explorar: busca, KWIC (abre o texto na ocorrência), frequência, colocados, dispersão e leitor com etiquetas coloridas. (passo 3.6)
- Tela Comparar: palavras-chave contra outro corpus, grupos ou lista, e KFA a partir das camadas (mesmo resultado da versão anterior) com detalhe do traço. (passo 3.7)
- Ajuda na interface: balões, tour guiado, "Explicar esta tela", destino Aprender e visual interativo do d de Cohen. (passo 3.8)
- Exportar tabelas (CSV/TXT), gráficos (SVG/PNG) e camadas (CoNLL-U, VRT, CSV); "copiar como código" em cada análise. (passo 3.9)
- Testes de ponta a ponta (Playwright) e verificação de acessibilidade (axe, WCAG 2.2 AA) em 3 larguras e 3 temas, no CI; correções de contraste e de foco. (passo 3.10)
- Interface nova cobre o que a antiga fazia: abrir .ttwt e arquivo pendente, salvar como, exportar projeto, galeria de gráficos da KFA (11 tipos, 3D sob demanda) e impressão do leitor. (passos 3.7 e 3.11)

### Alterado
- Versão do app corrigida de `0.1.0` (desatualizada) para `0.4.0.dev0`; Python mínimo passa a 3.11. (passo 0.2)

- Pacote `ttwtools` 0.2.0.dev0 (commit `3e29ac8`).

## [0.3.7] — 2026-05-05

### Alterado
- Novas visualizações e gráficos (heatmap, visualizador de texto com anotação estilo "rough notation") e correções de impressão. _(Entrada reconstruída a partir do histórico do git.)_

## [0.3.6] — 2026-05-05

### Interface — uniformização de diálogos de arquivo

- **Botão "Escolher pasta…" movido para a esquerda** em todos os campos de caminho (exportar e salvar como), tornando o layout consistente com o formulário de nova análise.
- **Salvar como**: botão passa a exibir texto ("Escolher pasta…") em vez de ícone; pasta escolhida popula automaticamente nome de arquivo sugerido (stem do projeto atual + extensão selecionada).
- **Memória de última pasta por contexto** — cada diálogo lembra sua própria pasta via localStorage:
  - Abrir `.ttwa`/`.ttwt` → `last_ttwa_folder`
  - Salvar como → `last_saveas_folder`
  - Exportar projeto → `last_export_folder`
  - Corpus / saída nova análise → `qr_last_corpus_folder` / `qr_last_output_folder` (já existiam)
- **`pick-file` aceita `default_location`** (backend `utils.py` + `api.js`): o seletor nativo abre na última pasta usada.
- **`pick-file` aceita `.ttwt`**: adicionado ao filtro de tipos no seletor macOS/tkinter.

## [0.3.5] — 2026-05-05

_Versões 0.3.1 a 0.3.5 só ajustaram o CI (submódulo privado, `en_core_web_sm` no Python 3.14, ícone do DMG, runner Intel desativado). Sem mudança de funcionalidade._

## [0.3.0] — 2026-05-04

_Mudanças feitas em 2026-05-01 e publicadas na primeira tag da série 0.3._

### Frontend (frontend-src/)

#### Correções de interface (UI)

##### Barra de progresso do Tagging (step 2 — Nova análise)
- **Removido efeito shimmer** da barra de progresso (`::after` com `animation: bar-shimmer`). A barra agora exibe uma cor sólida estática crescendo à medida que o percentual aumenta.
- **Removida animação bounce indeterminate** (`::before` com `animation: bar-bounce`). Em vez disso, quando ainda não há percentual disponível, a barra mostra um segmento mínimo de 5% para indicar visualmente que o tagger está ativo.
- **Corrigido bug de barra invisível**: a função `updateTaggerBar` executava `fill.style.display = 'none'` quando `pct=0`, resultando em barra completamente invisível. Agora a barra permanece sempre visível: `0%` (aguardando) → `5%–pct%` (em andamento) → `100%` verde (concluído) / `100%` vermelho (erro).
- **Arquivos alterados**: `frontend-src/src/style.css`, `frontend-src/src/views/quickrun.js`

##### Eixo Y do gráfico KFA no modo claro
- Garantido contraste adequado dos rótulos do eixo Y SVG no tema claro via regra CSS:
  `[data-theme="ttwlight"] #chart-wrapper svg text { fill: oklch(15% 0.01 260) !important; }`
- **Arquivo alterado**: `frontend-src/src/style.css`

##### Tela KFA via aba lateral (`KFA` no menu)
- **Removidos selects de Tagger 1 / Tagger 2** — o tagger é agora detectado automaticamente a partir dos dados disponíveis no projeto.
- **Auto-populate ao abrir**: ao navegar para a aba KFA, um `MutationObserver` chama `_autoPopulateFromProject()`, que consulta `api.analysis.listKfa()` para obter o par de corpora já analisado e pré-seleciona `Corpus 1` / `Corpus 2` automaticamente.
- **Detecção automática de taggers**: após os corpora serem definidos, `_loadAllFeatures()` tenta todos os 7 taggers (`biberplus`, `mfte`, `mfte_ext`, `stanza_upos`, `stanza_xpos`, `spacy_upos`, `spacy_ptb`) e exibe um painel de checkboxes por tagger com features disponíveis — idêntico ao step 3 do fluxo nova análise.
- **Múltiplos KFAs**: ao executar, itera pelos painéis detectados e dispara um `runKfa` por tagger, adicionando cada resultado como nova camada de análise ao `.ttwa`.
- **Arquivos alterados**: `frontend-src/index.html`, `frontend-src/src/views/analysis.js`

##### KFA via sidebar após nova análise
- Adicionado `refreshCorpusSelects()` no handler do evento `project-changed` em `main.js`. Com isso, ao concluir um quickrun (que cria/atualiza o projeto), os selects de corpus na tela KFA e Tagging são atualizados imediatamente, permitindo que `_autoPopulateFromProject()` encontre as opções e pré-selecione os corpora.
- **Arquivo alterado**: `frontend-src/src/main.js`

##### Rótulos descritivos em botões de browse
- Substituído o ícone `📁` no botão de pasta de destino da tela Exportar por `"Escolher pasta"`. Todos os demais botões de seleção de pasta/arquivo já possuíam rótulos textuais informativos ("Corpus 1…", "Corpus 2…", "Salvar em…").
- **Arquivo alterado**: `frontend-src/index.html`

##### Tema automático por horário do sistema
- O tema inicial agora é determinado pelo horário local do computador: entre **08h00 e 18h00** → tema claro (`ttwlight`); fora desse intervalo → tema escuro (`ttwdark`).
- Se o usuário alternar manualmente via botão 🌙/☀️, a escolha é salva no `localStorage` e prevalece nas sessões seguintes.
- **Arquivo alterado**: `frontend-src/src/main.js`

---

### Arquivos modificados nesta sessão

| Arquivo | Tipo de mudança |
|---|---|
| `frontend-src/src/style.css` | Remoção de shimmer/bounce nas barras; contraste eixo Y modo claro |
| `frontend-src/src/views/quickrun.js` | Correção de `updateTaggerBar` — barra sempre visível |
| `frontend-src/src/views/analysis.js` | Auto-detect taggers; auto-populate corpus; painéis de tags |
| `frontend-src/src/main.js` | Tema por horário; `refreshCorpusSelects` no `project-changed` |
| `frontend-src/index.html` | Remoção de selects de tagger; botão "Escolher pasta" |
| `frontend/` | Rebuild (assets atualizados: `index-C44bMuvf.js`, `index-Dv9u83w3.css`) |

[Unreleased]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.4.0-rc.1...HEAD
[0.4.0-rc.1]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.4.0-alpha.1...v0.4.0-rc.1
[0.4.0-alpha.1]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.7...v0.4.0-alpha.1
[0.3.7]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.6...v0.3.7
[0.3.6]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.5...v0.3.6
[0.3.5]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.0...v0.3.5
[0.3.0]: https://github.com/luaguiaroliveira/ttwtools-app/releases/tag/v0.3.0
