# Novo modelo do TTWtools — rascunho

Rascunho de 2026-09-26. Serve para ser complementado.

## 1. Ponto de partida: o TTWtools atual (ELC2026)

Três camadas:

1. **Pacote Python `ttwtools`:** tagging (BiberPlus com spaCy, MFTE com Stanza, spaCy e Stanza puros), contagens brutas e normalizadas por 1000 palavras, estatística descritiva e KFA (Cohen's d, mais a variante `kfa2`).
2. **App `TTWtools`:** backend FastAPI, GUI em Vite, D3 e Tailwind, empacotado com pywebview e PyInstaller. Serve como desktop ou como web.
3. **Arquivo de projeto `.ttwa`:** SQLite com textos, camadas de anotação e análises.

Fluxo: subir 1 ou 2 corpora em `.txt`, etiquetar, calcular a KFA, ver o gráfico de barras divergentes e abrir o texto com as tags marcadas.

### Limitações que o novo modelo quer superar

- Parte sempre de um par de corpora.
- Só inglês.
- Dependência da taxonomia de Biber.
- Sem corpora prontos: o usuário precisa trazer os dados.
- Sem concordância (KWIC) nem busca de palavra.
- Arquivos `.ttwa` grandes (o de exemplo em `ttwa_files` tem 346 MB).

## 2. Objetivo do novo modelo

Um aplicativo **acessível e fácil de usar**, menos restrito e menos direcionado à KFA, com:

- corpora abertos integrados;
- análise de um corpus individual;
- uso por pesquisadores, docentes e estudantes;
- data-driven learning (DDL) e estudo linguístico de/a partir de corpora.

A KFA continua, mas como um módulo a mais.

### Escopo da primeira fase (decidido em 2026-09-26)

- **Primeiro o aplicativo local:** interface em HTML/JavaScript (Vue 3), rodando **tudo na própria máquina**, na janela nativa (pywebview) com o servidor FastAPI local. Nada é enviado para fora.
- **A versão web fica para depois,** se for necessária. Quando vier, **o site não guardará nada** dos textos das pessoas (ver seção 18).
- **Continuam valendo** o princípio de paridade com o pacote Python (seção 10), a interface única, a tradução da interface, o desenho de projeto `.ttwa`/`.ttwl`, os corpora embutidos e as ferramentas de exploração e comparação.
- **Ficam adiados:** envio de arquivos pelo navegador, política de privacidade e registro de anuência do site, PWA, teste e ajuste fino para celular e hospedagem do servidor. A estrutura da interface continua pensada para telas de larguras diferentes, porque isso custa pouco quando feito desde o começo.

## 3. Três portas de entrada

1. **Explorar:** o usuário escolhe um corpus embutido, sem instalar nada. É o caminho mais curto para começar, inclusive para o DDL.
2. **Meu corpus:** o usuário arrasta uma pasta de `.txt`, o app etiqueta e o corpus fica salvo como projeto.
3. **Comparar:** escolhe dois corpora, embutidos ou próprios, e abre a KFA e as visualizações atuais.

## 4. Ferramentas no corpus aberto

Ponto de partida: `novodesenho/novodesenhoferramenta.md`.

| Ferramenta | Função | Situação |
|---|---|---|
| Frequência e busca de palavra | Quantas vezes ocorre, lema, classes | Nova, é a base |
| KWIC | Palavra + N palavras de cada lado + frase + classe gramatical; clicar abre o contexto ou o arquivo | Nova, é a principal |
| Colocados | Vizinhos frequentes (MI, log-dice) | Nova |
| Clusters e n-gramas | Sequências frequentes | Nova |
| Frequência por classe | Palavras mais frequentes, raras, por classe gramatical | Nova |
| Visão geral do corpus | Número de arquivos, palavras, types, etc.; depois do etiquetamento, classes gramaticais (seção 12) | Nova |
| Dicionário de tags | Repertório de tags do tagger escolhido, com descrição (seção 11) | Nova |
| Visualizador de texto | Texto paginado com etiquetas coloridas | Já existe |
| KFA/AMD | Comparação entre dois corpora | Já existe, vira módulo avançado |
| Dispersão | DP de Gries, Range e gráfico de código de barras (seção 15.2) | Nova |
| Palavras-chave | Alvo contra corpus de referência do catálogo (seção 16) | Nova |
| Comparação de N grupos | Comparar N corpora ou subgrupos (seção 14) | Experimental |
| Ajuda e explicações | Balões, tour com destaque e visuais interativos (seção 13) | Nova |

O KWIC é a peça central, porque serve à pesquisa e ao ensino. Para o DDL, vale uma versão simplificada com exemplos agrupados por padrão e exportação para atividade.

## 5. Decisões de arquitetura

1. **Separar a análise da anotação.** O corpus tem texto, tokens e camadas de anotação, e cada ferramenta pede só a camada de que precisa. Frequência simples e KWIC funcionam sem etiquetagem. spaCy, Stanza e Biber só entram quando o usuário quer classes gramaticais.
2. **Trocar o `.ttwa` gigante por um índice.** SQLite com tabela de tokens (posição, lema, classe, documento) e índices, para KWIC rápido em corpora grandes.
3. **Corpora embutidos como pacotes baixáveis.** O instalador continua leve. Cada corpus é baixado sob demanda, já pré-etiquetado, mostrando a licença no download.
4. **Idiomas em módulos.** Inglês primeiro, depois português (spaCy `pt_core_news`, Stanza, corpora UD).
5. **Interface única, sem perfis de usuário.** Não há modo "estudante" nem modo "pesquisador". Todos veem a mesma interface, com o essencial em primeiro plano (buscar, ver exemplos) e as opções mais detalhadas (KFA, tags de Biber, escolha de tagger, exportação) acessíveis dentro das próprias telas, por exemplo em painéis "opções avançadas" recolhidos por padrão. Nada fica escondido por perfil.
6. **Localização da interface (i18n).** O usuário escolhe o idioma da própria ferramenta (menus, mensagens, ajuda, nomes de tags e tooltips explicativos), independentemente do idioma do corpus. Um estudante brasileiro pode analisar um corpus em inglês com a interface em português. Consequências:
   - todos os textos da interface saem do código e vão para arquivos de tradução por idioma (um por idioma, com chaves estáveis);
   - o idioma da interface e o idioma do corpus são configurações separadas: o do corpus decide o tagger e o modelo, o da interface decide só a apresentação;
   - as descrições das tags (por exemplo os tooltips de Biber) também precisam de tradução;
   - formatos de número e de data seguem o idioma escolhido;
   - idiomas iniciais a definir (ver seção 8), com inglês como idioma de reserva quando faltar uma tradução.

## 6. Corpora candidatos

Fonte: `corporainternos/corporainternos.md` e a imagem `corporainternos/image.png` (lista de corpora embutidos de outra ferramenta). **As licenças abaixo precisam ser conferidas na fonte antes de distribuir.**

Já anotados em `corporainternos.md`:
- OANC (Open American National Corpus)
- Brown Corpus (via NLTK)
- LOB

Outras opções levantadas:
- **Inglês:** MASC, Project Gutenberg, Wikipedia dumps (CC BY-SA), Universal Dependencies.
- **Português:** Tycho Brahe (histórico), Floresta Sintá(c)tica, UD português, Corpus Brasileiro (NILC/USP, licença a confirmar), CETENFolha e CETEMPúblico (Linguateca, com cadastro).
- **Paralelos e especializados:** Europarl, OPUS, TED2020, CHILDES/TalkBank, Wikisource.
- **Já usado em testes:** BAWE (licença restrita, Oxford Text Archive).

## 7. Ordem de implementação sugerida

1. Modelo de dados novo (tokens indexados) e importação de uma pasta de `.txt`.
2. Busca de palavra e KWIC.
3. Frequência, colocados e gráficos por classe.
4. Catálogo de corpora baixáveis, começando por Brown/LOB e OANC.
5. Reencaixar a KFA como módulo, sem mudar a lógica dela.

## 8. Questões em aberto

- Quais idiomas de interface na primeira versão (português e inglês, ou mais)? Quem traduz e revisa?
- Português como idioma de corpus já na primeira versão, ou o inglês vem primeiro?
- Quais opções ficam em primeiro plano e quais vão para "avançadas", já que não haverá perfis?
- Manter a compatibilidade com `.ttwa`, ou o novo modelo pode quebrá-la?
- Limite de tamanho dos corpora embutidos.
- Formatos de importação além de `.txt` (CoNLL-U, XML, PDF?).

## 9. Formatos e estrutura de projeto

### 9.1 O que já existe e serve de base

Vem de `libs/ttwtools/ttwtools/tagged_io.py` e do esquema SQL de `project.py`:

- Cada tagger já é uma camada separada: `tagged_files` tem a chave `(corpus_name, filename, tagger_type)`.
- O JSONL canônico é standoff: cada token guarda `start_char` e `end_char` no texto original. Taggers diferentes tokenizam de modo diferente, então as camadas só se alinham por posição no texto. Isso não deve mudar.
- `feature_tables` e `kfa_results` já guardam resultados com seus parâmetros.
- O `tagged_io.py` preserva campos extras, o que permite acrescentar `lemma`, `upos`, `feats`, `head` e `deprel` sem quebrar arquivos antigos.

Pontos fracos a resolver:

1. Cada arquivo etiquetado é um bloco de texto opaco. Serve para ler um arquivo inteiro, mas não para consultar ocorrências no corpus todo (KWIC).
2. Nada registra se um resultado ainda vale. Não se sabe se o texto, o tagger, a versão ou a configuração mudaram.

### 9.2 Formatos considerados

| Formato | Papel | Observação |
|---|---|---|
| `.txt` | Entrada | Já é o caso atual |
| JSONL standoff (atual) | Formato canônico de camada e de troca | Já existe |
| CoNLL-U | Entrada e saída | Cobre o Universal Dependencies |
| TEI XML / XML do BNC | Entrada | O OANC/MASC vem em XML standoff (GrAF), então um conversor cobre ambos |
| VRT | Saída | Abre o corpus no CWB, no Sketch Engine e no CQPweb |
| Parquet | Saída opcional | Dados em escala, Hugging Face |
| Texto anotado do NLTK (`palavra/TAG`) | Entrada | Usado pelo Brown e pelo LOB |

Deixados de fora por enquanto: `.spacy`/DocBin (depende da versão do spaCy; no máximo cache local), CWB binário, PAULA, GrAF completo, XCES, WebAnno TSV, TCF, IOB/NER, TextGrid e ELAN (fala é outro projeto).

### 9.3 Dois tipos de arquivo de projeto: `.ttwa` e `.ttwl`

Os dois usam o mesmo esquema SQLite. A diferença é só se o texto do corpus está dentro do arquivo.

| | `.ttwa` | `.ttwl` |
|---|---|---|
| Texto original do corpus | Dentro do arquivo | Fora do arquivo |
| Camadas, tokens e análises | Sim | Sim |
| Portabilidade | Alta: um arquivo só | Menor: precisa do corpus por perto |
| Tamanho | Grande | Leve |

Regras propostas para o `.ttwl`:

- Ao criar ou salvar, o app oferece **exportar o corpus ao lado do arquivo**, por exemplo uma pasta com o mesmo nome do projeto, com os `.txt` originais.
- O `.ttwl` guarda, para cada documento, o caminho relativo e o **hash do conteúdo**. Ao abrir, o app confere se o corpus ao lado bate com os hashes.
- Se o corpus não for encontrado ou tiver mudado, o app pede para localizá-lo de novo, sem perder as camadas. Se o texto mudou, avisa que as camadas daquele documento podem estar desalinhadas.
- Ferramentas que só usam a tabela de tokens (frequência, colocados, KWIC básico) funcionam mesmo sem o corpus. O visualizador de texto paginado e o contexto completo do KWIC precisam do texto original.
- Converter entre os dois deve ser possível: "embutir corpus" (`.ttwl` → `.ttwa`) e "separar corpus" (`.ttwa` → `.ttwl` mais a pasta de textos).

A sigla `.ttwl` vem de *light*: a versão leve do projeto, sem o texto do corpus.

### 9.4 Tabelas propostas

1. `documents`: identificação e hash de conteúdo do documento. O texto entra só no `.ttwa`; no `.ttwl` guarda-se o caminho relativo.
2. `layers`: uma linha por camada e documento, com `tool`, `tool_version`, `model`, `config_hash`, `text_hash` e `created_at`. Antes de etiquetar, o app procura uma camada com o mesmo `(text_hash, tool, tool_version, config_hash)` e, se existir, pula. É isso que evita reprocessar.
3. `tokens`: `doc_id, layer_id, idx, start_char, end_char, word, lemma, upos, xpos, feats, tags`, com índices em `word`, `lemma` e `xpos`. Permite KWIC rápido e serve de fonte para CoNLL-U e VRT.
4. `analyses`: tabela geral com `type` (kfa, frequência, colocados, KWIC salvo), `params` em JSON, referência às camadas usadas, resultado e `created_at`. O `kfa_results` vira um caso particular dela.
5. Tabelas derivadas (`feature_tables`, frequências) tratadas como cache, recalculáveis a partir dos tokens.

O JSONL continua como formato de troca, lido e escrito por `tagged_io.py`. Os `.ttwa` existentes seriam migrados lendo os blocos JSONL e preenchendo `tokens`, no mesmo estilo dos `_migrate_*` de `project.py`.

### 9.5 Pontos ainda em aberto

- Corpora embutidos: entregar já indexados e etiquetados, como pacotes baixáveis, para que cada usuário não processe o Brown ou o OANC.
- Limite do SQLite: funciona bem para dezenas de milhões de tokens. O BNC e o Hansard (2 bilhões) pedem outra estratégia, como particionar ou usar só um subconjunto.
- Se o texto de um `.ttwa` deve ser guardado comprimido.
- Como o `.ttwl` trata corpora embutidos: provavelmente apontando para o pacote baixado, e não para uma pasta de `.txt`.

## 10. Princípio de desenvolvimento: GUI e pacote Python

Tudo o que o aplicativo faz precisa também estar acessível pelo pacote Python em `libs/ttwtools` e, portanto, pela linha de comando. A GUI é uma camada sobre o pacote, nunca o contrário.

Como aplicar em cada recurso:

1. **Pacote primeiro:** a lógica (cálculo, leitura de tagset, estatística, comparação) vive em `libs/ttwtools/ttwtools`, com função pública e docstring.
2. **Rota depois:** `app/routes` só chama a função do pacote e devolve JSON. Nenhuma regra de análise dentro da rota.
3. **Tela por último:** `frontend-src` só apresenta e coleta parâmetros.
4. **Linha de comando:** cada função pública tem um subcomando equivalente, por exemplo `ttwtools describe`, `ttwtools kwic`, `ttwtools tagset`, `ttwtools compare`. A saída pode ser tabela, JSON ou CSV.
5. **Mesmos arquivos de projeto:** o `.ttwa` e o `.ttwl` criados pela GUI abrem no Python, e os criados pelo Python abrem na GUI.
6. **Ajuda também no pacote:** as explicações do item 13 alimentam tanto os balões da GUI quanto o `--help` e as docstrings.

Cada seção abaixo traz uma linha "Pacote" e uma "GUI" para manter essa dupla visão à vista.

## 11. Escolha de tagger e tagset

**Requisitos:**
1. A pessoa escolhe o tagger.
2. Ao selecionar um tagger, o app mostra o repertório de tags dele, com uma breve descrição de cada uma.

**Taggers hoje no pacote** (de `taggers/__init__.py`): BiberPlus, MFTE, spaCy (UPOS e PTB), Stanza (UPOS e XPOS) e os combinados de spaCy e Stanza.

**O que já existe:** `tags_biber.json` tem `tag` e `definition` para as tags de Biber (por exemplo `VBD`, "Past tense POS"). Ainda não verifiquei se há arquivo equivalente para MFTE, UPOS e PTB.

**Proposta:** um arquivo de tagset por tagger, todos no mesmo formato:

```json
{
  "tagger": "biberplus",
  "version": "...",
  "tags": [
    {"tag": "VBD", "group": "Tempo verbal", "definition": "...", "example": "..."}
  ]
}
```

- `group` agrupa as tags (verbos, pronomes, etc.) para a tela ficar navegável.
- `definition` e `example` são traduzíveis, como o resto da interface.
- O tagset vem do próprio tagger e da sua versão, então cada camada em `layers` (seção 9.4) registra qual tagset usou.

**Pacote:** `ttwtools.taggers.available()` lista os taggers (com idiomas suportados, dependências e se estão instalados). `ttwtools.taggers.get_tagset("biberplus")` devolve o repertório. Linha de comando: `ttwtools tagset biberplus`.

**GUI:** na escolha do tagger, um botão "ver tags" abre um painel com o repertório: busca, agrupamento e, se possível, exemplo real do corpus aberto para cada tag. O mesmo painel serve depois, dentro das análises, para explicar as tags que aparecem nos gráficos.

Como o tagger define o idioma do corpus, a lista de taggers oferecida depende do idioma escolhido para o corpus (independente do idioma da interface).

### 11.1 Opções de cada tagger: padrão e "Personalizar"

Requisito: ao escolher o tagger, a pessoa tem as **opções que cada ferramenta (spaCy, Stanza e os demais) oferece para o etiquetamento**, com um **valor padrão** e as opções **expostas e explicadas**, num painel **"Personalizar"** (ou "Avançado") dentro da própria escolha do tagger. Não é um modo de usuário: o painel fica recolhido por padrão e qualquer pessoa pode abri-lo (seção 5).

**Situação atual** (lida em `libs/ttwtools/ttwtools/taggers/` e em `app/routes/tagging.py`):

| Tagger | O que já é parâmetro | O que está fixo no código |
|---|---|---|
| spaCy | `spacy_model` (padrão `en_core_web_sm`), `batch_size` | Componentes `ner` e `parser` sempre desligados (`_DISABLED`); só inglês |
| Stanza | `use_gpu`, `model_dir` | Pipeline sempre `tokenize,pos`; idioma `"en"` fixo; MPS (Apple) excluído de propósito por ser mais lento |
| BiberPlus | `n_processes`, `function_words`, `usenlp` | — |
| MFTE | `use_gpu`, `extended`, `model_dir` | — |

Além disso, a API do aplicativo (`TagRequest`) só repassa `tagger`, `save_tagged`, `usenlp`, `n_processes` e `function_words`. Ou seja, praticamente nenhuma opção de spaCy ou Stanza chega hoje à interface.

**Proposta: um descritor de opções por tagger,** junto do arquivo de tagset (seção 11), com estes campos por opção:

```json
{
  "id": "spacy_model",
  "grupo": "modelo",
  "tipo": "escolha",
  "padrao": "en_core_web_sm",
  "valores": ["en_core_web_sm", "en_core_web_md", "en_core_web_lg", "en_core_web_trf"],
  "afeta_resultado": true,
  "explicacao": "Modelo estatístico usado pelo spaCy. Modelos maiores costumam ser mais precisos e mais lentos.",
  "impacto": {"velocidade": "menor", "memoria": "maior", "download": "sim"}
}
```

- `afeta_resultado` separa o que muda as etiquetas do que só muda a velocidade (importante para o cache, ver 11.4).
- `explicacao`, os nomes e o `impacto` são traduzíveis (seção 5, item 6) e alimentam os balões da seção 13.
- Uma opção pode declarar quando está disponível (por exemplo, GPU só se existir; um modelo só se estiver instalado ou puder ser baixado).

**Opções candidatas** (levantadas do que as bibliotecas expõem; os nomes e valores exatos devem ser **confirmados na documentação das versões instaladas**):

| Tagger | Opção | Muda o resultado? | Para que serve |
|---|---|---|---|
| spaCy | Modelo (`sm`, `md`, `lg`, `trf`; outros idiomas têm os seus) | Sim | Precisão, velocidade, tamanho e download |
| spaCy | Componentes ativos (`tok2vec`, `tagger`, `attribute_ruler`, `lemmatizer`, `parser`, `ner`) | Sim | O que é extraído (lema, dependências, entidades); mais componentes, mais tempo |
| spaCy | Limite de tamanho de texto (`max_length`) | Não | Evita erro em textos muito longos |
| spaCy | Tamanho do lote (`batch_size`) e número de processos (`n_process`) | Não | Velocidade e uso de memória |
| spaCy | GPU | Não* | Velocidade, sobretudo com o modelo `trf` |
| Stanza | Idioma | Sim | Qual modelo carregar |
| Stanza | Pacote ou treebank (`package`, por exemplo `ewt`, `gum`) | Sim | Muda os modelos e, no caso do XPOS, o próprio conjunto de tags |
| Stanza | Processadores (`tokenize`, `mwt`, `pos`, `lemma`, `depparse`) | Sim | O que é extraído; mais processadores, mais tempo |
| Stanza | Texto já tokenizado (`tokenize_pretokenized`) e não dividir frases (`tokenize_no_ssplit`) | Sim | Respeitar uma tokenização ou segmentação prévia |
| Stanza | Tamanhos de lote (`tokenize_batch_size`, `pos_batch_size`) | Não | Velocidade e memória |
| Stanza | Dispositivo (CPU ou GPU) | Não* | Velocidade |
| Stanza | Pasta dos modelos e política de download | Não | Onde ficam os modelos, uso offline |
| BiberPlus | `n_processes`, `function_words`, usar spaCy (`usenlp`) | Só `function_words` e `usenlp` | Velocidade e conjunto de tags |
| MFTE | GPU, `extended`, pasta dos modelos | Só `extended` | Velocidade e conjunto de tags |

\* CPU e GPU podem dar diferenças numéricas mínimas; tratar como "não muda o resultado", mas registrar o dispositivo usado.

**Nova saída a considerar:** hoje o resultado guarda posições, palavra, etiqueta (`xpos`) e tags. Para o modelo de tokens da seção 9.4 (`lemma`, `upos`, `feats`), o tagger precisa poder extrair também **lema, morfologia e, opcionalmente, dependências**. Isso vira uma opção ("O que extrair") e um custo a explicar.

### 11.2 Como aparece na interface

1. **Primeiro, só a escolha do tagger.** O padrão de cada tagger já é razoável (ponto de partida: os valores atuais, como `en_core_web_sm` com `parser` e `ner` desligados).
2. **Botão "Personalizar"** abre o painel, com as opções em grupos: **Modelo e idioma**, **O que extrair**, **Desempenho**, **Avançado** (pastas, download).
3. **Cada opção mostra:** nome claro, valor atual e padrão, uma marca **"muda o resultado"** ou **"só muda a velocidade"**, uma explicação curta com balão (seção 13) e o impacto esperado em tempo, memória e download.
4. **Uma linha de resumo** da configuração ("spaCy · `en_core_web_lg` · com lemas") e o botão **"restaurar recomendado"**.
5. **Predefinições** ("Rápido", "Recomendado", "Mais preciso") que apenas preenchem as opções, e a pessoa pode salvar as suas.
6. **Combinações inválidas** ficam desativadas, com a razão explicada. Se o modelo escolhido não estiver instalado, o painel oferece baixá-lo, dizendo o tamanho.
7. A configuração usada fica registrada na camada e aparece na visão geral do corpus (seção 12), para saber como cada camada foi feita.

### 11.3 Pacote e linha de comando

Segue o princípio da seção 10:

- `ttwtools.taggers.options("spacy_upos")` devolve o descritor (as mesmas informações do painel).
- `ttwtools.taggers.run(tagger, corpus, options={...})`: todos os taggers passam a aceitar **um único dicionário de opções**, validado contra o descritor. Os parâmetros atuais (`spacy_model`, `use_gpu`, ...) continuam funcionando como atalhos, para não quebrar quem já usa.
- Linha de comando: `ttwtools tagger-options spacy_upos` (tabela com as explicações) e `ttwtools tag meu_corpus --tagger spacy_upos --set spacy_model=en_core_web_lg --preset preciso`.
- API do aplicativo: `GET /api/taggers/{id}/options` para o painel e `POST /api/tagging/run` com um campo `options`, no lugar dos campos soltos de hoje.
- O botão "copiar como código" da GUI (seção 15.2, item 10) gera exatamente esse comando.

### 11.4 Ligação com o cache de camadas (seção 9)

As opções entram no `config_hash` de cada camada, e a regra é:

- **Só as opções que mudam o resultado** compõem o `config_hash`, já com os valores padrão escritos por extenso e com a versão do modelo. Opções de desempenho (lote, processos, dispositivo) ficam **fora**: mudar o tamanho do lote não invalida uma camada já feita.
- **Uma camada existente atende um pedido** se contém tudo o que foi pedido: mesmo modelo ou pacote e os mesmos componentes ou mais. Uma camada com POS e lema atende um pedido só de POS. O contrário não, e nesse caso o app avisa que precisa reprocessar e quanto isso custa.
- A tabela `layers` guarda a **configuração efetiva completa** (JSON) e as versões (spaCy, modelo, Stanza), para reproduzir depois.

### 11.5 Pontos a confirmar

- A lista exata e os nomes das opções nas versões instaladas de spaCy e de Stanza (a tabela acima vem do que as bibliotecas costumam expor, e não foi testada aqui).
- Quais opções do Stanza dependem de um pacote ou treebank existir para o idioma.
- Que modelos existem por idioma (em especial para o português).
- Onde ficam os modelos baixados e como o aplicativo os baixa e usa offline.
- Qual é o padrão recomendado de cada tagger, a decidir depois de medir tempo e qualidade em corpora reais.

## 12. Estatísticas descritivas do corpus

Como etiquetar demora, a descrição do corpus tem dois níveis, e o primeiro não depende de tagger.

### 12.1 Antes do etiquetamento (só a partir do texto)

Rápido, roda ao abrir o corpus:

- número de arquivos;
- número de palavras (tokens), de formas distintas (types) e de hapax legomena;
- razão type/token e uma versão padronizada (por blocos de tamanho fixo), porque a razão simples depende do tamanho do texto;
- comprimento médio de palavra;
- tamanho dos documentos: mínimo, mediana, máximo e desvio-padrão, com histograma;
- número aproximado de frases (regra simples de pontuação);
- palavras mais frequentes (com opção de ocultar palavras funcionais) e curva de Zipf.

Observação: a tokenização simples usada aqui pode diferir da de um tagger, então os números são estimativas e a tela deve dizer isso. Depois do etiquetamento, o app passa a mostrar os valores da camada escolhida.

### 12.2 Depois do etiquetamento (a partir de uma camada)

- distribuição das classes gramaticais (UPOS ou PTB, conforme o tagger);
- densidade lexical (proporção de palavras de conteúdo);
- lemas mais frequentes, por classe gramatical;
- comprimento médio de frase, agora com a segmentação do tagger;
- média e desvio-padrão por documento das principais tags, mostrando quanto o corpus é homogêneo.

**Pacote:** `ttwtools.describe(corpus)` devolve as estatísticas de 12.1. `ttwtools.describe(corpus, layer=...)` acrescenta as de 12.2. Retorna dicionário ou tabela e o resultado é salvo em `analyses` (seção 9.4), então não é recalculado sem necessidade. Linha de comando: `ttwtools describe pasta_do_corpus`.

**GUI:** uma tela de "Visão geral do corpus" logo depois de abrir um corpus, com números grandes no topo e gráficos abaixo. Antes do etiquetamento mostra só o nível 12.1, com um convite discreto a etiquetar para ver mais.

## 13. Ajuda e explicações no aplicativo

A ferramenta precisa explicar recursos e métricas de forma acessível e visual, e o conteúdo precisa poder ser incluído e editado sem mexer no código da interface.

### 13.1 Peças

1. **Balões de ajuda:** um ícone "?" ao lado de cada métrica ou controle abre um balão curto (uma ou duas frases, um pequeno visual e um link "saiba mais"). Serve para o dia a dia, sem tirar a pessoa da tela.
2. **Tour guiado com destaque (overlay):** uma sequência de passos que escurece a tela e destaca um elemento real por vez, com um balão ao lado. Existe para as primeiras vezes ou quando a pessoa pede.
3. **"Explicar esta tela":** um botão que sobrepõe anotações sobre a tela atual, apontando cada área (por exemplo "este gráfico mostra...", "aqui você escolhe o tagger"). Como usa a própria tela, funciona com os dados do corpus da pessoa.
4. **Explicações visuais interativas:** para métricas mais abstratas, um pequeno painel animado. Exemplos: o d de Cohen com duas distribuições sobrepostas e um controle que afasta ou aproxima as médias; a normalização por 1000 palavras com dois textos de tamanhos diferentes; o KWIC destacando a palavra e o contexto.
5. **Exemplo vivo com dados de verdade:** sempre que possível, o exemplo usa o corpus aberto da pessoa; se não houver, usa um corpus minúsculo embutido só para ilustrar.
6. **"Como ler" e "cuidados":** cada gráfico ou métrica ganha um trecho curto de interpretação e de limites (por exemplo, d de Cohen com poucos textos é instável).
7. **Glossário pesquisável**, ligado aos balões.

### 13.2 Como incluir conteúdo

Separar o conteúdo do código, em arquivos por idioma:

```
help/
  pt/
    metricas/cohens_d.md
    telas/kwic.md
  en/
    ...
  tours/
    primeiro_corpus.json      # lista de passos
```

Um passo de tour seria algo como:

```json
{"alvo": "#botao-tagger", "titulo": "Escolha o tagger", "texto_ref": "telas/tagger", "posicao": "direita"}
```

- `alvo` é o elemento da tela a destacar (um identificador estável, não uma posição).
- O texto vem de um arquivo de ajuda, então o mesmo texto serve ao balão, ao tour e à linha de comando.
- Novos tópicos entram só criando um arquivo `.md` e, se quiser, um passo no JSON do tour.

**Pacote:** `ttwtools.help.get("cohens_d", lang="pt")` devolve o texto, e `ttwtools help cohens_d` o mostra no terminal. Assim o `--help` e as docstrings usam a mesma fonte.

**GUI:** os balões, o tour e o "explicar esta tela" leem esses mesmos arquivos.

### 13.3 Bibliotecas possíveis para o destaque e os balões

Para o overlay e os passos guiados, existem bibliotecas prontas em JavaScript (por exemplo Driver.js e Shepherd.js), e para os balões, Floating UI ou Tippy.js. **É preciso conferir as licenças antes de adotar**: pelo que sei, Driver.js e Shepherd.js são MIT, mas Intro.js é AGPL (com licença comercial), o que seria um problema para uma ferramenta livre distribuída em executável. Também vale avaliar escrever um overlay próprio, que é simples com D3 e CSS.

### 13.4 Acessibilidade

- navegação por teclado (abrir e fechar balões, avançar no tour);
- compatibilidade com leitores de tela;
- nunca depender só de cor nos visuais;
- texto alternativo em cada figura explicativa;
- tradução completa dos textos de ajuda, junto com o resto da interface (item 6 da seção 5).

## 14. Comparação de N corpora ou subgrupos (experimental)

A KFA compara dois corpora. A ideia aqui é comparar **N grupos**, onde um grupo pode ser um corpus inteiro, um subconjunto de um corpus (por pasta, por padrão no nome do arquivo ou por metadado) ou uma seleção manual de textos. Fica marcado como **experimental**, numa área separada da interface (por exemplo "Laboratório"), com aviso de que os métodos ainda estão em avaliação.

### 14.1 Base comum

Toda comparação parte da mesma matriz: **textos × features** (contagem normalizada por 1000 palavras), mais a associação de cada texto a um grupo. Isso já existe nas `feature_tables`. Falta apenas saber a que grupo cada texto pertence, o que pede uma tabela de **metadados por documento** (chave e valor, incluindo o que vier de um CSV que a pessoa carregue). Isso precisa entrar em `documents` (seção 9.4).

### 14.2 Possibilidades (da mais simples à mais especulativa)

1. **KFA de um grupo contra todos os demais.** Generaliza a KFA de forma direta e é fácil de explicar: para cada grupo, quais features o distinguem do resto. Bom ponto de partida.
2. **KFA par a par (matriz N×N).** Cada par de grupos recebe seu conjunto de features-chave, e um mapa de calor resume quais grupos são mais próximos ou mais distantes.
3. **Features que variam entre os grupos.** Teste global (ANOVA ou Kruskal-Wallis) com tamanho de efeito (eta² ou epsilon²) para achar as features em que o grupo importa, e comparações par a par só nelas.
4. **Espaço de perfis.** PCA, análise fatorial ou outra redução dimensional sobre as features, com cada texto como um ponto colorido pelo grupo e elipses por grupo. O app já tem um endpoint de redução (`/api/viz/reduction`) que pode ser reaproveitado. Tem afinidade com a Análise Multidimensional.
5. **Agrupamento hierárquico.** Dendrograma de grupos (ou de textos) pela semelhança dos perfis, mostrando quem se parece com quem, inclusive se os grupos previstos se confirmam.
6. **Grupos ordenados (gradientes).** Quando os grupos têm uma ordem natural (níveis de proficiência, décadas, séries), procurar features que crescem ou diminuem ao longo dela (correlação de Spearman).
7. **Quais features separam os grupos.** Um classificador simples (regressão logística ou floresta aleatória) e a importância das features. Serve de complemento, mas exige cuidado para não se tomar importância preditiva por diferença linguística.
8. **Palavras-chave em N grupos.** Os mesmos métodos de 1 e 2, mas sobre palavras ou lemas (log-likelihood, log ratio), e não só sobre tags.
9. **Meu texto contra vários corpora de referência.** A pessoa carrega um ou poucos textos e o app mostra de qual dos N grupos o perfil dele mais se aproxima e em quais features. Tem grande apelo para o ensino e para o data-driven learning, por exemplo comparar um texto de aluno com Brown, LOB e OANC.
10. **Composição interna.** Tratar um corpus como coleção de subgrupos (por autor, por seção, por ano) e ver como eles se distribuem no espaço de perfis.

### 14.3 Cuidados metodológicos (a explicar na própria interface)

- comparações múltiplas: com muitas features e muitos pares, é preciso corrigir os p-valores (Bonferroni ou FDR) ou apresentar só tamanhos de efeito;
- grupos de tamanhos muito diferentes: a variante `kfa2` já trata disso para dois grupos, e o mesmo cuidado vale para N;
- poucos documentos por grupo deixam qualquer estimativa instável, e a tela deve avisar;
- descrever o que é resultado exploratório e o que é evidência.

### 14.4 Sugestão de ordem

Começar por 1 (um contra todos), 2 (par a par) e 9 (meu texto contra referências), porque reaproveitam o que já existe e cobrem os dois públicos. Depois 4 e 5 para visualização, e o restante conforme o interesse de pesquisa.

**Pacote:** `ttwtools.experimental.compare_groups(...)`, com o método como parâmetro. Como o módulo é experimental, a API pode mudar e isso vai declarado na documentação. Linha de comando: `ttwtools compare --groups ...`.

**GUI:** aba "Laboratório", com aviso de experimental, escolha dos grupos (por pasta, metadado ou seleção manual) e do método, sempre com balão explicando o método (seção 13).

## 15. Inspiração: funcionalidades do OCTOBOX

Fonte: o aplicativo web OCTOBOX (`timmarchand-octobox.share.connect.posit.cloud`), de Tim Marchand, um conjunto de ferramentas em R/Shiny para linguística de corpus. O inventário abaixo vem de uma leitura automática da página, e não do código, então convém abrir o aplicativo para confirmar os detalhes. Serve só como fonte de ideias, sem reaproveitar código nem dados (a licença de cada componente precisaria ser conferida).

### 15.1 O que o OCTOBOX oferece

| Área | O que faz |
|---|---|
| Entrada | CSV com colunas de metadados; texto colado; vários arquivos; grupos (metadados) atribuídos à mão ou extraídos do nome do arquivo por um delimitador; filtro por grupo |
| Tokenização | Opções: remover pontuação, remover números, minúsculas, tratamento de contrações; resultado guardado em cache; saída em CSV ou TXT |
| Visão geral | Estatísticas por texto e por grupo; razão type/token (TTR) e TTR sobre amostra de 400 palavras; o pacote de exemplos traz também CTTR e MATTR |
| Frequência | N-gramas de tamanho ajustável; por texto, por grupo ou corpus inteiro; unidade: forma, lema, palavra+POS, só POS, lema+POS; faixas de frequência lexical (1k a 10k); listas de stopwords por idioma (inglês, espanhol, francês, alemão, italiano, japonês, chinês) e personalizadas; gráficos por grupo |
| Classes gramaticais | Distribuição por UPOS ou XPOS (Penn Treebank), com categorias simplificadas (15 classes) e guia de referência das tags |
| Dispersão | Medidas DP de Gries e Range; gráfico de "código de barras" mostrando onde o termo aparece em cada texto; termo pode ser palavra, frase ou regex |
| Palavras-chave | Log-odds de um grupo-alvo contra um de referência; sobre n-gramas de formas, lemas, tags ou combinações; direção do gráfico (ambos, só alvo, só referência) |
| KWIC e colocações | Busca por regex, janela ajustável, contagem de padrões por posição (esquerda, direita, ±1); colocações por log-likelihood, informação mútua, T-score e frequência bruta, com posição e frequência mínima |
| Etiquetagem | Modelo UDPipe (cerca de 15,6 MB), saída em linha, vertical ou tabela; recomenda cerca de 20 mil palavras por vez |
| Exemplos | Dois romances (Alice e A Guerra dos Mundos, cerca de 86 mil palavras, 39 textos) e debates eleitorais dos EUA (2000 a 2024) com metadados |
| Exportação | CSV, TXT, PNG e scripts em R independentes (MIT) para reproduzir cada análise |
| Relacionadas | MDA Tagger (Análise Multidimensional) e links para AntConc, #LancsBox e Sketch Engine |

### 15.2 O que vale trazer para o TTWtools

Sem repetir o que já está no desenho (KWIC, colocações, frequência):

1. **Dispersão (DP de Gries, Range) e gráfico de código de barras.** Mostra se uma palavra está espalhada pelo corpus ou concentrada em poucos textos. Serve muito ao ensino (evita destacar como "frequente" uma palavra de um só texto) e é uma boa forma de filtrar palavras-chave. Não estava no desenho.
2. **Metadados por documento.** Carregar um CSV com colunas de metadados e extrair grupos do nome do arquivo por delimitador. Confirma a tabela `document_meta` já proposta na seção 14.1 e serve para todas as comparações e filtros.
3. **Mais medidas de riqueza lexical.** TTR sobre amostra, CTTR e MATTR, além da razão simples (seção 12.1).
4. **Unidade de análise escolhível.** Forma, lema, palavra+classe, só classe, lema+classe, em toda ferramenta de frequência, dispersão e palavras-chave. No nosso modelo isso é escolher a camada e a coluna de `tokens`.
5. **Categorias simplificadas entre taggers.** Um mapeamento das classes de cada tagger (PTB, UPOS, Biber) para umas 15 classes comuns, para poder comparar resultados de taggers diferentes e para explicar a um iniciante. Encaixa no dicionário de tags (seção 11).
6. **Faixas de frequência lexical.** Mostrar quanto do vocabulário do corpus está nas 1.000, 2.000, ... palavras mais comuns da língua. Pode ser derivado dos corpora de referência da seção 16, sem depender de listas externas.
7. **Stopwords por idioma e listas personalizadas** (acrescentar ou substituir), com opção de tratar contrações.
8. **Tokenização configurável** (pontuação, números, maiúsculas, contrações), com o resultado guardado. No nosso modelo isso entra na configuração da camada de tokens, dentro de `config_hash` (seção 9.4).
9. **Corpora de demonstração pequenos, com metadados,** embutidos no instalador (por exemplo romances em domínio público). Servem de exemplo vivo para o tour e para os balões (seção 13).
10. **"Exportar como código".** Cada análise da GUI oferece copiar ou baixar o comando de linha de comando ou o script Python que a reproduz. É a versão do princípio da seção 10 para o usuário: a GUI mostra como fazer o mesmo por código.
11. **Exportação em CSV, TXT e imagem (PNG e SVG)** de qualquer tabela ou gráfico.

O que não copiar: o limite de cerca de 20 mil palavras por etiquetagem e o carregamento lento do modelo a cada uso. O índice de tokens e as camadas salvas (seção 9) existem justamente para evitar isso.

## 16. Corpus de referência e análise de palavras-chave

A pessoa escolhe um corpus dela (ou um embutido) como **alvo** e um corpus de referência **entre os embutidos** (ou outro dela) para achar o que é característico do alvo.

### 16.1 Como funciona

1. Escolher o corpus-alvo.
2. Escolher a referência: um corpus do catálogo (Brown, LOB, OANC, ...), outro corpus da pessoa, ou "os demais grupos do mesmo corpus" (um contra o resto, ligando com a seção 14).
3. Escolher a unidade: forma, lema, classe gramatical, palavra+classe, n-grama, ou as tags de Biber (neste caso o método natural é a KFA, e não a análise de palavras-chave).
4. Escolher a medida e os filtros e ver a lista, do mais característico do alvo ao mais característico da referência.

### 16.2 Medidas

- **Log-likelihood (G²):** mede a evidência estatística da diferença. Sozinho, favorece palavras muito frequentes.
- **Log ratio:** mede o tamanho da diferença (quantas vezes a palavra é mais frequente no alvo).
- **Diferença percentual (%DIFF)** e **log-odds**, esta última usada também no OCTOBOX.
- **Filtros:** frequência mínima, número mínimo de textos em que aparece (dispersão, ver seção 15.2 item 1) e correção para comparações múltiplas.

A tela deve mostrar evidência estatística e tamanho de efeito lado a lado, com balão explicando a diferença (seção 13), e alertar quando o alvo ou a referência é muito pequeno.

### 16.3 O que o catálogo de referência precisa registrar

Para uma referência ser uma escolha justificável, cada corpus do catálogo traz uma ficha:

- idioma e variedade (por exemplo inglês britânico ou americano);
- período e gêneros cobertos;
- tamanho (arquivos e palavras);
- licença e fonte;
- camadas disponíveis (tokenização, lemas, classes) e **qual tagger e versão** as produziu;
- se está disponível o corpus completo ou só a lista de frequências.

### 16.4 Comparabilidade

- O alvo e a referência devem ter sido tokenizados e lematizados **do mesmo modo**. Se o alvo foi etiquetado com um tagger e a referência com outro, os lemas e as classes podem não ser comparáveis. O app deve avisar, e oferecer usar só formas (que dependem apenas da tokenização) ou etiquetar o alvo com o mesmo tagger da referência.
- O idioma tem que coincidir, e o app deve bloquear ou avisar quando não coincidir.
- A referência deve ser adequada ao que se quer descobrir. Uma referência de língua geral mostra o que é próprio de um gênero ou tema. Uma referência do mesmo gênero mostra diferenças mais finas.

### 16.5 Listas de frequência de referência (versão leve)

Para palavras-chave sobre formas, lemas ou classes, não é preciso carregar o corpus de referência inteiro: bastam as **frequências agregadas** (e, para o filtro de dispersão, o número de textos em que cada item aparece). Cada referência do catálogo pode ser distribuída de duas maneiras:

- **lista de frequências:** pacote pequeno, suficiente para palavras-chave e faixas de frequência lexical;
- **corpus completo indexado:** para quem quer KWIC, colocações e outras análises sobre ele.

Isso reduz o tamanho do download e dispensa processamento pesado. A licença das listas derivadas pode ser diferente da dos textos, e precisa ser conferida corpus a corpus.

### 16.6 Quais corpora servem de referência

- **Inglês:** Brown e LOB (variedades americana e britânica, meados do século XX), OANC/MASC (americano contemporâneo), BNC se a licença permitir. As anotações atuais de `corporainternos/corporainternos.md` já apontam nessa direção.
- **Português:** falta um corpus de língua geral com licença clara. Tycho Brahe é histórico, então serve para referência histórica, mas não geral. O Corpus Brasileiro e o UD português são candidatos, com licenças a confirmar.
- **Outros idiomas:** Universal Dependencies e Wikipedia (CC BY-SA) dão referências mínimas em muitas línguas.

### 16.7 Pacote, linha de comando e GUI

- **Pacote:** `ttwtools.keywords(target, reference, unit="lemma", measure="log_ratio", min_freq=5, min_range=3)`. Devolve tabela e é salvo em `analyses`, guardando o identificador e a versão da referência usada.
- **Linha de comando:** `ttwtools keywords --target meu_corpus --reference brown --unit lemma`.
- **GUI:** aba "Palavras-chave", com seletor de referência que já mostra a ficha do corpus (16.3) e avisos de comparabilidade (16.4); a tabela leva de volta ao KWIC ao clicar em uma palavra.

### 16.8 Relação com a KFA e com a seção 14

A KFA compara **features gramaticais por texto** (d de Cohen). A análise de palavras-chave compara **itens lexicais** entre corpora. São complementares, e as duas podem usar o mesmo seletor de alvo e de referência. A seção 14 (N grupos) generaliza a escolha da referência para vários grupos.

## 17. Projeto da interface gráfica

A interface precisa funcionar bem em computador (aplicativo ou site) e em celular, quando acessada pela web, e ser compreensível sem perfis de usuário (seção 5). Esta seção parte de uma revisão da interface atual e propõe uma organização nova.

### 17.1 Diagnóstico da interface atual

Levantado a partir de `frontend-src/` e de `app/`:

**Estrutura**
- Um único `index.html` de cerca de 1.250 linhas com todas as telas como `<section class="view">`, ligadas por JavaScript puro (12 módulos em `src/views/`; com o HTML e o CSS, o frontend soma cerca de 8.000 linhas).
- Bibliotecas: Vite, Tailwind 4 com DaisyUI 5, Shoelace, D3, Plotly, Lucide, paged.js e rough-notation.
- Estado global em `state.js`, quase todo voltado à KFA (`kfaC1`, `kfaC2`, `kfaData`, escolhas dos gráficos).

**Navegação**
- Barra de menu no estilo de programa de computador, com um único menu "Arquivo", mais uma barra lateral fixa com três botões: Tagging, KFA e Resultados.
- Organização por **etapas de um pipeline** (etiquetar, calcular a KFA, ver resultados), e não por tarefas do usuário.
- A tela inicial tem dois cartões ("Nova análise" e "Abrir projeto") e o subtítulo "Análise de features linguísticas Biber", coerente com o desenho antigo, centrado na KFA.
- "Nova análise" é um fluxo de 4 etapas que sempre pede **duas** pastas de corpus.
- A tela de Resultados tem abas e sub-abas (comparação, corpus individual, redução; gráficos de barras, dispersão, bolhas, faixas, mapa de calor, radar, violino, PCA, t-SNE...). Isso funciona para quem já domina a KFA, mas é denso para quem chega agora.

**Uso em telas pequenas**
- Só há uma regra `@media print` no CSS, e o único ponto realmente responsivo é a grade da tela inicial. Não há pontos de quebra para celular.
- A barra lateral é fixa e o corpo usa `h-screen overflow-hidden`, com painéis laterais e uma alça de arrastar (`#tv-resize-handle`) que depende de mouse.
- O visualizador de texto mostra definições de tags ao passar o mouse, o que não existe em tela de toque.

**Entrada de arquivos**
- As pastas são escolhidas por um diálogo **do sistema operacional, aberto pelo servidor** (`/api/.../pick-folder` usa `osascript` no macOS e `tkinter` nos demais). Isso só funciona quando o servidor e a pessoa estão na mesma máquina, isto é, no aplicativo. **No modo web (e, portanto, no celular), a escolha de pasta não funciona**: a pessoa precisa enviar arquivos pelo navegador.

**Pontos que já ajudam**
- O etiquetamento já roda como tarefa em segundo plano, com consulta de progresso (`POST /run` e `GET /status/{job_id}`). Esse padrão serve a todas as tarefas demoradas.
- O servidor já é uma API separada (FastAPI, com documentação em `/api/docs`) e a interface web já existe, então o mesmo código serve ao aplicativo e ao site.
- Os módulos de gráficos em D3 (`chart.js`, `viz-*.js`) podem ser reaproveitados.
- Os temas claro e escuro já existem.

**Lacunas**
- Sem tradução: todos os textos estão escritos no HTML, em português.
- Acessibilidade: praticamente sem atributos ARIA (uma única linha com `role` em todo o `index.html`).
- O tema muda automaticamente por horário (claro entre 8h e 18h), em vez de seguir a preferência do sistema.
- Nada de ajuda integrada além de alguns `title`.

### 17.2 Princípios

1. **Organizar por tarefa, não por etapa.** A pessoa pensa "quero ver como esta palavra é usada", não "vou rodar a etapa 3".
2. **Sempre um corpus ativo.** Um contexto visível (corpus e camada de etiquetas ativos) que todas as ferramentas usam, para não escolher tudo de novo a cada tela.
3. **Interface única, com detalhe sob demanda** (seção 5): o essencial à vista e as opções avançadas em painéis recolhíveis dentro da própria tela, e nunca em modos ou perfis.
4. **Funciona antes de etiquetar.** O que não depende de tagger (visão geral, frequência simples, KWIC de formas) fica disponível logo após importar.
5. **Mesmo desenho em qualquer tela.** O que muda é o arranjo, não o que a ferramenta faz. Se algo não cabe no celular, a tela diz isso, e não some em silêncio.
6. **Explicar onde a dúvida aparece** (seção 13): balões, tour e "explicar esta tela" fazem parte da interface, não são um manual à parte.
7. **Paridade com o pacote** (seção 10): cada tela mostra "copiar como código" para reproduzir o que foi feito.

### 17.3 Nova organização das telas

Cinco destinos principais, mais o projeto e as configurações.

| Destino | Para quê | Absorve da interface atual |
|---|---|---|
| **Início** | Continuar de onde parou, escolher um corpus embutido, abrir um projeto | Tela inicial |
| **Corpora** | Biblioteca com corpora embutidos e os da pessoa; importar; visão geral (seção 12); etiquetar e ver camadas | "Nova análise" (etapas de importação e etiquetamento) e "Tagging" |
| **Explorar** | Busca de palavra, KWIC, frequência, colocados, dispersão e leitor de texto com etiquetas | Visualizador de texto; aba "Corpus individual" |
| **Comparar** | Palavras-chave contra referência (seção 16), KFA, N grupos (seção 14, marcado como experimental) | "KFA" e "Resultados" |
| **Aprender** | Glossário, tours, exemplos, descrição das métricas (seção 13) | Novo |
| **Projeto e configurações** (menu) | Abrir, salvar, exportar; idioma da interface; tema; sobre | Menu "Arquivo" |

**Corpus ativo:** uma faixa fixa no topo mostra "Corpus: Brown · Camada: spaCy (PTB) ▾", e trocar corpus ou camada é um toque. As telas de Explorar e Comparar usam esse contexto, e ao comparar o corpus ativo vira o alvo.

**Fluxo de entrada:** o assistente de "Nova análise" vira "Corpora › Adicionar corpus", em poucas etapas e sem exigir dois corpora: 1) de onde vem (pasta, envio de arquivos, catálogo, texto colado); 2) metadados e grupos (seção 15.2, item 2); 3) o que fazer agora (só ver a visão geral, ou etiquetar escolhendo o tagger, com o painel de tags da seção 11).

