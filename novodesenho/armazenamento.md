# Eficiência e formato de arquivo: análise e proposta

Responde a uma pergunta: o que tornaria o TTWtools **rápido, leve em memória e robusto** do Apple Silicon ao Mac Intel de 2015, **mantendo perfis de arquivo diferentes** (maiores e prontos × compactos que podem reprocessar) e todas as funcionalidades previstas. Medições e observações do Intel: `macintel.md`. Andamento, próximos passos e decisões: `plano.md`. Convenção: **[medido]**, **[código]** (leitura do código), **[estimado]** (extrapolação a validar com protótipo), **[geral]** (prática de outras ferramentas, de memória, **a conferir** antes de decidir algo caro).

## 1. Situação (medida)

Projeto real de `ttwa_files/`: 2 corpora, 1.526 textos, 19 milhões de tokens; o corpus grande tem 96% dos tokens e 5 camadas de ~3,7 M.

| | Antes da Fase A | Depois (A1–A5) |
|---|---|---|
| Banco de trabalho | 2.979 MB | 2.066 MB |
| Projeto todo compactado | 1.058 MB | 614 MB (118 MB sem tabelas de busca) |
| `.ttwcl` do corpus grande | 466 MB | 104 MB |
| Camada em `layer_blobs` | JSON+zlib | colunar `TCL1`, −45% |
| Índices de `tokens` | 7 | 5 (−21% no arquivo, mesma velocidade) |
| Abrir sem tabelas | ~53 s **em toda** abertura | 1ª vez 38–44 s, depois 1 s (índice em cache) |

Codec: na camada spaCy do corpus grande (3,76 M de tokens) o formato colunar (ids + léxico) fica em 15,0 MB com zlib, contra 14,3 MB com zstd e 12,6 MB com lzma; o JSON antigo, 34,1 MB com zlib [medido]. O ganho vem do **formato colunar**, não do codec: por isso `zlib` (biblioteca padrão) basta e o formato não depende de `zstandard`, que o Python 3.11 do Mac Intel não traz.

Mac Intel (i5-5287U) contra M4: CPU de Python **5–9×** mais lenta, disco e descompressão ~2–3×, hash 21× (sem SHA-NI). Abrir com tabelas 12,6 s; migrar arquivo antigo 14,3 min; recriar tabelas sem cache 5,3 min; 6 consultas com tabelas 89,9 s.

## 2. Onde está o desperdício (código)

1. **Tokens como texto, uma linha por token**: `word`, `lemma`, `upos`, `xpos`, `feats`, `tags`, `extra` em TEXT; ~110 bytes por token com índices (cache de 2.124 MB para 19 M).
2. **Consultas em Python sobre linhas**: `query.frequency` (`query.py:297`) traz **todas** as linhas de cada camada (`fetchall`, `query.py:290`) e conta num `Counter`; n-gramas guardam todos os distintos do corpus na memória. `collocates`, `keywords` (`keyness.py`) e `feature_table` (um `json.loads` **por token**, `features.py:67`) seguem o mesmo padrão.
3. **`REGEXP` linha a linha** (`query.py:97,137`): uma chamada Python por token da tabela inteira.
4. **Derivados recalculados a cada tela** (frequências, contagens de features, perfis por documento). Só o KFA ganhou reaproveitamento (resultado guardado + tabelas em memória).
5. **Índice construído por inteiro na abertura** (B3): 10 entradas (ferramentas × corpora) mesmo que só uma seja usada.
6. **Chave do cache relê e hasheia todos os blobs** a cada abertura (`searchindex.entry_key`): 1,6 s por 250 MB no Intel.
7. **Cada requisição reabre o projeto** (`api_new._project`): DDL, verificação de migração e, no modo cache, anexar 10 bancos.
8. **Abrir compactado descompacta tudo** (gzip não é acessível por partes): 2–3 GB de temporário por abertura.
9. **Migrar, compactar e salvar** fazem laços em Python token a token (migrar 14 min, compactar 10 min no Intel).
10. **Resultados derivados sujam o arquivo**: o KFA grava dentro do projeto e ativa "não salvo"; salvar no Intel custa de 29 s a 6 min.

## 3. O que outros fazem [geral, a conferir]

| Ferramenta | Ideia | O que aproveitamos |
|---|---|---|
| CWB/CQPweb, Manatee (Sketch Engine) | atributo = coluna de **inteiros** + **léxico**; índice invertido; `mmap`; regex roda **no léxico**; frequências pré-calculadas | modelo mais provado para concordância em corpus grande: colunas de inteiros + léxico por corpus + regex no léxico |
| spaCy `DocBin` | arrays de ids + armazém de strings compartilhado, comprimido | é o `TCL1`, com léxico compartilhado no lugar do dicionário por documento |
| Parquet/Arrow, DuckDB | colunar, dicionário por coluna, leitura só das colunas necessárias | o princípio; as bibliotecas ficam **fora** (só biblioteca padrão) |
| Lucene | segmentos **imutáveis**; novo dado = novo segmento | salvar incremental; nunca regravar o que existe |
| Git, Nix, Bazel | objetos endereçados pelo **conteúdo**, imutáveis | o cache do B3 já é assim; estender a tudo que for derivado |
| ZIP/ePub/Office/`.app` | partes lidas sob demanda a partir de um manifesto | a pasta-pacote |
| AntConc, #LancsBox | tudo na memória | o que **não** queremos com 19 M de tokens em 8 GB |

Nota sobre o nome: **`TCL` = *TTWtools Columnar Layer***, nome próprio do projeto (não existe como formato ou pacote externo; nada a ver com a linguagem Tcl). `TCL1` é o código de 4 bytes do blob atual.

Lição comum: strings viram inteiros + dicionário; o pesado é construído uma vez, imutável e endereçado por conteúdo; **estatísticas agregadas não dependem do índice posicional**; o que não foi pedido não é construído.

## 4. Proposta: quatro camadas

```
A. OBJETOS (verdade, imutáveis, pequenos)   textos · camadas em colunas de inteiros · léxico por corpus
B. ESTATÍSTICAS derivadas (minúsculas)      matriz documento×tipo · contagens de features por documento · TTR
C. ÍNDICE posicional (grande, descartável)  tokens + índices por (corpus, ferramenta), só quando precisa
D. EXECUÇÃO                                 tarefas com andamento · limite de concorrência e de memória
```

