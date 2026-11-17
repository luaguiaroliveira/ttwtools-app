# Tagsets e etiquetas dos taggers do TTWtools

Este documento reúne, para cada tagger disponível no TTWtools, os tagsets que ele produz, a lista de etiquetas com suas definições e o modelo usado. As definições e os exemplos vêm dos descritores de tagset do pacote (`ttwtools/data/tagsets/*.tagset.json`, textos em português) e podem ser consultados também pela linha de comando:

```bash
python -m ttwtools tagset upos
python -m ttwtools tagset spacy_upos
python -m ttwtools tagset mfte
python -m ttwtools tagset biberplus
```

> A disponibilidade de cada tagger depende das dependências instaladas: spaCy para `spacy`; torch e Stanza para `stanza` e `mfte`; BiberPlus e spaCy para `biberplus`. Os atalhos (`spacy_upos`, `stanza_xpos`, `mfte_ext` etc.) apenas fixam tagset e opções.

## Visão geral

| Tagger | Identificador | Camadas de etiqueta | Tagsets | Modelo | Atalhos |
|---|---|---|---|---|---|
| spaCy | `spacy` | UPOS; PTB (XPOS) | `upos`, `ptb` | `en_core_web_sm` … `en_core_web_trf`; `pt_core_news_sm` … `pt_core_news_lg` | `spacy_upos`, `spacy_ptb` |
| Stanza | `stanza` | UPOS; XPOS (PTB só em inglês) | `upos`, `ptb` | `<idioma>/<pacote>` (ex.: `en/default`, `pt/bosque`) | `stanza_upos`, `stanza_xpos` |
| MFTE | `mfte` | Atributos MFTE; UPOS; XPOS (PTB) | `mfte`, `upos`, `ptb` | `stanza-en` (Stanza `en/default` + MFTE) | `mfte`, `mfte_ext` |
| BiberPlus | `biberplus` | Atributos de Biber | `biber` | `biberplus-spacy` (spaCy `en_core_web_sm`) | `biberplus` |

## spaCy

**spaCy** — Etiquetador estatístico rápido. Dá classe universal (UPOS), etiqueta Penn Treebank (XPOS), lema e morfologia. Em inglês, `upos` e `xpos` trazem tagsets distintos (UPOS e PTB); em português, o XPOS é a própria UPOS (não há PTB).

### Modelos

| Modelo | Idioma | Tamanho | Descrição |
|---|---|---|---|
| `en_core_web_sm` | inglês | pequeno | Rápido e leve; boa escolha para começar e para corpora grandes. |
| `en_core_web_md` | inglês | médio | Um pouco mais preciso que o pequeno; inclui vetores de palavras (úteis para similaridade). |
| `en_core_web_lg` | inglês | grande | Mais vetores de palavras que o médio; a precisão das classes é parecida, mas o download é grande. |
| `en_core_web_trf` | inglês | transformer | O mais preciso do spaCy, baseado em transformer (RoBERTa); bem mais lento. |
| `pt_core_news_sm` | português | pequeno | Modelo pequeno para português; etiqueta UPOS (sem PTB) e lema. |
| `pt_core_news_md` | português | médio | Modelo médio para português, com vetores de palavras; etiqueta UPOS (sem PTB) e lema. |
| `pt_core_news_lg` | português | grande | Modelo grande para português; etiqueta UPOS (sem PTB) e lema. |

### Tagset UPOS (`upos`)

**Universal POS (UD)** — As 17 classes gramaticais universais do projeto Universal Dependencies, iguais para todas as línguas.

- Identificador: `upos`
- Fonte: https://universaldependencies.org/u/pos/
- Etiquetas: 17

| Etiqueta | Grupo | Definição | Exemplo |
|---|---|---|---|
| `ADJ` | Classes abertas | adjetivo | big, old, green |
| `ADV` | Classes abertas | advérbio | very, well, exactly |
| `INTJ` | Classes abertas | interjeição | oh, hello, wow |
| `NOUN` | Classes abertas | substantivo comum | girl, cat, idea |
| `PROPN` | Classes abertas | nome próprio | Mary, London, NATO |
| `VERB` | Classes abertas | verbo (não auxiliar) | run, eat, think |
| `ADP` | Classes fechadas | adposição (preposição ou posposição) | in, to, during |
| `AUX` | Classes fechadas | verbo auxiliar (tempo, modo, voz; inclui modais e cópula) | has, will, should, is |
| `CCONJ` | Classes fechadas | conjunção coordenativa | and, or, but |
| `DET` | Classes fechadas | determinante (artigos, demonstrativos etc.) | a, the, this |
| `NUM` | Classes fechadas | numeral | 1, 2026, one, seventy |
| `PART` | Classes fechadas | partícula (to infinitivo, 's possessivo, not) | to, 's, not |
| `PRON` | Classes fechadas | pronome | I, you, herself, who |
| `SCONJ` | Classes fechadas | conjunção subordinativa | that, if, while |
| `PUNCT` | Outros | pontuação | . , ( ) ? |
| `SYM` | Outros | símbolo | $, %, §, :) |
| `X` | Outros | outro (palavra estrangeira, erro, não classificável) | etc., xfgh |

### Tagset PTB (`ptb`) — XPOS em inglês

**Penn Treebank (inglês)** — Etiquetas do Penn Treebank usadas pelos modelos de inglês do spaCy e do Stanza (XPOS), com as extensões do OntoNotes.

- Identificador: `ptb`
- Fonte: https://catalog.ldc.upenn.edu/docs/LDC99T42/tagguid1.pdf
- Etiquetas: 50

