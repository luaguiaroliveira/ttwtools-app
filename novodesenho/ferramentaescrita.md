# ferramentaescrita.md — instrumentos ricos de corpus + DDL para a Escrita

Continuação do `plano_escrita.md` (que entrega a base: texto individual × referência, com
LL, log ratio, %DIFF, FDR, dispersão e badges). Aqui o foco é **ir além da contagem de
palavras**: um texto pode ser sobre um tema específico e a ocorrência de uma palavra diz
pouco sobre a **escrita**. O que interessa é *como* o texto se constrói — combinações,
padrões e construções — em diálogo com a tradição de **DDL (Data-Driven Learning)**.

> Referências-chave: Johns (1991, DDL); Sinclair (padrões lexicais); Hunston & Francis
> (Pattern Grammar); Biber et al. (1999, bundles e traços de registro); Hoey (lexical
> priming); Stefanowitsch & Gries (2003, collostructional analysis); Anthony (AntConc);
> Biber & Egbert (KFA).

---

## 1. Diagnóstico — por que contagem de palavras não basta

- **Tema ≠ competência.** Num texto sobre televisão regulada, `media`, `regulation`,
  `television` serão frequentes por causa do assunto, não por escolha estilística. Comparar
  listas de palavras entre um texto e um corpus "geral" mede tópico, não escrita.
- **n=1 e autocorrelação.** Palavras de um mesmo texto não são observações independentes;
  p-valores superestimam significância (Kilgarriff 2001). A saída deve ser descritiva e
  ancorada em **tamanho de efeito** e **dispersão**, não só em significância.
- **O que se ganha com instrumentos ricos:** mostrar **combinabilidade** (o que anda junto),
  **padrões** (sequências de classes/etiquetas = construções) e **registro** (perfil
  funcional). Isso transfere melhor para a escrita: o aluno vê *"assim se diz"*, não só
  *"esta palavra aparece muito"*.

---

## 2. Instrumentos propostos (do léxico ao discurso)

Cada um reusa o que já existe no pacote e acrescenta uma lente.

### 2.1 Perfis de colocação (nodes como pontes)
Para cada palavra-chave do texto (over/underuse), comparar **os colocados** dela no texto vs
na referência: tabela de colocados com LL, log ratio, MI, T-score e dispersão. Em vez de
"`analysis` é chave", mostrar "`analysis` no seu texto vem com `conduct`, `reveal`; na
referência vem com `provide`, `suggest`". Base: `query.collocates` + medidas de `keyness`.
Visual: rede de colocação (node no centro, colocados em órbitas por log ratio).

### 2.2 Pacotes lexicais / n-gramas (bundles)
Sequências de 3–5 palavras e de forma+classe (`on the other hand`, `it is important to`,
`DT JJ NN`). Comparar frequência normalizada e efeito vs referência; destacar **fórmulas
sub/superusadas** (função retórica: conectar, hedge, citar, exemplificar). Biber et al.
(1999); Hoey (lexical priming).

### 2.3 Perfil de construções por sequências de etiquetas (POS/tag)
Padrões de UPOS/XPOS e de tag detalhada (`DT JJ NN`, `VBZ that`, `VBN by`, `n-grams` de
classe) contados no texto e na referência, com log ratio/LL e dispersão. É o "Pattern
Grammar" operacionalizado: a unidade não é a palavra, é o **molde** (`the * of *`,
`a * that *`). Base: camadas POS/tag já existentes; nenhuma etiquetagem nova.

### 2.4 Análise colocacional (collostructional analysis)
A família de Stefanowitsch & Gries (2003) mede **atração/repulsão de lemas a uma
construção** — é o que responde "meu texto usa as construções certas com os lexemas certos?".

- **Collexeme analysis:** de uma construção/slot (ex.: slot antes de um `that-clause`),
  quais lemas são atraídos/repelidos. Estatística: **Fisher-Yates exato** (hipergeométrica),
  força = **−log10(p)**; não pressupõe normalidade nem independência de células.
- **Distinctive collexeme analysis:** preferência de um lema entre **duas construções
  alternativas** (ex.: `V to-inf` × `V that-clause`; `however` × `on the other hand`), o que
  é ótimo para escolha estilística.
- **Covarying collexeme analysis:** atração entre dois slots (ex.: no *into*-causative).

Entrega: para construções frequentes na referência, a lista de lexemas que o texto usa
"certo/errado" e um **score de preferência** entre alternativas. Aplicar FDR sobre as
centenas de testes.

### 2.5 Perfil de registro (Biber) via z-scores
O pacote já tem BiberPlus com dezenas de traços (tempo/aspecto, passiva, pronomes,
nominalizações, subordinação, modalidade...). Para um texto único:
- calcular a **taxa do traço no texto** (por 1.000 palavras);
- comparar com a **distribuição dos textos da referência** → **z-score** descritivo
  ("este texto é 1,8 DP acima do padrão em `VBD`"), em vez de um teste de significância
  sobre n=1.