**Aba "Resultados" atual:** as abas e sub-abas viram uma galeria de visualizações dentro de cada análise, com um seletor visível (nome e miniatura) em vez de sub-abas empilhadas. O que serve a um corpus só migra para Explorar ou para a visão geral; o que compara migra para Comparar.

### 17.4 Layout responsivo

Três faixas de largura. A navegação e os painéis mudam de forma, e o conteúdo é o mesmo.

| Largura | Navegação | Painéis laterais | Tabelas |
|---|---|---|---|
| **Celular** (até cerca de 640 px) | Barra inferior com 4 ícones (Corpora, Explorar, Comparar, Aprender); Início e Projeto no topo | Viram gavetas que sobem de baixo (bottom sheet) | Viram lista de cartões, ou tabela com rolagem lateral e colunas prioritárias fixas |
| **Tablet** (cerca de 640 a 1024 px) | Trilho lateral só com ícones | Gaveta lateral | Tabela completa, com menos colunas |
| **Computador** (acima disso) | Barra lateral com ícones e rótulos | Ao lado do conteúdo, com alça de largura | Tabela completa |

Regras gerais:
- Alvos de toque de pelo menos 44 px e nenhuma função que dependa de passar o mouse: tooltips e definições de tags também abrem ao tocar ou pelo teclado.
- A alça de redimensionamento do visualizador de texto some em telas pequenas, e o painel de tags vira gaveta.
- Gráficos: no celular, versões simplificadas (barras horizontais dos N principais, legenda abaixo, sem 3D). Os gráficos 3D e o t-SNE/UMAP interativo ficam para telas maiores, com aviso, ou uma imagem estática.
- Toda visualização tem o botão "ver como tabela", que serve também à acessibilidade.
- Tema: claro, escuro e alto contraste, seguindo a preferência do sistema por padrão.
- Prever **PWA** (o site "instalável" no celular), o que dá ícone na tela inicial e uso offline básico, se fizer sentido (seção 17.9).

