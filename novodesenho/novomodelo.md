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
| Visualizador de texto | Texto paginado com etiquetas coloridas | Já existe |
| KFA/AMD | Comparação entre dois corpora | Já existe, vira módulo avançado |

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

## 10. A incluir

(espaço para os próximos acréscimos)
