# Changelog — ttwtools-app

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões: [SemVer](https://semver.org/lang/pt-BR/); a regra está em `CONTRIBUTING.md` (Versão e changelog). O pacote `ttwtools` (submódulo) tem changelog próprio.

## [Unreleased]

## [0.7.0-alpha.1] — 2026-10-04

> Linha **0.7 (experimental)**: a janela do aplicativo passa de pywebview para **Tauri** (Rust), sem mudar a interface nem o servidor.

### Alterado

- **Casca Tauri** no lugar do pywebview: mesma interface (comparação visual idêntica), abertura da interface ≈13 % mais rápida e ≈6 % menos memória no macOS arm64 (`novodesenho/tauri.md`). Diálogos do sistema, exportação, duplo clique em arquivos do TTWtools (também com o aplicativo já aberto) e instância única funcionam como antes.
- **Pacotes pelo CI nos 4 sistemas:** macOS (`.dmg`, arm64 e Intel/macOS 12), Windows (`.zip` portátil) e Linux (`.tar.gz`, precisa de `libwebkit2gtk-4.1` instalado). Sem assinatura nem notarização: no macOS use botão direito → Abrir; no Windows o SmartScreen avisa.

- Pacote `ttwtools` 0.2.0 (commit `30271b9`, tag `v0.2.0`).

## [0.6.0] — 2026-09-30

> Linha **0.6**: abrir arquivos grandes deixa de ser lento, o formato das camadas fica bem menor e Comparar ganha uma barra de comparação, mais gráficos interativos e ícones próprios para cada formato de arquivo.

### Adicionado

- **Ícones próprios para cada formato de arquivo** (`.ttwa`, `.ttwl`, `.ttwal`, `.ttwc`, `.ttwcl`, `.ttwt`) e associação com o aplicativo: bloco único de folhas = um corpus (`.ttwc`), blocos lado a lado = vários corpora (`.ttwa`), contorno = arquivo leve, setas = compactado. **macOS:** o `.app` declara os seis tipos, cada um com o seu ícone (Finder e abrir com duplo clique). **Windows:** `registrar-associacoes.bat` na pasta do pacote (só para o usuário atual, sem administrador; `remover-associacoes.bat` desfaz). **Linux:** `instalar-associacoes.sh` (tipos MIME, ícones e entrada no menu; `--remover` desfaz). Fontes em `assets/icone/arquivos/`, gerados por `assets/icone/make_file_icons.py`.
- **Comparar: barra "Comparação"** no topo, valendo para todas as ferramentas: corpus 2 (ou dois grupos do corpus ativo), **cor de cada lado** nos gráficos e a métrica da KFA. Palavras-chave e Faixas usam o corpus 2 da barra por padrão; novo `reference_where` (`keywords`, `frequency_bands`, rotas e `--reference-where` na linha de comando) compara dois grupos do mesmo corpus.
- **Gráficos de Comparar abrem o texto no Leitor** (redução dimensional, PCA 3D, faixas por texto, mapa de calor e coordenadas paralelas), com o botão voltar trazendo a comparação como estava.
- **Coordenadas paralelas** com controle de opacidade e espessura, destaque de um lado, zoom (roda do mouse ou botões), arrastar e destaque da linha sob o mouse com o nome do texto.
- **Mapa de calor** com zoom global, horizontal e vertical do tamanho dos blocos, rolagem dentro da área do gráfico e títulos por lado.
- **Barras do d** com ordem (maior módulo, crescente ou decrescente), altura ajustável, quantidade e rolagem: mostra todos os atributos, não só os 30 primeiros.
- **|d| mínimo com controle deslizante** (ajuste fino), agora acima dos resultados: só filtra o que já foi calculado, sem recalcular.
- **Leitor:** busca por fragmento de palavra (`const` acha *construction* e *deconstruction*; `*` e `?` mantêm a palavra inteira), busca com contagem e navegação, cópia do texto, marcar a etiqueta do token (caixa e dois cliques), justificação sem hifenizar e palavra que não quebra entre linhas.
- **Exemplos de colocados** clicáveis (abrem o Leitor com o nó marcado) e forma real do nó com curingas; dispersão com as posições relativas.
- **Palavras-chave e Faixas** mostram a camada usada, avisam quando a camada do topo não tem o campo da unidade e pedem recálculo quando a camada muda.
- **Atributo contado** (tags, upos, xpos) na KFA e no Laboratório, com a camada do topo como padrão.

### Alterado

- **Abrir é rápido:** arquivo salvo sem tabelas de busca abre sem montar o índice (arquivo de 139 MB: 0,4 s; antes 66 s na primeira abertura). O índice só é montado quando algo ainda precisa dele (camadas `TCL1` antigas ou recém-criadas), com andamento por etapa.
- **Consultas pelos ids das camadas:** busca, KWIC, frequência, colocados, dispersão, leitura de documento, contagem de etiquetas, tabelas de atributos (KFA), palavras-chave e faixas leem os ids direto (mesmo resultado do SQL). A KFA entre dois corpora caiu de 70 s para 5 s no arquivo de teste.
- **`TCL2` é o único formato gravado** e ficou menor: posições relativas (1 byte em vez de 4), `tags` omitida quando repete `xpos` e léxico por frequência. Arquivo de teste: 139 → 102 MB (de `TCL1`: 177 → 101 MB), 26,5 milhões de tokens idênticos. Salvar converte as camadas `TCL1`/JSON antigas; arquivos `TCL1` continuam abrindo. **Arquivos salvos nesta versão não abrem em versões anteriores do TTWtools.** A variável `TTWTOOLS_LAYER_FORMAT` foi removida.
- **"KFA2" passou a se chamar "KFA ponderada"** (desvio-padrão combinado pelo tamanho de cada lado); a KFA de Biber & Egbert usa a média simples das variâncias. Os identificadores `kfa` e `kfa2` (linha de comando e API) não mudaram.
- **KFA** mostra o andamento por documento contado e **reaproveita o resultado** guardado no projeto (mesmos parâmetros e mesmas camadas); repetições não se acumulam. As tabelas de atributos ficam em memória: o detalhe de um atributo e a galeria não recontam os corpora. Resultados derivados (KFA etc.) entram no arquivo sem ativar o aviso "não salvo".
- Vocabulário: *feature* passa a se chamar **atributo** em toda a interface, ajuda e mensagens.
- Arquivos de exemplo de `ttwa_files/` (Git LFS): `lemas_tcl2.ttwa` e `lemas_tcl2_comtabelas.ttwa` no lugar dos projetos antigos.

### Corrigido

- **Comparar** (palavras-chave, KFA, faixas, galeria de gráficos e Laboratório) calcula como **tarefa com andamento** (`?async=1`), em vez de uma requisição parada até o fim: o WebKit derruba requisições sem resposta por ~60 s, o que aparecia como "sem conexão com o servidor local" em máquinas lentas (Mac Intel). Falhas isoladas de rede ao consultar o andamento são repetidas.
- Barra de progresso própria (o `<progress>` nativo aparecia como barra cheia e parada no macOS 12): faixa deslizante quando o andamento é desconhecido e largura real quando há porcentagem; barras em etapas na abertura e no salvamento.
- As linhas da tabela de resultados da KFA passam a ter foco de teclado (falha de acessibilidade apontada pelo teste de ponta a ponta).

### Verificação

- Testes: 268 do pacote, 58 do servidor, 37 da interface e 27 de ponta a ponta (Playwright, nas três larguras). **Não testado** nesta versão: Mac Intel e macOS 12 em máquina real, Windows e Linux em máquina real (só o CI), associação de arquivos e ícones nos sistemas instalados.

- Pacote `ttwtools` 0.2.0 (commit `30271b9`, tag `v0.2.0`).

## [0.6.0-alpha.1] — 2026-09-30

> Linha **0.6** (desenvolvimento): novo armazenamento de corpora e análises, em **beta** (mais leve, leitura de todos os formatos anteriores). Plano em `novodesenho/armazenamento.md`.

### Adicionado

- **Compactar projeto** (Arquivo → Mais opções; `ttwtools compact`; `POST /api/project/compact`): remove as cópias antigas das etiquetagens (`tagged_files`) que já estão nas camadas, conferindo token a token; simula primeiro e pede confirmação. No projeto de teste, o banco foi de 2.979 para 2.066 MB.
- **Checagem de espaço livre** antes de salvar, salvar como, exportar, abrir arquivo compactado e importar: a operação é recusada com mensagem clara (pt/en), sem criar nada.
- **Uso de disco** (Módulos): o que ocupa disco (cópias de trabalho e cache), botão "Limpar restos" e aviso ao iniciar quando havia lixo grande; `ttwtools cache list|clear`. Cache com limite (`cache_limit_mb`, padrão 5 GB) e remoção do menos usado.
- **Índice de busca em cache** (beta): arquivos salvos sem tabelas de busca abrem com o índice guardado neste computador (construído uma vez, com barra de progresso por etapa); a 2ª abertura leva ~1 s em vez de ~1 min e a cópia de trabalho fica pequena. `ttwtools index status|build|clear`; desliga com `TTWTOOLS_INDEX_CACHE=0`.
- Camadas empacotadas em **formato colunar** (`TCL1`), ~45% menores que JSON+zlib; arquivos antigos continuam abrindo.

### Alterado

- Índices da tabela de tokens reduzidos de 7 para 5 (os de `word`/`lemma` simples não eram usados): −21% no arquivo, mesma velocidade. Arquivos antigos os perdem ao abrir.
- Exportar `.ttwcl` do corpus grande do projeto de teste: 466 → 104 MB.

### Corrigido

- Gravação cancelada ou com falha deixava um arquivo `.part` ao lado do destino; abrir arquivo compactado que falhava na descompressão deixava a pasta de trabalho.

- Pacote `ttwtools` 0.2.0.dev0 (commit `4573ab7`).

## [0.5.0] — 2026-09-29

### Adicionado

- Projetos **salvos compactados por padrão**, com opções visíveis ao salvar: compactar e guardar as tabelas de busca (sem elas o arquivo fica bem menor e as tabelas são recriadas ao abrir); aviso "não salvo" e confirmação ao fechar (6.2a).
- Formatos **.ttwc** e **.ttwcl** para guardar um corpus só, com as camadas e análises dele ("Salvar corpus…") (6.2a).
- **Etiquetagem**: tela própria para acrescentar camadas ao corpus (estatísticas básicas e etiquetadores, com as opções de cada um); as escolhas vão para uma lista "A executar" guardada no projeto e executada numa etapa só, que pode ser ampliada depois; `ttwtools pipeline` faz o mesmo na linha de comando (6.2a).
- Andamento de "Executar análise e etiquetagem": porcentagem geral e por tarefa, passo atual, tempo decorrido e estimativa (6.2a).
- **Módulos**: área própria para modelos de etiquetagem (spaCy e Stanza, em inglês e português) e corpora do catálogo, com o que cada um faz, fonte, licença, dados de treino e tamanho; `ttwtools catalog models` mostra as mesmas fichas (6.2a).
- **Redesign da interface** (`novodesenho/interface.md`): temas laranja/cinza/preto (claro, escuro, alto contraste), fonte Inter empacotada, densidade compacta, componentes base próprios, cabeçalho com chips de camada e corpus, menus de idioma e tema, menu lateral só com ícones e dica animada, ícones duotone. Componentes adaptados do Vue Bits sem dependências novas (`novodesenho/interface.md`, seção 3).
- **Leitor**: etiquetas em coluna única com ordenação (ocorrências no texto, no corpus, alfabética, grupo), dica com a descrição da etiqueta segundo o etiquetador (documentação oficial do MFTE 1.6 e descrições inferidas, marcadas como tal), seletor de cor (roda, paletas, hex), gaveta de etiquetas em telas curtas, zoom, tamanho de fonte e justificação da folha, voltar/avançar; abre já no texto clicado na Dispersão e no KWIC.
- **Dispersão** compacta, com altura de linha ajustável; clicar num texto abre o leitor.
- `ttwtools tag-counts` e `/api/corpora/{corpus}/tag-counts`: ocorrências de cada etiqueta no corpus.
- Dica global das etiquetas (KWIC, Frequência por classe, painel do token).
- Abrir e salvar arquivos em modal de progresso.
- **Exportar** em Arquivo: um corpus (`.ttwc`, textos dentro; `.ttwcl`, textos ao lado) ou um **pacote leve com vários corpora** (`.ttwal`), à escolha; `ttwtools save-as DEST.ttwal --corpus A --corpus B`, `save_corpora_as()` e `POST /api/project/saveas` com `corpora` (a exportação é uma cópia: o projeto aberto não muda).
- **Comparar**: modal de progresso enquanto calcula (palavras-chave, KFA e gráficos, faixas, Laboratório) e legenda ligando cada cor ao nome do corpus ou grupo.
- **Ícone novo** do aplicativo e favicon da interface (`assets/icone/`, gerado por `make_icons.py`).

### Alterado

- "Corpora" passa a se chamar **Arquivo**, com Novo, Abrir, Salvar e Salvar como; projetos .ttwt têm Salvar de verdade e pergunta antes de trocar de projeto (6.2a).
- Corpora não calcula nem etiqueta mais: a visão geral mostra o que já foi calculado e aponta para Etiquetagem (6.2a).
- Assistente "Adicionar corpus" em dois passos: as informações sobre os textos (metadados) viraram um painel opcional recolhido, com os pedaços do nome de um arquivo real, pré-visualização e planilha CSV como alternativa (6.2a).
- Projeto com **Novo projeto…**, **Abrir projeto…** e **Salvar cópia…** pelos diálogos do sistema; digitar o caminho fica num painel recolhido (6.2a).

### Corrigido

- "Novo projeto…" sobre um arquivo existente falhava mesmo depois de o diálogo do sistema confirmar a substituição; no caminho digitado, a tela oferece "Substituir" (6.2a).
- Depois de recompilar a interface com a janela aberta, as telas carregadas sob demanda (Explorar, Comparar...) não abriam; agora a página recarrega no destino (6.2a).
- Projetos de versões anteriores grandes pareciam não abrir: a atualização de formato agora mostra o progresso, pode ser cancelada e retoma de onde parou, e ficou bem mais rápida (6.2a).
- "Salvar como" podia deixar de fora as alterações mais recentes (ainda no WAL do SQLite); trabalho feito num projeto aberto de .ttwt se perdia ao abrir outro projeto (6.2a).
- Caminhos com `~` (ex.: `~/projeto.ttwa`) davam "unable to open database file" (6.2a).
- Depois de instalar um corpus ou baixar um modelo, a lista só se atualiza quando a tarefa termina (6.2a).
- KWIC e ferramentas de Explorar não ficam mais em branco em camadas sem UPOS/XPOS (BiberPlus, MFTE); `tag=` cai para UPOS/XPOS em camadas sem tags (spaCy, Stanza).
- Ferramentas de Explorar e Comparar mostram aviso (e recarregam uma vez) se o arquivo delas sumir depois de a interface ser recompilada com a janela aberta.
- Lista de recentes não mistura mais arquivos de teste; recentes só no menu Recentes.

- Pacote `ttwtools` 0.2.0.dev0 (commit `a93269c`).

## [0.4.0-rc.1] — 2026-09-27

### Adicionado

- Catálogo de corpora: pacotes com ficha e licença conferida, instalação com conferência de hash, remoção e aviso de atualização, pela interface (Corpora → Catálogo) e por `ttwtools catalog` (4.1–4.2).
- Download de modelos spaCy e Stanza sob demanda para a pasta de dados do usuário, fora do binário (4.2).
- Scripts de preparo dos corpora do catálogo em `tools/corpora/`: demonstração (Gutenberg), Brown, UD English EWT e receita do LOB (4.3).
- Listas de referência do catálogo (`catalog:<id>`) nas palavras-chave, pacotes só de listas e **faixas de frequência lexical** (Comparar → Faixas de frequência; `ttwtools bands`) (4.4).
- **Laboratório** (experimental) em Comparar: N grupos por metadado ou corpus — um contra todos, par a par, Kruskal-Wallis, PCA, dendrograma e "meu texto contra referências"; `ttwtools compare --group-by/--group` (5.1).
- Importadores de **TEI XML/BNC XML** e do standoff **GrAF (OANC/MASC)**, pela linha de comando (`import --format tei|graf`) e pelo assistente "Adicionar corpus"; receita `tools/corpora/masc.py` (5.2).
- **Português**: modelos spaCy `pt_core_news_*` e Stanza em português, sugeridos automaticamente para corpora em português; idioma do corpus detectado para as palavras funcionais; UD Portuguese Bosque como referência (`tools/corpora/ud.py`) (5.3).
- Documentação: LEIAME/README para quem usa, `CONTRIBUTING.md`, `RELEASING.md` revisto (hoje dentro do `CONTRIBUTING.md`); no pacote, guia rápido e referência de todas as funções (6.1).

### Removido

- Interface antiga (`frontend-src/`, JS puro) e o build dela versionado em `frontend/`; a interface Vue é a única, e o build dela passa a sair em `frontend/` (fora do git). Rotas sem uso na interface nova: `/api/analysis`, `/api/quickrun`, `/api/tags`, `/api/viz` (3.11).

### Corrigido

- Testes da interface (Vitest) não tentam mais rodar o teste de ponta a ponta do Playwright (4.4).
- Buscas por lema ou classe sem camada escolhida usam a camada que tem esse campo (antes podiam cair numa camada sem lema e dar zero) (6.1).

- Pacote `ttwtools` 0.2.0.dev0 (commit `1d318a8`).

## [0.4.0-alpha.1] — 2026-09-26

Linha nova **0.4.0** (reformulação; histórico em `novodesenho/memoria_para_IA.md`).

### Adicionado
- Versão única: `pyproject.toml` é a fonte; `app/_version.py` expõe `__version__`, `python -m app --version` e `GET /api/version` (app, `ttwtools`, commit). `RELEASING.md` (hoje `CONTRIBUTING.md`) com a regra de versão. (passo 0.2)
- Build único `build/build.py` (macOS arm64/Intel, Windows, Linux) com `--selftest` no binário, `build/check_macos_min.py` e pacotes `TTWtools-<versão>-<so>-<arq>`. Mínimo: macOS 12.0 (Intel) e 12.3 (Apple Silicon). (passo 0.3)
- CI a cada push (testes, frontend) e pipeline de release em 4 sistemas (macOS arm64 e Intel, Windows, Linux) com autoteste do binário e release em rascunho. (passo 0.4)
- Pacote `ttwtools`: testes, linha de comando `ttwtools` (passo 1.1); esquema de projeto v0.3 com camadas, tokens e projetos leves `.ttwl` (passo 1.2). Importação de corpus com metadados por documento, filtros e tokenização simples (passo 1.3). Etiquetagem com cache de camadas: não reprocessa o que já foi feito (passo 1.4). Opções e tagsets dos taggers descritos em dados, com explicações em pt/en, predefinições e disponibilidade por sistema (passo 1.5). Formatos CoNLL-U, VRT, palavra/TAG e tabelas de tokens (passo 1.6). Estatísticas descritivas do corpus com cache (passo 1.7). Busca, KWIC, frequência, colocados e dispersão, também sem tagger (passo 1.8). Palavras-chave contra referência com avisos de comparabilidade (passo 1.9). Ajuda em pt/en no pacote e `ttwtools help` (passo 1.10).
- Servidor: registro único de tarefas com cancelamento (`/api/jobs`), `/api/health`, importação por fonte de corpus (`/api/corpora/import`), projetos `.ttwl` nas rotas; corrigido o erro 500 com NaN nas tabelas de traços. (passo 2.1)
- Rotas dos recursos novos (taggers, visão geral, explorar, palavras-chave, ajuda, traduções) e "copiar como código" (`/api/code`). (passo 2.2)
- Processo de release: `build/release.py` (com `--dry-run`), `RELEASING.md` completo (hoje dentro do `CONTRIBUTING.md`) e `build/release_github.sh` para pacotes feitos localmente. (passo 0.5)
- Interface nova em Vue 3 (`frontend-vue/`, `TTW_UI=vue`): casca responsiva com corpus ativo, tema claro/escuro/alto contraste, pt/en, tarefas com progresso e cancelamento, tela Corpora (projeto, importar com metadados, visão geral, camadas). (passos 3.1–3.4)
- Tela de etiquetagem: escolha de tagger, "ver tags", "Personalizar" gerado do descritor, predefinições e aviso de reaproveitamento. (passo 3.5)
- Tela Explorar: busca, KWIC (abre o texto na ocorrência), frequência, colocados, dispersão e leitor com etiquetas coloridas. (passo 3.6)
- Tela Comparar: palavras-chave contra outro corpus, grupos ou lista, e KFA a partir das camadas (mesmo resultado da versão anterior) com detalhe do traço. (passo 3.7)
- Ajuda na interface: balões, tour guiado, "Explicar esta tela", destino Aprender e visual interativo do d de Cohen. (passo 3.8)
- Exportar tabelas (CSV/TXT), gráficos (SVG/PNG) e camadas (CoNLL-U, VRT, CSV); "copiar como código" em cada análise. (passo 3.9)
- Testes de ponta a ponta (Playwright) e verificação de acessibilidade (axe, WCAG 2.2 AA) em 3 larguras e 3 temas, no CI; correções de contraste e de foco. (passo 3.10)
- Interface nova cobre o que a antiga fazia: abrir .ttwt e arquivo pendente, salvar como, exportar projeto, galeria de gráficos da KFA (11 tipos, 3D sob demanda) e impressão do leitor. (passos 3.7 e 3.11)

### Alterado
- Versão do app corrigida de `0.1.0` (desatualizada) para `0.4.0.dev0`; Python mínimo passa a 3.11. (passo 0.2)

- Pacote `ttwtools` 0.2.0.dev0 (commit `3e29ac8`).

## [0.3.7] — 2026-05-05

### Alterado
- Novas visualizações e gráficos (heatmap, visualizador de texto com anotação estilo "rough notation") e correções de impressão. _(Entrada reconstruída a partir do histórico do git.)_

## [0.3.6] — 2026-05-05

### Interface — uniformização de diálogos de arquivo

- **Botão "Escolher pasta…" movido para a esquerda** em todos os campos de caminho (exportar e salvar como), tornando o layout consistente com o formulário de nova análise.
- **Salvar como**: botão passa a exibir texto ("Escolher pasta…") em vez de ícone; pasta escolhida popula automaticamente nome de arquivo sugerido (stem do projeto atual + extensão selecionada).
- **Memória de última pasta por contexto** — cada diálogo lembra sua própria pasta via localStorage:
  - Abrir `.ttwa`/`.ttwt` → `last_ttwa_folder`
  - Salvar como → `last_saveas_folder`
  - Exportar projeto → `last_export_folder`
  - Corpus / saída nova análise → `qr_last_corpus_folder` / `qr_last_output_folder` (já existiam)
- **`pick-file` aceita `default_location`** (backend `utils.py` + `api.js`): o seletor nativo abre na última pasta usada.
- **`pick-file` aceita `.ttwt`**: adicionado ao filtro de tipos no seletor macOS/tkinter.

## [0.3.5] — 2026-05-05

_Versões 0.3.1 a 0.3.5 só ajustaram o CI (submódulo privado, `en_core_web_sm` no Python 3.14, ícone do DMG, runner Intel desativado). Sem mudança de funcionalidade._

## [0.3.0] — 2026-05-04

_Mudanças feitas em 2026-05-01 e publicadas na primeira tag da série 0.3._

### Frontend (frontend-src/)

#### Correções de interface (UI)

##### Barra de progresso do Tagging (step 2 — Nova análise)
- **Removido efeito shimmer** da barra de progresso (`::after` com `animation: bar-shimmer`). A barra agora exibe uma cor sólida estática crescendo à medida que o percentual aumenta.
- **Removida animação bounce indeterminate** (`::before` com `animation: bar-bounce`). Em vez disso, quando ainda não há percentual disponível, a barra mostra um segmento mínimo de 5% para indicar visualmente que o tagger está ativo.
- **Corrigido bug de barra invisível**: a função `updateTaggerBar` executava `fill.style.display = 'none'` quando `pct=0`, resultando em barra completamente invisível. Agora a barra permanece sempre visível: `0%` (aguardando) → `5%–pct%` (em andamento) → `100%` verde (concluído) / `100%` vermelho (erro).
- **Arquivos alterados**: `frontend-src/src/style.css`, `frontend-src/src/views/quickrun.js`

##### Eixo Y do gráfico KFA no modo claro
- Garantido contraste adequado dos rótulos do eixo Y SVG no tema claro via regra CSS:
  `[data-theme="ttwlight"] #chart-wrapper svg text { fill: oklch(15% 0.01 260) !important; }`
- **Arquivo alterado**: `frontend-src/src/style.css`

##### Tela KFA via aba lateral (`KFA` no menu)
- **Removidos selects de Tagger 1 / Tagger 2** — o tagger é agora detectado automaticamente a partir dos dados disponíveis no projeto.
- **Auto-populate ao abrir**: ao navegar para a aba KFA, um `MutationObserver` chama `_autoPopulateFromProject()`, que consulta `api.analysis.listKfa()` para obter o par de corpora já analisado e pré-seleciona `Corpus 1` / `Corpus 2` automaticamente.
- **Detecção automática de taggers**: após os corpora serem definidos, `_loadAllFeatures()` tenta todos os 7 taggers (`biberplus`, `mfte`, `mfte_ext`, `stanza_upos`, `stanza_xpos`, `spacy_upos`, `spacy_ptb`) e exibe um painel de checkboxes por tagger com features disponíveis — idêntico ao step 3 do fluxo nova análise.
- **Múltiplos KFAs**: ao executar, itera pelos painéis detectados e dispara um `runKfa` por tagger, adicionando cada resultado como nova camada de análise ao `.ttwa`.
- **Arquivos alterados**: `frontend-src/index.html`, `frontend-src/src/views/analysis.js`

##### KFA via sidebar após nova análise
- Adicionado `refreshCorpusSelects()` no handler do evento `project-changed` em `main.js`. Com isso, ao concluir um quickrun (que cria/atualiza o projeto), os selects de corpus na tela KFA e Tagging são atualizados imediatamente, permitindo que `_autoPopulateFromProject()` encontre as opções e pré-selecione os corpora.
- **Arquivo alterado**: `frontend-src/src/main.js`

##### Rótulos descritivos em botões de browse
- Substituído o ícone `📁` no botão de pasta de destino da tela Exportar por `"Escolher pasta"`. Todos os demais botões de seleção de pasta/arquivo já possuíam rótulos textuais informativos ("Corpus 1…", "Corpus 2…", "Salvar em…").
- **Arquivo alterado**: `frontend-src/index.html`

##### Tema automático por horário do sistema
- O tema inicial agora é determinado pelo horário local do computador: entre **08h00 e 18h00** → tema claro (`ttwlight`); fora desse intervalo → tema escuro (`ttwdark`).
- Se o usuário alternar manualmente via botão 🌙/☀️, a escolha é salva no `localStorage` e prevalece nas sessões seguintes.
- **Arquivo alterado**: `frontend-src/src/main.js`

---

### Arquivos modificados nesta sessão

| Arquivo | Tipo de mudança |
|---|---|
| `frontend-src/src/style.css` | Remoção de shimmer/bounce nas barras; contraste eixo Y modo claro |
| `frontend-src/src/views/quickrun.js` | Correção de `updateTaggerBar` — barra sempre visível |
| `frontend-src/src/views/analysis.js` | Auto-detect taggers; auto-populate corpus; painéis de tags |
| `frontend-src/src/main.js` | Tema por horário; `refreshCorpusSelects` no `project-changed` |
| `frontend-src/index.html` | Remoção de selects de tagger; botão "Escolher pasta" |
| `frontend/` | Rebuild (assets atualizados: `index-C44bMuvf.js`, `index-Dv9u83w3.css`) |

[Unreleased]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.7.0-alpha.1...HEAD
[0.7.0-alpha.1]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.6.0...v0.7.0-alpha.1
[0.6.0]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.6.0-alpha.1...v0.6.0
[0.6.0-alpha.1]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.5.0...v0.6.0-alpha.1
[0.5.0]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.4.0-rc.1...v0.5.0
[0.4.0-rc.1]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.4.0-alpha.1...v0.4.0-rc.1
[0.4.0-alpha.1]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.7...v0.4.0-alpha.1
[0.3.7]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.6...v0.3.7
[0.3.6]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.5...v0.3.6
[0.3.5]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.0...v0.3.5
[0.3.0]: https://github.com/luaguiaroliveira/ttwtools-app/releases/tag/v0.3.0
