# Changelog — ttwtools-app

## [Unreleased] — 2026-05-01

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
