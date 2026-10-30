# Parte I — Construção e funcionamento do TTWtools

## 1. Apresentação e recorte

Esta parte do capítulo descreve como o TTWtools é construído e como funciona por dentro. O objetivo não é ensinar a programar, mas tornar compreensível, para quem conhece análise de corpus e não necessariamente programação, quais são as peças da ferramenta, que decisões de projeto as organizam e por que essas decisões importam para o trabalho linguístico. A descrição se refere ao estado implementado na versão 0.8.3 do aplicativo e 0.3.1 do pacote de análise; sempre que houver risco de confusão, a versão é indicada. Os documentos de desenho do projeto são usados aqui como fonte das intenções e das justificativas, mas o que se descreve é o que existe no código e nos testes, não apenas o que foi planejado.

O TTWtools é um aplicativo local de análise de corpus. “Local” significa que o programa, os textos, as anotações e os resultados ficam no computador de quem usa; não há envio de textos para um serviço externo nem dependência de uma conta em site. O aplicativo reúne quatro grandes operações: organizar textos em um projeto, anotá-los com ferramentas de processamento de linguagem, explorá-los por meio de buscas e concordâncias, e compará-los entre si ou com corpora de referência. A mesma lógica que atende à interface gráfica também está disponível em uma biblioteca para a linguagem Python e em uma linha de comando. Essa equivalência é um princípio de projeto, não um detalhe técnico: ela permite que uma análise feita com cliques possa ser reproduzida, documentada e automatizada.

Para uma banca de linguística, a pergunta relevante não é “qual é a linguagem de programação”, mas “o que a ferramenta guarda, o que ela calcula e o que ela presume sobre os dados”. É isso que este texto procura responder. Termos técnicos são explicados na primeira vez em que aparecem, e as analogias são usadas apenas quando ajudam a fixar a ideia, não para substituir a precisão.

## 2. Princípios de projeto

Cinco princípios organizam o funcionamento do TTWtools.

O primeiro é a **primazia do local e da privacidade**. O aplicativo não precisa de internet para analisar um corpus já instalado. Os modelos de anotação são baixados uma vez, por escolha explícita, e ficam guardados na pasta de dados do usuário. Nenhum texto é enviado a um servidor remoto durante a análise. Essa decisão tem consequências técnicas — por exemplo, o aplicativo precisa carregar os modelos localmente e verificar o espaço em disco antes de gravar — e consequências éticas, sobretudo quando o corpus contém redações de estudantes, entrevistas ou outros materiais sensíveis.

O segundo é a **interface única, sem perfis**. Não existem modos “estudante” e “pesquisador”. Todos veem a mesma tela, com as operações mais frequentes em primeiro plano e as opções mais especializadas em painéis recolhidos, que qualquer pessoa pode abrir. Essa escolha evita que o aplicativo esconda recursos considerados “avançados” e mantém uma única curva de aprendizagem.

O terceiro é a **paridade entre interface, biblioteca e linha de comando**. A lógica de análise fica em um pacote de programas — o `ttwtools` —, e a interface apenas coleta parâmetros e apresenta resultados. A rota do servidor local não contém regra de análise; ela chama a função correspondente do pacote. Na prática, isso significa que uma contagem de palavras-chave, uma KFA (*Key Feature Analysis*, a análise de atributos-chave) ou uma dispersão têm uma única implementação, usada pelos três caminhos. O botão “Copiar como código” traduz uma análise feita na tela em um comando de linha de comando e em um trecho de Python equivalente, o que torna a análise auditável e reexecutável.

O quarto é o **não retrabalho de anotação**. Se um texto já foi anotado por uma ferramenta com a mesma configuração, o TTWtools reaproveita a anotação em vez de refazê-la. Se dois documentos têm exatamente o mesmo texto, a anotação de um pode ser copiada para o outro. Esse princípio economiza tempo e, mais importante, evita que o corpus passe a ter versões incompatíveis da mesma anotação sem que o usuário saiba.

O quinto é a **portabilidade e a longevidade do arquivo**. Um projeto deve poder ser aberto em outro computador, arquivado, enviado a um colega ou reaberto anos depois. Por isso o formato de arquivo usa apenas recursos da biblioteca padrão da linguagem, sem depender de pacotes exóticos, e o aplicativo mantém compatibilidade de leitura com versões anteriores. O formato não é um segredo proprietário: ele é documentado e verificável.

## 3. Arquitetura geral

A arquitetura do TTWtools pode ser descrita em quatro camadas, como mostra a Figura 1. Na superfície está a **interface gráfica**, escrita com Vue 3 (uma biblioteca para construir interfaces), a parte visível do aplicativo: menus, formulários, tabelas, gráficos e o leitor de textos anotados. Logo abaixo está o **servidor local**, escrito em Python (linguagem de programação) com o arcabouço FastAPI (uma biblioteca que organiza a comunicação entre programas). Ele recebe os pedidos da interface, coordena as tarefas demoradas e devolve os resultados em um formato estruturado. Abaixo do servidor está o **pacote de análise** `ttwtools`, onde vivem as funções que de fato leem os textos, consultam as anotações, calculam estatísticas e geram os dados dos gráficos. Por fim, no nível mais profundo, está o **arquivo de projeto**, um banco de dados SQLite que guarda textos, metadados, camadas de anotação e resultados.