- **A.** Camadas `TCL2` (colunas de inteiros, posições em deltas, léxico por corpus). Estimativa: **3–5× menor** que o `TCL1` e que a tabela de tokens [estimado; protótipo antes de decidir].
- **B. Sempre dentro do arquivo, mesmo no compacto.** Por camada: matriz documento × tipo (forma, lema, classe) e contagens de features por documento; ~1 M de linhas para 19 M de tokens [estimado]. Com ela, **sem tocar nos tokens**: frequência, palavras-chave, faixas, KFA, dispersão por documento, detalhe de feature, galeria, Escrita (texto n=1 contra referência). Nasce quando a camada nasce (sem segunda passagem), chaveada pelo conteúdo. É o mesmo dado dos corpora clássicos (perfil de frequência + features) e das listas `reference-list`: um formato para três usos.
- **C. Sob demanda, uma entrada por vez.** Só KWIC, colocados, posições da dispersão e leitor precisam dele. Construir na **primeira consulta posicional**, por (corpus × ferramenta), com a barra de etapas que já existe. Com ids, regex e glob rodam no léxico e viram `word_id IN (...)`. Ids **nativos do projeto** (remapear ids numa view levou o KWIC de 8 ms a 17 s [medido]); o léxico por corpus resolve o compartilhamento por outro caminho.
- **D.** Toda operação pesada como tarefa com andamento (Comparar já é); limite de tarefas pesadas simultâneas (núcleos − 1, no Intel 3); uma conexão por thread reaproveitada; consultas em SQL (`GROUP BY` sobre ids) em vez de `fetchall` + `Counter`; `temp_store` em arquivo para não estourar memória.

### Perfis de arquivo: mesmo formato, o que muda é o que vai dentro

| Perfil | Dentro | Tamanho [estimado] | 1ª abertura | Demais | Reprocessa? |
|---|---|---|---|---|---|
| **Compacto** | A + B | ~10–20% do atual | segundos; estatísticas imediatas | igual | só o índice C, **se e quando** houver consulta posicional |
| **Pronto** | A + B + C | C ocupa 2–4× o compacto | extrai C para o cache (segundos a 1 min) | segundos | nada |
| **Cache local** | C fora do arquivo | — | — | — | C reaproveitado entre arquivos da mesma linhagem |

"Pronto" responde à necessidade de uma máquina lenta: o compacto **mais** as entradas de índice já construídas (`entry.json` + `tokens.sqlite`, autocontidas). Trocar de perfil = acrescentar ou retirar a pasta `index/`, **sem reprocessar as camadas**. O ZIP é só transporte; dentro dele o índice comprime ~3:1, então "Pronto" é sempre maior para enviar.

### Contêiner e migração (decisões já tomadas)

`.ttwc` = **pasta-pacote** (`manifest.json`, `meta.sqlite` com documentos, catálogo de camadas, análises, `texts/`, `layers/`, léxico; ZIP só para enviar). `.ttwa` = **manifesto** de corpora referenciados + resultados (com opção de embutir). Corpora clássicos = só perfil de frequência + features (B). Salvar = objetos novos + `meta.sqlite`, sem cópia de trabalho de vários GB. Conversão (`ttwtools convert`) nunca apaga o original e exporta de volta ao formato clássico; todo formato atual (`.ttwa`, `.ttwl`, `.ttwc`, `.ttwcl`, `.ttwal`, `.ttwt`; esquemas 0.1–0.3) continua legível para sempre; o novo é opt-in, rotulado beta, e não abre em versões antigas do aplicativo.

## 5. Melhorias, em ordem de impacto ÷ risco

| # | Passo | Ganho | Mexe no formato? | Risco |
|---|---|---|---|---|
| 1 | Índice sob demanda por entrada; hash gravado uma vez ao empacotar; conexão por thread; fila de tarefas pesadas | 1ª abertura de minutos a segundos no Intel [estimado]; sem corrida | não | baixo |
| 2 | Estatísticas B calculadas ao empacotar/etiquetar; KFA, palavras-chave, faixas, frequência usam B; resultados derivados **fora** do arquivo (não sujam) | "recalcular tudo" some | não (B vai para o cache primeiro) | médio |
| 3 | SQL nos laços quentes, `PRAGMA`s (`cache_size`, `mmap_size`, `temp_store`, `page_size` 16 KiB nos índices), orçamentos no benchmark | tempo e memória das consultas posicionais | não | baixo |
| 4 | Protótipo `TCL2` + léxico + índice com ids (medir tamanho e regex) | decide o formato com número | não | médio |
| 5 | Pasta-pacote com perfis Compacto/Pronto | os dois tipos de arquivo | sim | alto |
| 6 | Converter antigos; migração única com aviso; corpora do catálogo | encerra a Fase B | sim | médio |

Os passos 1–3 não mudam o formato: dá para entregar já e medir no Intel antes de investir em 4–6.

## 6. Funcionalidades previstas e compatibilidade

| Funcionalidade | Como fica |
|---|---|
| KWIC, colocados, leitor, dispersão de posições | usam C (sob demanda); mesmas respostas |
| Frequência, palavras-chave, faixas, KFA, Laboratório, galeria, Escrita | passam a usar B; milissegundos; os testes comparam com o caminho atual |
| Corpora do catálogo | pacote só com A (ou nem isso) + B |
| Arquivos antigos | migração única, com aviso e sem apagar |
| Paridade GUI/pacote/CLI | cada peça: função pública + subcomando (`stats build`, `index build`, `pack --profile`) |
| macOS 12 Intel, só biblioteca padrão | nenhuma dependência nova |

## 7. Robustez e o que não fazer

- **Atômico e imutável**: `.part` + renome; chave = conteúdo; entrada incompleta não existe. Derivados são descartáveis; a verdade (A) só recebe acréscimos. Dois processos construindo a mesma chave já são seguros (renome); falta trava leve por chave.
- **Teste de falha**: matar no meio de cada etapa e conferir que nada fica inválido (o teste de resíduos do A3 cobre a pasta temporária). Tudo desligável (`TTWTOOLS_INDEX_CACHE=0` já existe; o mesmo padrão para B e o índice sob demanda).
- **Não** trocar de motor (DuckDB, Arrow) nem adicionar `zstandard`; **não** remapear ids em views; **não** construir índice que ninguém pediu; **não** guardar a mesma informação duas vezes; **não** tratar estimativa como medida.

## 8. Decisões do usuário