Entrega: painel de "impressão digital de registro" (barras divergentes), com aviso de que é
descritivo.

### 2.6 Sofisticação lexical e legibilidade
- **Bandas de frequência lexical** (já existe) — parte do texto coberta pelas 1.000/2.000...
  palavras mais frequentes da referência.
- **Diversidade lexical** com medidas robustas ao tamanho: MTLD, HD-D, MATTR, voc-D
  (`lexicalrichness`).
- **Densidade lexical** e comprimento médio de frase; **legibilidade** (`textstat`), com a
  ressalva de que fórmulas de legibilidade foram feitas para inglês nativo.
- **Palavras acadêmicas / lista de referência** (AWL ou lista do catálogo): cobertura.

### 2.7 Coesão, postura e discurso
- Conectores e marcadores de discurso (dependência de listas), **hedging/boosting**
  (pacotes de postura), **nominalizações**, densidade informacional.
- **Consistência interna**: dispersão das escolhas ao longo do texto (se houver seções),
  não só no agregado.

---

## 3. Modelo DDL (pedagógico)

O objetivo não é "corrigir", é **descobrir com dados** (Johns 1991; aprender como
pesquisador). Fluxo sugerido:

1. **Rascunho** (colar/subir).
2. **Diagnóstico** por categorias: colocação, construções, pacotes, registro, léxico —
   cada achado com **significância + magnitude + dispersão**.
3. **Ver no corpus (noticing):** para cada achado, botão "Ver concordâncias"/"Ver como se
   diz" abre o KWIC real na referência, com os padrões alinhados (padrão `the * of *`).
4. **Hipótese e reformulação:** sugestões no estilo "nesta construção, a referência prefere
   X" (distinctive collexemes); o aluno reescreve e **re-mede**.
5. **Comparar com textos modelo** do mesmo gênero (não só com um corpus "geral").

Recursos didáticos: glossário curto por métrica; exemplos de sala; "modo aprendiz" (só o
essencial, botões de ajuda) e "modo pesquisador" (todas as estatísticas e exportação).
Compatível com a tela **Aprender** e com o "Explicar esta tela".

Escolha crucial: **a referência deve ser do mesmo gênero/registro** do texto. Um corpus de
redações de alunos de mesmo nível dá feedback mais útil que um corpus jornalístico; o
catálogo de corpora (passo 4.x) já prevê listas de referência com ficha (gênero, público).

---

## 4. Recursos de corpus e ferramentas (pesquisa)

### 4.1 Ferramentas de corpus / DDL (referência de funcionalidades)
| Ferramenta | O que faz | Inspiração para cá |
|---|---|---|
| AntConc (Anthony) | concordâncias, clusters, colocados, keywords | pacotes de concordância e "clusters" para o DDL |
| #LancsBox (Brezina) | `GraphColl` (redes de colocação), dispersão | visual de rede de colocação |
| Sketch Engine / **SkELL** | "word sketch", concordâncias prontas para aprendiz | layout de "como se diz" |
| WriteBetter (DDL) | assistente de escrita com dados de corpus | fluxo diagnóstico→reescrita |
| **PhraseBank** (Manchester) | frases acadêmicas por função retórica | banco de "fórmulas" por função |
| JustTheWord | colocados por padrão | colocados agrupados por padrão |

### 4.2 Bibliotecas Python (encaixe direto — paridade pacote/CLI)
| Lib | Uso | Licença / nota |
|---|---|---|
| **spaCy** (já usada) | POS, dependências, noun chunks, `Matcher`/`DependencyMatcher` | MIT; já no projeto |
| **textacy** | n-grams, SVO triples, keyterms, legibilidade, TTR sobre spaCy | Apache-2.0; depende de spaCy (ok) |
| **lexicalrichness** | MTLD, HD-D, MATTR, MSTTR, voc-D, Yule | MIT; puro Python, ótimo encaixe |
| **textstat** | legibilidade multi-idioma (Flesch, etc.) | MIT; puro Python |
| **language_tool_python** + LanguageTool | gramática/estilo/ortografia en/pt | GPL-3; **exige Java** e download — usar como opcional/externo |
| **keybert / yake** | frases-chave por embeddings/estatística | MIT/BSD; yake é puro, keybert puxa sentence-transformers (pesado) |
| **pyphen** | sílabas p/ legibilidade | GPL/LGPL/MPL tri-licença; usar com `textstat` |
| **wordfreq** | frequência multilingue p/ sofisticação | Apache-2.0 |
| **proselint** | estilo (clichês, redundância) | BSD; inglês |
| **statsmodels** | Fisher exato / BH (opcional) | BSD; hoje não é necessário (Já temos BH e Fisher é simples) |

**Decisão de arquitetura:** manter o núcleo em **Python, dentro do pacote**, sem novas
dependências pesadas — `lexicalrichness`, `textstat` e `yake` são puros e pequenos;
`textacy` é opcional; `LanguageTool` fica como recurso **externo opcional** (Java, GPL), com
aviso claro, respeitando a compatibilidade (macOS 12, offline).

