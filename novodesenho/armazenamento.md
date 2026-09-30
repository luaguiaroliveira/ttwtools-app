# Armazenamento de corpora e análises: situação, problemas e proposta

Escrito em 2026-09-29, a pedido do usuário (prioridade registrada em `pendencias.md`, seção 1). **É proposta, não decisão**: nada aqui foi implementado além do que está marcado "já feito". Números medidos no projeto real de `ttwa_files/` (2 corpora, 1.525 textos; o corpus grande tem 1.226 textos, 20,2 milhões de caracteres, 5 camadas de ~3,7 milhões de tokens). O que vem de conhecimento geral sobre outras ferramentas (seção 3) **não foi conferido na internet nesta sessão**: confirmar antes de citar.

Objetivo do usuário: um modelo **enxuto e versátil** para analisar corpora individuais e em comparação, com corpora clássicos internos (comparação de corpora menores ou de textos individuais), guardando **dados sobre o corpus** (camadas, comparações) e **os textos originais** de forma opcionalmente separada, com a maior eficiência de espaço, de carregamento e de uso.

---

## 1. A solução atual

**Um arquivo SQLite por projeto** (`.ttwa`, texto dentro; `.ttwl`, texto numa pasta ao lado; `.ttwc`/`.ttwcl` um corpus só; `.ttwal` pacote leve de vários), **compactado por inteiro com gzip** ao salvar.

Tabelas principais: `documents` (hash do texto), `document_meta`, `layers` (uma camada **por documento e etiquetador**, com `text_hash + tool + versão + config_hash`, o que evita reprocessar), `tokens` (uma linha por token e camada: 12 colunas), **7 índices** sobre `tokens`, `layer_blobs` (tokens empacotados em JSON + zlib, usado no modo "sem tabelas de busca"), `corpus_files` (textos), `tagged_files` (legado, ver abaixo), `feature_tables`, `kfa_results`, `analyses`, `project_meta`.

Fluxo:
- **Abrir** um arquivo compactado = descompactar **tudo** numa cópia de trabalho na pasta temporária (2,8 GB para um projeto de 1,06 GB).
- **Trabalhar** = consultas SQL direto nessa cópia.
- **Salvar** = compactar a cópia inteira de novo (~23 s) e gravar por cima do arquivo.
- **Exportar um corpus** = (agora) copiar só as linhas do corpus para um arquivo novo.

### Para onde vai o espaço (banco descompactado, 2,98 GB)

| Parte | Tamanho | Observação |
|---|---|---|
| `tokens` | 887 MB | ~49 bytes por token e camada |
| 7 índices de `tokens` | ~1.740 MB | `word`/`lword` (297 MB cada) e `lemma`/`llemma` (209 MB cada) quase duplicados |
| `tagged_files` | 304 MB | **cópia legada** da saída dos etiquetadores (ver 2) |
| textos, tabelas de traços, resto | ~50 MB | os **textos são ~1%** |

Depois do gzip: 1,06 GB. Sem tabelas de busca (só `layer_blobs`): o `.ttwcl` do corpus grande fica com 466 MB, dos quais `tagged_files` = 290 MB (61%), `layer_blobs` = 180 MB (5 × ~35 MB), tabelas de traços = 15 MB.

---

## 2. Os problemas