A separação entre interface e servidor não é meramente organizacional. Ela permite que o mesmo núcleo de análise seja usado em uma janela nativa no computador, em um navegador apontando para o servidor local ou, sem interface alguma, na linha de comando e em scripts de pesquisa. O aplicativo pode ser aberto em modo desktop, com uma janela própria, ou em modo web local; nos dois casos, o servidor e o pacote são os mesmos.

O servidor local merece uma explicação para quem não é da área. Um “servidor”, aqui, não é uma máquina remota: é um programa que roda no próprio computador e fica “escutando” pedidos da interface. Quando a pessoa clica em “Buscar”, a interface envia um pedido a esse programa, que chama a função adequada do pacote e devolve a resposta. A vantagem é que a interface não precisa conhecer os detalhes de como a busca é feita; ela só precisa saber pedir e mostrar. A desvantagem é que o aplicativo precisa iniciar e encerrar esse programa junto com a janela, e é por isso que existem cuidados com portas de comunicação, processos órfãos e tempo de resposta.

O pacote `ttwtools` é a parte cientificamente mais importante. Ele está organizado em módulos com responsabilidades relativamente claras: importação de textos e metadados; tokenização simples; definição e armazenamento de camadas; adaptadores para os etiquetadores; consultas (busca, concordância, frequência, colocados, dispersão); palavras-chave; tabelas de atributos e KFA; estatísticas descritivas; visualizações; catálogo de corpora; formatos de entrada e saída; ajuda; e geração de código equivalente. Essa divisão facilita a manutenção e, para a pesquisa, deixa explícito onde cada cálculo acontece.

A Figura 1 deve mostrar também o fluxo de uma análise: a interface envia parâmetros; o servidor valida e chama a função; a função abre o projeto, lê a camada adequada, calcula e devolve um resultado estruturado; a interface apresenta o resultado e permite exportá-lo. O mesmo fluxo, sem a interface, é o que a linha de comando executa.

Um último elemento da arquitetura merece menção: a ajuda. Os textos explicativos sobre conceitos, métricas e telas ficam em arquivos Markdown por idioma, com título, resumo e relações entre tópicos. O mesmo conteúdo alimenta os balões de explicação, os tours guiados, a tela Aprender e o comando `ttwtools help`. Isso significa que explicar a ferramenta não é um apêndice acrescentado depois: é parte do produto e é tratado como dado, separado do código da interface.

## 4. O projeto como banco de dados

### 4.1 Por que SQLite

O coração do TTWtools é o arquivo de projeto. Por dentro, ele é um banco de dados SQLite. Para quem não trabalha com programação, a melhor analogia é a de uma pasta de trabalho de planilhas: um único arquivo que contém várias tabelas relacionadas entre si. Cada tabela tem colunas e linhas; cada linha é um registro; cada registro guarda informações em campos. O SQLite é um sistema de banco de dados que faz isso dentro de um único arquivo, sem exigir um servidor de banco de dados separado. É uma tecnologia madura, amplamente usada e de código aberto.

Há três razões para essa escolha. A primeira é a **integridade**: o banco pode relacionar documentos, camadas e tokens por identificadores, e o sistema impede que uma camada fique “solta”, sem documento, ou que um token aponte para uma camada inexistente. A segunda é a **consulta eficiente**: com índices, o banco encontra rapidamente todas as ocorrências de uma palavra ou de uma etiqueta em milhões de tokens, sem ler o arquivo inteiro. A terceira é a **segurança**: abrir um SQLite não executa código embutido, ao contrário de alguns formatos de dados que podem carregar instruções maliciosas. O aplicativo não “roda” o projeto; ele apenas lê e grava dados.

O arquivo `.ttwa` é, portanto, um banco SQLite. Na prática, o aplicativo costuma gravá-lo comprimido — isto é, reduzido por um algoritmo de compressão sem perda, semelhante ao que se faz com um arquivo `.zip` — para ocupar menos espaço. Ao abrir, ele descomprime o banco em uma cópia de trabalho temporária, faz as alterações nessa cópia e, ao salvar, grava de volta o arquivo comprimido. A extensão `.ttwa` indica o tipo de projeto, não o grau de compressão. O formato `.ttwt`, usado para envio e arquivamento, é uma versão comprimida com um algoritmo mais forte; o conteúdo lógico é o mesmo.

### 4.2 As tabelas e o que cada uma guarda

A Tabela 1 resume as tabelas principais do esquema atual. O esquema é a “planta” do banco: define quais tabelas existem, quais colunas cada uma tem e como se relacionam.

**Tabela 1 — Tabelas principais do projeto `.ttwa`**

| Tabela | O que guarda | Por que importa |
|---|---|---|
| `project_meta` | Pares de chave e valor com metadados do projeto: versão do esquema, tipo de projeto, opções de gravação | Permite que o aplicativo saiba como interpretar o arquivo e mantenha compatibilidade |
| `corpus_files` | Textos originais de cada corpus (nos projetos que embutem o texto) | Guarda a fonte primária, necessária para o leitor e para o contexto das concordâncias |
| `documents` | Um registro por documento: corpus, nome do arquivo, impressão digital do texto, número de caracteres, caminho relativo no projeto leve | É a âncora de identidade de cada texto |
| `document_meta` | Metadados por documento, em pares de chave e valor | Permite agrupar, filtrar e comparar por nível, autor, ano, gênero etc. |
| `layers` | Uma camada de anotação por documento, com ferramenta, versão, modelo, configuração e número de tokens | Registra o que foi feito, com que ferramenta e em que condições |
| `tokens` | Os tokens de cada camada, com posição no texto, forma, lema, classes e etiquetas | É a tabela que sustenta busca, concordância, frequência e colocados |
| `layer_blobs` | Camadas empacotadas em formato colunar, quando o arquivo é salvo sem as tabelas de busca | Reduz o tamanho do arquivo e permite reconstruir a tabela de tokens quando necessário |
| `lexicon_parts` | Léxico por corpus usado pelo formato colunar `TCL2` | Evita repetir palavras e lemas milhões de vezes |
| `analyses` | Resultados de análises salvas, com tipo, parâmetros, camadas usadas e resultado | Permite reaproveitar cálculos e documentar o que foi feito |
| `tagged_files`, `feature_tables`, `kfa_results` | Tabelas do esquema antigo, mantidas para compatibilidade | Garantem que projetos de versões anteriores possam ser abertos e migrados |

