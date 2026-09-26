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

## 17. A incluir

(espaço para os próximos acréscimos)