| Etiqueta | Grupo | Definição | Exemplo |
|---|---|---|---|
| `NN` | Substantivos | substantivo comum, singular ou incontável | cat, water |
| `NNS` | Substantivos | substantivo comum, plural | cats, ideas |
| `NNP` | Substantivos | nome próprio, singular | London, Mary |
| `NNPS` | Substantivos | nome próprio, plural | Americans, Alps |
| `VB` | Verbos | verbo, forma base | take, be |
| `VBD` | Verbos | verbo, passado | took, was |
| `VBG` | Verbos | verbo, gerúndio ou particípio presente | taking, being |
| `VBN` | Verbos | verbo, particípio passado | taken, been |
| `VBP` | Verbos | verbo, presente, exceto 3ª pessoa do singular | take, are |
| `VBZ` | Verbos | verbo, presente, 3ª pessoa do singular | takes, is |
| `MD` | Verbos | verbo modal | can, would, must |
| `JJ` | Adjetivos | adjetivo | big, green |
| `JJR` | Adjetivos | adjetivo, comparativo | bigger, better |
| `JJS` | Adjetivos | adjetivo, superlativo | biggest, best |
| `AFX` | Adjetivos | afixo separado | pre-, non- |
| `RB` | Advérbios e partículas | advérbio | quickly, very, not |
| `RBR` | Advérbios e partículas | advérbio, comparativo | faster, more |
| `RBS` | Advérbios e partículas | advérbio, superlativo | fastest, most |
| `RP` | Advérbios e partículas | partícula (de verbo frasal) | up (in give up), off |
| `WRB` | Advérbios e partículas | advérbio interrogativo ou relativo (wh-) | where, when, how |
| `PRP` | Pronomes e determinantes | pronome pessoal | I, she, them |
| `PRP$` | Pronomes e determinantes | pronome possessivo | my, her, their |
| `WP` | Pronomes e determinantes | pronome interrogativo ou relativo (wh-) | who, what |
| `WP$` | Pronomes e determinantes | pronome possessivo wh- | whose |
| `DT` | Pronomes e determinantes | determinante | the, a, this |
| `PDT` | Pronomes e determinantes | predeterminante | all (in all the), both |
| `WDT` | Pronomes e determinantes | determinante wh- | which, that (relative) |
| `EX` | Pronomes e determinantes | there existencial | there (in there is) |
| `IN` | Preposições, conjunções e outras palavras funcionais | preposição ou conjunção subordinativa | in, of, because |
| `TO` | Preposições, conjunções e outras palavras funcionais | to (infinitivo ou preposição) | to |
| `CC` | Preposições, conjunções e outras palavras funcionais | conjunção coordenativa | and, but, or |
| `CD` | Preposições, conjunções e outras palavras funcionais | numeral cardinal | 3, twenty |
| `POS` | Preposições, conjunções e outras palavras funcionais | marca de possessivo | 's |
| `UH` | Preposições, conjunções e outras palavras funcionais | interjeição | oh, uh, yes |
| `LS` | Preposições, conjunções e outras palavras funcionais | marcador de item de lista | a), 1. |
| `,` | Pontuação e símbolos | vírgula | , |
| `.` | Pontuação e símbolos | pontuação de fim de frase | . ? ! |
| `:` | Pontuação e símbolos | dois-pontos, ponto e vírgula, travessão, reticências | : ; -- ... |
| ```` | Pontuação e símbolos | aspas de abertura | “ `` |
| `''` | Pontuação e símbolos | aspas de fechamento | ” '' |
| `-LRB-` | Pontuação e símbolos | parêntese (ou colchete) de abertura | ( [ |
| `-RRB-` | Pontuação e símbolos | parêntese (ou colchete) de fechamento | ) ] |
| `HYPH` | Pontuação e símbolos | hífen | - |
| `NFP` | Pontuação e símbolos | pontuação solta (fora do padrão) | ***, ... |
| `$` | Pontuação e símbolos | símbolo de moeda | $, £ |
| `SYM` | Pontuação e símbolos | símbolo | %, &, + |
| `FW` | Outros | palavra estrangeira | et, cetera |
| `ADD` | Outros | endereço de e-mail ou internet | www.example.com |
| `XX` | Outros | desconhecido | — |
| `_SP` | Outros | espaço em branco | — |

## Stanza

**Stanza** — Etiquetador neural de Stanford (usa torch). Mais lento que o spaCy, com modelos por treebank. Dá UPOS, XPOS (PTB em inglês), atributos morfológicos e, se pedido, lema. Em português, o Stanza fornece UPOS, mas não XPOS.

### Modelos (pacotes do Stanza)

| Pacote | Idioma | Observação |
|---|---|---|
| `default` | inglês | Combinado recomendado; padrão do Stanza. |
| `default_fast` | inglês | Versão mais rápida do pacote padrão. |
| `default_accurate` | inglês | Transformer; mais preciso e bem mais lento. |
| `combined` | inglês | Combina treebanks de inglês. |
| `ewt` | inglês | Treinado no English Web Treebank (EWT). |
| `gum` | inglês | Treinado no Georgetown University Multilayer (GUM). |
| `partut` | inglês | Treinado no treebank de paráfrases PAR TUT. |
| `lines` | inglês | Treinado no treebank Lines. |
| `atis` | inglês | Treinado no corpus de fala ATIS. |
| `eslspok` | inglês | Treinado no corpus ESLSPOK. |
| `default` | português | Combinado recomendado para o idioma. |
| `bosque` | português | Treebank Bosque; padrão do Stanza para português. |
| `cintil` | português | Treinado no CINTIL. |
| `dantestocks` | português | Treinado no DANTEStocks. |
| `gsd` | português | Treinado no treebank Universal Dependencies GSD. |
| `petrogold` | português | Treinado no PetroGold. |
| `porttinari` | português | Treinado no Porttinari. |

### Tagset UPOS (`upos`)

**Universal POS (UD)** — As 17 classes gramaticais universais do projeto Universal Dependencies, iguais para todas as línguas.

- Identificador: `upos`
- Fonte: https://universaldependencies.org/u/pos/
- Etiquetas: 17

| Etiqueta | Grupo | Definição | Exemplo |
|---|---|---|---|
| `ADJ` | Classes abertas | adjetivo | big, old, green |
| `ADV` | Classes abertas | advérbio | very, well, exactly |
| `INTJ` | Classes abertas | interjeição | oh, hello, wow |
| `NOUN` | Classes abertas | substantivo comum | girl, cat, idea |
| `PROPN` | Classes abertas | nome próprio | Mary, London, NATO |
| `VERB` | Classes abertas | verbo (não auxiliar) | run, eat, think |
| `ADP` | Classes fechadas | adposição (preposição ou posposição) | in, to, during |
| `AUX` | Classes fechadas | verbo auxiliar (tempo, modo, voz; inclui modais e cópula) | has, will, should, is |
| `CCONJ` | Classes fechadas | conjunção coordenativa | and, or, but |
| `DET` | Classes fechadas | determinante (artigos, demonstrativos etc.) | a, the, this |
| `NUM` | Classes fechadas | numeral | 1, 2026, one, seventy |
| `PART` | Classes fechadas | partícula (to infinitivo, 's possessivo, not) | to, 's, not |
| `PRON` | Classes fechadas | pronome | I, you, herself, who |
| `SCONJ` | Classes fechadas | conjunção subordinativa | that, if, while |
| `PUNCT` | Outros | pontuação | . , ( ) ? |
| `SYM` | Outros | símbolo | $, %, §, :) |
| `X` | Outros | outro (palavra estrangeira, erro, não classificável) | etc., xfgh |