### 4.3 Bibliotecas JavaScript (só no frontend, se necessário)
| Lib | Uso | Licença / nota |
|---|---|---|
| **retext** (`unified`/`nlcst`) + plugins: `retext-readability`, `retext-passive`, `retext-simplify`, `retext-spell`, `retext-equality`, `retext-redundant-acronyms` | checagens de prosa como *lint* | MIT; roda no navegador |
| **write-good** | passiva, "weasel words", advérbios, clichês, E-Prime | MIT; inglês (tem extensão alemã) |
| **textlint** + regras | lint de texto configurável | MIT |
| **compromise** | POS e *pattern matching* leves em JS | MIT |
| **wink-nlp** | POS, entidades, padrões | MIT |
| **alex** | linguagem insensível/inclusiva | MIT |
| **text-readability / syllable** | legibilidade em JS | MIT |

**Cuidado (paridade GUI/pacote):** a regra do projeto é que a **lógica vive no pacote**. Se
usarmos JS, que seja só para *feedback instantâneo de rascunho* (ex.: passiva/clichê via
retext), **nunca** como a única implementação de um recurso — o mesmo recurso precisa existir
em Python + CLI.

---

## 5. Arquitetura proposta (pacote → CLI → rota → tela)

- **Pacote** (`libs/ttwtools/ttwtools/`):
  - `bundles.py` — n-gramas lexicais e de POS com comparação à referência.
  - `constructions.py` — inventário de sequências de etiquetas (POS/tag) e padrões.
  - `collexemes.py` — collexeme/distinctive/covarying; Fisher exato e −log10(p) + FDR.
  - `register.py` — z-scores dos traços BiberPlus por texto vs distribuição da referência.
  - `sophistication.py` (ou estender `stats.py`) — MTLD/HD-D, legibilidade, bandas, AWL.
  - `writing.py` passa a orquestrar um **perfil** por categorias (payload único para a tela).
  - `keyness.FreqTable` ganha opção de **contagens por documento** (necessário para
    bootstrap, dispersão fina e z-scores de traços).
- **CLI:** `ttwtools writing --profile colocacoes|construcoes|bundles|registro|lexico` (e
  subcomandos `bundles`, `collexemes` para uso de pesquisa/ensino).
- **Rota:** `POST /api/writing/analyze` devolve o perfil completo; rotas específicas só se
  o payload ficar grande.
- **Tela Escrita:** abas/cartões por categoria; cada linha com **significância (LL/p
  corrigido)** + **magnitude (log ratio/%DIFF)** + **dispersão** + badge; botão
  "Ver concordâncias" (abre o KWIC já filtrado); painel "Como interpretar" e glossário.

## 6. Estatística (regras)

- Collexeme/construções: **Fisher exato** (hipergeométrica), força `−log10(p)`, **FDR**
  (Benjamini-Hochberg); reportar **log ratio/odds** como efeito.
- Traços de registro e padrões: **z-score** vs distribuição dos documentos da referência
  (descritivo), evitando inferência sobre n=1; opcional **bootstrap por texto** para
  intervalo.
- Nunca apresentar só o p; sempre significância **e** magnitude **e** dispersão.
- Filtros de dispersão: não destacar item/constrção concentrado em poucos textos da
  referência (evita outlier) — hoje já sinalizamos isso nas palavras; estender às
  construções.

## 7. Roadmap por fases

- **Fase A (curta):** perfil de **construções** (n-gramas de POS/tag) + **z-score de
  traços Biber** + diversidade lexical (MTLD/HD-D) e legibilidade. Sem novas dependências
  pesadas. Alto valor pedagógico e reusa tudo o que já existe.
- **Fase B (média):** **colocados por palavra-chave** (comparação de perfis) e
  **distinctive collexemes** entre construções alternativas; rede de colocação.
- **Fase C (média):** **bundles** e covarying collexemes; dispersão fina e bootstrap por
  texto; "textos modelo" do mesmo gênero.
- **Fase D (longa):** camada DDL completa (exercícios, *noticing* guiado, banco de
  fórmulas por função retórica à la PhraseBank); integração **opcional** com LanguageTool;
  pacotes de sala de aula.

## 8. Perguntas abertas / decisões

- **Gênero da referência:** como garantir que o corpus de referência é do mesmo gênero?
  (ficha do catálogo com gênero/público; sugestão automática por similaridade de perfil).
- **Etiquetas:** construções dependem de camada POS/tag; o que fazer quando o texto/referência
  não tem tagger (spaCy indisponível, ex. macOS Intel sem torch)? Oferecer só form/ngram.
- **Fisher exato** em milhares de construções: custo aceitável? (versão vetorizada em
  `numpy`/`scipy.stats.hypergeom` ou implementação log-gama).
- **JS vs Python:** quanto de *feedback* de rascunho vale ter no navegador sem quebrar a
  paridade GUI/pacote?
- **Escopo de idioma:** listas de conectores/hedges e AWL são por idioma (en/pt).