**Já tomadas (2026-09-29/30):** `.ttwa` como manifesto; pasta-pacote (ZIP só para enviar); índice em cache com barra de etapas clara; léxico por corpus; corpora clássicos só com perfil de frequência + features; começar pela Fase A; depois, começar pelo B3 com o Mac Intel como referência.

**Abertas:**
1. ~~Estatísticas B dentro do arquivo?~~ **Decidido (2026-09-30): sim.** Regra geral: o que melhora a **usabilidade** do aplicativo e é pequeno (estatísticas derivadas, resultados de análises, perfis) **vai dentro do arquivo**, inclusive no perfil compacto; só o que é grande e reconstruível (índice posicional) fica no cache ou opcional no perfil Pronto.
2. **Índice só sob demanda** (a 1ª busca posicional espera, com barra de etapas) ou construir ao abrir como hoje? Recomendação: sob demanda.
3. **`TCL2` com ids e léxico por corpus**, mesmo que o cache deixe de ser compartilhado entre projetos sem relação?
4. **Resultados derivados (KFA etc.)**: pela regra acima ficam **dentro** do arquivo; o problema do "não salvo" (salvar custa de 29 s a 6 min no Intel, porque o formato atual recompacta tudo) se resolve **não marcando o arquivo como alterado por causa de derivados** (vão junto na próxima gravação) e, na pasta-pacote, salvando só o objeto novo.
5. **Teto de espera no Intel** por operação (1ª abertura, etiquetar, comparar): vem das respostas em `macintel.md`, seção 6.

## 9. Código nativo (Rust ou C++)? Avaliação em 2026-09-30

**Conclusão: ainda não. Primeiro a arquitetura (seção 5, passos 1–4); depois um experimento curto e medido.** O motivo está na evidência, não em princípio.

**O que medi (M4, projeto sintético de 1 M de tokens):**

| operação | resultado |
|---|---|
| frequência de lemas: laço Python atual × SQL `GROUP BY lower(lemma)` | 0,87 s × 0,72 s (**só 1,2×**) |
| contar 10 mil formas: `Counter` × numpy sobre strings × `bincount` sobre **ids** | 0,3 ms × 2,8 ms × **0,02 ms** |
| `TCL1` em Python puro (camada de 10 mil tokens) | codifica 717 mil tok/s, decodifica 4.042 mil tok/s |

Leitura: o custo não está na contagem (o `Counter` e o SQLite já são C), está em **fabricar strings e linhas** a cada token. Trocar Python por SQL sobre strings quase não ganha; trocar strings por **inteiros** ganha ~15× sem nenhum binário. Nativo em cima do desenho atual aceleraria o que a arquitetura pode simplesmente eliminar. (Uma estimativa minha anterior, de que SQL daria ordens de grandeza, **não se confirmou** para strings.)

**Onde o nativo ainda pode valer depois dos passos 1–4** (laços por token que sobram): (a) `TCL2`: codificar/decodificar e montar o léxico (Intel hoje: 272/397 mil tok/s); (b) ler JSONL das etiquetagens e migrar arquivo antigo (14 min no Intel, laço por camada em Python); (c) construir o índice posicional (hoje SQLite + `executemany`); (d) janelas de colocados e n-gramas sobre arrays de ids; (e) só na Fase C, um índice próprio estilo CWB. **Não ajuda:** gzip/zlib (já é C; trocar de codec quebraria o requisito de ler com a biblioteca padrão), SQLite (já é C), spaCy/Stanza/torch (já nativos).

**Alternativas que dão velocidade de C sem novo binário, a esgotar antes:** ids inteiros + `array`/`memoryview`; numpy (já vai no pacote: pandas e spaCy o trazem, 1.26.4 no Intel) **só para cálculo**, com o formato continuando legível só com a biblioteca padrão; BLAKE2 no lugar de SHA-256 (mais rápido sem SHA-NI); SQL com `json_each`; `multiprocessing`; e **Cython em modo Python puro** ou **mypyc**, em que o mesmo arquivo `.py` roda sem compilar e ganha velocidade se compilado (o melhor para portabilidade: o fallback é o próprio código).

**Se e quando for para nativo:**

| Opção | Portabilidade | Fallback | Custo de manter | Quando |
|---|---|---|---|---|
| **Cython/mypyc em modo Python puro** | extensão por plataforma, mesma fonte | o próprio `.py` | baixo | primeira tentativa |
| **Rust + PyO3 (`abi3`) + maturin**, pacote opcional `ttwtools-native` | uma roda por SO/arquitetura serve do Python 3.9 ao 3.14; macOS 12 com `MACOSX_DEPLOYMENT_TARGET=12.0` | Python puro | médio (toolchain e CI) | se sobrar laço por token acima do orçamento |
| **C com cffi/ctypes** | parecido, sem Python.h | Python puro | médio, memória manual | só se Rust não servir |
| **Executável à parte + subprocesso** | binário por SO | Python puro | alto (IPC, empacotar, assinar) | só para isolar tarefa longa (memória, cancelar) |

Rust é preferível a C++ aqui (compila para todos os alvos com o mesmo `cargo`, sem compilador diferente por sistema, segurança de memória). O pacote Python **nunca depende** do binário: `ttwtools._native` tenta importar e, se falhar, usa a implementação Python; `TTWTOOLS_NATIVE=0` força o caminho Python; verificação de versão da interface na importação. O binário **acelera, não define**: o formato de arquivo é o mesmo nos dois caminhos.

**Regras para entrar:** (1) só uma "costura" por vez, com interface estreita (bytes/arrays entram e saem), escrita primeiro em Python e já com teste de **equivalência token a token** entre as duas implementações; (2) só depois de um perfil mostrar laço por token acima do orçamento no Mac Intel; (3) CI constrói e testa a roda em macOS x86_64 e arm64, Windows x64 e Linux (o x86_64 também roda sob Rosetta no M4); (4) plataforma sem roda continua funcionando em Python; (5) o PyInstaller já empacota extensões; assinatura entra com a decisão D4.

**Ordem:** passos 1–3 (sem formato) → medir no Intel → protótipo `TCL2` já desenhado com as costuras → **experimento de dois dias**: a costura (a) em Cython modo puro e em Rust, comparando ganho, tamanho do pacote e esforço de CI. Só então decidir.



## 10. Protótipo TCL2: resultados (2026-09-30, M4)