### Tagset PTB (`ptb`) — XPOS em inglês

**Penn Treebank (inglês)** — Etiquetas do Penn Treebank usadas pelos modelos de inglês do spaCy e do Stanza (XPOS), com as extensões do OntoNotes.

- Identificador: `ptb`
- Fonte: https://catalog.ldc.upenn.edu/docs/LDC99T42/tagguid1.pdf
- Etiquetas: 50

| Etiqueta | Grupo | Definição | Exemplo |
|---|---|---|---|
| `NN` | Substantivos | substantivo comum, singular ou incontável | cat, water |
| `NNS` | Substantivos | substantivo comum, plural | cats, ideas |
| `NNP` | Substantivos | nome próprio, singular | London, Mary |
| `NNPS` | Substantivos | nome próprio, plural | Americans, Alps |
| `VB` | Verbos | verbo, forma base | take, be |
| `VBD` | Verbos | verbo, passado | took, was |
| `VBG` | Verbos | verbo, gerúndio ou particípio presente | taking, being |
| `VBN` | Verbos | verbo, particípio passado | taken, been |
| `VBP` | Verbos | verbo, presente, exceto 3ª pessoa do singular | take, are |
| `VBZ` | Verbos | verbo, presente, 3ª pessoa do singular | takes, is |
| `MD` | Verbos | verbo modal | can, would, must |
| `JJ` | Adjetivos | adjetivo | big, green |
| `JJR` | Adjetivos | adjetivo, comparativo | bigger, better |
| `JJS` | Adjetivos | adjetivo, superlativo | biggest, best |
| `AFX` | Adjetivos | afixo separado | pre-, non- |
| `RB` | Advérbios e partículas | advérbio | quickly, very, not |
| `RBR` | Advérbios e partículas | advérbio, comparativo | faster, more |
| `RBS` | Advérbios e partículas | advérbio, superlativo | fastest, most |
| `RP` | Advérbios e partículas | partícula (de verbo frasal) | up (in give up), off |
| `WRB` | Advérbios e partículas | advérbio interrogativo ou relativo (wh-) | where, when, how |
| `PRP` | Pronomes e determinantes | pronome pessoal | I, she, them |
| `PRP$` | Pronomes e determinantes | pronome possessivo | my, her, their |
| `WP` | Pronomes e determinantes | pronome interrogativo ou relativo (wh-) | who, what |
| `WP$` | Pronomes e determinantes | pronome possessivo wh- | whose |
| `DT` | Pronomes e determinantes | determinante | the, a, this |
| `PDT` | Pronomes e determinantes | predeterminante | all (in all the), both |
| `WDT` | Pronomes e determinantes | determinante wh- | which, that (relative) |
| `EX` | Pronomes e determinantes | there existencial | there (in there is) |
| `IN` | Preposições, conjunções e outras palavras funcionais | preposição ou conjunção subordinativa | in, of, because |
| `TO` | Preposições, conjunções e outras palavras funcionais | to (infinitivo ou preposição) | to |
| `CC` | Preposições, conjunções e outras palavras funcionais | conjunção coordenativa | and, but, or |
| `CD` | Preposições, conjunções e outras palavras funcionais | numeral cardinal | 3, twenty |
| `POS` | Preposições, conjunções e outras palavras funcionais | marca de possessivo | 's |
| `UH` | Preposições, conjunções e outras palavras funcionais | interjeição | oh, uh, yes |
| `LS` | Preposições, conjunções e outras palavras funcionais | marcador de item de lista | a), 1. |
| `,` | Pontuação e símbolos | vírgula | , |
| `.` | Pontuação e símbolos | pontuação de fim de frase | . ? ! |
| `:` | Pontuação e símbolos | dois-pontos, ponto e vírgula, travessão, reticências | : ; -- ... |
| ```` | Pontuação e símbolos | aspas de abertura | “ `` |
| `''` | Pontuação e símbolos | aspas de fechamento | ” '' |
| `-LRB-` | Pontuação e símbolos | parêntese (ou colchete) de abertura | ( [ |
| `-RRB-` | Pontuação e símbolos | parêntese (ou colchete) de fechamento | ) ] |
| `HYPH` | Pontuação e símbolos | hífen | - |
| `NFP` | Pontuação e símbolos | pontuação solta (fora do padrão) | ***, ... |
| `$` | Pontuação e símbolos | símbolo de moeda | $, £ |
| `SYM` | Pontuação e símbolos | símbolo | %, &, + |
| `FW` | Outros | palavra estrangeira | et, cetera |
| `ADD` | Outros | endereço de e-mail ou internet | www.example.com |
| `XX` | Outros | desconhecido | — |
| `_SP` | Outros | espaço em branco | — |

## MFTE

**MFTE (Multi-Feature Tagger of English)** — Atributos para análise multidimensional (Le Foll), aplicados sobre as classes do Stanza. Produz os atributos MFTE (`mfte`), UPOS e XPOS (PTB). O modo estendido acrescenta as classes semânticas e de postura.

### Modelos

| Componente | Modelo | Observação |
|---|---|---|
| MFTE | `mfte` (MFTE 1.0.0.7) | Regras e atributos do MFTE (Le Foll). |
| Base linguística | `stanza-en` | Stanza `en/default`, processadores `tokenize,pos`. |


### Tagset MFTE (`mfte`)

**MFTE (Multi-Feature Tagger of English)** — Atributos do MFTE (Le Foll), com as classes semânticas e de postura do modo estendido. Definições redigidas a partir do código do MFTE 1.0.0.7; a revisar com a documentação do autor.

- Identificador: `mfte`
- Fonte: https://github.com/mshakirDr/MFTE (Le Foll 2021; Shakir)
- Etiquetas: 172