Esboço da navegação:

```
Computador                                   Celular
┌──────┬───────────────────────────┐         ┌───────────────────────┐
│ ≡ TTW│ Brown · spaCy(PTB) ▾   ⚙  │         │ Brown · spaCy(PTB) ▾ ⚙│
├──────┼───────────────────────────┤         ├───────────────────────┤
│Corpor│                           │         │                       │
│Explor│   conteúdo da tela        │         │   conteúdo da tela    │
│Compar│                           │         │   (uma coluna)        │
│Aprend│   [painel opções ▸]       │         │   [opções ▲ gaveta]   │
└──────┴───────────────────────────┘         ├───────────────────────┤
                                             │ Corp │ Expl │ Comp │ ? │
                                             └───────────────────────┘
```

Esboço de uma linha de KWIC:

```
Computador: … the  [ RUN ]  of the…  | VERB | arquivo.txt · frase completa ▸
Celular:    ┌─────────────────────────┐
            │ …the [RUN] of the…      │
            │ VERB · arquivo.txt   ▸  │  ← toque abre contexto (gaveta)
            └─────────────────────────┘
```

### 17.5 Onde o app roda e o que isso muda

**Fase atual: só o aplicativo local** (primeira linha da tabela abaixo). As outras duas linhas e as consequências 2 a 6 valem para a fase web, que fica adiada. A ideia da fonte de corpus abstrata (consequência 1) já vale agora, com as origens pasta local, catálogo embutido e texto colado; o envio de arquivos pelo navegador entra na fase web.