A Tabela 1 mostra uma decisão conceitual importante: o projeto não guarda “o corpus anotado” como um bloco único. Ele guarda **documentos**, **camadas** e **tokens** como entidades separadas e relacionadas. Essa separação é o que permite ter, para o mesmo texto, uma camada do spaCy e outra do BiberPlus, ou uma camada antiga e outra nova, sem duplicar o texto e sem confundir as análises.

### 4.3 Documentos, metadados e impressões digitais

Cada documento tem um registro na tabela `documents`. Esse registro inclui o nome do arquivo, o corpus a que pertence, o número de caracteres e uma **impressão digital** do conteúdo — um valor calculado por uma função chamada *hash*, no caso o SHA-256. A ideia de hash é simples: o programa lê o texto e produz um código curto que depende de cada caractere. Se uma vírgula muda, o código muda. Se o texto é idêntico, o código é idêntico. Isso permite comparar textos sem comparar o conteúdo inteiro e saber se um documento mudou desde a última anotação.

O hash tem dois usos. O primeiro é verificar se o texto de um projeto leve ainda corresponde ao arquivo que está na pasta ao lado. Se o arquivo foi alterado, o aplicativo avisa que a anotação pode estar desalinhada. O segundo é permitir o reaproveitamento de camadas entre documentos com o mesmo conteúdo: se dois arquivos têm o mesmo hash, a camada de um pode ser copiada para o outro, porque a anotação se refere ao mesmo texto.

Os metadados ficam na tabela `document_meta`, em pares de chave e valor. Eles podem vir do nome do arquivo, quando este segue um padrão como `aluno_B1_2024.txt`, ou de um arquivo CSV separado, com uma coluna que identifica o arquivo. Os metadados são o que permite dizer “compare os textos de nível B1 com os de nível C1” ou “mostre apenas as redações de 2024”. Sem eles, a comparação por grupos dependeria de o usuário separar os arquivos em pastas diferentes.

### 4.4 Camadas, tokens e o princípio do não retrabalho

Uma **camada de anotação** é o resultado de uma ferramenta sobre um texto. Se o texto é “Os alunos escreveram”, uma camada pode dizer que “Os” é determinante, “alunos” é substantivo e “escreveram” é verbo. Outra camada, de outra ferramenta, pode dividir as palavras de modo ligeiramente diferente ou atribuir etiquetas de outro repertório. As camadas não substituem o texto: elas se apoiam nele.

O TTWtools adota uma representação **standoff**, palavra inglesa que, em processamento de linguagem, designa anotações guardadas separadamente do texto, ligadas a ele por posições. Cada token tem uma posição inicial e uma final em caracteres. A regra é que o trecho do texto entre essas posições seja exatamente a palavra anotada. Isso garante que a anotação possa ser destacada no texto original, que o contexto de uma concordância possa ser recuperado e que camadas diferentes possam conviver sobre o mesmo texto.

A identidade de uma camada é definida por um conjunto de informações: o documento, a ferramenta, a versão da ferramenta, o modelo e um **hash da configuração**. Esse hash de configuração é calculado apenas com as opções que mudam o resultado — por exemplo, o modelo escolhido ou a decisão de extrair lemas. Opções que afetam apenas a velocidade, como o tamanho do lote ou o número de processos, ficam de fora. Assim, mudar o número de processos não invalida uma camada já feita; mudar o modelo, sim.

Antes de anotar um documento, o aplicativo procura uma camada que satisfaça o pedido. “Satisfazer” significa: mesma ferramenta, mesma versão, mesmo modelo, mesmas opções que mudam o resultado e componentes iguais ou mais completos. Uma camada que tem classe e lema atende a um pedido que só pede classe; o contrário não. Se a camada existe, o trabalho é reaproveitado. Se não existe, o documento é anotado e a camada é gravada ao final. Se o processo for interrompido, os documentos já concluídos permanecem concluídos.

Esse desenho tem uma consequência metodológica importante: o corpus pode acumular camadas feitas em momentos diferentes, e cada análise registra qual camada usou. Não há uma “anotação oficial” única e invisível; há camadas identificáveis, com ferramenta, versão e configuração. Isso é o que permite comparar resultados e refazer uma análise de forma controlada.

### 4.5 Análises salvas e reprodutibilidade

A tabela `analyses` guarda resultados de análises. Cada registro tem um tipo (por exemplo, KFA, frequência, colocados), um nome, os parâmetros usados, as camadas consultadas, o resultado e a data. Guardar os parâmetros e as camadas é o que permite saber **como** um resultado foi obtido, e não apenas **qual** foi o resultado.