| Etiqueta | Grupo | Definição | Exemplo |
|---|---|---|---|
| `VBD` | Verbos: tempo, aspecto, voz | verbo no passado | walked |
| `VPRT` | Verbos: tempo, aspecto, voz | verbo no presente | walks |
| `VB` | Verbos: tempo, aspecto, voz | verbo na forma base (fora de outras categorias) | walk |
| `VIMP` | Verbos: tempo, aspecto, voz | imperativo (identificação aproximada) | Look at this. |
| `PEAS` | Verbos: tempo, aspecto, voz | aspecto perfeito | has walked |
| `PROG` | Verbos: tempo, aspecto, voz | aspecto progressivo | is walking |
| `GTO` | Verbos: tempo, aspecto, voz | futuro com 'going to' | going to leave |
| `HGOT` | Verbos: tempo, aspecto, voz | construção 'have got' | I've got |
| `BEMA` | Verbos: tempo, aspecto, voz | 'be' como verbo principal | She is tall. |
| `BEAUX` | Verbos: tempo, aspecto, voz | 'be' como auxiliar | is going |
| `DOAUX` | Verbos: tempo, aspecto, voz | 'do' como auxiliar | Do you know? |
| `PASS` | Verbos: tempo, aspecto, voz | voz passiva com 'be' | was taken |
| `PGET` | Verbos: tempo, aspecto, voz | voz passiva com 'get' | got arrested |
| `ABLE` | Verbos: tempo, aspecto, voz | 'able'/'unable' + to | able to swim |
| `USEDTO` | Verbos: tempo, aspecto, voz | 'used to' (hábito no passado) | used to live |
| `GER` | Verbos: tempo, aspecto, voz | gerúndio | Swimming is fun. |
| `MDCA` | Modais | modal 'can' | can |
| `MDCO` | Modais | modal 'could' | could |
| `MDMM` | Modais | modais 'may' e 'might' | may, might |
| `MDWS` | Modais | modais 'will' e 'shall' | will, shall |
| `MDWO` | Modais | modal 'would' | would |
| `MDNE` | Modais | modais e semimodais de necessidade | must, have to, need to |
| `PP1S` | Pronomes e referência | primeira pessoa do singular | I, me, my |
| `PP1P` | Pronomes e referência | primeira pessoa do plural | we, us, our |
| `PP2` | Pronomes e referência | segunda pessoa | you, your |
| `PP3f` | Pronomes e referência | terceira pessoa, feminino | she, her |
| `PP3m` | Pronomes e referência | terceira pessoa, masculino | he, him |
| `PP3t` | Pronomes e referência | terceira pessoa do plural | they, them |
| `PIT` | Pronomes e referência | pronome 'it' | it, its |
| `DEMO` | Pronomes e referência | demonstrativo | this, that, these |
| `QUPR` | Pronomes e referência | pronome quantificador | everybody, nothing |
| `EX` | Pronomes e referência | 'there' existencial | there is |
| `NN` | Substantivos | substantivo comum (singular e plural) | idea, books |
| `NNP` | Substantivos | nome próprio | London |
| `NCOMP` | Substantivos | composto nominal | bus stop |
| `NOMZ` | Substantivos | nominalização | decision, happiness |
| `JJAT` | Adjetivos | adjetivo atributivo | a tall man |
| `JJPR` | Adjetivos | adjetivo predicativo | he is tall |
| `COMPAR` | Adjetivos | construção comparativa | taller, more useful |
| `SUPER` | Adjetivos | construção superlativa | tallest, most useful |
| `QUAN` | Adjetivos | quantificador | all, many, several |
| `RB` | Advérbios e marcadores de postura | advérbio (fora das categorias específicas) | quickly |
| `AMP` | Advérbios e marcadores de postura | intensificador | very, totally |
| `DWNT` | Advérbios e marcadores de postura | atenuador | slightly, barely |
| `EMPH` | Advérbios e marcadores de postura | enfático | really, for sure |
| `HDG` | Advérbios e marcadores de postura | atenuação (hedge) | maybe, sort of |
| `FREQ` | Advérbios e marcadores de postura | advérbio de frequência | usually, never |
| `PLACE` | Advérbios e marcadores de postura | advérbio de lugar | abroad, nearby |
| `TIME` | Advérbios e marcadores de postura | advérbio de tempo | now, tomorrow |
| `SO` | Advérbios e marcadores de postura | 'so' (fora do uso como preposição) | so |
| `XX0` | Advérbios e marcadores de postura | negação 'not' | not, n't |
| `THSC` | Orações e subordinação | oração subordinada com 'that' | I think that... |
| `THRC` | Orações e subordinação | oração relativa com 'that' | the book that... |
| `WHSC` | Orações e subordinação | oração subordinada com wh- | I know what... |
| `THATD` | Orações e subordinação | omissão do subordinador 'that' | I think [] he left |
| `CUZ` | Orações e subordinação | conjunção causal | because, 'cause |
| `COND` | Orações e subordinação | conjunção condicional | if, unless |
| `CONC` | Orações e subordinação | conjunção concessiva | although |
| `ELAB` | Orações e subordinação | conector de elaboração | for example, similarly |
| `CC` | Orações e subordinação | conjunção coordenativa | and, or |
| `IN` | Orações e subordinação | preposição | in, on, of |
| `STPR` | Orações e subordinação | preposição deslocada (no fim) | the man I spoke to |
| `PHC` | Orações e subordinação | coordenação de sintagmas | cats and dogs |
| `THAC` | Orações e subordinação | complemento de adjetivo com 'that' | glad that... |
| `WHAC` | Orações e subordinação | complemento de adjetivo com wh- | unsure whether... |
| `SPLIT` | Orações e subordinação | auxiliar ou infinitivo partido | to really go |
| `YNQU` | Interação, perguntas e oralidade | pergunta sim/não | Are you ready? |
| `WHQU` | Interação, perguntas e oralidade | pergunta com wh- | What is it? |
| `WQ` | Interação, perguntas e oralidade | marca auxiliar de pergunta wh- (não entra nas contagens) | ? |
| `QUTAG` | Interação, perguntas e oralidade | pergunta de confirmação (question tag) | isn't it? |
| `DMA` | Interação, perguntas e oralidade | marcador de discurso | anyway, yeah, well |
| `FPUH` | Interação, perguntas e oralidade | pausa preenchida e interjeição | uh, um, oh |
| `POLITE` | Interação, perguntas e oralidade | marca de polidez | please, thanks |
| `LIKE` | Interação, perguntas e oralidade | 'like' (marcador, citação, preposição) | like |
| `QLIKE` | Interação, perguntas e oralidade | 'like' citativo (be + like) | she was like... |
| `CONT` | Interação, perguntas e oralidade | contração verbal | 's, 're, 'll |
| `EMO` | Outros (formas, símbolos, web) | emoji | 🙂 |
| `HST` | Outros (formas, símbolos, web) | hashtag | #corpus |
| `URL` | Outros (formas, símbolos, web) | endereço de internet | www.example.com |
| `FU` | Outros (formas, símbolos, web) | palavra sem letras romanas (outro alfabeto) | 日本 |
| `SYM` | Outros (formas, símbolos, web) | símbolo | % |
| `CD` | Outros (formas, símbolos, web) | número | 42 |
| `AFX` | Outros (formas, símbolos, web) | afixo | pre- |
| `NNHUMAN` | Classes semânticas (modo estendido) | substantivo humano | teacher, family |
| `NNCOG` | Classes semânticas (modo estendido) | substantivo cognitivo | idea, knowledge |
| `NNCONC` | Classes semânticas (modo estendido) | substantivo concreto | table, stone |
| `NNPLACE` | Classes semânticas (modo estendido) | substantivo de lugar | city, room |
| `NNQUANT` | Classes semânticas (modo estendido) | substantivo de quantidade | amount, number |
| `NNGRP` | Classes semânticas (modo estendido) | substantivo de grupo ou instituição | committee, company |
| `NNTECH` | Classes semânticas (modo estendido) | substantivo técnico | software, cell |
| `NNABSPROC` | Classes semânticas (modo estendido) | substantivo abstrato ou de processo | development, system |
| `JJSIZE` | Classes semânticas (modo estendido) | adjetivo de tamanho | big, small |
| `JJTIME` | Classes semânticas (modo estendido) | adjetivo de tempo | new, early |
| `JJCOLR` | Classes semânticas (modo estendido) | adjetivo de cor | red, dark |
| `JJEVAL` | Classes semânticas (modo estendido) | adjetivo avaliativo | good, important |
| `JJREL` | Classes semânticas (modo estendido) | adjetivo relacional | general, total |
| `JJTOPIC` | Classes semânticas (modo estendido) | adjetivo temático | political, economic |
| `ACT` | Classes semânticas (modo estendido) | verbo de atividade | buy, make |
| `COMM` | Classes semânticas (modo estendido) | verbo de comunicação | say, tell |
| `MENTAL` | Classes semânticas (modo estendido) | verbo mental | think, know |
| `CAUSE` | Classes semânticas (modo estendido) | verbo de causa ou facilitação | help, let |
| `OCCUR` | Classes semânticas (modo estendido) | verbo de ocorrência | happen, become |
| `EXIST` | Classes semânticas (modo estendido) | verbo de existência ou relação | seem, include |
| `ASPECT` | Classes semânticas (modo estendido) | verbo aspectual | start, keep |
| `RATT` | Classes semânticas (modo estendido) | advérbio de atitude | surprisingly, hopefully |
| `RFACT` | Classes semânticas (modo estendido) | advérbio factivo (certeza) | certainly, undoubtedly |
| `RNONFACT` | Classes semânticas (modo estendido) | advérbio não factivo (probabilidade) | probably, apparently |
| `ToVDSR` | Complementos de postura (modo estendido) | oração com to controlada por verbo de desejo | want to |
| `ToVEFRT` | Complementos de postura (modo estendido) | oração com to controlada por verbo de esforço | try to |
| `ToVPROB` | Complementos de postura (modo estendido) | oração com to controlada por verbo de probabilidade | seem to |
| `ToVSPCH` | Complementos de postura (modo estendido) | oração com to controlada por verbo de ato de fala | ask to |
| `ToVMNTL` | Complementos de postura (modo estendido) | oração com to controlada por verbo mental | expect to |
| `ToJCRTN` | Complementos de postura (modo estendido) | oração com to controlada por adjetivo de certeza | sure to |
| `ToJABL` | Complementos de postura (modo estendido) | oração com to controlada por adjetivo de capacidade | able to |
| `ToJEFCT` | Complementos de postura (modo estendido) | oração com to controlada por adjetivo afetivo | happy to |
| `ToJEASE` | Complementos de postura (modo estendido) | oração com to controlada por adjetivo de facilidade/dificuldade | easy to |
| `ToJEVAL` | Complementos de postura (modo estendido) | oração com to controlada por adjetivo avaliativo | important to |
| `ToNSTNC` | Complementos de postura (modo estendido) | oração com to controlada por substantivo de postura | the decision to |
| `ThVCOMM` | Complementos de postura (modo estendido) | oração com that controlada por verbo de comunicação | say that |
| `ThVATT` | Complementos de postura (modo estendido) | oração com that controlada por verbo de atitude | hope that |
| `ThVFCT` | Complementos de postura (modo estendido) | oração com that controlada por verbo factivo | show that |
| `ThVLIK` | Complementos de postura (modo estendido) | oração com that controlada por verbo de probabilidade | suggest that |
| `ThJATT` | Complementos de postura (modo estendido) | oração com that controlada por adjetivo de atitude | glad that |
| `ThJFCT` | Complementos de postura (modo estendido) | oração com that controlada por adjetivo factivo | clear that |
| `ThJLIK` | Complementos de postura (modo estendido) | oração com that controlada por adjetivo de probabilidade | likely that |
| `ThJEVL` | Complementos de postura (modo estendido) | oração com that controlada por adjetivo avaliativo | important that |
| `ThNATT` | Complementos de postura (modo estendido) | oração com that controlada por substantivo de atitude | the hope that |
| `ThNFCT` | Complementos de postura (modo estendido) | oração com that controlada por substantivo factivo | the fact that |
| `ThNNFCT` | Complementos de postura (modo estendido) | oração com that controlada por substantivo não factivo | the claim that |
| `ThNLIK` | Complementos de postura (modo estendido) | oração com that controlada por substantivo de probabilidade | the possibility that |
| `WhVATT` | Complementos de postura (modo estendido) | oração com wh- controlada por verbo de atitude | wonder why |
| `WhVFCT` | Complementos de postura (modo estendido) | oração com wh- controlada por verbo factivo | know what |
| `WhVLIK` | Complementos de postura (modo estendido) | oração com wh- controlada por verbo de probabilidade | doubt whether |
| `WhVCOM` | Complementos de postura (modo estendido) | oração com wh- controlada por verbo de comunicação | explain how |
| `PrepNSTNC` | Complementos de postura (modo estendido) | substantivo de postura + sintagma preposicional | the possibility of |
| `ToVSTNCall` | Totais e restos (modo estendido) | total de orações com to controladas por verbos de postura | — |
| `ToJSTNCall` | Totais e restos (modo estendido) | total de orações com to controladas por adjetivos de postura | — |
| `ToSTNCall` | Totais e restos (modo estendido) | total de orações com to de postura | — |
| `ThVSTNCall` | Totais e restos (modo estendido) | total de orações com that controladas por verbos de postura | — |
| `ThJSTNCall` | Totais e restos (modo estendido) | total de orações com that controladas por adjetivos de postura | — |
| `ThNSTNCall` | Totais e restos (modo estendido) | total de orações com that controladas por substantivos de postura | — |
| `ThSTNCall` | Totais e restos (modo estendido) | total de orações com that de postura | — |
| `ToThNSTNCall` | Totais e restos (modo estendido) | total de orações com to ou that controladas por substantivos de postura | — |
| `WhVSTNCall` | Totais e restos (modo estendido) | total de orações com wh- controladas por verbos de postura | — |
| `RSTNCall` | Totais e restos (modo estendido) | total de advérbios de postura | — |
| `MDPOSSCall` | Totais e restos (modo estendido) | total de modais de possibilidade (can, could, may, might) | — |
| `MDPREDall` | Totais e restos (modo estendido) | total de modais de predição (will, would, shall) | — |
| `PASSall` | Totais e restos (modo estendido) | total de passivas | — |
| `PP1all` | Totais e restos (modo estendido) | total de primeira pessoa | — |
| `PP3all` | Totais e restos (modo estendido) | total de terceira pessoa | — |
| `MDother` | Totais e restos (modo estendido) | outros modais | — |
| `PPother` | Totais e restos (modo estendido) | outros pronomes | — |
| `NNother` | Totais e restos (modo estendido) | substantivos fora das classes semânticas | — |
| `NSTNCother` | Totais e restos (modo estendido) | outros substantivos de postura | — |
| `JJATother` | Totais e restos (modo estendido) | adjetivos atributivos fora das classes semânticas | — |
| `JJPRother` | Totais e restos (modo estendido) | adjetivos predicativos fora das classes semânticas | — |
| `JJATDother` | Totais e restos (modo estendido) | outros adjetivos atributivos de postura | — |
| `JJEPSTother` | Totais e restos (modo estendido) | outros adjetivos epistêmicos | — |
| `RBother` | Totais e restos (modo estendido) | advérbios fora das classes semânticas | — |
| `INother` | Totais e restos (modo estendido) | preposições fora de construções de postura | — |
| `THSCother` | Totais e restos (modo estendido) | outras orações subordinadas com that | — |
| `THRCother` | Totais e restos (modo estendido) | outras orações relativas com that | — |
| `WHSCother` | Totais e restos (modo estendido) | outras orações subordinadas com wh- | — |
| `JJDESCall` | Totais e restos (modo estendido) | total de adjetivos descritivos (tamanho, tempo, cor...) | — |
| `JJEpstAtdOther` | Totais e restos (modo estendido) | outros adjetivos epistêmicos ou de atitude | — |
| `RSTNCother` | Totais e restos (modo estendido) | outros advérbios de postura | — |
| `ThVSTNCother` | Totais e restos (modo estendido) | outras orações com that controladas por verbos de postura | — |
| `ToVSTNCother` | Totais e restos (modo estendido) | outras orações com to controladas por verbos de postura | — |
| `VATTother` | Totais e restos (modo estendido) | outros verbos de atitude | — |
| `VCOMMother` | Totais e restos (modo estendido) | outros verbos de comunicação | — |
| `VFCTother` | Totais e restos (modo estendido) | outros verbos factivos | — |
| `VLIKother` | Totais e restos (modo estendido) | outros verbos de probabilidade | — |