Spike `libs/ttwtools/tools/proto_tcl2.py` (não muda o app nem o formato gravado). Rodado numa **cópia** de `com_tabelas.ttwa`: corpus `essays_bawe_somentetexto`, camadas `spacy` e `stanza`, 2.454 camadas, 7.504.886 tokens, Apple M4, Python 3.13, numpy 2.2.6. Tudo abaixo é **medido no M4**, salvo o que estiver marcado [estimado]. Para repetir no Intel: `python tools/proto_tcl2.py PROJETO --saida rel.md` (mesma tabela).

**Veredito contra o critério de adoção (tamanho ≤ ⅓ do `TCL1` **e** regex no léxico ordens de grandeza mais rápida que `REGEXP` por linha):**

- **Tamanho: NÃO atende.** `TCL2` = **0,75× o `TCL1`** (largura fixa, com léxico) e **0,68×** (varint); o critério pedia ≤ 0,33×. Contra o JSON antigo: 0,42×. Contra a tabela `tokens` com 5 índices (hoje): 875 MB → 30,6 MB (**≈ 29× menor**), mas isso o `TCL1` já entrega (40,7 MB, 21×).
- **Regex/glob no léxico: atende.** Regex 0,015 s × 2,22 s (**150×**); glob 0,018 s × 6,05 s (**338×**; o SQLite aí usa `GLOB` nativo, não callback Python). Contagens idênticas. Frequência por `bincount` 0,012 s × 2,09 s (171×); matriz documento × tipo (2,1 M de células) 0,19 s × 2,09 s (11×), resultados idênticos ao laço.
- **Resultado: revisar, não adotar como está.** Os ganhos de consulta são reais (ordens de grandeza), mas o ganho de espaço sobre `TCL1` é de 25–32%, não de dois terços. Ver "por que não chegou a ⅓".

**Por que não chegou a ⅓ (medido por coluna, camadas sem léxico).** O `TCL1` já tinha tirado o grosso: o que sobra é entropia real. Em `TCL2` (largura fixa): `word` 11,8 MB (1,58 B/token) · `xpos` 3,8 · `tags` 3,8 · `upos` 3,2 · `start` 3,75 · `end` 3,67 · `lemma`, `feats`, `extra` ~0,07 cada (vazios). Três fontes de sobra **não exploradas** no spike, [estimado] em bytes a partir dessa tabela: `tags` repete `xpos` em `spacy` e `stanza` (`["DT"]` × `DT`): −3,8 MB; `end` é `start` + tamanho da forma na quase totalidade dos tokens: −3,6 MB; `start` deriva do texto quando só há espaços entre tokens (não medido). Somando só as duas primeiras: ~23 MB, **≈ 0,57× o `TCL1`**; ainda longe de ⅓. **Ressalva importante:** nessas camadas `lemma`, `feats` e `extra` estão **vazios** (spaCy e Stanza gravados sem lema no projeto do Intel), o caso em que o léxico por corpus mais ajudaria (lemas e features repetidos por documento) **não foi medido**. Um projeto com lemas preenchidos deve dar razão menor.

**Léxico por corpus (prova).** `word`: 81.097 formas só com `spacy`, 85.920 na união com `stanza` (+6%), contra 162.954 se cada ferramenta tivesse o seu (+101%). `upos` 17, `xpos` 51. O léxico inteiro serializa em 0,4 MB (1× por corpus). No `TCL1`, a soma dos dicionários por camada tem 2,35 M de entradas contra 86 mil no léxico do corpus (27×).

**Largura fixa × varint.** Só `word` muda (11,8 → 9,1 MB); as demais colunas empatam (já cabem em 1 ou 2 bytes). Varint dá −8% no total (27,9 × 30,6 MB), mas exige laço em Python na biblioteca padrão (o spike usou numpy, vetorizado, só para medir; decodificar 144 mil ids em 3 ms). **Recomendação:** largura fixa (`array` + `frombytes`, 100% biblioteca padrão), mais simples e rápida; varint só se o nativo vier.

**Velocidade (Mtokens/s no M4; mesma linha do `macintel.md`).**

| medida | `TCL1` | `TCL2` | razão |
|---|---|---|---|
| codificar | 0,88 | 2,05 a 3,13 (linhas → ids 3,13; zlib das colunas 2,05, contando largura fixa e varint) | ≈ 1,2× no total |
| decodificar linhas completas com strings | 3,39 | 4,22 | 1,25× |
| decodificar só `word` (ids) | — | 86 | 25× o `TCL1` |
| decodificar 4 colunas de ids | — | 46 | 14× |
| decodificar 9 colunas (ids e posições) | — | 23 | 7× |

Codificar `TCL2` (2,40 s de mapeamento + 3,66 s de zlib, este último com dois formatos) fica no mesmo patamar do `TCL1` (8,57 s) ou abaixo. No Intel [estimado], com as razões já medidas (codificar 3×, decodificar 8×): decodificar só ids ≈ 10 Mtok/s, regex no léxico ainda em décimos de segundo, `bincount` sobre 7,5 M de ids em ~0,1 s. Não medido no Intel.

**Memória.** Fluxo do passo 1: pico de 97 MB; com `TCL2` e a tabela temporária: 144 MB; o pico de **1,6 GB** vem de manter os ids de `word`, `lemma`, `upos`, `xpos` de todas as camadas na memória para as consultas do spike (o real leria por camada ou por corpus: 4 colunas × 7,5 M × 4 B = 120 MB, [estimado]). O `TCL2` decodifica para `numpy` sem cópia (`frombuffer`).

**O que o spike não fez (dito com franqueza).** Não chamou `query.frequency` (o "laço atual" é um `SELECT` por camada + `Counter`, equivalente); não testou lemas/feats reais; não montou o índice posicional com os mesmos ids (parte (d) só até a máscara sobre ids); não foi rodado no Intel; a tabela `tokens` temporária é montada por `executemany`, não pelo caminho real do projeto (o tamanho de 875 MB bate com o real, 21× o `TCL1`).

**Costuras para código nativo** (seção 9): os pontos quentes do `TCL2` em Python são (1) linhas → ids (dicionários Python, 2,4 s/7,5 M), (2) zlib das colunas (3,7 s, e não seria acelerado por Rust), (3) varint e (4) varrer o léxico com `re` (0,006 a 0,009 s, irrelevante). Com ids, as consultas de contagem (`bincount`, `unique`) já são numpy; **não há gargalo que peça nativo agora**. A costura útil é `decode_ids(blob, colunas)` → array de inteiros, e `mascara_do_lexico(padrão)` → ids.

