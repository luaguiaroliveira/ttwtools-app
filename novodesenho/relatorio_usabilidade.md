# Relatório de usabilidade e apresentação gráfica — interface Vue

Revisão feita a partir do aplicativo rodando em modo web (`python -m app --mode web`), com
screenshots das telas principais, um projeto de demonstração com **dois corpora já
etiquetados** e as três larguras (computador 1440, tablet 768, celular 390). O objetivo é
apontar o que melhorar para **estudantes e pesquisadores**, sem abreviações sem explicação.

- Data: 2026-09-28
- Como reproduzir: abrir um projeto com mais de um corpus já etiquetado, percorrer
  Arquivo → Etiquetagem → Explorar → Comparar → Módulos → Aprender.
- Prints: `novodesenho/verificacao/prints/usabilidade/` (numerados na ordem das seções).
- Base: `v0.4.0-rc.2.dev0` (branch `new_set26`).

> Prioridades: **P0** = atrapalha o fluxo hoje · **P1** = melhora clara, esforço médio ·
> **P2** = polimento.

## 0. Status da implementação (2026-09-28)

Implementado neste branch (a lógica do pacote não mudou; só `frontend-vue/`, i18n e este
relatório):

- **Tokens (§4):** definidos em `style.css` (`@theme`) e usados na casca, em `BarChart`/
  `ParCoords` (paleta `--chart-*`), nas marcas de classe gramatical (`--pos-*`, aplicadas no
  KWIC) e nos pontos das camadas (`--layer-*`).
- **A:** glossário com 28 verbetes + `HelpTip` com `term`/`topic`, `aria-describedby` e
  abertura no foco/toque; anotados a consulta (operadores), os cabeçalhos de Colocados
  (LL/MI/T), Frequência (lema/n-grama/per 1.000/palavras funcionais), Palavras-chave
  (LL/log ratio/%DIFF/range) e KFA (KFA/d de Cohen).
- **B:** menu "Arquivo" → **Projeto** e "Módulos" → **Recursos**, com os textos que os
  citavam ajustados.
- **C:** o seletor de corpus do cabeçalho mostra o número de camadas; o cartão do corpus
  ganhou selo "etiquetado".
- **D:** vazios de Explorar/Comparar trazem o próprio seletor de corpus. A faixa "Próximo
  passo" chegou a ser feita e foi **removida a pedido**: usar a ferramenta para explorar um
  corpus individual é legítimo, e sugerir "comparar" confundia.
- **E2:** `ParCoords` corrigido (só traço, sem preenchimento), com legenda e rolagem
  horizontal.
- **F:** Frequência com "Mostrar N" (25–500), rolagem vertical própria (`overflow-auto` +
  cabeçalho fixo) e botão de tabela junto do gráfico; Colocados com ordenação por coluna e
  `aria-sort`.
- **G:** Palavras-chave e KFA com "Opções avançadas" recolhidas.
- **H:** português como idioma padrão; erros da API traduzidos nos casos comuns
  (`utils/errors.js`, sem tocar no pacote).

**Parcial / pendente:** nomes definitivos dos menus (decisão D8 do plano); tradução de
**todas** as mensagens do servidor (hoje só os casos comuns — o pacote ainda não manda
códigos de erro estáveis); reordenar o menu/tour com indicador de etapas; agrupar também os
formulários de Colocados/Dispersão/Laboratório.

---

## 1. Corrigido nesta sessão (P0)

**Sintoma:** depois de abrir um arquivo com mais de um corpus já etiquetado, ir direto a
Explorar mostrava *"Choose a corpus in File to explore"*, e não havia onde escolher o
corpus a não ser voltando a Arquivo/Etiquetagem. O seletor de **camada** no cabeçalho só
funcionava depois de escolher o corpus em outra tela.

**Antes:** `03-explorar-sem-corpus-antes.png` — cabeçalho só com o texto "no corpus".
**Depois:** `04-cabecalho-escolher-corpus.png` e `12-explorar-apos-escolher-corpus.png`.

**O que mudou**

- O cabeçalho passou a ter o **seletor de corpus** (antes era um simples texto), sempre
  que há projeto aberto; escolher ali já carrega as camadas e libera o seletor de camada.
- `App.vue`: `active-corpus` virou `<select>` ligado a `session.setCorpus()`.
- Mensagens de Explorar e Comparar deixaram de apontar para "Arquivo" e passaram a apontar
  para o **seletor do topo**.
- Chaves novas/ajustadas no pacote: `header.select_corpus`; `explore.need_corpus` e
  `compare.need_corpus`.