### Tagset UPOS (`upos`)

**Universal POS (UD)** — As 17 classes gramaticais universais do projeto Universal Dependencies, iguais para todas as línguas.

- Identificador: `upos`
- Fonte: https://universaldependencies.org/u/pos/
- Etiquetas: 17

| Etiqueta | Grupo | Definição | Exemplo |
|---|---|---|---|
| `ADJ` | Classes abertas | adjetivo | big, old, green |
| `ADV` | Classes abertas | advérbio | very, well, exactly |
| `INTJ` | Classes abertas | interjeição | oh, hello, wow |
| `NOUN` | Classes abertas | substantivo comum | girl, cat, idea |
| `PROPN` | Classes abertas | nome próprio | Mary, London, NATO |
| `VERB` | Classes abertas | verbo (não auxiliar) | run, eat, think |
| `ADP` | Classes fechadas | adposição (preposição ou posposição) | in, to, during |
| `AUX` | Classes fechadas | verbo auxiliar (tempo, modo, voz; inclui modais e cópula) | has, will, should, is |
| `CCONJ` | Classes fechadas | conjunção coordenativa | and, or, but |
| `DET` | Classes fechadas | determinante (artigos, demonstrativos etc.) | a, the, this |
| `NUM` | Classes fechadas | numeral | 1, 2026, one, seventy |
| `PART` | Classes fechadas | partícula (to infinitivo, 's possessivo, not) | to, 's, not |
| `PRON` | Classes fechadas | pronome | I, you, herself, who |
| `SCONJ` | Classes fechadas | conjunção subordinativa | that, if, while |
| `PUNCT` | Outros | pontuação | . , ( ) ? |
| `SYM` | Outros | símbolo | $, %, §, :) |
| `X` | Outros | outro (palavra estrangeira, erro, não classificável) | etc., xfgh |