#### Saída completa do script (M4)


| formato | MB | bytes/token | razão ao TCL1 |
|---|---|---|---|
| JSON + zlib (antigo) | 73,1 | 9,74 | 1,80 |
| `TCL1` (atual, dicionário por documento) | 40,7 | 5,43 | 1,00 |
| `TCL2` largura fixa + zlib por coluna, camadas | 30,3 | 4,03 | 0,74 |
| `TCL2` largura fixa, camadas + léxico do corpus (1×) | 30,6 | 4,08 | 0,75 |
| `TCL2` varint + zlib por coluna, camadas + léxico | 27,9 | 3,72 | 0,68 |
| tabela `tokens` sem índices | 366,7 | 48,86 | 9,00 |
| tabela `tokens` com os 5 índices (hoje) | 874,8 | 116,56 | 21,48 |

##### Onde estão os bytes do `TCL2` (camadas, sem o léxico)

| coluna | fixa (MB) | varint (MB) | bytes/token (fixa) |
|---|---|---|---|
| start | 3,75 | 3,74 | 0,50 |
| end | 3,67 | 3,67 | 0,49 |
| word | 11,83 | 9,11 | 1,58 |
| lemma | 0,07 | 0,07 | 0,01 |
| upos | 3,21 | 3,21 | 0,43 |
| xpos | 3,79 | 3,79 | 0,50 |
| feats | 0,07 | 0,07 | 0,01 |
| tags | 3,79 | 3,79 | 0,50 |
| extra | 0,07 | 0,07 | 0,01 |

_Léxico serializado (JSON+zlib): 0,4 MB. Entradas de dicionário somadas por camada no `TCL1`: 2.351.857; entradas do léxico por corpus: 86.039._

##### Léxico por coluna e crescimento ao somar ferramentas

| coluna | só `spacy` | união (léxico por corpus) | soma dos léxicos separados |
|---|---|---|---|
| word | 81.097 | 85.920 | 162.954 |
| lemma | 0 | 0 | 0 |
| upos | 17 | 17 | 34 |
| xpos | 50 | 51 | 99 |
| feats | 0 | 0 | 0 |
| tags | 50 | 51 | 99 |
| extra | 0 | 0 | 0 |

#### 2. Velocidade (Mtokens/s; maior é melhor)

| medida | tempo (s) | Mtok/s |
|---|---|---|
| ler linhas do SQLite (referência) | 4,30 | 1,75 |
| codificar `TCL1` | 8,67 | 0,87 |
| codificar `TCL2`: linhas → ids (dicionários Python) | 2,39 | 3,14 |
| codificar `TCL2`: zlib das colunas (largura fixa + varint, ambos) | 3,64 | 2,06 |
| decodificar `TCL1` (linhas completas) | 2,22 | 3,38 |
| decodificar `TCL2`: 1 coluna de ids (`word`) | 0,09 | 85,50 |
| decodificar `TCL2`: 4 colunas de ids (word, lemma, upos, xpos) | 0,16 | 46,17 |
| decodificar `TCL2`: 9 colunas (só ids e posições) | 0,33 | 22,58 |
| decodificar `TCL2`: linhas completas com strings | 1,81 | 4,15 |

_Verificação: 0 camadas amostradas com decodificação diferente da original (esperado 0). Varint (vetorizado com numpy; em biblioteca padrão seria laço Python): decodificar `word` de 50 camadas (143.980 ids) em 0,003 s, ida e volta ok._

#### 3. Consultas sobre ids × laço atual (unidade: **word**; lemas vazios nessas camadas, medida sobre a forma)

| medida | `TCL2` (ids) | laço atual (SQLite + `Counter`) | razão |
|---|---|---|---|
| frequência do corpus | 0,012 s (+ 0,002 s juntar) | 2,09 s | 171× |
| matriz documento × tipo (2.108.289 células) | 0,193 s | 2,09 s (mesmo laço) | 11× |
| resultado igual ao do laço | sim | | |

_Sem incluir o custo de decodificar os ids (seção 2). O laço é o de `query.frequency`: `SELECT` por camada e `Counter`; a função em si não foi chamada (exigiria abrir o projeto)._

##### Regex e glob sobre `word` (85.920 formas distintas no léxico)

| consulta | léxico (varre) + máscara sobre ids | `TCL2` total | SQLite | razão | ocorrências | igual |
|---|---|---|---|---|---|---|
| regex `^(un\|re)[a-z]{3,}(ed\|ing)$` (REGEXP por linha) | 0,006 s + 0,009 s | 0,015 s | 2,22 s | 150× | 32.564 | sim |
| glob `*tion` (`lower(word) GLOB`, C nativo) | 0,009 s + 0,009 s | 0,018 s | 6,05 s | 338× | 119.875 | sim |

_Montar a tabela `tokens` temporária: inserir 6,98 s; criar os 5 índices 8,54 s._

#### 4. Memória (pico acumulado do processo, MB)

| depois de | MB |
|---|---|
| passo 1 (fluxo: TCL1, JSON, contagens) | 97 |
| passo 2 (TCL2 e tabela temporária) | 144 |
| decodificações | 1.626 |
| consultas | 1.626 |


## 11. TCL2 com lemas e teste no aplicativo (2026-09-30, M4)

Pedido do usuário: insistir no `TCL2`, medir com lemas e testar um arquivo no formato novo abrindo e rodando o aplicativo. Feito numa **cópia** do projeto do Intel; a cópia e o projeto etiquetado foram apagados (ficam só os dois arquivos de saída, abaixo).

**Como se obtiveram os lemas.** As camadas `spacy` e `stanza` do projeto do Intel não têm lema nem feats. Etiquetei de novo o corpus `essays_bawe_somentetexto` (1.227 documentos, 3,76 M de tokens por ferramenta) com `ttwtools tag --components pos,tag,lemma,morph` (spaCy `en_core_web_sm`) e `pos,morph,lemma` (Stanza `en`), no `ttw314` (M4). spaCy: ~5 min; Stanza: ~45 min. Novas camadas: lema em 100% dos tokens; feats em 66% (Stanza).

**Tamanho com lemas (7,5 M de tokens, `spacy` + `stanza`, medido pelo spike).**

