# Escrita (experimental): texto individual × corpus de referência

Comparar **um texto** (n=1) com um corpus de referência e mostrar, com honestidade estatística, o que o distingue; meta didática em linha com DDL (Data-Driven Learning: Johns 1991). Pacote: `writing.py`, `keyness.py`, `constructions.py`, `collocations.py`, `sophistication.py`; CLI `writing`, `patterns`, `collocates-text`; rotas `/api/writing/*`; tela **Escrita**.

## 1. Princípios (valem para todo recurso novo)

- O texto é **uma unidade**: a saída é **descritiva**, nunca prova sobre uma população (Kilgarriff 2001: palavras de um texto são autocorrelacionadas). A tela diz isso e repete nos resultados.
- **Nunca só o p:** sempre significância (LL, p corrigido por **FDR**) **e** magnitude (log ratio, %DIFF, log-odds) **e** dispersão na referência (não destacar item concentrado em poucos textos).
- Normalizar por tamanho (por 1.000). Texto curto: abaixo de ~200 palavras "exploratório"; abaixo de ~50, recusar com aviso. Badges automáticos: texto curto, palavra concentrada, palavra rara no texto.
- **Tema ≠ competência:** palavras dizem tópico; o que ensina é **como o texto se constrói** (combinações, padrões, construções, registro). A referência deve ser do **mesmo gênero e registro**.
- Métodos: Dunning (1993), Hardie (2014), Gabrielatos & Marchi (2012); leitura de arquivos só com biblioteca padrão (txt/md direto; docx/odt com `zipfile` + `xml.etree`; pdf com `pypdf` se instalado, senão aviso).

## 2. Feito (2026-09-28)

- **Base:** `extract_text`, `text_freqs`, `analyze_text` (reusa `keyness`: LL, FDR, effect sizes, dispersão, badges); rota por base64 (sem `multipart`); tela com editor/upload, referência do projeto ou do catálogo, opções recolhidas e painel "Como interpretar".
- **Construções** (n-gramas de UPOS/XPOS) com FDR, log ratio, dispersão e z-score vs documentos da referência; aba "Construções (classes)".
- **Colocados por palavra-chave** (clicar numa palavra abre o painel).
- **Bundles** pela unidade `ngram`; **riqueza lexical** (TTR, Guiraud, MTLD, palavras longas) e palavras por frase.
- **DDL "ver no corpus":** troca o corpus ativo para a referência e abre o KWIC do item.

## 3. Falta

| Item | Nota |
|---|---|
| Registro Biber por z-score | taxa de cada traço por 1.000 palavras vs distribuição dos textos da referência; barras divergentes; descritivo |
| Distinctive / covarying collexemes | Fisher exato (hipergeométrica), força −log10(p) + FDR; escolha entre construções alternativas (`V to-inf` × `V that-clause`) |
| Rede de colocação | node no centro, colocados em órbita por log ratio |
| Bootstrap por texto da referência | intervalo da frequência esperada; dispersão fina; textos modelo do mesmo gênero |
| Diversidade e legibilidade | HD-D, MATTR, voc-D, densidade lexical, AWL (ressalva: legibilidade foi feita para inglês nativo) |
| Coesão e postura | conectores, hedging/boosting, nominalizações (listas por idioma en/pt) |
| Fase 3 didática | tours, exemplos de sala, exercícios guiados, banco de fórmulas por função retórica (PhraseBank), listas de referência do catálogo pré-instaladas, "modo aprendiz" × "modo pesquisador" |
| Exportar e "copiar como código" | paridade com as outras telas |

## 4. Bibliotecas candidatas (regra: núcleo em Python no pacote, sem dependência pesada)

**Python:** `lexicalrichness` (MTLD, HD-D, MATTR; MIT, puro), `textstat` (legibilidade; MIT, puro), `yake` (frases-chave; puro), `textacy` (opcional, sobre spaCy), `wordfreq` (Apache), `proselint` (inglês). **Externo opcional:** LanguageTool (`language_tool_python`; GPL-3, **exige Java**; só com aviso claro, offline e macOS 12). **JS (só feedback instantâneo de rascunho, nunca a única implementação):** `retext`, `write-good`, `textlint`, `compromise`, `wink-nlp`, `alex`. Regra do projeto: a lógica vive no pacote; todo recurso existe em Python + CLI.

## 5. Decisões abertas

Como garantir o **mesmo gênero** da referência (ficha do catálogo com gênero e público; sugestão por similaridade de perfil); o que fazer sem tagger (macOS Intel sem torch): oferecer só forma e n-grama; custo do Fisher exato em milhares de construções (vetorizar ou log-gama); quanto feedback de rascunho no navegador vale sem quebrar a paridade; listas de conectores, hedges e AWL por idioma.