O aplicativo reaproveita uma análise salva enquanto os textos, as camadas e os parâmetros não mudam. Se algo muda, o resultado é recalculado. Essa política evita dois extremos: recalcular tudo a cada tela, o que tornaria o uso lento, e apresentar um resultado antigo como se fosse atual, o que seria enganoso.

A reprodutibilidade tem dois níveis. O primeiro é o **registro**: o projeto guarda a configuração da camada e os parâmetros da análise. O segundo é a **reexecução**: o botão “Copiar como código” mostra o comando de linha de comando e o trecho de Python equivalentes. Isso permite que uma análise feita na interface seja repetida fora dela, documentada em um artigo ou incorporada a um script. A reprodutibilidade não é absoluta: depende das versões dos modelos e das bibliotecas, que podem mudar. Por isso o projeto registra versões e mantém um histórico de mudanças.

### 4.6 O formato colunar e o léxico

Guardar tokens como uma lista de linhas, cada uma com palavra, lema, classe e etiqueta, é simples, mas ocupa muito espaço, porque as mesmas palavras e os mesmos lemas se repetem milhões de vezes. O TTWtools usa um formato colunar próprio, chamado **TCL** (*TTWtools Columnar Layer*). O nome é uma sigla do projeto; não tem relação com a linguagem de programação Tcl.

A ideia do formato colunar é separar o **vocabulário** da **sequência**. Em vez de gravar a palavra “aluno” em cada ocorrência, o programa cria um léxico do corpus, no qual “aluno” recebe um número de identificação. A camada passa a guardar sequências de números, e não de palavras. O mesmo vale para lemas, classes e etiquetas. As posições no texto também são gravadas de forma econômica, como diferenças entre posições consecutivas. Por fim, o conjunto é comprimido.

A analogia útil é a de um dicionário numerado: em vez de escrever a palavra inteira em cada página, escreve-se o número da entrada do dicionário. O texto fica menor e as consultas podem ser feitas sobre os números, que são mais rápidos de comparar do que sequências de caracteres. A versão atual do formato, `TCL2`, usa identificadores inteiros e um léxico compartilhado por corpus. A leitura aceita versões anteriores, para não perder projetos antigos.

O formato colunar é uma decisão de engenharia com efeito prático: arquivos menores, abertura mais rápida e consultas mais velozes em corpora grandes. O custo é a complexidade interna: é preciso manter o léxico, garantir que os identificadores sejam estáveis e saber reconstruir as linhas quando uma ferramenta precisa delas. Por isso o formato é testado com projetos reais e com comparações entre o caminho colunar e o caminho tradicional.

### 4.7 O índice de busca e a abertura rápida

Para que uma busca por palavra seja rápida, o banco precisa de um **índice**, isto é, uma estrutura auxiliar que funciona como o índice remissivo de um livro: em vez de percorrer todas as páginas, o programa consulta uma lista ordenada que aponta para as ocorrências. No TTWtools, a tabela `tokens` tem índices para a forma, o lema, a classe e o documento. Esses índices ocupam espaço, mas evitam que uma busca em milhões de tokens se torne uma varredura completa.

O aplicativo oferece dois caminhos. Se o projeto foi salvo com as tabelas de busca, a consulta usa os índices diretamente. Se foi salvo sem essas tabelas — para ser menor —, o aplicativo pode construir um índice em uma pasta de **cache**, isto é, uma reserva de resultados derivados que pode ser apagada e reconstruída. Esse índice é anexado ao projeto no momento da consulta, como se fosse uma parte temporária do banco. O índice também pode ser construído de forma **preguiçosa**: o projeto abre rapidamente e o índice só é montado quando a primeira consulta que realmente precisa dele é feita. A abertura deixa de ser uma espera longa; a primeira busca pode custar alguns segundos a mais.

O cache tem limite de tamanho e é limpo por idade de uso. Isso evita que o aplicativo ocupe o disco indefinidamente. Para o usuário, a consequência é que a primeira busca em um projeto grande pode ser mais lenta do que as seguintes, mas o custo não se repete a cada abertura.

## 5. Corpus, documentos e metadados

Um **corpus**, no TTWtools, é um conjunto de documentos reunidos sob um nome dentro do projeto. Um projeto pode conter vários corpora — por exemplo, “redações”, “artigos” e “referência” —, e as análises escolhem com qual corpus trabalhar. Essa organização permite comparar corpora diferentes sem misturar os textos.

A importação pode ser feita de uma pasta de arquivos `.txt`, de um único arquivo, de um CSV (arquivo de texto com valores separados por vírgula ou ponto e vírgula) com uma coluna de texto ou de um texto colado na interface. Os metadados podem vir do nome dos arquivos ou de um CSV separado. O aplicativo mostra uma prévia de como os nomes serão interpretados antes de importar, o que reduz erros de codificação — por exemplo, um nome como `aluno_B1_2024.txt` pode ser lido como três campos: aluno, nível e ano.

Além dos formatos de texto simples, o TTWtools importa formatos anotados: CoNLL-U, o formato em colunas do Universal Dependencies; o formato `palavra/TAG` usado em corpora como Brown e LOB; TEI P5 e o XML do BNC, padrões de codificação de textos digitais; e GrAF, um formato standoff usado em corpora como OANC e MASC. Nesses casos, a anotação existente é convertida em uma camada, e o texto é preservado. Isso permite analisar corpora já anotados sem reetiquetar tudo.