| formato | MB | B/token | razão ao `TCL1` |
|---|---|---|---|
| JSON + zlib | 88,5 | 11,8 | 1,53 |
| `TCL1` | 58,0 | 7,73 | 1,00 |
| `TCL2` spike (ids por frequência, largura mínima, numpy) + léxico | 42,2 | 5,62 | **0,73** |
| `TCL2` spike, varint + léxico | 36,8 | 4,91 | 0,64 |
| **`TCL2` real** (`layerfmt.encode_tcl2`, biblioteca padrão, ids na ordem de chegada, posições em int32) + léxico | 44,2 | 5,89 | **0,76** |
| tabela `tokens` com os 5 índices | 1.077 | 143,5 | 18,6 |

**Os lemas não mudam o veredito:** 0,73× (era 0,75× sem lemas). `lemma` custa 1,49 B/token, `word` 1,58, `feats` 0,48. O léxico por corpus continua valendo (lemas: 69 mil só no spaCy, 78 mil na união, 135 mil se separados), mas a entropia de `word` + `lemma` domina. **O critério ≤ ⅓ não é atendido com lemas** (nem o varint, 0,64×). Consultas por ids: frequência de **lemas** 0,012 s × 2,06 s (177×), regex 149×, glob 371×, matriz documento × tipo 11× (resultados idênticos).

**Implementação real (experimental, desligada por padrão).** `TTWTOOLS_LAYER_FORMAT=tcl2` liga a gravação de camadas em `TCL2`; sem a variável nada muda (`TCL1`), e `TCL1`, JSON antigo e `TCL2` abrem sempre. Peças: `layerfmt.Lexicon`, `encode_tcl2`, `decode_tcl2`, `decode_ids` (só as colunas pedidas); `project.LayerStore` (empacota/desempacota, lê e grava o léxico); tabela nova `lexicon_parts` (léxico por corpus, **só cresce**: ids estáveis, camadas novas não invalidam blobs antigos; cada gravação acrescenta uma parte zlib+JSON). Tocam nele: `pack_search_tables`, `rebuild_search_tables`, `_layer_rows`, `_materialize_layer`, exportação `.ttwc/.ttwcl/.ttwal` (`_save_corpora_subset`, que **reescreve os ids** ao copiar entre arquivos, também de `TCL2` para `TCL1` e o inverso) e o índice em cache (`searchindex`: a chave do cache inclui a impressão digital do léxico quando o blob é `TCL2`). Testes novos: `tests/test_layerfmt_tcl2.py` (ida e volta com bordas, léxico que só cresce, empacotar/reabrir, exportar leve em `TCL2` e voltar a `TCL1`).

**Teste na prática (arquivo real, `save-as --no-search-tables`, projeto inteiro: 5 ferramentas, 1.526 documentos).**

| arquivo | tamanho | tempo de gravar |
|---|---|---|
| `TCL1` (hoje) | 176,6 MB | 1 min 50 s |
| `TCL2` | **139,2 MB (0,79×)** | 1 min 58 s |

(O ganho do arquivo inteiro é menor que o das camadas porque o arquivo tem também textos, tabelas de features, KFA etc., e é gzip do todo.) **Abrir e rodar no aplicativo:** subi o servidor (`python -m app --mode web`, porta 8799, com a variável ligada), abri o `.ttwa` em `TCL2` pela rota `/api/project/open` (descompacta numa cópia de trabalho, `search_tables=false`, índice em cache construído a partir dos blobs `TCL2`), e rodei `explore/kwic` (`lemma=examine`, 929 ocorrências, com contexto e lema) e `explore/frequency` (unidade lema, camada spaCy). Depois comparei, dentro do pacote, `frequency` (forma, lema, classe) e `kwic` de `spacy`, `stanza` e `mfte` nos dois arquivos (`TCL1` e `TCL2`): **as 12 consultas deram resultado idêntico** (impressão digital dos resultados igual). Só a rota de abrir e duas de consulta foram exercitadas pelo servidor; **a interface (telas) não foi aberta no navegador**, e não abri o arquivo pela tela nem salvei por ela em `TCL2`.

**Não verificado / limites.** Paridade GUI: a escolha do formato ainda é só por variável de ambiente (sem opção no `save-as`, sem rota nem tela; fica assim enquanto for experimental). Não testado no Intel nem no Windows/Linux. Arquivos em `TCL2` **não abrem em versões anteriores do TTWtools** (o decodificador antigo falha no blob). Camadas apagadas deixam entradas no léxico (só cresce; um `compact` do léxico não existe). Não medi o tempo de abrir (primeira abertura: 104 s em `TCL1` e 71 s em `TCL2`, mas com cache de disco e ordem diferentes: **não é comparação válida**). Otimizações do tamanho ainda não feitas: ids por frequência (o spike usa; o real não), posições em largura mínima (spike: start+end ≈ 1,0 B/token; real: int32 + zlib), `tags` duplicando `xpos`, `end` derivável de `start` + tamanho da forma.

**Decisão a tomar.** `TCL2` real entrega 0,76× em camadas e 0,79× no arquivo, com ~20% menos que o `TCL1`, e habilita consultas por ids (a implementação atual ainda **não** as usa: o aplicativo continua reconstruindo `tokens`). Vale ligar por padrão só se as consultas por ids forem implementadas (seção 5, passo 3) ou se o ganho de ~20% no arquivo justificar quebrar a abertura em versões anteriores.

**Arquivos de teste** (gerados nesta sessão, na pasta temporária da sessão, ficam até você apagar): `scratchpad/out/lemas_tcl1.ttwa` (176,6 MB) e `lemas_tcl2.ttwa` (139,2 MB), ambos com camadas `spacy` e `stanza` **com lema** para o corpus `essays_bawe_somentetexto`, para testar no Intel.


## 12. `TCL2` vira o padrão (2026-09-30)

Decisão do usuário: usar `TCL2` a partir de agora, pela redução de tamanho (~20–25%) e pela rapidez de busca. Feito: `layerfmt.default_format()` devolve `tcl2` (a variável `TTWTOOLS_LAYER_FORMAT=tcl1` volta ao `TCL1`); testes ajustados (`tests/test_layerfmt.py` cobre os dois formatos; `test_layerfmt_tcl2.py` cobre padrão, `TCL1` forçado e exportação de arquivo leve `TCL1` para `TCL2`); 248 testes do pacote e 51 do servidor passam. **Ressalvas ditas ao usuário:** (1) a rapidez de busca **ainda não existe no aplicativo**: as consultas continuam por `tokens`; só o spike mediu os ids; (2) arquivos gravados agora **não abrem em versões anteriores**; (3) copiar um arquivo antigo inteiro (`save-as` de um `.ttwa` sem tabelas) não converte: medido, o resultado sai idêntico (176,6 MB, `TCL1`); a conversão acontece ao abrir e salvar sem tabelas de busca, ou ao exportar um corpus (`.ttwc`, `.ttwcl`, `.ttwal`).


