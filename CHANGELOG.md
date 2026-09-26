# Changelog — ttwtools-app

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões: [SemVer](https://semver.org/lang/pt-BR/); a regra está em `RELEASING.md`. O pacote `ttwtools` (submódulo) tem changelog próprio.

## [Unreleased]

Linha nova **0.4.0** (reformulação; plano em `novodesenho/plano_implementacao.md`).

### Adicionado
- Versão única: `pyproject.toml` é a fonte; `app/_version.py` expõe `__version__`, `python -m app --version` e `GET /api/version` (app, `ttwtools`, commit). `RELEASING.md` com a regra de versão. (passo 0.2)
- Build único `build/build.py` (macOS arm64/Intel, Windows, Linux) com `--selftest` no binário, `build/check_macos_min.py` e pacotes `TTWtools-<versão>-<so>-<arq>`. Mínimo: macOS 12.0 (Intel) e 12.3 (Apple Silicon). (passo 0.3)
- CI a cada push (testes, frontend) e pipeline de release em 4 sistemas (macOS arm64 e Intel, Windows, Linux) com autoteste do binário e release em rascunho. (passo 0.4)
- Pacote `ttwtools`: testes, linha de comando `ttwtools` (passo 1.1); esquema de projeto v0.3 com camadas, tokens e projetos leves `.ttwl` (passo 1.2). Importação de corpus com metadados por documento, filtros e tokenização simples (passo 1.3). Etiquetagem com cache de camadas: não reprocessa o que já foi feito (passo 1.4). Opções e tagsets dos taggers descritos em dados, com explicações em pt/en, predefinições e disponibilidade por sistema (passo 1.5). Formatos CoNLL-U, VRT, palavra/TAG e tabelas de tokens (passo 1.6).

### Alterado
- Versão do app corrigida de `0.1.0` (desatualizada) para `0.4.0.dev0`; Python mínimo passa a 3.11. (passo 0.2)

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

[Unreleased]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.7...HEAD
[0.3.7]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.6...v0.3.7
[0.3.6]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.5...v0.3.6
[0.3.5]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.0...v0.3.5
[0.3.0]: https://github.com/luaguiaroliveira/ttwtools-app/releases/tag/v0.3.0