A tokenização simples, feita sem um etiquetador, divide o texto em unidades por expressões regulares — padrões de caracteres. Ela é usada nas estatísticas que não dependem de classe gramatical e é assumidamente uma **estimativa**: um etiquetador pode separar contrações, pontuação e palavras compostas de modo diferente. O aplicativo avisa disso na interface. Quando uma camada é escolhida, as estatísticas passam a usar a tokenização daquela camada, e os números podem mudar ligeiramente. Essa transparência é importante para não tratar estimativas como se fossem medições definitivas.

Os metadados sustentam os filtros e os grupos. Um filtro por metadado seleciona documentos, e um agrupamento por metadado cria os grupos que serão comparados. É por esse mecanismo que a KFA pode comparar “B1” com “C1” dentro do mesmo corpus, ou que o Laboratório pode comparar vários níveis ao mesmo tempo.

## 6. Etiquetagem e camadas

### 6.1 O que é etiquetar

Etiquetar, no contexto do TTWtools, é atribuir a cada token de um texto uma ou mais informações linguísticas: a classe gramatical, o lema, a etiqueta do repertório da ferramenta e, em alguns casos, informações morfológicas. Neste texto evita-se a palavra “traço” para não confundi-la com “traço” no sentido de linha desenhada; para as características de Biber, o termo adotado é **atributo**, sobretudo nas análises de KFA.

A etiquetagem pressupõe uma tokenização. Diferentes ferramentas tokenizam de modo diferente: algumas separam “don't” em “do” e “n't”, outras mantêm a forma contraída; algumas tratam a pontuação como token, outras não. Por isso as camadas se alinham ao texto por posição em caracteres, e não por número de token. Essa decisão permite comparar camadas que tokenizam de modo diferente sem perder a referência ao texto original.

### 6.2 Os etiquetadores

O TTWtools integra quatro famílias de etiquetadores, resumidas na Tabela 2. Todas produzem o mesmo formato canônico de saída, o que permite que as análises seguintes não precisem saber qual ferramenta gerou a camada.

**Tabela 2 — Etiquetadores integrados**

| Etiquetador | Natureza | O que produz | Idiomas | Observações |
|---|---|---|---|---|
| spaCy | Modelos estatísticos e neurais treinados | Tokenização, classe gramatical, lema, morfologia | Inglês e português | Modelos de tamanhos diferentes, baixados sob demanda |
| Stanza | Modelos neurais treinados, alinhados ao Universal Dependencies | Tokenização, classe, lema, morfologia | Inglês e português | Usado também como tokenizador de outras ferramentas |
| BiberPlus | Regras e expressões regulares, com apoio opcional do spaCy | Cerca de 67 atributos de Biber | Inglês | Não depende de treinamento neural para as etiquetas de Biber |
| MFTE | Etiquetador baseado em Stanza e torch | Conjunto ampliado de atributos, com versão estendida | Inglês | Dependência opcional e mais pesada; licença própria |

A distinção entre modelos treinados e regras é relevante para a interpretação. spaCy e Stanza são sistemas de aprendizado de máquina: suas decisões vêm de padrões estatísticos aprendidos de dados anotados. Isso significa que eles podem errar de formas sistemáticas e que a qualidade depende do modelo, do domínio e do idioma. BiberPlus, por sua vez, aplica regras explícitas para identificar um conjunto de atributos associado à tradição de Biber; é mais previsível, mas também mais dependente de como as regras foram formuladas. MFTE amplia o conjunto de atributos e usa infraestrutura neural. Nenhum deles é “neutro”: cada um carrega uma concepção de token, de classe e de atributo.

O aplicativo oferece atalhos de configuração, chamados **presets** — Rápido, Recomendado e Mais preciso —, que preenchem as opções do etiquetador. O painel “Personalizar” expõe as opções com explicações e indica quais mudam o resultado e quais afetam apenas o desempenho. O **repertório de tags** de cada etiquetador pode ser consultado, com definições e exemplos, e o mesmo repertório alimenta a ajuda e o leitor. O objetivo é que a pessoa saiba o que a etiqueta significa antes de interpretar uma contagem.

### 6.3 Reaproveitamento e cache

O reaproveitamento de camadas foi descrito na seção 4.4. Vale acrescentar o efeito sobre o fluxo de trabalho. A tela de etiquetagem permite montar uma lista de passos “a executar” — por exemplo, estatísticas básicas, uma camada do spaCy e uma camada do BiberPlus — e rodar tudo de uma vez. O aplicativo calcula apenas o que falta. Se a lista for interrompida, o que já foi concluído permanece; ao retomar, o aplicativo não refaz o que já existe.

Esse desenho é particularmente importante em corpora grandes e em máquinas lentas. Ele também torna o trabalho incremental: é possível começar com uma camada leve, explorar o corpus e, depois, acrescentar uma camada mais custosa apenas para a análise que a exige. A ferramenta não obriga a uma “anotação total” antes de qualquer exploração.

## 7. Importação, exportação e interoperabilidade

O TTWtools não é um sistema fechado. Ele importa formatos usados por outras comunidades e exporta resultados para que possam ser analisados, arquivados ou publicados. A Tabela 3 resume os principais formatos.

**Tabela 3 — Formatos de entrada e saída**