## 13. Consultas por ids, medidas de abrir/salvar e barras em etapas (2026-09-30, M4)

**Medidas de antes (mesma máquina, `lemas_tcl1.ttwa` × `lemas_tcl2.ttwa`, consultas por SQL):** abrir 9,3 s × 39,5 s (não comparável: o índice em cache do `TCL1` já existia e o do `TCL2` foi reconstruído); KWIC de "the" 1,2 a 2,5 s nos dois; frequência 4,3 a 4,5 s nos dois; colocados 3,9 s nos dois; **salvar com tabelas 119,9 s (`TCL1`) × 117,7 s (`TCL2`), 904 e 905 MB**. Confirma: o `TCL2` em si não muda nada nas buscas SQL nem no salvar com tabelas.

**Consultas por ids (`libs/ttwtools/ttwtools/idquery.py`).** `search`, `kwic`, `frequency` (forma, lema, classe, palavra+classe, n-grama de 1 a 3, por corpus, documento ou metadado, com `stop` e `words_only`) e `collocates` leem os ids do `TCL2` (`layer_blobs`) e o léxico do corpus; cada condição da consulta (forma, lema, curinga, regex, `pos=`, `tag=`, `&`, frases) é avaliada uma vez no léxico e vira máscara sobre os ids. Usado só quando **todas** as camadas escolhidas estão em `TCL2` e não há linhas em `main.tokens` (arquivo salvo sem tabelas de busca, sem etiquetagens novas naquela sessão); senão cai no SQL de antes. `TTWTOOLS_ID_QUERIES=0` desliga. Reproduz do SQL: desempates da frequência (1ª aparição), ordem das camadas, `LIKE` e `GLOB` do SQLite, `lower()` só ASCII, ordem de iteração dos acertos nos colocados.

**Verificação.** Teste automático `tests/test_idquery.py`: 448 chamadas (busca, KWIC nas 3 ordens, frequência, colocados; 5 camadas/ferramentas; 21 consultas) no projeto pequeno, SQL antes e ids depois de empacotar: **todas idênticas** (270 com resultado). No projeto real (`lemas_tcl2.ttwa`, 7,5 M de tokens, spaCy e Stanza): 14 chamadas, **todas idênticas** ao SQL:

| chamada | SQL | ids (1ª, com decodificar) | ids (2ª) |
|---|---|---|---|
| KWIC `the` (spaCy) | 2,96 s | 0,14 s | 0,06 s |
| KWIC `the`, ordem à esquerda | 1,53 s | 0,17 s | 0,11 s |
| KWIC regex `^(un\|re)[a-z]+(ed\|ing)$` | 19,5 s | 0,04 s | 0,04 s |
| KWIC `in the` | 3,98 s | 0,06 s | 0,06 s |
| KWIC `pos=NOUN of pos=NOUN` (Stanza) | 57,6 s | 0,16 s | 0,06 s |
| KWIC `lemma=examine` (raro) | 0,01 s | 0,12 s | 0,04 s |
| busca `*tion` | 4,04 s | 0,05 s | 0,05 s |
| frequência de lemas | 4,57 s | 0,56 s | 0,49 s |
| frequência de formas | 4,38 s | 0,47 s | 0,47 s |
| frequência palavra+classe | 4,70 s | 0,87 s | 0,86 s |
| frequência de bigramas | 5,03 s | 1,90 s | 1,92 s |
| frequência por documento (1.227 grupos) | 4,41 s | 2,85 s | 2,66 s |
| colocados de `result` | 4,03 s | 0,14 s | 0,15 s |
| colocados de `lemma=examine` (lema) | 4,20 s | 0,15 s | 0,16 s |

O único caso pior é o KWIC de palavra rarísssima (SQL com índice, 0,01 s; ids 0,04 a 0,12 s por ter de decodificar as colunas na 1ª vez). A frequência ainda tem folga (montar o vocabulário em Python e concatenar índices); o lento restante é o **abrir**.

**O que não muda (dito com franqueza).** (1) **Abrir** continua construindo o índice em cache a partir dos blobs (9 a 40+ s no M4; minutos no Intel), porque outras funções ainda leem `tokens` (KFA, dispersão, leitura de documento, estatísticas, etiquetagem). Tornar isso preguiçoso exige que **toda** leitura de `tokens` passe por um ponto que monte o índice quando faltar; hoje há leituras espalhadas (`features.py`, `project.py`, `query.py` em `dispersion`, `read_document`, `tag_counts`) e uma falha seria silenciosa (resultado vazio), por isso **não foi feito**. É o próximo passo. (2) Arquivo salvo **com tabelas** não tem blobs: as consultas seguem no SQL, sem ganho. (3) Depois de "Salvar como", o aplicativo continua na **cópia de trabalho atual** (que já tem `tokens` ou o índice em cache), não no arquivo novo: é desenho (`app/routes/project.py`, `saveas`: "a cópia atual já tem as tabelas de busca"); as consultas por ids só valem depois de **reabrir** um arquivo salvo sem tabelas. (4) Dispersão, leitura de documento e contagem de etiquetas ainda usam SQL.

**Barras de progresso em etapas.** Ao abrir e ao salvar, o modal agora mostra **uma barra geral** e, abaixo, **uma lista das etapas vistas, cada uma com a sua barra** (descompactar, atualizar formato, recriar tabelas, ler camadas, criar cada índice; no salvar: copiar, empacotar, salvar, reduzir). O andamento geral é ponderado por pesos estimados e só conta as etapas do plano que ainda podem vir (as puladas não entram). Código: `composables/useSteps.js`, `components/StepProgress.vue`, `JobProgress`/`BusyModal` com a propriedade `plan`; texto `job.overall` em `pt` e `en`; testes em `src/test/useSteps.test.js` (9 arquivos, 29 testes passam). **Não abri a tela no navegador** (só teste de componente e build): a aparência real fica para você conferir.


