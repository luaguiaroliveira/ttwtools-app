# Desempenho, memória e formatos: análise e proposta

Escrito em 2026-09-30, depois da Fase A, do B3 e do primeiro teste no Mac Intel (`verificacao/relatorio_intel_20260930.md`, parcial). Pergunta: o que tornaria o TTWtools **eficiente, rápido e robusto** em máquinas e circunstâncias diferentes (do Apple Silicon ao Mac Intel de 2015), **mantendo arquivos de perfis diferentes** (maiores e prontos × compactos que podem exigir reprocessamento) e **todas as funcionalidades previstas**.

> Convenção: **[medido]** vem de medição neste projeto; **[código]** de leitura do código; **[estimado]** é extrapolação a validar; **[conhecimento geral]** são práticas de outras ferramentas, de memória, **a conferir** antes de decidir algo caro com base nelas.

## 1. O que sabemos (medido)

| Operação (projeto real, 19 M de tokens) | Apple Silicon M4 | Mac Intel i5-5287U | Razão |
|---|---|---|---|
| Decodificar camadas `TCL1` | ~3.300 mil tok/s | 397 mil tok/s | 8× |
| SHA-256 (chave do cache) | 3.273 MB/s | 155 MB/s | 21× (sem SHA-NI) |
| zlib nível 1 (salvar compactado) | 67 MB/s | 31 MB/s | 2× |
| Frequência + colocados, 1 M de tokens sintético | ~0,9 s | 5,3–5,7 s | 6× |
| Abrir arquivo antigo (migrar 0.2→0.3) | — | **14,3 min** | |
| Compactar projeto (A1) | ~2 min | **10–11 min** | ~5× |
| Recriar tabelas de busca ao abrir (sem cache) | ~53 s | **5,3 min** | 6× |
| Abrir com tabelas | 6 s | 12,6 s | 2× |
| 6 consultas com tabelas | ~10 s | 89,9 s | 9× |

Leitura: o Intel não é "um pouco mais lento". Para **CPU em Python** é 5–9× mais lento; para **E/S** e descompressão, cerca de 2×; e **não tem aceleração de hash**. Tudo o que é laço em Python sobre milhões de tokens dói ali.

## 2. Onde está o desperdício hoje (código)

1. **Tokens como texto, uma linha por token.** A tabela `tokens` guarda `word`, `lemma`, `upos`, `xpos`, `feats`, `tags`, `extra` como TEXT em cada linha: ~110 bytes/token com os índices (cache de 2.124 MB para 19 M de tokens [medido]). As mesmas cinco ou dez palavras se repetem milhões de vezes.
2. **Consultas em Python sobre linhas.** `query.frequency` (`query.py:297`) busca **todas** as linhas de cada camada (`fetchall`, `query.py:290`), conta num `Counter` e, para n-gramas, monta listas de strings e um `Counter` do corpus inteiro (memória cresce com o número de n-gramas distintos). `collocates`, `keywords` (`keyness.py`) e `feature_table` (`features.py:67`, um `json.loads` **por token**) seguem o mesmo padrão.
3. **`REGEXP` linha a linha.** Consultas por regex (`query.py:97,137`) chamam uma função Python por token da tabela inteira.
4. **Estatísticas recalculadas.** Frequências, contagens de features e perfis por documento são refeitos do zero a cada tela; só o KFA ganhou reaproveitamento agora (resultado guardado no projeto e tabelas de features em memória da sessão).
5. **Índice construído por inteiro na abertura.** O B3 constrói as 10 entradas (todas as ferramentas × corpora) mesmo que a pessoa só vá olhar uma. No Intel isso é minutos [estimado: 5–15 min].
6. **Chave do cache exige reler e hashear todos os blobs** a cada abertura (`searchindex.entry_key`): 1,6 s por 250 MB no Intel; poderia ser gravada uma vez.
7. **Cada requisição reabre o projeto** (`api_new._project`): roda o DDL, verifica migrações e, no modo cache, anexa 10 bancos. Barato em arquivos pequenos, caro e sujeito a corrida em grandes.
8. **Abrir compactado descompacta tudo** (gzip não é acessível por partes): 3 GB de temporário por abertura.
9. **Migração, compactar e salvar** fazem laços em Python token a token (migrar 14 min, compactar 10 min no Intel) sem poder aproveitar o que já foi provado igual.