1. **O arquivo mistura o que é dado do que é índice.** 87% do banco são tokens + índices, que são **derivados** e recriáveis (63 s para as 5 camadas do corpus grande). Guardar e compactar índices é o que faz o arquivo chegar a 1 GB.
2. **Dado duplicado.** `tagged_files` (290 MB no `.ttwcl` leve, 304 MB no projeto) é a saída de etiquetagem do formato antigo (v0.1/0.2). Confirmei que **etiquetagens novas não a preenchem** (0 linhas depois de etiquetar com spaCy), mas a migração de projetos antigos a manteve ao lado das camadas. Além disso, tokens e `layer_blobs` guardam a mesma informação em duas formas.
3. **Abrir = descompactar tudo.** Um projeto de 1 GB compactado ocupa 2,8 GB de disco só para abrir, e cada abertura cria **outra** cópia (não há cache reaproveitável). Abrir é lento (~5 s aqui, mas cresce com o projeto) e o disco é o gargalo, não a memória (a exportação usou ~158 MB de RAM).
4. **Salvar reescreve tudo.** Uma análise pequena nova obriga a compactar e gravar 3 GB de novo.
5. **Pastas temporárias que se acumulam.** A pasta temporária do sistema chegou a **71 GB** (77 cópias de trabalho de 2,8 GB + 3,9 GB de uma exportação interrompida) e o disco do usuário ficou com 6,6 GB livres. Causas encontradas: cópia só apagada ao trocar de projeto; erro na abertura não limpava; `/quit` saía por `os._exit`; a cópia criada pelo pacote tinha nome que a limpeza não reconhecia; e a exportação antiga fazia 3 cópias no pico. **Corrigido em parte** (seção "Já feito" abaixo), mas o desenho continua exigindo uma cópia enorme por abertura.
6. **Um `.ttwa` é "tudo junto"**: corpora, camadas e análises entre corpora no mesmo arquivo. Para comparar dois corpora é preciso carregar os dois inteiros, mesmo que a comparação use só tabelas pequenas (frequências, traços). Um corpus clássico (Brown, etc.) não pode ser distribuído sem levar seus milhões de tokens.
7. **"Leve" não é leve.** A definição do projeto (`novomodelo.md` §9.3) é "sem o texto do corpus", mas o texto é ~1% do arquivo. O `.ttwl` (projeto inteiro) continua guardando tokens e índices.
8. **Sem checagem de espaço** antes de salvar/exportar; sem cache com limite; sem painel de uso de disco.

### Já feito (2026-09-29)
Exportar copiando só o que fica; `.ttwcl`/`.ttwal` sem tabelas de busca por padrão e empacotados direto (466 MB, 46 s, pico de disco 3,6 GB, contra 1.000 MB, 89 s e 6,3 GB); pastas temporárias com dono (`owner.pid`) e limpeza das órfãs ao iniciar; cópia de trabalho apagada em erro, no `/quit` e no SIGTERM.

---

## 3. Como outras ferramentas resolvem (conhecimento geral, a conferir)

- **IMS Open Corpus Workbench (CWB/CQP)**, base de TXM e CQPweb; **Manatee (NoSketchEngine/Sketch Engine)**: cada atributo posicional (forma, lema, classe) vira arquivos próprios: um **léxico** (cada palavra distinta uma vez) e um **fluxo de números inteiros** com um id por token, mais um **índice invertido** ordenado; tudo em arquivos mapeados na memória (mmap). É o modelo mais enxuto conhecido para corpora grandes: consulta sem carregar o corpus. O corpus é um **diretório** por corpus, não um arquivo único; troca-se em formato vertical (VRT/CoNLL-U).
- **BlackLab (INL, sobre Lucene)**: índice integrado (posições, forward index para contexto/KWIC e um armazenamento de conteúdo), um índice por corpus.
- **spaCy `DocBin`**: serializa documentos como **arrays numéricos** (hashes de atributos) mais uma **tabela de strings compartilhada**, comprimidos; só grava os atributos escolhidos. Mostra o ganho de guardar tokens como inteiros com léxico à parte.
- **Apache Parquet / Arrow** (Hugging Face `datasets` usa Arrow com mmap; DuckDB e Polars consultam Parquet direto, lendo só as colunas e blocos necessários): armazenamento **colunar** com codificação por dicionário e zstd/zlib. Bom para tabela de tokens e de traços; custo: dependência (`pyarrow`/DuckDB) e compatibilidade com macOS 12 e com o torch fixado.
- **Contêiner ZIP com manifesto** (EPUB, Office Open XML, JAR): um arquivo só, **partes independentes** que se leem sem descompactar o resto; atualizar = copiar as partes inalteradas sem recomprimir e trocar as que mudaram.
- **SQLite como formato de arquivo de aplicativo** (é o que fazemos hoje); extensões de compressão por linha (por exemplo `sqlite-zstd`) e **FTS5**; funciona bem, mas **índice e dado no mesmo arquivo** é o que pesa.
- **zstd em modo "seekable"** (frames independentes com tabela de offsets): leitura aleatória de um trecho sem descompactar o resto.
- **Armazenamento endereçado por conteúdo** (como o Git): objetos imutáveis chamados pelo hash, deduplicados e reaproveitados entre projetos. Já temos o gancho: `text_hash + tool + versão + config_hash` identifica uma camada.
- **Padrões de anotação em standoff** (GrAF/ISO 24612, usado pelo OANC/MASC, que já importamos): camadas separadas apontando por posição para o texto, como fazemos.