## 14. Ajustes de tela pedidos após o teste no aplicativo (2026-09-30)

- **Atraso na tela vazia depois de abrir.** Causa: regressão minha do `TCL2`. `LayerStore.fingerprint` refazia o hash do léxico **por camada** (10.084 vezes) sempre que o índice em cache era planejado, e cada requisição da API reabre o projeto: `project/info` levava **4,3 s**. Agora o hash é calculado uma vez por corpus: **0,15 s**. Além disso, o modal de abrir continua na etapa nova "Preparando a tela do projeto" até a tela estar pronta (antes fechava e deixava a tela vazia).
- **Colocados.** A coluna "Colocado" mostra o nó em laranja antes ou depois do colocado conforme o lado (`L`: colocado nó; `R`: nó colocado; `L=R`: colocado nó colocado). Clicar numa linha (ou Enter) abre, acima da tabela, os **exemplos** (nó em laranja, colocado destacado), de 8 em 8, com Anterior/Próximo e "1–8 de 1226". Função pública `collocate_examples` (`query.py`; caminhos SQL e por ids, idênticos), subcomando `ttwtools collocate-examples`, rota `GET /api/explore/collocate-examples`, tela; testes: SQL × ids e soma dos exemplos = frequência da tabela de colocados. Limite: examina no máximo 5.000 ocorrências do nó (`capped` avisa).
- **KFA em Comparar.** A camada segue o seletor do **topo** (com "automática" cai na primeira camada do corpus; o selo ao lado do botão diz qual, ex. "Camada: stanza (automática)"); o resultado informa "camada X". Se o topo mudar depois de calculado, aparece o aviso "A camada do topo mudou de X para Y ... Recalcular com Y?" com [Recalcular] e [Manter o resultado atual]; nada recalcula sozinho. Métrica e |d| mínimo ficam sempre visíveis (sem "opções avançadas"). O tipo de gráfico virou botões lado a lado (mesmo estilo das abas).
- **"Não salvo" depois de KFA/análises.** Resultados derivados (`save_analysis`, KFA, tabelas de features) entram no arquivo sem ativar "não salvo" (decisão de 2026-09-30): `TTWAProject._derived()` + ganchos `DERIVED_HOOKS`/`CLOSE_HOOKS` que o aplicativo registra em `app/state.py` (o selo compara tamanho e data do banco e do WAL; fechar a conexão faz checkpoint e muda o arquivo, por isso a reavaliação ao fechar). Verificado: KFA pela API com o arquivo salvo continua `unsaved: false`. Limite: uma mudança real feita na **mesma conexão** depois de um derivado e antes de fechar seria marcada como salva; as rotas usam uma conexão por requisição, então não ocorre hoje.
- **Verificado na tela** (Chrome, servidor local): abrir o `lemas_tcl2.ttwa`, Colocados de "make" com exemplos e paginação, KFA com botões de gráfico, aviso de camada trocada e etiqueta de camada. **Não verificado:** e2e do Playwright (o teste `fluxo.spec.js` foi atualizado para os botões, sem rodar); modo escuro; larguras estreitas.

- **Atributo padrão `tags` em todas as camadas (2026-09-30).** `features.default_feature` devolve `tags` para qualquer camada; `resolve_feature` troca para `xpos` e depois `upos` só se a camada não tem `tags` (etiquetagem antiga), então o padrão nunca dá tabela vazia (era o erro 422 da KFA com `mfte_ext`). Quem tem `upos` e `xpos` (spaCy, Stanza) ganha o seletor **"Atributo contado"** (tags padrão, upos, xpos) na KFA e no Laboratório; a camada informa seus campos em `layer_summary` (`fields`, por amostra das 3 primeiras camadas). O resultado mostra "camada X · atributo Y", a galeria e o detalhe de um atributo usam o mesmo atributo do resultado, e mudar o atributo depois de calcular dispara o aviso de recálculo. O Laboratório passou a seguir a camada do topo (como a KFA). Verificado na API (spaCy: tags 43 atributos, xpos 29, upos 9) e na tela (seletor visível com spaCy). Observação: no projeto de teste, `tags` do spaCy/Stanza repete o `xpos`.

- **|d| mínimo e reaproveitamento de cálculos (2026-09-30).** A KFA guardada é sempre a **completa** (`min_effect` saiu da chave da análise): o servidor só filtra `|d| ≥ mínimo` no retorno (`_min_filtered`) e a tela pede tudo e filtra no navegador, então mudar o mínimo não chama o servidor nem o recálculo (medido: 0,15 a 0,18 s por chamada em cache; teste `test_min_effect_only_filters_and_never_recomputes`). A galeria guarda cada gráfico já calculado (por pedido) e só refaz se mudarem os atributos usados. Na exploração: consultas com os mesmos parâmetros vêm de um cache no navegador (`api/cache.js`, 80 entradas, limpo em `session.refresh()`), e **Frequência** pede a lista uma vez com até 500 itens (corpus inteiro) e "Mostrar os N primeiros" só corta. Ainda recalcula (e deve): mudar unidade, camada, corpus, métrica da KFA (rápido: tabelas em memória), janela ou nó nos colocados. Limite do cache: depois de etiquetar de novo a mesma camada sem chamar `refresh()`, uma consulta repetida viria do cache.
- **Colocados com curinga ou regex no nó.** A coluna "Colocado" mostrava a consulta (`Mak*`) ao lado do colocado; agora mostra a **forma real** do nó mais frequente com aquele colocado (`decision making`, `make decisions`, `makes clear`) e "+N" quando há outras formas (dica com o número). Novos campos `node_form` e `node_forms` em `collocates` (SQL e ids idênticos, teste com `th*` e `/^(the|a)$/`).
- **Leitor.** Busca no texto com `*`, `?`, /regex/ e sequência de palavras (destaca todas, a atual mais forte, contador "2 de 255", Enter e Shift+Enter percorrem; `utils/wildcard.js` com testes) e cópia: botões "Texto todo" e "Seleção", texto selecionável (`user-select: text`), clicar num token não limpa mais a seleção ao arrastar e o botão direito com texto selecionado abre o menu nativo (Copiar) em vez do menu de etiquetas. Verificado na tela só a busca (`th*` em um texto: 255 ocorrências); a cópia não foi testada na janela do aplicativo (área de transferência pode exigir permissão: há caminho de reserva com `execCommand`).