| Formato | Entrada | Saída | Uso típico |
|---|---|---|---|
| Texto simples (`.txt`, pasta, CSV) | Sim | Textos ao lado do projeto | Corpus próprios, redações, entrevistas |
| CoNLL-U | Sim, com camada | Sim | Universal Dependencies, intercâmbio com outras ferramentas |
| `palavra/TAG` (Brown, LOB) | Sim, com camada | Não | Corpora históricos já anotados |
| TEI P5 e BNC XML | Sim, com camada quando há `<w>` | Não | Corpora de referência e edição acadêmica |
| GrAF (OANC, MASC) | Sim, com camada | Não | Corpora standoff |
| VRT (CWB, Sketch Engine, CQPweb) | Não | Sim | Análise em ferramentas de corpus consolidada |
| Tabela de tokens (CSV, JSONL, Parquet) | Não | Sim | Análise estatística externa, arquivamento |
| Lista de frequência de referência (`.tsv`) | Sim, como referência | Sim | Palavras-chave e faixas de frequência sem distribuir o corpus inteiro |

A exportação de uma camada em CoNLL-U ou VRT permite levar o corpus anotado para outras ferramentas; a exportação em CSV, JSONL (um formato de texto com um registro por linha) ou Parquet (um formato de tabela comprimido, comum em análise de dados) permite analisar os tokens com outros programas. A lista de frequência de referência é um formato leve: em vez de distribuir o corpus completo, distribui-se uma tabela de frequências com uma ficha descritiva. Isso é útil quando a licença do corpus não permite redistribuir os textos, mas permite distribuir estatísticas derivadas.

O formato do projeto usa apenas recursos da biblioteca padrão da linguagem. Essa restrição é deliberada: reduz o risco de um projeto se tornar ilegível quando uma biblioteca externa deixa de existir ou muda de formato. A interoperabilidade com formatos externos fica nas rotas de importação e exportação, não no núcleo do arquivo.

## 8. Catálogo, modelos e dados do usuário

O aplicativo pode trabalhar com corpora próprios e com corpora de referência distribuídos pelo projeto. O **catálogo** é uma lista de pacotes disponíveis, descrita em um arquivo `catalogo.json` (JSON é um formato de texto estruturado, legível por pessoas e por programas). Cada pacote tem uma **ficha** com idioma, variedade, período, gêneros, tamanho, licença, fonte, camadas disponíveis e hashes. O catálogo não é um repositório de textos sem controle: a ficha é validada, e a licença é parte da decisão de distribuição.

Um pacote pode conter o projeto já anotado, apenas as listas de frequência ou ambos. Para corpora cuja licença não permite redistribuir os textos, o catálogo oferece uma **receita**: o procedimento para a pessoa preparar a sua própria cópia a partir da fonte original. Essa distinção é importante para a ética da pesquisa e para a publicação de resultados.

Os modelos de spaCy e Stanza são baixados sob demanda e guardados na pasta de dados do usuário. No macOS, essa pasta fica em `~/Library/Application Support/TTWtools`; no Windows, em `%LOCALAPPDATA%\TTWtools`; no Linux, em `~/.local/share/TTWtools`. Uma variável de ambiente permite mudar o local. Os modelos têm licenças próprias, e o aplicativo mostra a ficha e o tamanho antes do download. O MFTE, distribuído sob licença GPL, é uma dependência opcional e recebe tratamento jurídico próprio na distribuição; essa separação é uma decisão técnica e legal, não apenas de conveniência.

A pasta de dados também guarda o cache, as configurações e os pacotes instalados. O aplicativo oferece uma tela de uso de disco, com possibilidade de limpar o cache e as pastas de trabalho abandonadas. Isso responde a um problema real: análises de corpus grandes podem gerar cópias temporárias e índices que ocupam espaço considerável.

## 9. Execução, desempenho e compatibilidade

Uma operação de análise pode levar segundos ou minutos, dependendo do tamanho do corpus e do etiquetador. O TTWtools trata operações longas como **tarefas**, não como requisições paradas. A interface mostra o andamento por etapas e permite cancelar. O servidor local executa a tarefa em segundo plano e informa o progresso; quando termina, o resultado é apresentado. Esse desenho evita que a janela pareça “travada” e permite que a pessoa continue navegando enquanto o cálculo acontece.

Antes de gravar, o aplicativo verifica o espaço livre no disco. Se não houver espaço suficiente, a operação é recusada antes de criar um arquivo pela metade. Essa verificação é acompanhada de uma margem de segurança e de uma mensagem clara. O aplicativo também usa pastas de trabalho temporárias com um “dono” — o identificador do processo —, para que pastas abandonadas possam ser limpas depois. Esses cuidados vieram de problemas reais: em uma sessão de desenvolvimento, cópias temporárias chegaram a ocupar dezenas de gigabytes.

A compatibilidade é um requisito de projeto, não um detalhe. O aplicativo precisa rodar em macOS 12 (Intel e Apple Silicon), Windows e Linux. Isso impõe restrições: versões de Python, de torch e de numpy diferentes em máquinas antigas; cuidado com recursos de CSS e JavaScript que o Safari 17.6 não suporta; e testes em sistemas diferentes. O formato de arquivo, por sua vez, evita dependências que não estejam na biblioteca padrão. O resultado é uma ferramenta que envelhece melhor, ainda que à custa de mais trabalho de manutenção.

O projeto mantém diferentes níveis de teste. Há testes do pacote de análise, testes das rotas do servidor, testes da interface e testes de ponta a ponta, que simulam o uso real em um navegador. Há também um serviço de integração contínua que roda os testes a cada alteração em macOS, Windows e Linux. Nenhum conjunto de testes prova que a ferramenta está correta em todos os casos, mas ele reduz a chance de regressões e documenta o comportamento esperado.

## 10. Agentes de inteligência artificial e recursos de IA no projeto

### 10.1 Duas presenças distintas da IA