Três modos de uso com o mesmo código:

| Modo | Arquivos | Etiquetamento |
|---|---|---|
| **Aplicativo** (janela nativa) | Diálogo do sistema, pastas locais | Na própria máquina |
| **Site local** (servidor na própria máquina, aberto no navegador) | Igual ao aplicativo | Na própria máquina |
| **Site remoto** (servidor hospedado; inclui celular) | **Envio de arquivos pelo navegador** | No servidor, com fila e progresso |

Consequências:

1. **Abstrair a fonte do corpus.** Em vez de "caminho de pasta no servidor", uma fonte de corpus com quatro origens: pasta local, arquivos enviados (`.txt`, `.zip`, CSV com metadados), catálogo embutido e texto colado. A função do pacote continua recebendo caminhos, e a camada de importação da API converte envios em pasta temporária.
2. **No celular** não existe escolher pasta: o envio é de arquivos ou de um `.zip`. O uso mais natural ali é **explorar corpora embutidos e resultados prontos** (visão geral, KWIC, palavras-chave, ajuda). Etiquetar corpora grandes é desencorajado por aviso.
3. **Privacidade:** no site remoto, os textos enviados passam pelo servidor. É preciso definir e dizer claramente se ficam guardados, por quanto tempo e como apagar (seção 17.9).
4. **Tarefas longas:** usar o mesmo padrão de tarefa em segundo plano com progresso que o etiquetamento já usa, para importação, etiquetamento, referências e comparações, sempre retomáveis (as camadas já feitas não se perdem, seção 9).
5. **Tamanho:** tabelas grandes (KWIC com milhares de linhas) precisam de **paginação ou rolagem virtual feita no servidor**, e não de envio do resultado inteiro ao celular.
6. Uma versão que rode **inteira no navegador** (sem servidor) é possível só para o núcleo leve (frequência e KWIC sobre corpora pequenos); spaCy e Stanza não rodam assim. Fica como possibilidade futura.