### Tagset PTB (`ptb`) — XPOS

**Penn Treebank (inglês)** — Etiquetas do Penn Treebank usadas pelos modelos de inglês do spaCy e do Stanza (XPOS), com as extensões do OntoNotes.

- Identificador: `ptb`
- Fonte: https://catalog.ldc.upenn.edu/docs/LDC99T42/tagguid1.pdf
- Etiquetas: 50

| Etiqueta | Grupo | Definição | Exemplo |
|---|---|---|---|
| `NN` | Substantivos | substantivo comum, singular ou incontável | cat, water |
| `NNS` | Substantivos | substantivo comum, plural | cats, ideas |
| `NNP` | Substantivos | nome próprio, singular | London, Mary |
| `NNPS` | Substantivos | nome próprio, plural | Americans, Alps |
| `VB` | Verbos | verbo, forma base | take, be |
| `VBD` | Verbos | verbo, passado | took, was |
| `VBG` | Verbos | verbo, gerúndio ou particípio presente | taking, being |
| `VBN` | Verbos | verbo, particípio passado | taken, been |
| `VBP` | Verbos | verbo, presente, exceto 3ª pessoa do singular | take, are |
| `VBZ` | Verbos | verbo, presente, 3ª pessoa do singular | takes, is |
| `MD` | Verbos | verbo modal | can, would, must |
| `JJ` | Adjetivos | adjetivo | big, green |
| `JJR` | Adjetivos | adjetivo, comparativo | bigger, better |
| `JJS` | Adjetivos | adjetivo, superlativo | biggest, best |
| `AFX` | Adjetivos | afixo separado | pre-, non- |
| `RB` | Advérbios e partículas | advérbio | quickly, very, not |
| `RBR` | Advérbios e partículas | advérbio, comparativo | faster, more |
| `RBS` | Advérbios e partículas | advérbio, superlativo | fastest, most |
| `RP` | Advérbios e partículas | partícula (de verbo frasal) | up (in give up), off |
| `WRB` | Advérbios e partículas | advérbio interrogativo ou relativo (wh-) | where, when, how |
| `PRP` | Pronomes e determinantes | pronome pessoal | I, she, them |
| `PRP$` | Pronomes e determinantes | pronome possessivo | my, her, their |
| `WP` | Pronomes e determinantes | pronome interrogativo ou relativo (wh-) | who, what |
| `WP$` | Pronomes e determinantes | pronome possessivo wh- | whose |
| `DT` | Pronomes e determinantes | determinante | the, a, this |
| `PDT` | Pronomes e determinantes | predeterminante | all (in all the), both |
| `WDT` | Pronomes e determinantes | determinante wh- | which, that (relative) |
| `EX` | Pronomes e determinantes | there existencial | there (in there is) |
| `IN` | Preposições, conjunções e outras palavras funcionais | preposição ou conjunção subordinativa | in, of, because |
| `TO` | Preposições, conjunções e outras palavras funcionais | to (infinitivo ou preposição) | to |
| `CC` | Preposições, conjunções e outras palavras funcionais | conjunção coordenativa | and, but, or |
| `CD` | Preposições, conjunções e outras palavras funcionais | numeral cardinal | 3, twenty |
| `POS` | Preposições, conjunções e outras palavras funcionais | marca de possessivo | 's |
| `UH` | Preposições, conjunções e outras palavras funcionais | interjeição | oh, uh, yes |
| `LS` | Preposições, conjunções e outras palavras funcionais | marcador de item de lista | a), 1. |
| `,` | Pontuação e símbolos | vírgula | , |
| `.` | Pontuação e símbolos | pontuação de fim de frase | . ? ! |
| `:` | Pontuação e símbolos | dois-pontos, ponto e vírgula, travessão, reticências | : ; -- ... |
| ```` | Pontuação e símbolos | aspas de abertura | “ `` |
| `''` | Pontuação e símbolos | aspas de fechamento | ” '' |
| `-LRB-` | Pontuação e símbolos | parêntese (ou colchete) de abertura | ( [ |
| `-RRB-` | Pontuação e símbolos | parêntese (ou colchete) de fechamento | ) ] |
| `HYPH` | Pontuação e símbolos | hífen | - |
| `NFP` | Pontuação e símbolos | pontuação solta (fora do padrão) | ***, ... |
| `$` | Pontuação e símbolos | símbolo de moeda | $, £ |
| `SYM` | Pontuação e símbolos | símbolo | %, &, + |
| `FW` | Outros | palavra estrangeira | et, cetera |
| `ADD` | Outros | endereço de e-mail ou internet | www.example.com |
| `XX` | Outros | desconhecido | — |
| `_SP` | Outros | espaço em branco | — |