## 3. Como outros resolveram problemas análogos [conhecimento geral, a conferir]

| Ferramenta | Ideia | O que aproveitamos |
|---|---|---|
| **CWB / CQPweb, Manatee (Sketch Engine)** | Cada atributo vira uma coluna de **inteiros** apontando para um **léxico**; índice invertido por forma; abrem por `mmap` sem carregar; regex roda **no léxico** (milhares de entradas), não no texto. Frequências pré-calculadas por atributo. | O modelo de dados mais provado para concordância em corpus grande. Colunas de inteiros + léxico por corpus (já decidido no B1) + regex no léxico. |
| **spaCy `DocBin`** | Atributos dos tokens como arrays de ids de hash + `StringStore` compartilhado, comprimido. | É o `TCL1`, com léxico compartilhado no lugar do dicionário por documento. |
| **Parquet/Arrow, DuckDB** | Colunar, dicionário por coluna, *row groups* com estatísticas, leitura só das colunas necessárias. | O princípio; as bibliotecas ficam **fora** (regra de máquina antiga e só biblioteca padrão). |
| **Lucene / Elasticsearch** | Segmentos **imutáveis**; novo dado = novo segmento; mesclar depois. | Salvar incremental e cache por conteúdo; nunca reescrever o que já existe. |
| **Git, Nix, Bazel** | Objetos endereçados pelo **conteúdo**, imutáveis, compartilhados; construção interrompida não corrompe. | O cache do B3 já é assim; estender a tudo que for derivado. |
| **SQLite (prática comum)** | `WITHOUT ROWID`, índices de cobertura, `PRAGMA cache_size`/`mmap_size`/`temp_store`, `page_size` maior em bancos de leitura, `journal_mode=OFF` na construção, FTS5 para texto. | Afinar o que já usamos antes de trocar de motor. |
| **AntConc, #LancsBox** | Carregam os textos na memória. | Exatamente o que **não** queremos com 19 M de tokens em 8 GB. |
| **Pacotes Office/ePub/`.app`** | Pasta ou ZIP de partes; abre lendo o manifesto, carrega partes sob demanda. | A pasta-pacote do B1. |

Aprendizado comum: (a) **strings viram inteiros + dicionário**; (b) **o pesado é construído uma vez, é imutável e endereçado por conteúdo**; (c) **estatísticas agregadas não dependem do índice posicional**; (d) o que o usuário não pediu **não é construído**.

## 4. Proposta: quatro camadas, cada uma com um custo e um dono

```
  A. OBJETOS (verdade, imutáveis, pequenos)   textos · camadas em colunas de inteiros · léxico por corpus
  B. ESTATÍSTICAS derivadas (minúsculas)      matriz documento×tipo · contagens de features por documento · TTR
  C. ÍNDICE posicional (grande, descartável)  tokens + índices, por (corpus, ferramenta) — só quando precisa
  D. EXECUÇÃO                                 tarefas com andamento · limites de concorrência e de memória
```

**A. Objetos.** Camadas em colunas de inteiros com léxico por corpus (`TCL2`): `word_id`, `lemma_id`, `upos`, `xpos`, posições em deltas. Estimativa: **3–5× menor** que o TCL1 e que a tabela de tokens [estimado; protótipo antes de decidir]. É o que o B1 já prevê; a diferença é assumir que o **índice C também usa ids**.

**B. Estatísticas derivadas, sempre incluídas (mesmo no perfil compacto).** Por camada: a matriz documento × tipo (forma, lema, classe) e as contagens de features por documento. Tamanho [estimado]: ~1 milhão de linhas para 19 M de tokens (MBs). Com elas, **sem tocar nos tokens**: frequência, palavras-chave, faixas, KFA, dispersão por documento, detalhe de feature, galeria, perfil do Escrita. Elas nascem quando a camada nasce (na etiquetagem ou no empacotamento), sem segunda passagem, e são chaveadas pelo conteúdo da camada. É o mesmo dado que o B6 (corpora clássicos: perfil de frequência + features) e que as listas `reference-list` já geram: **um formato só para três usos**.