### 17.6 Arquitetura do frontend

Problemas a resolver, à luz de 17.1: HTML único e enorme, estado global, textos fixos no código, sem roteamento e pouca acessibilidade.

Peças propostas, independentes da escolha de biblioteca:

1. **Casca (shell) única:** cabeçalho com corpus ativo, navegação responsiva e área de conteúdo. As telas entram nela como módulos.
2. **Roteamento por URL** (por exemplo `#/explorar/kwic`): o botão "voltar" do celular e do navegador funciona, e dá para compartilhar o link de uma tela e restaurar a última.
3. **Telas em componentes,** cada uma com seu HTML, estilo e lógica juntos, em vez de um `index.html` gigante.
4. **Estado por área,** e não um objeto global centrado na KFA: corpus ativo, camada ativa, resultados de cada análise. Tudo o que for reproduzível fica no projeto (`analyses`), e o que é só de tela (aba aberta, filtro) fica local.
5. **Tradução (i18n):** todos os textos por chave, em `locales/pt.json`, `en.json`, etc. (seção 5, item 6), e a ajuda em `help/` (seção 13).
6. **Camada de API única:** um cliente que fala com as rotas finas do pacote, com tarefas em segundo plano e paginação já resolvidas.
7. **Acessibilidade desde o início:** meta WCAG 2.2 nível AA, com rótulos ARIA, foco visível, navegação por teclado, contraste, paletas seguras para daltonismo nos gráficos, alternativa em tabela para cada gráfico e respeito a `prefers-reduced-motion`.
8. **Desempenho:** tabelas virtualizadas, carregamento sob demanda dos gráficos (o Plotly, usado para 3D e PCA, é pesado e só deve carregar quando necessário) e cache.
9. **Testes de interface** nos fluxos principais, em três larguras (por exemplo 390, 768 e 1280 px), com Playwright.