- Teste e2e atualizado (`active-corpus` agora é `toHaveValue`). `npm test` → 16 passed;
  `npm run e2e` → 12 passed.

---

## 2. Leitura geral

**Pontos fortes (manter):**

- Estrutura consistente: trilho/barra lateral + conteúdo, com as mesmas seções em todas as
  telas; estados de erro/vazio aparecem em texto claro.
- Boa base de acessibilidade: foco visível, tema de alto contraste, `prefers-reduced-motion`,
  testes axe/WCAG AA nas três larguras; tour e "Explicar esta tela".
- Tela Etiquetagem bem resolvida: o que já existe, o que será executado e o porquê de cada
  etiquetador (Rápido/Recomendado/Mais preciso), nada rodando escondido.
- Módulos com ficha por modelo (licença, tamanho, origem) — exatamente o que faltava.

**Problemas transversais (resumo):**

| # | Tema | Prioridade | Onde |
|---|------|-----------|------|
| A | Jargão e abreviações sem explicação no ponto de uso | P0 | Explorar, Comparar |
| B | Nomes de menu/aba pouco intuitivos ("Arquivo", "Módulos", "Search") | P0 | Navegação |
| C | Falta de indicação de "corpus ativo" e do que está etiquetado | P1 | Cabeçalho, Arquivo |
| D | Fluxo de trabalho sem "próximo passo" sugerido | P1 | Geral |
| E | Hierarquia visual fraca e paleta sem tokens de dados | P1 | Geral, gráficos |
| E2 | Coordenadas paralelas com preenchimento errado; gráficos sem legenda/zoom | P1 | Comparar → KFA |
| F | Tabelas densas, sem orientação, cabeçalhos abreviados; frequência sem rolagem/zoom | P1 | KWIC, frequência, colocações |
| G | Formulários longos em uma linha, sem agrupamento | P2 | Explorar/Comparar |
| H | Idioma inicial segue o navegador; erros do servidor em português fixo | P1 | i18n |

---

## 3. Melhorias por tema

### A. Tooltips e explicações de jargão (P0)

Toda sigla ou termo técnico deve ter explicação **no ponto de uso**, não só na tela
Aprender. Hoje só há `HelpTip` em algumas telas, e mesmo assim por tópico, não por campo.

Casos concretos observados:

- **QueryBox** mostra `casa · cas* · /regex/ · lemma=run · pos=NOUN · tag=PASS · black cat (frase)`
  (`explore.query_hint`) sem dizer o que é `lemma`, `pos`, `tag`, regex ou frase.
- **Colocados**: cabeçalhos `LL`, `MI`, `T` sem tooltip; a única ajuda aponta para
  `keyness`, que não é o tópico certo.
- **Frequência**: `Unidade` mistura "forma, lema, palavra+classe, classe, n-grama" sem
  definição; `Freq. por 1.000` não é explicado.
- **Comparar**: `d de Cohen`, `KFA`, `log-likelihood`, `log ratio`, `%DIFF`, `log-odds`,
  `keyness`, `faixas lexicais`, `Range`, `DP de Gries` aparecem em rótulos e cabeçalhos.
- **Etiquetagem**: `UPOS`, `XPOS`, `traços`, `morfologia`, `tokenize_prioritized` ficam só
  no texto de apoio.
- **Cabeçalho**: "automática" (camada) tem `title`, mas `title` nativo não aparece em toque
  e demora no mouse.

**Recomendação**

1. Criar um componente único `<Help>` (evolução do `HelpTip`) que aceite `topic` **ou**
   `term` e resolva o texto por uma tabela `glossary.*` nas i18n; usar em **todo** rótulo,
   aba, cabeçalho de coluna e opção que tenha sigla.
2. Anexar `aria-describedby` ao controle, não só `title`; abrir em foco e em toque, com
   `Esc` para fechar.
3. Definir os termos uma vez em `data/i18n/ui.*.json` (`glossary.lemma`, `glossary.pos`,
   `glossary.ll`, `glossary.mi`, `glossary.t_score`, `glossary.cohens_d`, `glossary.kfa`,
   `glossary.keyness`, `glossary.log_ratio`, `glossary.percent_diff`, `glossary.log_odds`,
   `glossary.dp_gries`, `glossary.range`, `glossary.upos`, `glossary.xpos`, `glossary.ngram`,
   `glossary.per_1000`, `glossary.stopwords`, `glossary.lema`, `glossary.token`, …).
4. Modo **"glossário visível"** (opcional, no menu ⚙): mostra os termos sublinhados com
   definição embutida, útil para quem está aprendendo; desligado por padrão para não poluir.