É preciso distinguir dois usos de inteligência artificial neste projeto, porque eles têm estatutos diferentes.

O primeiro é a **IA no produto**. O TTWtools usa modelos de processamento de linguagem — spaCy, Stanza e MFTE — para tokenizar, etiquetar e lematizar. Esses modelos são sistemas de aprendizado de máquina treinados em grandes conjuntos de textos anotados. Eles são “IA” no sentido amplo da área, mas não são modelos gerativos como os que produzem texto em resposta a uma pergunta. O aplicativo não chama um serviço de linguagem generativa durante a análise, não envia textos para a nuvem e não usa os textos do usuário para treinar nada. BiberPlus, por sua vez, é baseado em regras explícitas. A escolha de quais modelos usar, e a transparência sobre o que cada um faz, é parte do desenho metodológico da ferramenta.

O segundo é a **IA no processo de desenvolvimento**. O aplicativo foi construído com o apoio de agentes de programação baseados em modelos de linguagem. As instruções permanentes do repositório nomeiam Claude, Gemini, Codex e DeepSeek como agentes compatíveis, e o percurso registrado mostra sessões com o Claude e a passagem de trabalho entre sessões. Esses agentes não são autores do projeto nem tomam decisões científicas: eles atuam como assistentes de implementação, documentação, revisão e teste, sob a direção e a validação do autor.

Essa distinção é importante para a banca. A ferramenta não é “uma IA que analisa textos”; é uma ferramenta de análise de corpus que usa modelos de processamento de linguagem e que foi desenvolvida com auxílio de agentes. O objeto linguístico e o método de análise continuam sendo escolhas humanas.

### 10.2 O contrato de trabalho com os agentes

O uso de agentes não foi improvisado. O repositório contém um arquivo de instruções permanentes, o `AGENTS.md`, que funciona como um contrato operacional para qualquer agente que venha a trabalhar no projeto. Esse arquivo define o que ler antes de começar, como trabalhar — uma frente e um passo por vez —, como registrar o progresso, como rodar os testes e quais regras nunca devem ser violadas.

Algumas dessas regras são técnicas e revelam os riscos identificados na prática. Por exemplo: nunca usar `git add -A`, porque o repositório contém projetos de corpus grandes que mudam ao serem abertos; adicionar arquivos pelo nome. Nunca incluir um agente como autor ou coautor dos commits. Não reescrever histórico publicado. Não apagar arquivos que o agente não criou. Não recompilar o pacote sem pedido. Conferir o espaço em disco antes de abrir um projeto real. Trabalhar em cópias. Rodar apenas os testes do que foi mexido. Essas regras não são burocracia: cada uma responde a um incidente ou a um risco concreto.

O contrato também define a **paridade** entre interface, pacote e linha de comando e o **vocabulário** do projeto — por exemplo, usar “atributo” e não “traço” para as características de Biber. A linguagem é tratada como parte do método: uma ferramenta de linguística não pode usar termos de forma descuidada.

Além do `AGENTS.md`, há um diário técnico, o `memoria_para_IA.md`, escrito para ser lido por agentes em sessões futuras. Ele registra o que mudou, por quê, quais armadilhas foram encontradas e o que não repetir. É uma forma de memória operacional que complementa o histórico do Git: o Git diz o que mudou; o diário diz por que mudou e o que se aprendeu. Para a pesquisa, esse diário é também um registro do processo de construção, com erros e correções.

### 10.3 O ciclo de desenvolvimento

O ciclo adotado pode ser descrito em seis momentos. Primeiro, o autor define a frente de trabalho e o passo; as decisões de escopo, método e arquitetura são registradas como decisões do autor. Segundo, o agente lê as instruções, o plano e os arquivos relevantes, e propõe ou implementa a alteração. Terceiro, a alteração é testada no nível adequado — pacote, servidor, interface ou ponta a ponta. Quarto, o autor revisa o resultado e o comportamento visível. Quinto, o passo é registrado em um commit curto, em português, com o prefixo `[passo]`. Sexto, o plano e o diário são atualizados para a próxima sessão.

Esse ciclo tem duas características que interessam metodologicamente. A primeira é a **granularidade**: trabalhar em passos pequenos reduz o risco de uma alteração ampla romper partes não relacionadas e facilita a revisão. A segunda é a **rastreabilidade**: cada passo deixa um registro no histórico, e as decisões ficam em documentos próprios. O resultado não é “código gerado por IA” sem controle; é um processo humano dirigido, com apoio de agentes e verificação sistemática.

O uso de **múltiplos agentes** também tem uma justificativa. Diferentes modelos têm estilos e pontos fortes distintos; a possibilidade de trocar de agente reduz a dependência de um fornecedor e permite comparar abordagens. A contrapartida é a necessidade de um contrato comum — o `AGENTS.md` — para que o trabalho não se torne inconsistente. O projeto também usa técnicas de **economia de contexto**: leitura seletiva de arquivos grandes, instruções para não abrir diretórios enormes e um arquivo de exclusão para o empacotador de contexto Repomix, que reúne o código em um único arquivo para consulta por agentes. Essas técnicas são menos visíveis no produto, mas foram necessárias para tornar o trabalho com modelos de linguagem viável em um repositório grande.

### 10.4 Outros usos de IA

Além dos agentes de programação, há um uso auxiliar de IA na etapa de verificação. Em pelo menos uma sessão de testes, relatos em áudio do autor sobre o uso do aplicativo em uma máquina antiga foram transcritos com o modelo Whisper, por meio da implementação `faster-whisper`. A transcrição alimentou o registro de problemas de usabilidade e orientou correções. Esse uso é periférico em relação ao produto, mas faz parte do processo de avaliação formativa da ferramenta.