**Escolha da tecnologia** (decisão em aberto, ver 17.9). Três caminhos:

| Caminho | Prós | Contras |
|---|---|---|
| A. Manter JavaScript puro e componentizar com Web Components (Shoelace já está instalado) | Menor mudança; reaproveita quase tudo | Roteamento, estado e traduções ficam por conta própria; mais repetitivo |
| B. Adotar um framework leve de componentes (Svelte ou Vue) sobre o Vite atual | Componentes, estado reativo e roteamento prontos; mantém Vite, Tailwind, DaisyUI e D3 | Reescrever as telas, mas com o código de gráficos reaproveitado |
| C. Reescrita completa | Liberdade total | Maior custo e risco |

**Decidido: caminho B, com Vue 3** (sobre o Vite atual). Vue traz componentes, estado reativo e roteamento prontos, e o código de gráficos em D3 continua aproveitável.

**Vue mais leve** (o site remoto e o celular pedem isso):

- Vue 3 com a Composition API e `<script setup>`; Vue Router para as URLs; estado em Pinia ou em funções reutilizáveis (composables); `vue-i18n` para as traduções.
- **Carregar cada tela sob demanda:** só o código da tela aberta é baixado, e a primeira tela fica pequena. Sugestão de meta: primeira tela abaixo de cerca de 200 KB comprimidos, a ser verificada com o resultado real do `vite build`.
- **Enxugar as bibliotecas atuais:**
  - Manter Tailwind com DaisyUI (é praticamente só CSS) e **tirar o Shoelace**, para não ter dois conjuntos de componentes.
  - **Plotly só sob demanda** (é grande, e serve principalmente ao 3D e à redução dimensional), ou substituí-lo por D3 nos gráficos simples.
  - Importar do Lucide só os ícones usados; carregar o paged.js só no leitor paginado; fontes servidas pelo próprio site.