5. Escrever a sintaxe de consulta com uma **lista de operadores** em vez de exemplos soltos:
   cada operador (`palavra`, `palavra*`, `/regex/`, `lemma=`, `pos=`, `tag=`, `"frase"`)
   com descrição curta e exemplo.

### B. Nomes de menus, comandos e abas (P0)

| Hoje | Problema | Sugestão |
|------|----------|----------|
| **Arquivo** (`nav.corpora`) | ambíguo em português (arquivo = file, acervo); mistura projeto + biblioteca de corpora | **Projeto** (ou "Projeto e corpora") |
| **Módulos** | não sugere modelos/corpora para baixar | **Recursos** (com subtítulo "modelos e corpora para baixar") ou "Baixar" |
| **Explorar → Search** | "Search" genérico e redundante com KWIC | **Consultar** / "Busca simples"; renomear tool para o que faz e ordenar por uso (KWIC, Frequência, Colocados, Dispersão, Leitor) |
| **Etiquetagem** | termo correto, mas exige contexto | manter, com subtítulo "camadas de análise" |
| **Aprender** | ok | manter |
| **Módulos/[modelos]** | "Modelos" aparece em Configurações avançadas | unificar vocabulário: "modelo de etiquetagem" vs "corpus pronto" |

- Ordem do menu/abas deve seguir o fluxo real: **Arquivo → Etiquetagem → Explorar →
  Comparar → Recursos → Aprender**, com um indicador de etapa (1–2–3) no tour.
- Ícones atuais ajudam, mas "Módulos" (quadriculado) e "Comparar" (barras) são genéricos;
  revisar par de ícone+rótulo na barra inferior do celular (rótulos truncam: "Etiquet…").
- Padronizar rótulos de botão: ação **negrito/verbo no infinitivo** ("Escolher pasta…",
  "Executar análise e etiquetagem"), evite "Go/Buscar/Search" misturados na mesma tela.
  Hoje a Frequência usa **"Buscar"** e o tooltip do QueryBox usa **"Search"**.

### C. Corpus ativo e o que está etiquetado (P1)

- O seletor do cabeçalho agora existe, mas não diz **quais corpora têm camadas**. Mostrar
  junto do nome, p.ex. `CorIFAessays · 1 camada`, e/ou um ponto de estado.
- Em Arquivo, os cartões de corpus já indicam "N documentos · N camadas" — bom; acrescentar
  um selo "etiquetado" quando houver camadas e destacar o **corpus ativo** de forma mais
  forte que o contorno atual.
- Se houver mais de um corpus e **nenhum** salvo, sugerir no vazio de Explorar/Comparar:
  "Escolha um corpus no topo" **com o próprio seletor ali** (evita a caça ao menu).
- Avaliar (decisão do usuário) selecionar automaticamente o primeiro corpus **etiquetado**
  ao abrir, em vez de ficar vazio; hoje só há seleção automática quando existe 1 corpus.

### D. Fluxo de trabalho e "próximo passo" (P1)

- Ao concluir uma etapa, oferecer a **próxima ação** com botão: importou → "Etiquetar
  agora"; etiquetou → "Explorar". Hoje o `corpora.go_tagging` faz isso parcialmente.
  **Cuidado:** não sugerir "Comparar" dentro de Explorar — explorar um corpus individual é
  uso legítimo, e a faixa de "próximo passo" foi removida por confundir (ver §0).
- Estado vazio deve ser **acionável**, não só explicativo: cada tela com `need_corpus`
  deve trazer o seletor ou um botão, não um link para outra tela.
- Barra de tarefas persistente: a tela Etiquetagem tem bom progresso; replicar um resumo
  discreto no cabeçalho quando uma tarefa roda em segundo plano.

### E. Apresentação gráfica e hierarquia (P1)

- Títulos de página (`text-2xl`) e seções (`text-xl`) têm pouca distinção de cor/tamanho em
  relação ao corpo; falta uma "faixa de título" ou espaçamento vertical consistente.
- Cartões/painéis usam `bg-base-200` sem borda; em telas longas as seções se fundem. Usar
  `--radius-box` e uma **sombra/contorno tokenizados** para separar blocos.
- Gráficos (barras, KFA, dispersão) usam **uma só cor primária**. Definir **paleta
  categórica** para grupos/traços e **paleta de POS/classe** para tabelas e leitor.
- Estados de sucesso usam `badge-success` com "✓"; padronizar ícone + cor, e reservar
  amarelo/vermelho para aviso/erro de forma consistente.
- Área de leitura (Leitor, KWIC) sem largura máxima confortável de linha; aplicar
  `--container-reading` (~65–70ch).