Não há, no estado atual, uso de IA generativa dentro do aplicativo para gerar explicações, reescrever textos ou produzir análises. Os textos de ajuda são escritos e revisados, não gerados em tempo de execução. Essa escolha preserva a previsibilidade e evita que a ferramenta dependa de um serviço externo para funcionar.

### 10.5 Limites, riscos e transparência

O uso de agentes trouxe ganhos claros de velocidade e de cobertura de testes, mas também riscos que precisam ser declarados. O primeiro é a **confabulação**: um agente pode propor uma solução que parece correta e não é. Por isso a verificação por testes e a revisão humana são obrigatórias. O segundo é a **deriva de dependências**: modelos e bibliotecas mudam, e um código que funcionava pode deixar de funcionar. Por isso as versões são fixadas e a compatibilidade é testada. O terceiro é a **inconsistência de estilo**: agentes diferentes podem escrever de formas diferentes; o contrato e os padrões do projeto reduzem, mas não eliminam, esse risco. O quarto é a **tentação de otimizar para o teste**: um agente pode fazer o teste passar sem resolver o problema real; a revisão humana e os testes de ponta a ponta ajudam a detectar isso.

A transparência é parte da ética da pesquisa. O capítulo declara o uso de agentes, indica quais documentos registram o processo e não atribui aos agentes a autoria científica. As decisões de método, o recorte, a interpretação dos resultados e a redação final são do autor. Os textos dos usuários não são enviados a serviços de IA, e o aplicativo não depende de rede para funcionar. Essa combinação — uso de agentes no desenvolvimento, ausência de IA generativa em tempo de execução e processamento local — é a posição adotada pelo projeto.

## 11. Síntese da Parte I

A construção do TTWtools pode ser resumida em uma ideia: separar o que é **fonte**, o que é **anotação** e o que é **resultado**, e manter cada uma dessas camadas identificável, reutilizável e auditável. O texto original fica no projeto; as anotações ficam em camadas com ferramenta, versão, modelo e configuração; os resultados ficam em análises com parâmetros e referências às camadas usadas. Essa separação é o que permite comparar ferramentas, refazer análises, corrigir erros sem perder o corpus e levar o projeto para outra máquina.

O funcionamento combina um arquivo de projeto em SQLite, um formato colunar para os tokens, um índice de busca em cache e um conjunto de funções de análise no pacote `ttwtools`. A interface, o servidor local e a linha de comando são camadas sobre esse núcleo. O princípio de paridade garante que uma análise feita com cliques possa ser reproduzida em código; o princípio de não retrabalho garante que o corpus não seja reanotado sem necessidade; a verificação de espaço, as cópias de trabalho e a compatibilidade com sistemas antigos garantem que o trabalho não se perca.

Os agentes de IA participaram da implementação, da documentação e dos testes, sob um contrato explícito e com verificação humana. Eles não substituem as decisões linguísticas nem a interpretação dos resultados. A IA que aparece no produto é a dos modelos de processamento de linguagem — spaCy, Stanza, MFTE e as regras de BiberPlus —, não a de um serviço generativo remoto.

A Parte II deste capítulo descreve, uma a uma, as funções que essa arquitetura torna possíveis: organizar e importar corpora, etiquetar e gerenciar camadas, explorar por busca, concordância, frequência, colocados e dispersão, comparar por palavras-chave, KFA, faixas de frequência e Laboratório, analisar um texto individual na ferramenta de Escrita, aprender com os verbetes e tours, instalar corpora e modelos e automatizar tudo pela linha de comando e pela biblioteca Python.

---

## Notas para revisão (não fazem parte do texto do capítulo)

1. **Versão e números.** O texto se refere ao app 0.8.3 e ao pacote 0.3.1. Confirmar se o capítulo deve congelar essa versão ou descrever a versão final da tese. Números de desempenho e tamanho de arquivo foram deliberadamente deixados fora; se forem incluídos, conferir os valores em `novodesenho/armazenamento.md` e `novodesenho/macintel.md` e indicar a máquina de referência.
2. **Uso de agentes.** O texto nomeia Claude, Gemini, Codex e DeepSeek porque são os agentes citados em `AGENTS.md`. O percurso registrado documenta sessões com o Claude e a passagem entre sessões/agentes, mas não distribui tarefas por modelo. Se a tese quiser uma seção mais detalhada, convém o autor registrar quais agentes foram usados em quais frentes e em que período.
3. **Whisper.** A transcrição de áudio com `faster-whisper` está registrada em `novodesenho/memoria_para_IA.md`. Confirmar se o episódio deve ser mencionado no capítulo ou apenas nos agradecimentos/notas de método.
4. **Repomix.** O texto menciona o empacotador de contexto porque o repositório contém `.repomixignore` e as instruções se referem a `repomix-output.xml`. Se o uso não tiver sido relevante, a menção pode ser retirada.
5. **Citações.** A Parte I menciona Biber, Universal Dependencies e tradições de análise, mas ainda não traz referências bibliográficas completas. Elas devem ser inseridas na revisão, sobretudo na Parte II, quando as métricas forem apresentadas.
6. **Figuras.** As figuras 1 a 4 ainda precisam ser produzidas: arquitetura em camadas, modelo de dados do projeto, fluxo de reaproveitamento de camadas e armazenamento colunar.
