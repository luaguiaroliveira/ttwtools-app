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