### E2. Gráficos e visualizações (P1)

- **Coordenadas paralelas (Comparar → KFA → galeria) saem com áreas preenchidas estranhas.**
  A causa é de código: `components/charts/ParCoords.vue` desenha `<polyline fill="none">`,
  mas aplica a classe `SIDE_CLASS` (`utils/scale.js`), que contém `fill-primary stroke-primary`
  etc. O `fill-*` de CSS vence o atributo `fill="none"`, então cada linha vira um polígono
  fechado e as áreas se sobrepõem (print do usuário). Correção de uma linha: usar apenas
  classes de traço (`stroke-*`) nesse gráfico, com `fill="none"` preservado, ou adicionar
  `fill-none`. Vale conferir os outros gráficos que reutilizam `SIDE_CLASS` e realmente
  querem preenchimento.
- Com muitas features, o `viewBox` cresce (`70px` por traço) e o gráfico fica ilegível sem
  zoom/rolagem; considerar eixos reordenáveis, brush por eixo e limite de linhas visíveis.
- Legenda de cores ausente na maioria dos gráficos (só cor); adicionar legenda/label dos
  grupos e permitir filtrar por grupo.

### F. Tabelas e resultados (P1)

- KWIC: coluna "Class" (classe gramatical) sem tooltip; "Hit" e "File:offset" poderiam ter
  cabeçalho explicado. Garantir alinhamento tabular (`tabular-nums`) também nas colunas de
  POS e deixar a linha de contexto clicável evidente.
- **Frequência: permitir zoom e rolagem vertical própria**, para chegar às palavras menos
  frequentes sem rolar a página inteira. Hoje a tabela fica em `max-h-96` com
  `overflow-x-auto` — só o eixo X rola, então o conteúdo vertical é cortado e não há
  scroll; trocar por `overflow-auto` e dar à tabela uma altura com rolagem interna. Além
  disso, não há controle de **quantidade/top**: `f.top` está fixo em 50 e não aparece na
  tela, então não há como pedir mais itens nem "zoom" no gráfico (aumentar a barra/lista
  exibida, com um seletor de "mostrar N" e um campo de zoom). O botão "Ver como tabela"
  fica longe, à direita do gráfico; aproximá-lo do título do gráfico.
- Colocados: ordenar por medida clicando no cabeçalho; indicar a medida ativa.
- Paginação: botões "Anterior/Próximo" no fim da lista (ok), mas falta o total no topo e um
  atalho "ir para a página"; considerar "carregar mais".

### G. Formulários (P2)

- Frequência/Colocados/KFA/Lab põem muitos campos na mesma linha; agrupar por bloco
  ("Consulta", "Janela", "Medida", "Filtros") e pôr o avançado em painel recolhido — padrão
  já adotado em Etiquetagem e em Arquivo; replicar.
- Rótulos como "Freq. mínima" e "Por" (agrupamento) precisam de tooltip (ver A).

### H. Internacionalização e textos de erro (P1)

- O idioma inicial segue `navigator.language`; para o público-alvo (Brasil), considerar
  **pt como padrão** e en como opção, ou pelo menos lembrar a escolha (já lembra).
- Erros vindos do servidor/pacote saem sempre em português, mesmo com a interface em inglês
  (item já aberto no passo 6.2a). Mapear os erros comuns para chaves de tradução.
- Fazer uma varredura por strings fixas em componentes (fora do i18n) e movê-las para chaves
  `ui.*.json`.

---

## 4. Design tokens propostos

Hoje quase tudo vem dos temas DaisyUI (`base-*`, `primary`, `success`, `warning`, `error`) e
`style.css` só ajusta contraste e impressão. Proposta: uma **camada de tokens** em
`frontend-vue/src/style.css` com `@theme` (Tailwind 4), para que telas e gráficos compartilhem
a mesma escala e paleta, sem repetir valores.