- Para menus, janelas e gavetas acessíveis, usar uma biblioteca de componentes sem estilo (por exemplo Headless UI ou Reka UI; confirmar disponibilidade e licença atuais), em vez de reescrever o comportamento de teclado e foco.
- A interface é só uma camada: tudo o que for pesado fica no servidor (seção 17.5), então o navegador do celular só apresenta.

### 17.7 Como a ajuda e as explicações entram na interface

Reaproveita a seção 13:
- o **corpus ativo** e a **navegação** ganham balões na primeira vez;
- em cada tela, o botão "explicar esta tela" e o ícone "?" ao lado das métricas;
- no celular, balões e tours aparecem como gavetas ou cartões fixos, sem depender de passar o mouse;
- o destino **Aprender** reúne glossário, tours e exemplos com os corpora de demonstração.

O rough-notation, já instalado, serve para os destaques manuscritos do "explicar esta tela".

### 17.8 Ordem de trabalho da interface

Na fase atual (aplicativo local), sem envio de arquivos, PWA nem ajuste fino para celular:

1. **Decisões** (17.9), e **protótipos de baixa fidelidade** das telas principais, para revisar antes de programar. Os protótipos ainda consideram as três larguras, para a estrutura já nascer adaptável.
2. **Casca responsiva:** navegação, roteamento, tema, tradução e faixa do corpus ativo, com as telas atuais encaixadas para nada quebrar.
3. **Corpora:** biblioteca, importação por envio de arquivos e pelo catálogo, visão geral (seção 12).
4. **Explorar:** busca de palavra, KWIC, frequência, colocados, dispersão, leitor de texto.
5. **Comparar:** migrar a KFA e os Resultados atuais, depois palavras-chave contra referência (seção 16).
6. **Ajuda:** balões, tours e "explicar esta tela", depois glossário.
7. **Laboratório** (N grupos, seção 14).

Cada etapa segue o princípio da seção 10: função no pacote, rota fina, tela por último.

### 17.9 Decisões em aberto

Decididos:

- **Tecnologia do frontend:** Vue 3, o mais leve possível (17.6).
- **Fase atual:** aplicativo local, tudo rodando na máquina da pessoa (seção 2).
- **Fase web (adiada):** se vier, o site poderá rodar remotamente, com o máximo de recursos possível no celular e no computador, o peso do processamento no servidor (17.5) e **sem guardar nada** dos textos (seção 18).

Adiados até a fase web:

- **PWA:** explicação e recomendação em 17.10.
- **Hospedagem do servidor:** onde e a que custo. Etiquetar com spaCy e Stanza pesa em processador e memória, então seria preciso definir limites (tamanho de envio, fila, cota por pessoa).

Em aberto para a fase atual:
- **Nomes dos destinos** (Corpora, Explorar, Comparar, Aprender) e do rótulo da faixa do corpus ativo, que precisam ser claros para quem não conhece linguística de corpus.
- **Quem faz os protótipos e as traduções** da interface.

### 17.10 PWA em poucas palavras

Um **PWA** (*Progressive Web App*) é um site que pode ser **instalado** como se fosse um aplicativo, sem passar por loja de aplicativos. Na prática:

- aparece um ícone na tela inicial do celular (ou no menu de aplicativos do computador);
- abre em tela cheia, sem a barra de endereço do navegador;
- guarda a própria interface no aparelho, então abre rápido e mostra as telas mesmo sem internet;
- se atualiza sozinho quando você publica uma versão nova.

Para isso o site precisa de HTTPS, de um arquivo de descrição (manifesto, com nome e ícones) e de um *service worker*, um pequeno script que controla o que fica guardado. Com Vue e Vite existe um plugin pronto (`vite-plugin-pwa`), então o custo é baixo.

O que um PWA **não** faz: rodar o Python offline. Para importar, etiquetar ou analisar continua precisando do servidor. Offline, só a interface e o que já estiver guardado.

Ponto de atenção com a privacidade: o que fica guardado no aparelho (interface, resultados abertos) precisa ser apagado quando a pessoa clicar em "sair" ou "apagar meus dados" (seção 18).

**Recomendação:** incluir o PWA básico, isto é, instalável e com a interface guardada, e **não** guardar dados de corpus offline por padrão. Custa pouco, ajuda no celular e não cria novos riscos de privacidade.

## 18. Privacidade, cache e registro de anuência (site remoto)

**Adiada até a fase web.** Vale só para a versão hospedada. O aplicativo de janela e o site local **não enviam nada para fora da máquina**, e isso deve constar claramente no texto de privacidade.

**Decisão de 2026-09-26: o site não guardará nada.** Isso simplifica o desenho abaixo:

- Ficam só as formas **1 (sessão temporária)** e **2 (baixar e apagar)** da seção 18.3. A forma 3 (guardar por um tempo, com conta ou chave de recuperação) fica **descartada**, e com ela a autenticação e a retenção estendida.
- O cache de camadas (18.4) vive só na sessão e some junto com ela.
- O registro de anuência (18.5) se reduz ao aviso de privacidade e à declaração de direito de uso no envio de cada corpus, sem o aceite específico de retenção.
- A tela "Meus dados" (18.6) se resume a "baixar meu projeto" e "apagar tudo agora".

O restante da seção fica como referência para quando a fase web começar, e deve ser revisado com o encarregado de dados antes de qualquer publicação.

> **Aviso:** este é um desenho técnico e de produto, e não um parecer jurídico. A base legal, o texto dos termos e as obrigações (LGPD, Lei 13.709/2018) devem ser revisados por quem tem essa competência na instituição (encarregado de dados ou assessoria jurídica da UFMG, se o serviço for hospedado por ela).

### 18.1 Que dados existem

| Tipo | Exemplos | Risco |
|---|---|---|
| **Textos enviados** | `.txt`, `.zip`, CSV com metadados | Podem conter dados pessoais de terceiros (redações de alunos, transcrições, mensagens) |
| **Dados derivados** | Tokens, etiquetas, tabelas de contagem, análises | Reconstituem em grande parte o texto, então valem como dados pessoais quando o texto vale |
| **Metadados** | Nomes de arquivo, autor, turma, idade, L1 | Frequentemente identificam pessoas |
| **Conta ou sessão** | Identificador, e-mail (se houver conta) | Dados pessoais de quem usa |
| **Registros técnicos** | Logs de acesso, erros | Endereço IP e horários |
| **Registro de anuência** | Aceite dos termos e escolhas | Precisa existir para provar o consentimento |
| **Guardados no navegador** | Preferências, cache da interface | Ficam no aparelho da pessoa |