**C. Índice posicional sob demanda, por entrada.** Só KWIC, colocados, dispersão de posições e leitor precisam dele. Construir **quando a primeira consulta posicional for feita**, **uma entrada (corpus × ferramenta) por vez**, com a barra de etapas que já existe. Com ids inteiros, regex e glob rodam no léxico e depois viram `word_id IN (...)`. Hoje o B3 constrói tudo na abertura.

**D. Execução.** Toda operação pesada é tarefa com andamento (feito para Comparar; falta o resto). Um limite de tarefas pesadas simultâneas (núcleos − 1; no Intel, 3). Uma conexão por thread reaproveitada entre requisições. Consultas em SQL (`GROUP BY` sobre ids) em vez de `fetchall` + `Counter`, com `temp_store` em arquivo para não estourar a memória.

### Perfis de arquivo (mesmo formato, o que muda é o que vai dentro)

| Perfil | Dentro | Tamanho [estimado] | 1ª abertura | Demais aberturas | Reprocessa? |
|---|---|---|---|---|---|
| **Compacto** | A + B | menor (~10–20% do hoje) | segundos (lê manifesto e B); estatísticas imediatas | igual | só o índice C, **se e quando** houver consulta posicional |
| **Pronto** | A + B + C | maior (C ocupa ~2–4× o compacto) | extrai C para o cache (segundos a 1 min) | segundos | nada |
| **Cache local** | (C fora do arquivo) | — | — | — | C reaproveitado entre arquivos da mesma linhagem |

O perfil **Pronto** responde à sua pergunta sobre "um formato maior e menos pesado para máquinas assim": é o compacto mais a(s) entrada(s) de índice que já estão prontas. Trocar de perfil = acrescentar ou retirar a pasta `index/`, **sem reprocessar as camadas**. Um ZIP só para transporte, como decidido; dentro do ZIP o índice não comprime bem além de ~3:1, então "Pronto" é sempre maior para enviar.

## 5. O que é barato e sai já (sem mudar formato)

1. **Índice sob demanda por entrada** no B3 (hoje constrói as 10 na abertura). Ganho [estimado]: de 5–15 min para 0,5–1,5 min no Intel para quem usa uma ferramenta.
2. **Hash gravado uma vez** ao empacotar (coluna `hash` em `layer_blobs`); a chave do cache vira o hash dos hashes. Some o custo de 1,6 s por abertura e a dependência de SHA-NI (ou BLAKE2, mais rápido sem SHA-NI).
3. **Conexão reaproveitada por thread** e **fila de tarefas pesadas** com limite.
4. **`frequency`/`collocates`/`feature_table` em SQL** onde possível: `COUNT … GROUP BY` sobre o índice, `json_each` no lugar de um `json.loads` por token; `fetchmany` em vez de `fetchall`; limite de n-gramas distintos com poda por frequência mínima.
5. **`PRAGMA`s** medidos no benchmark (`cache_size` limitado, `mmap_size`, `temp_store=FILE`, `page_size` de 16 KiB nos bancos de índice).
6. **Compactar e migrar** com progresso por etapa e consulta de espaço antes (já há) e, para arquivo antigo, **oferecer converter uma vez** em vez de migrar em toda abertura.
7. **Orçamentos por máquina** no `bench_storage.py`: cada operação tem um teto para o Mac Intel de referência, e o relatório marca o que passa.

## 6. O que exige mudança de formato (B1/B2 revistos)

1. **`TCL2` com léxico por corpus + B (estatísticas)** dentro da pasta-pacote (objetos imutáveis).
2. **Índice C com ids** e consultas traduzidas (regex e glob no léxico).
3. **Salvar incremental**: objetos novos + `meta.sqlite`; nunca regravar o que já existe.
4. **Conversão sem perda** dos formatos antigos (nunca apaga o original; exporta de volta ao clássico), como já está nas diretrizes.

## 7. Compatibilidade com o que já está previsto