Lição comum: **texto, anotação e índice são coisas diferentes**; o índice é derivado e mora fora do arquivo de troca; tokens viram inteiros com um léxico compartilhado.

---

## 4. Proposta

### 4.1 Medida que sustenta a proposta (camada spaCy do corpus grande, 3.756.174 tokens)

| Representação da camada | Cru | zlib 6 | zstd 9 | lzma 4 |
|---|---|---|---|---|
| JSON atual (o que vai em `layer_blobs`) | 219,9 MB | 34,1 MB | 26,5 MB | 23,4 MB |
| **Colunar** (ids inteiros + léxico de palavras compartilhado) | 49,5 MB | **15,0 MB** | 14,3 MB | 12,6 MB |

O ganho vem do **formato colunar** (2,3× menor), não do codec: zlib (da biblioteca padrão, disponível em qualquer Python do pacote) fica a 5% do zstd. Isso evita depender de `zstandard` no Mac Intel (Python 3.11, sem `compression.zstd`). Medido com o preset "rápido" (sem lemas); com lemas e traços morfológicos espere algo maior (uns 1,5×).

### 4.2 Quatro tipos de dado, cada um com seu ciclo de vida

1. **Textos** (imutáveis, com hash): 20 M de caracteres ≈ **7 MB** compactados. Em frames por documento, para ler um texto sem descompactar os outros.
2. **Camadas** (imutáveis, identificadas por `text_hash + tool + versão + config_hash`): arquivo colunar por corpus e etiquetador, com **léxico compartilhado** e um bloco por documento (leitura direta de um documento para o Leitor e o contexto do KWIC). **≈ 15 MB por camada** neste corpus (5 camadas ≈ 75 MB) em vez de ~35 MB.
3. **Metadados e análises** (pequenos, editáveis): um `meta.sqlite` com `documents`, `document_meta`, catálogo de camadas, `analyses`, `feature_tables`, `kfa_results`, lista "a executar", `project_meta`. KB a poucos MB.
4. **Índice de busca** (derivado): **fora do arquivo**, num **cache local do aplicativo** (não na pasta temporária do sistema), por camada e identificado pelo hash da camada, com limite de tamanho (LRU) e botão "limpar cache". Construído sob demanda (~13 s por camada de 3,7 M de tokens), pode rodar em segundo plano, e é **reaproveitado por todo projeto que contenha a mesma camada**. Os arquivos deixam de carregar 87% de índice.

### 4.3 Contêiner

- **`.ttwc` (um corpus)** = ZIP com `manifest.json`, `meta.sqlite`, `texts/`, `layers/`. **Abrir = ler o diretório do ZIP** (milissegundos); nada é descompactado até ser preciso, e uma camada só é lida quando usada. Salvar = gravar um `.part` **na pasta do destino** (não na temporária do sistema), copiando as partes inalteradas **sem recomprimir** e trocando só as novas: o temporário passa a ser o tamanho do arquivo final, sem a cópia de trabalho de 2,8 GB.
- **Leve:** o mesmo arquivo com `texts/` como **pasta ao lado** (já é o `.ttwcl`).
- **`.ttwa` (conjunto/comparação)** passa a ser **um manifesto**: lista de corpora **referenciados** (id, nome, hash de conteúdo, caminho) + **resultados** das comparações (KFA, palavras-chave, Laboratório) + tabelas de traços e perfis de frequência usados. Tamanho: KB a MB. Só precisa abrir os `.ttwc` para explorar tokens. **Robusto** = embutir os `.ttwc` dentro (pacote); **leve** = só referências.
- **Corpora clássicos internos:** um pacote traz o que a comparação realmente usa: **perfil de frequência** (forma, lema, classe; contagem e amplitude por documento) e **tabelas de traços por texto**, alguns MB; a **camada de tokens** completa é um download opcional. Isso permite comparar textos individuais ou corpora pequenos contra Brown, LOB, etc. sem carregar milhões de tokens.
- **Migração:** ferramenta (`ttwtools convert` e botão em Arquivo) que separa um `.ttwa` antigo em `.ttwc` por corpus + `.ttwa` de análises, **remove `tagged_files` legados já cobertos por camadas** (verificando que a camada reproduz o conteúdo) e nunca apaga o arquivo original. Os formatos atuais continuam **legíveis** para sempre.

### 4.4 Estimativa para o seu projeto (a confirmar com uma medição de ponta a ponta)