### 18.2 Princípios

1. **Minimização:** guardar o mínimo, pelo menor tempo.
2. **Padrão que protege:** o que não foi escolhido de forma ativa não é guardado por muito tempo.
3. **Transparência:** dizer em linguagem simples o que acontece com os textos, sem esconder no fim de um termo longo.
4. **Controle da pessoa:** ver, baixar e apagar tudo, sem precisar pedir.
5. **Responsabilidade compartilhada:** quem envia o corpus declara que tem direito de usar aqueles textos (autoria, licença, consentimento de quem escreveu) e a ferramenta registra essa declaração.
6. **Segredo por padrão:** os dados de uma pessoa nunca aparecem para outra.

### 18.3 Três formas de guardar o trabalho

A pessoa escolhe ao começar, e a escolha padrão é a mais protetora:

| Forma | O que acontece | Quando os dados somem do servidor |
|---|---|---|
| **1. Sessão temporária** (padrão) | O corpus e as análises existem só enquanto a pessoa trabalha | Ao terminar a sessão ou depois de um período sem uso (por exemplo 24 horas; valor a definir) |
| **2. Baixar e apagar** | O servidor processa, a pessoa baixa o projeto (`.ttwa` ou `.ttwl`) e o servidor apaga tudo | Assim que ela confirma o download |
| **3. Guardar por um tempo** (opcional, exige aceite) | O projeto fica no servidor, ligado a uma conta ou chave de recuperação, para continuar depois | Depois de um prazo definido (por exemplo 30 ou 90 dias, renovável) ou quando a pessoa apagar |

O arquivo de projeto da seção 9 ajuda muito aqui: como o `.ttwa` guarda camadas e análises, a pessoa pode **levar o trabalho consigo** e reabri-lo depois sem que o servidor precise guardar nada. Ao reabrir, o servidor confere os hashes e pula o que já foi feito (seção 9.4).

Os corpora do **catálogo embutido** são públicos e não entram nessa política de dados enviados.

### 18.4 Cache

O cache de camadas (seção 9.4) reaproveita etiquetagens já feitas, mas num serviço com várias pessoas ele pede cuidado:

- **Cache individual, nunca compartilhado.** Se duas pessoas enviarem o mesmo texto e o servidor reaproveitar a etiqueta da primeira, a segunda pode descobrir que aquele texto já foi enviado. Por isso o cache das camadas de textos enviados vale só **dentro da sessão ou conta** de quem enviou.
- **Cache compartilhado só para os corpora do catálogo,** que são públicos e já vêm pré-etiquetados.
- **O cache vive tanto quanto os dados.** Cache e dados derivados seguem o mesmo prazo de retenção da seção 18.3 e são apagados juntos.
- **Cache no navegador:** só a interface (por causa do PWA) e preferências. Textos e resultados de corpora enviados **não** vão para o armazenamento do navegador, ou, se forem, apenas na forma 3 e apagáveis pela pessoa.
- **Cópias de segurança:** se houver, têm prazo curto e o apagamento vale nelas também. Melhor não fazer cópia dos dados enviados.

### 18.5 Registro de anuência

**O que registrar** (uma linha por aceite, sem apagar as anteriores):

| Campo | Para quê |
|---|---|
| Identificador da pessoa ou da sessão (pseudônimo, sem nome nem e-mail no registro) | Ligar o aceite a quem o fez |
| Versão do texto aceito (identificador e hash do documento) | Provar exatamente o que foi aceito |
| Data e hora (UTC) | Provar quando |
| Finalidade e escolha | Por exemplo: guardar por tempo estendido, sim ou não |
| Idioma em que o texto foi mostrado | Provar que foi compreensível |
| Forma do aceite (clique em "aceito", caixa marcada) | Provar que foi um ato ativo |
| Revogação (data, se houver) | A pessoa pode voltar atrás |

Não guardar o IP completo no registro. Se for indispensável, guardar de forma truncada ou com hash, e definir por quanto tempo.

**Quando pedir:**

1. **Primeiro acesso:** aviso curto de privacidade (o que é guardado, por quanto tempo, como apagar), com link para o texto completo. O uso essencial (rodar a análise que a pessoa pediu) precisa de transparência, e a base legal exata deve ser definida com o encarregado de dados.
2. **Ao enviar um corpus:** a declaração de direito de uso ("declaro que tenho autorização para processar estes textos e que, se contêm dados pessoais de terceiros, há base para isso"), registrada **por corpus**, com o identificador do corpus e a versão do termo.
3. **Ao escolher a forma 3 (guardar):** aceite **específico** para a retenção.
4. **Recursos opcionais** (por exemplo estatísticas de uso, se algum dia existirem): aceite separado, desligado por padrão. A recomendação é não ter telemetria.

**Regras:**
- Cada escolha é separada, sem caixa única que aceita tudo.
- A pessoa pode **revogar** a qualquer momento, e isso apaga ou desativa o que dependia daquele aceite.
- Se o texto dos termos mudar, o aceite é pedido de novo. O registro antigo permanece.
- O registro de anuência fica em tabela **separada** dos corpora e é a única coisa que sobrevive à exclusão dos dados (ele registra o aceite, e não o conteúdo).
- No navegador, guarda-se só uma marca de "já aceitei a versão X" para não perguntar de novo no mesmo aparelho. A prova fica no servidor.

### 18.6 Direitos da pessoa (tela "Meus dados")

Uma tela sempre acessível com:

- **ver** o que está guardado e por quanto tempo (corpora, projetos, data de expiração);
- **baixar** tudo (projeto `.ttwa` e exportações);
- **apagar tudo agora,** com confirmação, incluindo cache e dados derivados;
- **rever e revogar** cada aceite;
- **contato** do responsável pelo serviço.

### 18.7 Segurança do servidor

- HTTPS obrigatório e criptografia dos dados guardados.
- **Isolamento por pessoa:** cada sessão ou conta usa seu próprio espaço, e nenhuma rota devolve dados de outro dono.
- Envio de arquivos com limite de tamanho, validação do tipo e cuidado com arquivos `.zip` malformados (bombas de descompressão e caminhos com `..`).
- Limite de requisições por pessoa e fila de tarefas com cota.
- **Logs sem conteúdo dos textos:** registrar erros e tempos, nunca o texto.
- Faxina automática: uma tarefa periódica que apaga o que passou do prazo.
- Autenticação só para a forma 3, de preferência simples (por exemplo link enviado por e-mail, ou chave de recuperação), para coletar o mínimo de dados.

### 18.8 Como fica no pacote e na interface

- **Pacote e linha de comando:** nada disso se aplica. A execução é local e o pacote não envia dados a lugar nenhum. Vale declarar isso na documentação. O que se aplica ao pacote é só o `.ttwa`/`.ttwl` como forma de levar o trabalho.
- **Servidor:** configuração de prazos (`retencao_sessao`, `retencao_conta`), tabela `consents` e a tarefa de faxina.
- **Interface:** janela de aceite com texto por idioma (os textos legais ficam em `help/`, com versão e hash), a declaração no envio, a tela "Meus dados" e o botão "apagar tudo" sempre visível.

### 18.9 Pontos que dependem de decisão ou de revisão especializada

- **Base legal e texto dos termos:** revisão com o encarregado de dados ou a assessoria jurídica.
- **Onde o servidor fica.** Se estiver fora do Brasil, há regras próprias de transferência internacional de dados.
- **Prazos:** duração da sessão temporária e da retenção estendida.
- **Menores de idade:** se estudantes menores puderem usar o serviço, os cuidados aumentam.
- **Corpora de terceiros com licença restrita** (por exemplo o BAWE): o serviço deve impedir que um corpus enviado por uma pessoa seja acessível a outras.
- **Quem responde pelo serviço** (controlador e contato) e como o titular pede algo.

## 19. A incluir

(espaço para os próximos acréscimos)

### 19.1 Ideia para mais tarde: arquivo por corpus (`.ttwc`) e por conjunto (`.ttwa`)

Registrada em 2026-09-27. Ainda não decidida nem planejada; pensar melhor antes de entrar no plano.

- **`.ttwc`: um corpus.** Textos, metadados e camadas de um único corpus. É a unidade que se etiqueta, reaproveita e compartilha.
- **`.ttwa`: conjunto de corpora (*bundle*).** Reúne vários corpora para as análises que os comparam (KFA, palavras-chave, Laboratório). Guarda as análises e aponta para os `.ttwc` (ou os embute).
- **Manter o "l" de *light*** nos dois níveis: versão leve com o texto fora do arquivo, como o `.ttwl` de hoje (§9.3). Nomes a definir (por exemplo `.ttwcl` e `.ttwal`, ou outra forma curta).
- A diferença de nome precisa deixar claro, só pela extensão, se o arquivo é um corpus ou um conjunto.

A pensar:

- Se o `.ttwa` referencia os `.ttwc` pelo caminho (com hash, como o `.ttwl`) ou os copia para dentro; e o que acontece quando um `.ttwc` muda depois da análise.
- Como migrar os `.ttwa` atuais, que hoje já são projetos com vários corpora: viram conjuntos com os corpora embutidos?
- Relação com os pacotes do catálogo (Fase 4): um corpus do catálogo poderia ser simplesmente um `.ttwc`.
- O `.ttwt` (comprimido) continua valendo para os dois tipos ou ganha um equivalente por tipo.
- Paridade (§10): comandos para criar, juntar e separar corpora e conjuntos no pacote e na GUI.