```css
@theme {
  /* tipografia */
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --text-xs: 0.75rem;  --text-sm: 0.875rem; --text-base: 1rem;
  --text-lg: 1.125rem; --text-xl: 1.375rem; --text-2xl: 1.75rem;
  --leading-snug: 1.3; --leading-normal: 1.55;

  /* espaçamento e layouts (escala de 4px) */
  --spacing-page: 1.25rem;      /* padding da main */
  --spacing-section: 1rem;      /* entre seções */
  --container-app: 72rem;       /* largura máxima de tela */
  --container-reading: 68ch;    /* texto corrido */

  /* forma e elevação */
  --radius-box: 0.75rem; --radius-field: 0.5rem; --radius-selector: 0.5rem;
  --shadow-card: 0 1px 2px rgb(0 0 0 / .06), 0 1px 3px rgb(0 0 0 / .10);
  --shadow-pop: 0 10px 30px rgb(0 0 0 / .15);

  /* foco (já usado hoje; centralizar) */
  --focus-width: 3px; --focus-offset: 2px;

  /* paleta de dados (grupos/traços) */
  --chart-1: #4f46e5; --chart-2: #0ea5e9; --chart-3: #10b981;
  --chart-4: #f59e0b; --chart-5: #ef4444; --chart-6: #8b5cf6;
  --chart-7: #14b8a6; --chart-8: #64748b;

  /* classes gramaticais (POS/UPOS) */
  --pos-noun: #2563eb; --pos-verb: #16a34a; --pos-adj: #d97706;
  --pos-adv: #7c3aed; --pos-other: #6b7280;

  /* etiquetadores e camadas */
  --layer-stats: #64748b; --layer-spacy: #0ea5e9; --layer-stanza: #8b5cf6;
  --layer-mfte: #f59e0b; --layer-biberplus: #10b981;
}
```

**Classes utilitárias** (uma vez em `style.css`, reutilizadas nas telas):

- `.page` (largura, padding, espaçamento entre seções), `.page-title`, `.section-title`.
- `.panel` (fundo/borda/raio/sombra tokenizados), `.panel-head`.
- `.field` (rótulo + controle + ajuda no mesmo bloco), `.field-help` (texto pequeno).
- `.chip` / `.chip-pos` / `.badge-tagger` (cor por token) para POS e etiquetadores.
- `.prose-read` (usa `--container-reading`).
- `.focusable` (usa `--focus-*`).

**Regras de uso**

1. Nenhum componente define cor/sombra "na mão": sempre token (ou utilitário derivado).
2. Gráficos leem `--chart-*` por índice; POS/etiquetador usam seu token fixo (mesma cor em
   tabela, gráfico, leitor e legenda).
3. Tema escuro/alto contraste: os tokens de dados devem ter variantes legíveis; conferir
   contraste AA (os testes axe já cobrem telas-chave — estender às telas de resultado).
4. Documentar os tokens no `LEIAME`/`novodesenho` para quem for criar telas.

---

## 5. Roadmap sugerido

| Ordem | Entrega | Itens | Prioridade |
|-------|---------|-------|-----------|
| 1 | Tooltips de jargão no ponto de uso | A (componente `<Help>` + glossário) | P0 |
| 2 | Nomes de menu/aba e comandos; ordem do fluxo | B | P0 |
| 3 | Vazios acionáveis (sem sugerir "comparar" em Explorar) | C, D | P1 |
| 4 | Corrigir coordenadas paralelas e legenda/zoom dos gráficos | E2, tokens | P1 |
| 5 | Tokens + hierarquia + paleta de gráficos | E, tokens | P1 |
| 6 | Tabelas (rolagem/zoom da frequência, tooltips, ordenação, i18n) | F, H | P1 |
| 7 | Agrupamento de formulários | G | P2 |

Sugestão de registro no plano: criar um passo **`6.4 Revisão de usabilidade e design
tokens`** (depois de 6.2a/6.3) ou dividir em `6.4` (tooltips + nomes, P0) e `6.5` (tokens +
gráficos, P1). Como a lógica não muda, o trabalho é só em `frontend-vue/` e nas chaves de
i18n do pacote — mantendo a paridade GUI/pacote.

---

## Anexo — prints

| Arquivo | O quê |
|---------|-------|
| `01-inicio.png` | Tela inicial |
| `02-arquivo-projeto-com-dois-corpora.png` | Arquivo com 2 corpora, um aberto |
| `03-explorar-sem-corpus-antes.png` | Explorar bloqueado (antes) |
| `04-cabecalho-escolher-corpus.png` | Cabeçalho com seletor de corpus (depois) |
| `05-etiquetagem.png` | Etiquetagem com camadas existentes |
| `06-explorar-kwic.png` | KWIC com resultados |
| `07-explorar-frequencia.png` | Frequência com gráfico |
| `08-comparar-sem-corpus.png` | Comparar bloqueado |
| `09-modulos.png` | Módulos (modelos e fichas) |
| `10-aprender.png` | Aprender (métricas e conceitos) |
| `11-mobile-frequencia.png` | Celular 390 (cabeçalho + barra inferior) |
| `12-explorar-apos-escolher-corpus.png` | Explorar depois de escolher no cabeçalho |
| `13-parcoords-ruim.png` | Coordenadas paralelas com preenchimento errado (seção E2) |