| | Hoje | Proposta |
|---|---|---|
| Corpus grande, **robusto** (textos + camadas, sem índice) | 1,06 GB (`.ttwa` dos 2 corpora) | ~85–130 MB |
| Corpus grande, **leve** (textos ao lado) | 466 MB | ~80–120 MB + 7 MB de textos |
| Conjunto comparando 2 corpora | tudo junto (1,06 GB) | KB–MB (referências + resultados) |
| Disco temporário para abrir | 2,8 GB por abertura | ~0 (índice em cache, compartilhado, com limite) |
| Só remover `tagged_files` legados (passo barato, sem formato novo) | | 466 MB → ~180 MB |

### 4.5 Fases (do mais barato ao mais ambicioso)

**Fase A: sem mudar o formato (dias).**
1. Remover `tagged_files` legados cobertos por camadas (ferramenta "Compactar projeto"). Maior ganho pelo menor custo: ~290 MB no leve.
2. Checar espaço livre antes de salvar/exportar e recusar com mensagem clara.
3. Cache de trabalho no diretório de cache do aplicativo, com registro e limite (LRU), em vez da temporária do sistema; painel "Uso de disco / Limpar" em Recursos.
4. Reduzir os índices duplicados (um índice por `lower(word)` e outro por `lower(lemma)`), medindo o efeito no KWIC e na frequência.
5. Empacotamento de camadas em formato colunar + zlib (2,3× menor que o JSON atual), com **versão no cabeçalho** e leitura dos dois formatos.

**Fase B: novo contêiner (semanas).**
6. `.ttwc` em ZIP (manifesto + `meta.sqlite` + textos + camadas colunares); abrir lendo só o índice; salvar por partes.
7. Índice de busca em cache por camada, construído sob demanda e em segundo plano; consultas continuam em SQL sobre o banco de cache (ATTACH), então o código de busca quase não muda.
8. `.ttwa` como manifesto de referências + resultados, com a opção de embutir; conversão dos antigos.
9. Perfis de frequência e tabelas de traços como formato dos **corpora clássicos** do catálogo (liga com a decisão D6).

**Fase C: só se for preciso (corpora de 100 M+ de tokens).**
10. Índice próprio estilo CWB (léxico + fluxos de inteiros + postings em arquivos mmap) ou DuckDB/Parquet. Custo alto e dependência nova; o SQLite em cache já cobre dezenas de milhões de tokens (limite anotado em `novomodelo.md` §9.5).

### 4.6 O que não mudar

Camadas em **standoff** (posições de caracteres) e a chave de cache `text_hash + tool + versão + config_hash`; conferência de hash dos textos externos; paridade GUI × pacote (cada operação nova como função pública, subcomando e rota); compatibilidade com macOS 12 Intel (Python 3.11: **só biblioteca padrão** no formato; `pyarrow`/DuckDB só se a Fase C vier).

---

## 5. Decisões que dependem do usuário

1. **`.ttwa` como manifesto** (referencia os `.ttwc`, com opção de embutir) ou continua a ser "tudo junto" em formato mais leve?
2. **ZIP único** (um arquivo para compartilhar) ou **pasta-pacote** (como um pacote do macOS) como formato de trabalho, com ZIP só para enviar?
3. O **índice de busca em cache** é aceitável (a primeira abertura de cada camada leva ~13 s por camada de 3,7 M de tokens, depois é instantânea e compartilhada)? Ou prefere que o arquivo robusto **abra pronto** (arquivo bem maior)?
4. Léxico compartilhado **por corpus** (melhor compressão, camadas ficam ligadas ao corpus) ou **por camada** (camadas independentes, ~10–20% maiores)?
5. **Corpora clássicos:** distribuir só perfil de frequência e traços (poucos MB) e o corpus completo como download opcional?
6. Começar pela **Fase A** (ganho grande, risco baixo) e decidir a Fase B depois de medir?

## 6. Riscos e a medir

- Medição de ponta a ponta do formato colunar com **lemas e traços** (a amostra usou o preset "rápido").
- Velocidade de consulta com índice em cache versus dentro do arquivo (KWIC, frequência, colocados).
- Comportamento em **Windows e Linux** (caminhos, cache, limpeza de órfãs, bloqueio de arquivos ao reescrever o ZIP).
- Migrar sem perder nada: teste que compara camada antiga e nova token a token, e projetos reais antigos de `ttwa_files/` como base de teste.