| Funcionalidade prevista | Como fica |
|---|---|
| KWIC, colocados, leitor, dispersão de posições | usam C (sob demanda); mesmas respostas |
| Frequência, palavras-chave, faixas, KFA, Laboratório, galeria, Escrita (n=1 contra referência) | passam a usar B: respostas em milissegundos e sem tokens; os testes atuais comparam contra o caminho antigo |
| Corpora do catálogo (B6) | = pacote só com A (ou nem isso) + B |
| Arquivos antigos (`.ttwa`, `.ttwl`, `.ttwc`, `.ttwcl`, `.ttwal`, `.ttwt`; esquemas 0.1–0.3) | leitura para sempre (migração única, com aviso e sem apagar) |
| Paridade GUI/pacote/CLI | cada peça nova é função pública + subcomando (`ttwtools stats build`, `index build`, `pack --profile`) |
| Compatibilidade macOS 12 / Intel, só biblioteca padrão | nenhuma dependência nova |

## 8. Robustez

- **Atômico e imutável**: escreve em `.part`, renomeia; chave = conteúdo; entrada incompleta não existe (já no B3).
- **Falha nunca corrompe**: derivados são descartáveis e reconstruíveis; o que é verdade (A) só é acrescentado.
- **Concorrência**: dois processos construindo a mesma chave (já seguro por renome); trava leve por chave para não duplicar trabalho.
- **Teste de falha**: matar no meio de cada etapa (empacotar, construir índice, salvar) e conferir que nada fica inválido; o teste de resíduos do A3 cobre a pasta temporária.
- **Desligáveis**: `TTWTOOLS_INDEX_CACHE=0` já volta ao comportamento antigo; o mesmo padrão para B (estatísticas) e para o índice sob demanda.

## 9. Ordem proposta (impacto ÷ risco)

| # | Passo | Ganho principal | Risco |
|---|---|---|---|
| 1 | Índice sob demanda por entrada; hash gravado; conexão por thread; fila de tarefas | 1ª abertura de minutos para segundos; sem corrida | baixo |
| 2 | Estatísticas B (matriz doc×tipo e features) calculadas ao empacotar/etiquetar e usadas por KFA, palavras-chave, faixas, frequência | "recalcular tudo" some; Intel deixa de esperar | médio |
| 3 | SQL nos laços quentes e PRAGMAs, com orçamentos no benchmark | tempo e memória das consultas posicionais | baixo |
| 4 | Protótipo `TCL2` + léxico + índice com ids (medir tamanho e regex) | decide o B1 com número | médio |
| 5 | Pasta-pacote com perfis Compacto/Pronto (B1/B2/B4) | os dois tipos de arquivo que você quer | alto |
| 6 | Conversão dos antigos (B5) e catálogo (B6) | encerra a Fase B | médio |

Os passos 1–3 não mudam o formato de arquivo. Dá para entregá-los já e medir no Intel antes de investir nos 4–6.

## 10. Decisões que dependem do usuário

1. **Estatísticas B sempre dentro do arquivo** (mesmo no compacto), ou só no cache? Recomendação: dentro, por serem minúsculas e o que o Intel mais sente.
2. **Índice só sob demanda** (primeira consulta posicional espera com barra) ou construir ao abrir como hoje? Recomendação: sob demanda.
3. **`TCL2` com ids e léxico por corpus** mesmo que o cache deixe de ser compartilhado entre projetos sem relação? (Já sabemos que remapear ids na view é inviável; o léxico por corpus resolve isso por outro caminho.)
4. **Teto de espera** no Intel por operação (1ª abertura, etiquetar, comparar): define os orçamentos do benchmark. Vem do relatório do teste no Intel, quando ele terminar.

## 11. O que não fazer

- Não trocar de motor (DuckDB, Arrow) nem adicionar `zstandard`: quebra a regra de máquina antiga e só biblioteca padrão; o SQLite bem afinado cobre o que precisamos.
- Não remapear ids dentro de views (medido: KWIC de 8 ms para 17 s).
- Não construir índice que ninguém pediu; não guardar duas vezes a mesma informação (verdade em A, derivados descartáveis).
- Não tratar a estimativa como medida: cada item marcado [estimado] tem um protótipo barato que o confirma ou derruba antes de virar formato.