## BiberPlus

**BiberPlus** — Etiquetador dos atributos de Biber (1988) para análise multidimensional, com extensões para textos da web. Produz as etiquetas do tagset `biber` (categorias A–P, mais as classes Q e R acrescentadas pelo BiberPlus).

### Modelos

| Componente | Modelo | Observação |
|---|---|---|
| BiberPlus | `biberplus-spacy` | Etiquetador BiberPlus; usa tokenização/POS do spaCy. |
| Base linguística | `en_core_web_sm` | Modelo spaCy de inglês usado pelo BiberPlus. |


### Tagset Biber (`biber`)

**Atributos de Biber (BiberPlus)** — Atributos léxico-gramaticais de Biber (1988), agrupados nas categorias A–P, mais as classes que o BiberPlus acrescenta.

- Identificador: `biber`
- Fonte: Biber (1988), Variation across speech and writing; BiberPlus (https://github.com/davidjurgens/biberplus)
- Etiquetas: 95

| Etiqueta | Grupo | Definição |
|---|---|---|
| `VBD` | A. Tempo e aspecto | verbo no passado |
| `PEAS` | A. Tempo e aspecto | aspecto perfeito: HAVE + (advérbio) + (advérbio) + particípio |
| `VPRT` | A. Tempo e aspecto | verbo no presente (etiquetas VBP ou VBZ) |
| `PGAS` | A. Tempo e aspecto | aspecto progressivo (formas verbais em -ing com BE) |
| `PLACE` | B. Advérbios de lugar e tempo | advérbio de lugar da lista de Biber (que não seja nome próprio) |
| `TIME` | B. Advérbios de lugar e tempo | advérbio de tempo (exceto 'soon' seguido de 'as') |
| `FPP1` | C. Pronomes e pró-verbos | pronome de primeira pessoa |
| `SPP2` | C. Pronomes e pró-verbos | pronome de segunda pessoa |
| `TPP3` | C. Pronomes e pró-verbos | pronome de terceira pessoa |
| `PIT` | C. Pronomes e pró-verbos | pronome 'it' e formas relacionadas |
| `INPR` | C. Pronomes e pró-verbos | pronome indefinido (lista) |
| `DEMP` | C. Pronomes e pró-verbos | pronome demonstrativo (em certos contextos) |
| `PROD` | C. Pronomes e pró-verbos | pró-verbo 'do' (excluídos certos padrões) |
| `WHQU` | D. Perguntas | pergunta direta com wh- |
| `NOMZ` | E. Formas nominais | nominalização (terminações -tion, -ment, -ness, -ity) |
| `GER` | E. Formas nominais | gerúndio com 10 letras ou mais terminado em -ing/-ings |
| `NN` | E. Formas nominais | demais substantivos (não nominalizações nem gerúndios) |
| `PASS` | F. Passivas | passiva sem agente |
| `BYPA` | F. Passivas | passiva com agente (by) |
| `BEMA` | G. Formas estativas | 'be' como verbo principal |
| `EX` | G. Formas estativas | 'there' existencial |
| `THVC` | H. Subordinação | complemento verbal com 'that' |
| `PASTP` | H. Subordinação | oração participial no passado (pontuação + particípio) |
| `WZPAST` | H. Subordinação | relativa reduzida com particípio passado (apagamento WHIZ) |
| `WZPRES` | H. Subordinação | relativa reduzida com particípio presente após substantivo (apagamento WHIZ) |
| `TSUB` | H. Subordinação | relativa com 'that' na posição de sujeito |
| `TOBJ` | H. Subordinação | relativa com 'that' na posição de objeto |
| `WHSUB` | H. Subordinação | relativa com wh- na posição de sujeito |
| `WHOBJ` | H. Subordinação | relativa com wh- na posição de objeto |
| `PIRE` | H. Subordinação | relativa com preposição anteposta (prep. + whom/who/whose/which) |
| `SERE` | H. Subordinação | relativa de frase: pontuação + 'which' |
| `CAUS` | H. Subordinação | subordinada causal: 'because' |
| `CONC` | H. Subordinação | subordinada concessiva: 'although', 'though', 'tho' |
| `COND` | H. Subordinação | subordinada condicional: 'if', 'unless' |
| `OSUB` | H. Subordinação | outros subordinadores adverbiais (de várias palavras) |
| `PIN` | I. Sintagmas preposicionais, adjetivos e advérbios | sintagmas preposicionais (total) |
| `JJ` | I. Sintagmas preposicionais, adjetivos e advérbios | adjetivo atributivo |
| `PRED` | I. Sintagmas preposicionais, adjetivos e advérbios | adjetivo predicativo |
| `RB` | I. Sintagmas preposicionais, adjetivos e advérbios | advérbio (etiquetas RB, RBS, RBR, WRB) |
| `TTR` | J. Especificidade lexical | razão type/token |
| `AWL` | J. Especificidade lexical | comprimento médio de palavra |
| `CONJ` | K. Classes lexicais | conjunto (conector) com pontuação antes ou palavras específicas |
| `DWNT` | K. Classes lexicais | atenuador (downtoner) da lista |
| `AMP` | K. Classes lexicais | intensificador (amplifier) da lista |
| `DPAR` | K. Classes lexicais | partícula de discurso precedida de pontuação |
| `HDG` | K. Classes lexicais | atenuação (hedge) |
| `EMPH` | K. Classes lexicais | enfático |
| `DEMO` | K. Classes lexicais | demonstrativo |
| `POMD` | L. Modais | modal de possibilidade |
| `NEMD` | L. Modais | modal de necessidade |
| `PRMD` | L. Modais | modal de predição |
| `PUBV` | M. Classes verbais especializadas | verbo público (dizer, anunciar...) |
| `PRIV` | M. Classes verbais especializadas | verbo privado (pensar, saber...) |
| `SUAV` | M. Classes verbais especializadas | verbo suasivo (sugerir, exigir...) |
| `SMP` | M. Classes verbais especializadas | 'seem' e 'appear' |
| `CONT` | N. Formas reduzidas e estruturas desfavorecidas | forma reduzida (contração) |
| `THATD` | N. Formas reduzidas e estruturas desfavorecidas | omissão do subordinador 'that' |
| `STPR` | N. Formas reduzidas e estruturas desfavorecidas | preposição deslocada (no fim) |
| `SPIN` | N. Formas reduzidas e estruturas desfavorecidas | infinitivo partido (to + advérbio + verbo) |
| `SPAU` | N. Formas reduzidas e estruturas desfavorecidas | auxiliar partido (auxiliar + advérbio + verbo) |
| `PHC` | O. Coordenação | coordenação de sintagmas |
| `ANDC` | O. Coordenação | 'and' coordenando orações independentes |
| `XX0` | P. Negação | negação analítica ('not') |
| `SYNE` | P. Negação | negação sintética antes de adjetivo ou substantivo ('no', 'neither', 'nor') |
| `QUAN` | Classes gramaticais básicas (BiberPlus) | quantificador |
| `QUPR` | Classes gramaticais básicas (BiberPlus) | pronome quantificador |
| `ART` | Classes gramaticais básicas (BiberPlus) | artigo ('the', 'a', 'an') |
| `AUXB` | Classes gramaticais básicas (BiberPlus) | auxiliar formado por 'be' |
| `CAP` | Classes gramaticais básicas (BiberPlus) | palavra iniciada por maiúscula |
| `SCONJ` | Classes gramaticais básicas (BiberPlus) | conjunção subordinativa |
| `CCONJ` | Classes gramaticais básicas (BiberPlus) | conjunção coordenativa |
| `DET` | Classes gramaticais básicas (BiberPlus) | determinante |
| `INF` | Classes gramaticais básicas (BiberPlus) | verbo no infinitivo |
| `UH` | Classes gramaticais básicas (BiberPlus) | interjeição |
| `NUM` | Classes gramaticais básicas (BiberPlus) | numeral |
| `PRP` | Classes gramaticais básicas (BiberPlus) | pronome possessivo |
| `PREP` | Classes gramaticais básicas (BiberPlus) | preposição |
| `NNP` | Classes gramaticais básicas (BiberPlus) | nome próprio |
| `SBJP` | Classes gramaticais básicas (BiberPlus) | pronome sujeito |
| `WH` | Classes gramaticais básicas (BiberPlus) | palavra wh- ('who', 'what', 'where') |
| `INDA` | Classes gramaticais básicas (BiberPlus) | artigo indefinido ('a', 'an') |
| `ACCU` | Classes gramaticais básicas (BiberPlus) | pronome no caso acusativo |
| `CMADJ` | Classes gramaticais básicas (BiberPlus) | adjetivo comparativo |
| `SPADJ` | Classes gramaticais básicas (BiberPlus) | adjetivo superlativo |
| `X` | Classes gramaticais básicas (BiberPlus) | palavra fora das demais classes |
| `TRB` | Classes gramaticais básicas (BiberPlus) | advérbios (total) |
| `EMOJ` | Marcas de redes sociais (BiberPlus) | emoji |
| `EMOT` | Marcas de redes sociais (BiberPlus) | emoticon comum |
| `EXCL` | Marcas de redes sociais (BiberPlus) | ponto de exclamação |
| `HASH` | Marcas de redes sociais (BiberPlus) | palavra iniciada por # (hashtag) |
| `LAUGH` | Marcas de redes sociais (BiberPlus) | sigla de riso ('lol' etc.) |
| `QUES` | Marcas de redes sociais (BiberPlus) | ponto de interrogação |
| `QUOT` | Marcas de redes sociais (BiberPlus) | aspas |
| `AT` | Marcas de redes sociais (BiberPlus) | palavra iniciada por @ (menção) |
| `URL` | Marcas de redes sociais (BiberPlus) | endereço de internet (URL) |

---

Definições redigidas a partir dos dados de `ttwtools/data/tagsets/` (UPOS, PTB, MFTE e Biber). Para o MFTE, o descritor cita como fonte o manual/código do MFTE; consulte `ttwtools.get_tagset("mfte")` para os campos detalhados de operacionalização quando disponíveis.
