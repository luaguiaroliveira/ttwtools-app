# Plano de implementação — novo armazenamento (beta da 0.6)

Fonte única de andamento desta frente. **Leia só este cabeçalho e o passo atual** (`grep -n '^### ' novodesenho/plano_armazenamento.md`). Análise, medidas e alternativas: `novodesenho/armazenamento.md` (consulte só a seção citada no passo). Pendências gerais: `novodesenho/pendencias.md`. Regras do repositório: `AGENTS.md`.

## Estado atual (atualizar ao fim de cada passo)

- **Passo atual:** **B3 concluído** (Fase A também; decisão do usuário 2026-09-30: começar pelo B3, Mac Intel é referência). Próximo: a definir com o usuário (ver Relato do B3: B1/B2 ou decidir a "pronto para abrir")
- **Versão:** `0.6.0.dev0` · **branch:** `new_set26` · **ponto de retorno:** tag local `pre-armazenamento-0.6`
- **Decisões do usuário (2026-09-29):** `.ttwa` = **manifesto** (referencia corpora + guarda resultados); formato de trabalho novo = **pasta-pacote** (ZIP só para enviar); **índice de busca em cache**, com **barra de progresso clara em cada etapa**; **léxico compartilhado por corpus**; **corpora clássicos = só perfil de frequência + features**; **começar pela Fase A** e decidir a B depois de medir.
- **Diretrizes:** o mais **leve**, de **fácil computação em máquina antiga** (só biblioteca padrão: `zipfile`, `zlib`, `sqlite3`, `json`, `struct`; nada de `zstandard`, `pyarrow`, DuckDB; Mac Intel = Python 3.11, macOS 12) e **retrocompatível**: todo formato atual (`.ttwa`, `.ttwl`, `.ttwc`, `.ttwcl`, `.ttwal`, `.ttwt`; esquemas v0.1–v0.3) continua legível para sempre; o formato novo é **opt-in, rotulado "beta"**; conversão nunca apaga o original; sempre exportar de volta ao formato clássico.
- **Terminologia:** usar **features** (não "traços") na documentação e na interface.

## Como trabalhar (curto)

1. **Um passo por vez.** Ao concluir: marque `[x]`, preencha o **Relato**, atualize "Estado atual", rode os testes do que mexeu e faça **um commit** `[A1] mensagem curta em português` (sem coautoria de agente; nunca `git add -A`; adicione arquivos pelo nome). Depois pare ou siga ao próximo; **em sessão nova, comece em "Estado atual"**.
2. **Submódulo:** a lógica vive em `libs/ttwtools/ttwtools`; commit e `git push` **dentro dele primeiro**, depois o ponteiro no app. Rota fina em `app/routes`, tela só apresenta. Todo recurso novo = função pública + subcomando + rota + tela; textos por chave de tradução (`pt` e `en`, em `libs/ttwtools/ttwtools/data/i18n/ui.*.json`); depois de mexer em função pública: `cd libs/ttwtools && python docs/gerar_referencia.py`.
3. **DISCO (o usuário já teve 71 GB de lixo temporário):** antes de qualquer teste que abra `ttwa_files/*` (3 GB descompactados) confira `df -h /` (mínimo de 20 GB livres); rode um processo longo por vez, **sempre com o usuário sabendo**; apague o que criar (`ls -d $TMPDIR/ttw_* $TMPDIR/../T/ttw_*`); nunca deixe monitor ou processo em segundo plano sem necessidade. Teste com projetos **pequenos gerados nos testes**; use o projeto real só nas medições marcadas.
4. **Testes:** `pytest libs/ttwtools/tests -q` e `pytest tests -q` (ambiente `conda activate ttw314`); `cd frontend-vue && npm test && npm run e2e` só ao fim de passos de tela. Cada passo acrescenta teste, inclusive **"não deixa lixo temporário"**.
5. **Não recompilar o pacote** (PyInstaller) até o usuário pedir; rodar por `python -m app --mode desktop|web`.

## Fase A — sem mudar o formato (entra como beta da 0.6)

### A1 Compactar projeto: remover `tagged_files` legados
- Contexto: `tagged_files` (304 MB no projeto real, 290 MB do `.ttwcl` leve) é cópia legada da saída dos etiquetadores (v0.1/0.2); etiquetagens novas **não** a preenchem (medido). As camadas (`layers` + tokens ou `layer_blobs`) já têm o conteúdo.
- **Fazer:**
  - [x] `ttwtools.project.compact_project(project, dry_run=True, progress=None)`: para cada `tagged_files` (corpus, arquivo, etiquetador) confirma que existe camada equivalente (mesmo documento; tokens iguais **token a token** ao decodificar o JSONL); só então apaga. Devolve relatório (removidos, mantidos com motivo, bytes liberados). **Nunca remove o que não conseguir provar equivalente.**
  - [x] Subcomando `ttwtools compact PROJETO [--dry-run]`; rota `POST /api/project/compact` (tarefa com progresso); botão "Compactar projeto (remover cópias antigas)" em Arquivo → Mais opções, com o efeito explicado e confirmação; `VACUUM` no fim (documentar o pico de disco).
- **Pronto quando:** teste com projeto sintético v0.2 migrado (tagged_files + camadas) remove só os equivalentes, mantém o resto e os resultados de busca/KWIC não mudam; `--dry-run` não altera nada; medição no projeto real (uma vez) mostra o ganho.
- **Relato:** `compact_project(project, dry_run=True, progress=None)` em `project.py` (exportada; subcomando `ttwtools compact PROJETO [--dry-run]`; rota `POST /api/project/compact` como tarefa, com etapas `check` e `vacuum`; botão "Compactar projeto (remover cópias antigas)" em Arquivo → Mais opções: simula, mostra quantas cópias e MB saem e o que fica, e só remove após "Remover agora"; textos pt/en). Equivale = mesmo documento, ferramenta, versão, modelo e configuração, e tokens iguais token a token (lê `tokens` ou, sem tabelas de busca, `layer_blobs`). **Única tolerância:** em Stanza/spaCy os arquivos `_upos` e `_xpos` compartilham uma camada cuja coluna `tags` guarda a de um só; o outro arquivo difere apenas em `tags` = `[upos]`/`[xpos]` do mesmo token, informação que a camada já tem, e é aceito. Motivos de "mantido": `not_jsonl`, `no_document`, `no_layer`, `tokens_differ`. `VACUUM` no fim, precedido e seguido de `wal_checkpoint(TRUNCATE)` para o tamanho medido ser real. Nota: depois de compactar, o Exportar deixa de oferecer os arquivos `tagged/…` (vêm de `tagged_files`); as camadas seguem exportáveis. Testes: `tests/test_compact.py` (6) e `tests/test_routes_compact.py`, com "sem lixo temporário".
  - **Medição no projeto real** (cópia do `_novo.ttwa`, 10.675 cópias): simulação 103 s, remoção + VACUUM 119 s; **10.675 removidas, 0 mantidas**; banco **2.979 → 2.571 MB** (−408 MB; o conteúdo das linhas era 295 MB comprimido); camadas e nº de tokens (18.978.656) idênticos. Sem a tolerância de `tags`, 3.050 ficavam como `tokens_differ`. Cópia apagada; disco sem resíduo.

### A2 Checar espaço livre antes de gravar
- **Fazer:**
  - [x] `ttwtools.storage.ensure_free_space(path, needed_bytes, what)` (usa `shutil.disk_usage`); estimativas: salvar/salvar como (tamanho do banco + margem), exportar (estimativa por corpus), abrir compactado (tamanho descompactado lido do cabeçalho gzip quando possível, senão 3× o arquivo). Erro `InsufficientDiskSpace` com valores; mensagem traduzida na tela.
  - [x] Chamar em salvar, salvar como, exportar, abrir arquivo compactado, importar; teste com `monkeypatch` de `disk_usage`.
- **Pronto quando:** operação recusada com mensagem clara **antes** de criar qualquer arquivo; nenhum resíduo.
- **Relato:** novo módulo `ttwtools/storage.py` (só biblioteca padrão): `ensure_free_space(path, bytes, what)` (sobe até uma pasta existente; não cria nada), `InsufficientDiskSpace` (com `code` e `params` para a tela), `with_margin` (+10% + 64 MB), `estimate_open` (ISIZE do cabeçalho gzip quando plausível; senão 3× o arquivo). Chamado em: `save_project_as` (destino e, sem tabelas de busca, também a pasta temporária; antes de criar a pasta de destino), `save_corpus_as`/`save_corpora_as` (fração dos documentos × tamanho do banco), `decompress_project_file`/`decompress_from_ttwt` (abrir), `import_corpus` (2× o tamanho dos textos), rota `/export` (`estimate_export_bytes`: textos ×2, etiquetados ×5, tabelas ×2) e rota `saveas` com troca de projeto (cópia de trabalho). `TTWAProject.open` agora apaga a pasta de trabalho se a descompressão falha (antes vazava). Erros: rota síncrona → HTTP 507 com `{code, what, needed_mb, free_mb, path}`; tarefa → `error_code`/`error_params` (novo `jobs.error_fields`); CLI → mensagem e código 1. Tela: `error.disk_space` e `disk.what.*` (pt/en), em `errors.js` e `JobProgress`. Testes: `tests/test_storage.py` (8) e `tests/test_routes_storage.py` (`monkeypatch` de `shutil.disk_usage`, sem resíduo em pasta nova nem em `ttw_*` temporários). Limite conhecido: o ISIZE do gzip dá a volta em 4 GB (usa 3× se o valor fica menor que o arquivo); a migração v0.3 depois de abrir não é estimada.

### A3 Pastas de trabalho e cache num só lugar, com dono, limite e limpeza
- **Fazer:**
  - [x] Módulo `ttwtools.storage`: `workdir(kind)` (cópias de trabalho, exportações, empacotamento; hoje `make_workdir` em `project.py`) e `cache_dir()` (índices e derivados; `platformdirs.user_cache_dir`, já usado pelo catálogo); marca `owner.pid`; registro de uso (tamanho, último uso).
  - [x] Limite configurável do cache (padrão sugerido: 5 GB) com remoção LRU; `purge_orphans()` reúne o que já existe; limpeza ao iniciar e ao sair.
  - [x] `ttwtools cache list|clear`; rota `/api/utils/disk-usage`; painel **Uso de disco** em Recursos (o que é, quanto ocupa, botão limpar) com aviso quando houver lixo grande ao iniciar.
  - [x] Teste (fixture reutilizável) que garante **nenhum arquivo residual** depois de abrir, salvar, exportar, cancelar e falhar.
- **Pronto quando:** matar o processo no meio de uma exportação e reiniciar apaga os restos; o painel mostra o uso.
- **Relato:** tudo em `ttwtools/storage.py`. **Pastas de trabalho:** `workdir(kind)` (`work`/`export`/`pack`), `make_workdir` (agora só delega; `project.make_workdir`/`purge_orphan_workdirs` continuam existindo), `owner.pid`, `list_workdirs()` (tamanho, dono vivo ou não, idade), `purge_orphans()` (dono morto ou, sem marca, mais de 24 h; guarda em `last_purge` o que apagou), `release_own_workdirs()`. **Cache:** `cache_dir()` (`platformdirs.user_cache_dir("TTWtools")`; `TTWTOOLS_CACHE_DIR` muda), `cache_entry(key)`/`touch_cache` (marca de uso em `.last_used`), `cache_entries()`, `enforce_cache_limit()` (LRU; limite = `cache_limit_mb` do `settings.json`, padrão 5 GB), `clear_cache()`. `disk_usage()` e `cleanup(exit=)` reúnem tudo. **Quando roda:** o app limpa órfãs e aplica o limite ao iniciar; ao sair (atexit e `/quit`) apaga as pastas do próprio processo. **CLI:** `ttwtools cache list|clear`. **Rotas:** `GET /api/utils/disk-usage`, `POST /api/utils/disk-usage/clear` (apaga cache e órfãs; o que está em uso fica). **Tela:** painel "Uso de disco" em Módulos (Recursos) com o que é, quanto ocupa, detalhes recolhidos e botão "Limpar restos"; faixa de aviso no topo do Arquivo quando há ≥ 1 GB de restos (apagados ao iniciar ou ainda lá). **Vazamento achado pelo teste e corrigido:** `save_project_as` deixava `X.part` se a gravação fosse cancelada ou falhasse. Testes: `tests/test_storage_dirs.py` (8; inclui matar um processo no meio da criação de uma pasta de exportação e o reinício apagar o resto) e fixture reutilizável `no_temp_residue` em `tests/conftest.py` (abrir, salvar, salvar sem tabelas, exportar, cancelar, falhar), mais `test_disk_usage_routes`. O cache ainda não guarda nada: quem o usa é a Fase B (B3).

### A4 Índices: medir e enxugar
- **Fazer:**
  - [x] Benchmark (script em `libs/ttwtools/tests/` ou `tools/`, sobre um projeto **sintético grande** de ~2 M de tokens, não o real) do KWIC, frequência, colocados e dispersão com os 7 índices atuais × conjunto reduzido (`lower(word)`, `lower(lemma)`, `doc`, `upos`, `xpos`).
  - [x] Se a perda for aceitável, reduzir; índices continuam recriáveis; `rebuild_search_tables` cria o conjunto novo; arquivos antigos abrem e são atualizados sob demanda.
- **Pronto quando:** tabela antes/depois (tamanho e tempo) no Relato; decisão registrada.
- **Relato:** `libs/ttwtools/tools/bench_indexes.py` (projeto **sintético** Zipf de 2 M de tokens, 200 documentos; apaga tudo ao fim; mediana de 3 execuções). Medido em 2026-09-29 (Mac Apple Silicon):

  | conjunto | arquivo (MB) | criar índices (s) | KWIC forma | KWIC lema+classe | KWIC classe | busca | frequência (lema) | colocados | dispersão |
  |---|---|---|---|---|---|---|---|---|---|
  | antigo (7) | 267,7 | 3,88 | 0,033 s | 0,012 s | 0,052 s | 0,017 s | 1,94 s | 1,67 s | 0,060 s |
  | **reduzido (5)** | **211,7** | **2,72** | 0,033 s | 0,011 s | 0,050 s | 0,016 s | 1,81 s | 1,66 s | 0,061 s |
  | mínimo (3, sem upos/xpos) | 157,6 | 1,64 | 0,034 s | 0,006 s | 0,106 s | 0,016 s | 1,83 s | 1,67 s | 0,061 s |
  | nenhum | 78,1 | 0 | 0,308 s | 0,313 s | 0,205 s | 0,150 s | 1,79 s | 1,81 s | 0,195 s |

  **Decisão:** adotado o **reduzido (5)**: `lower(word)`, `lower(lemma)`, `doc_id`, `upos`, `xpos`. Saem os índices simples de `word` e `lemma`, que nenhuma consulta usa (todas comparam `lower(...)`): −21% no arquivo (−56 MB em 2 M de tokens), −30% ao criar, tempos iguais. O "mínimo" é 41% menor, mas dobra o KWIC por classe (`pos=`), então não foi adotado. Frequência e colocados varrem a tabela (índice não ajuda) e dispersão e busca dependem só dos índices de forma. Arquivos antigos abrem normalmente: ao abrir, `_connect` apaga `idx_tokens_word`/`idx_tokens_lemma` (`_OBSOLETE_INDEXES`; o espaço é reaproveitado e o arquivo encolhe no próximo Salvar/VACUUM); `rebuild_search_tables` e a migração criam só o conjunto novo. Teste: `tests/test_indexes.py`. Observação: a tabela `tokens` (78 MB sem índices) segue sendo o grosso; quem a reduz é o formato colunar (A5).

### A5 Camadas em formato colunar (dentro de `layer_blobs`)
- Medido: 219,9 MB (JSON) → 49,5 MB cru → **15,0 MB com zlib** (camada de 3,76 M de tokens), contra 34,1 MB do JSON+zlib.
- **Fazer:**
  - [x] `ttwtools.layerfmt`: `encode(tokens) -> bytes` / `decode(bytes) -> tokens`, cabeçalho com magia e **versão** (`TCL1`), dicionário local por documento (o léxico por corpus vem na Fase B), colunas em `array`/`struct` (sem numpy obrigatório), `zlib`. `decode` aceita também o blob JSON antigo (retrocompatível).
  - [x] `pack_search_tables` e `rebuild_search_tables` gravam/leem o formato novo (blobs antigos continuam legíveis); teste de ida e volta token a token com camadas reais pequenas (spaCy, Stanza, MFTE, BiberPlus).
  - [x] Medir tempo de codificar/decodificar em máquina lenta (registrar) e o tamanho no projeto real (uma vez).
- **Pronto quando:** `.ttwcl` leve do corpus grande cai bem abaixo dos 466 MB (esperado ~180 MB só removendo `tagged_files` e ~100 MB com o formato colunar).
- **Relato:** `ttwtools/layerfmt.py` (`TCL1`): `encode(rows)`/`decode(blob)`. Blob = `b"TCL1"` + zlib( `n:u32`, início (diferença do anterior) e tamanho do token em `int32`, e 7 colunas de texto: dicionário local em JSON + índice de 2 ou 4 bytes por token ). Só biblioteca padrão (`array`, `struct`, `zlib`, `json`); sem numpy. `decode` lê também o JSON+zlib antigo, então arquivos antigos abrem para sempre; linhas fora do padrão (valor não textual) caem no formato antigo (`_pack_rows`). `pack_search_tables`, a exportação leve (`_save_corpora_subset`), `rebuild_search_tables` e `_layer_rows` (A1) usam o módulo. Um arquivo salvo assim **não abre em versões anteriores ao 0.6** (só quando salvo sem tabelas de busca, ou em `.ttwcl`/`.ttwal`); o resto do formato não muda. Testes (`tests/test_layerfmt.py`, 8): ida e volta token a token em casos extremos (None, unicode, vazio, >65 535 formas) e em **todas as camadas reais** do `v2_small.ttwa` (BiberPlus, spaCy, MFTE; Stanza não está na amostra, coberta na medição real abaixo), blob antigo, fallback, pack→rebuild sem perda, menor que o JSON.
  - **Medição no projeto real** (cópia; camadas por documento, ~3 mil tokens cada; 62 camadas amostradas, 188 mil tokens, ida e volta conferida): JSON+zlib 1,8 MB → TCL1 1,0 MB (**−45%**; o dicionário é por documento, o léxico por corpus vem na Fase B). **Tempo** (Apple Silicon): codificar ≈ 890 mil tokens/s, decodificar ≈ 3,3 milhões tokens/s, então recriar as tabelas de busca de 19 M de tokens leva ~6 s só de decodificação (o resto é inserir e indexar). **Não medido em máquina lenta**: em Mac Intel de 2015 espere ~3–5× (segundos, não minutos); confirmar no Mac Intel na A6. **Resultado do plano:** `.ttwcl` do corpus grande (essays_bawe) **103,5 MB** (era 466 MB; meta ~100 MB) e o do pequeno 6,2 MB, gerados depois de compactar (A1) e com o conjunto reduzido de índices (A4). O banco de trabalho foi de 2.979 → 2.066 MB (A1 + A4).

### A6 Fechar a Fase A
- **Fazer:**
  - [x] Medição ponta a ponta no projeto real (com A2 ativo, um processo, sem monitor): abrir, exportar `.ttwcl`, compactar, reabrir; tabela no Relato; atualizar `armazenamento.md` §4.4 com números reais.
  - [x] `CHANGELOG.md` `[Unreleased]` (Adicionado/Alterado/Corrigido), `pendencias.md` (marcar o feito), `plano_implementacao.md` "Estado atual".
  - [x] Decidir com o usuário a Fase B com base nas medidas.
- **Relato:** medição ponta a ponta numa cópia do projeto real (`_novo.ttwa`, 2 corpora, 19 M de tokens; Apple Silicon; A2 ativo; um processo; cópia e saídas apagadas, disco sem resíduo):

  | etapa | antes da Fase A | depois (A1+A4+A5) |
  |---|---|---|
  | abrir o `.ttwa` compactado (1.058 MB) | 7 s → banco de trabalho 2.979 MB | igual (só descompactar) |
  | compactar projeto (A1) | — | 111 s: 10.675 cópias removidas, 0 mantidas; banco **2.979 → 2.066 MB** (A1 + índices do A4) |
  | exportar `.ttwcl` do corpus grande | 388 MB (45 s) | **104 MB** (35 s) |
  | exportar `.ttwc` (com tabelas de busca) | — | 592 MB (44 s) |
  | salvar projeto todo (compactado) | 1.058 MB | **614 MB** (11 s) |
  | salvar projeto todo sem tabelas de busca | — | **118 MB** (55 s) |
  | reabrir com tabelas | 4 s | 4 s |
  | reabrir sem tabelas (recria 19 M de tokens) | ~63 s | **53 s** |

  Ganho: o corpus grande leve de 466 MB (medido antes) para 104 MB; o projeto todo de 1,06 GB para 614 MB (ou 118 MB sem tabelas de busca, ao custo de ~53 s ao abrir). **O que a Fase A não resolveu** (é o que a Fase B ataca): (1) abrir ainda descompacta ~2,0–3,0 GB por abertura; (2) o arquivo *com* tabelas de busca segue grande (614 MB) porque a tabela `tokens` e os índices ficam dentro dele; (3) recriar as tabelas leva ~53 s e cresce com o corpus; (4) o `.ttwa` continua a misturar corpora, camadas e análises. `armazenamento.md` §4.4 recebeu esses números. Verificação em outros sistemas (Windows/Linux, `os.kill(pid, 0)` da limpeza de órfãs) e máquina lenta (Mac Intel/macOS 12) **continuam por fazer**: rodar `pytest`, `ttwtools cache list`, abrir/salvar um projeto pequeno e cronometrar `layerfmt` lá.
  - **Sugestão para a decisão da Fase B:** fazer a **B1 (especificação)** e o **B3 (índice de busca em cache por camada)** primeiro, porque atacam os itens (1)–(3) sem mudar o formato do `.ttwa`; deixar B5 (`.ttwa` manifesto) e B6 (corpora clássicos) para depois de medir o B3. Aguarda o usuário.

## Fase B — pasta-pacote, índice em cache e `.ttwa` manifesto (só depois da A e da medição; **beta**)

Decisões já tomadas estão em "Estado atual". Detalhes de desenho: `armazenamento.md` §4.2–4.3.

### B1 Especificação do formato
- [ ] `libs/ttwtools/docs/formato-pacote.md`: pasta `nome.ttwc/` (arquivo com o mesmo nome continua sendo o `.ttwc` clássico; **pasta** = formato novo, reconhecido pelo tipo e pelo `manifest.json`), com `manifest.json` (versão, ids, hashes), `meta.sqlite` (documents, document_meta, catálogo de camadas, analyses, feature_tables, kfa_results, pending_steps, project_meta), `texts/` (por documento, compactado), `layers/` (colunar, **léxico compartilhado por corpus** em `lexicon/`), sem índice. Empacotar para enviar = ZIP da pasta (`nome.ttwc.zip`), abrir = descompactar ou ler direto; confirmar com o usuário o nome do ZIP.
- [ ] `.ttwa` = manifesto: corpora referenciados (id, nome, hash, caminho relativo/absoluto), resultados de comparação, perfis de frequência e tabelas de features usados; opção de embutir. Regras de versão e de erro para versões antigas.

### B2 Leitura e escrita do pacote (`ttwtools.bundle`)
- [ ] Abrir lendo só o manifesto; texto por documento; camada sob demanda; salvar **incremental** (objetos imutáveis novos + `meta.sqlite`), sem cópia de trabalho de vários GB; temporários só no destino/cache.

### B3 Índice de busca em cache por camada
- [ ] Construído sob demanda, em segundo plano, **com barra de progresso por etapa** ("Lendo a camada", "Criando o índice de formas", ...); compartilhado por hash entre projetos; consultas existentes rodam por `ATTACH` (o código de busca **não** muda: view temporária `tokens`); limite e LRU do A3.
- **Relato:** módulo `ttwtools/searchindex.py` + integração em `project.py`. **Arquitetura:** um arquivo salvo sem tabelas de busca mantém as camadas em `layer_blobs` (formato `TCL1`). Ao abrir, em vez de recriar `tokens` dentro do projeto, o índice é construído **uma vez** num SQLite da pasta de cache (`idx-<chave>/tokens.sqlite` + `entry.json`; atômico: `.part` e renomeia) e **anexado somente leitura** (`ATTACH ... mode=ro`); uma `TEMP VIEW tokens` = `main.tokens ∪ idx1.tokens ∪ …` faz as consultas existentes funcionarem sem mudança. O projeto continua pequeno e sem tabelas no arquivo (abrir não o altera: não vira "não salvo").
  - **Decisão de desenho medida (protótipo, 300 mil tokens sintéticos):** a cache precisa guardar os **ids nativos** do projeto. Com a view remapeando `layer_id`, o SQLite perde a chave primária `(layer_id, idx)` e o KWIC com mais de uma palavra passou de 8 ms para **17 s**. Com ids nativos: igual à tabela direta (uma cache) e ≤ 2× com `UNION ALL`. Consequência: a **chave** = hash de formato + ids + blobs, então o cache é compartilhado por quem descende do mesmo arquivo (cópias, salvar como, `.ttwc` exportado), **não** por projetos sem relação que por acaso tenham os mesmos textos (caso a tratar no B1/B2, com léxico e ids por corpus).
  - **Grupos:** camadas do mesmo corpus + ferramenta + versão + modelo + configuração. Se passar do limite de bancos anexados do SQLite (10), agrupa por ferramenta e, por fim, tudo junto (`plan_entries`). Memo por arquivo (tamanho e data do banco e do WAL) evita recalcular hashes a cada abertura na mesma sessão do app.
  - **Etapas com progresso** (app e CLI): `idx_read` (camadas lidas) e uma por índice (`idx_words`, `idx_lemmas`, `idx_doc`, `idx_upos`, `idx_xpos`), com aviso "só na primeira vez" na janela de abertura. Antes de construir: `ensure_free_space` ("criar o índice de busca"). LRU do A3 protege as entradas em uso (`keep`).
  - **Escrita em modo cache:** camadas novas vão para `main.tokens` (escritas qualificadas com `main.`). Salvar **sem tabelas** empacota só as novas; salvar **com tabelas** e exportar `.ttwc` **materializam** os tokens numa cópia temporária (`rebuild_search_tables` / `_materialize_layer`); `save_project_as(raw=True)` grava o banco como está.
  - **Desligar:** `TTWTOOLS_INDEX_CACHE=0` ou `index_cache: false` no `settings.json` volta a recriar as tabelas ao abrir (comportamento anterior); falha que não seja de disco também cai nele, com aviso.
  - **CLI:** `ttwtools index status|build|clear PROJETO`. Testes: `tests/test_searchindex.py` (13: mesmos tokens e mesmas respostas de KWIC/frequência/colocados/dispersão que o projeto materializado, etapas, segunda abertura sem construir, cópia compartilha o cache, camada nova + salvar/materializar, exportar `.ttwc`/`.ttwcl`, cache apagado, cancelar sem resíduo, disco cheio recusa antes, limite de anexos, LRU) e `_isolated_cache` (testes nunca tocam o cache real).
  - **Medição no projeto real** (cópia; Apple Silicon; cache em pasta própria, apagada): o arquivo salvo sem tabelas ficou em 415 MB (esta cópia ainda tinha os `tagged_files`; sem eles, ~120 MB como no A6). **Abrir com tabelas:** 6 s, banco de 2.979 MB. **Abrir sem tabelas, 1ª vez** (constrói o índice; 10 entradas, 19 M de tokens, cache de **2.124 MB**): **44 s**, banco de trabalho 459 MB (antes da Fase A: 2.979 MB). **2ª vez: 1,0 s** (antes: ~53–63 s em *toda* abertura). Consultas (corpus de 3,7 M de tokens, via `UNION ALL` de 10 caches × tabela direta): KWIC 0,86 × 0,74 s; KWIC lema+classe 0,52 × 0,48 s; busca 0,53 × 0,38 s; frequência de lemas 4,6 × 3,8 s; colocados 4,8 × 3,9 s; dispersão 0,60 × 0,64 s, ou seja **+0 a +40%**, aceitável.
  - **Mac Intel (referência do usuário):** não medido aqui. A construção é CPU e disco; espere a 1ª abertura de 2–5 min (M-series: 44 s) e as seguintes em poucos segundos. Para quem não quiser pagar a 1ª vez (ou para máquinas lentas), já existe o arquivo **com** tabelas (abre em ~6 s, mas 600 MB+); o desenho permite um terceiro modo, **"abre pronto"**: levar a própria entrada de cache (`entry.json` + `tokens.sqlite`, autocontida) dentro do pacote e **copiá-la** para o cache no lugar de construí-la (sem descompactar 3 GB e sem a 1ª espera). Isso fica para o B2/B4, junto da decisão do formato.
  - **Limites conhecidos:** um arquivo com mais de uma linhagem de ids não compartilha cache; re-etiquetar um documento muda a chave do grupo inteiro (reconstrói aquela entrada; entradas por documento seriam a otimização); orfãos de camada apagada na sessão ficam visíveis na view até reabrir (consultas passam por `layers`, então não aparecem).

### B4 Integração no app e na CLI
- [ ] Abrir/salvar pasta-pacote; interruptor "formato beta" (opt-in); exportar para o clássico e empacotar ZIP; barras de progresso claras em cada etapa (o usuário pediu explicitamente); `ttwtools convert`.

### B5 `.ttwa` manifesto e conversão dos antigos
- [ ] `ttwtools convert PROJETO.ttwa DESTINO/` separa em `.ttwc` por corpus + `.ttwa` de análises (nunca apaga o original); teste de ida e volta token a token com projetos reais antigos (v0.1/v0.2/v0.3).

### B6 Corpora clássicos do catálogo
- [ ] Pacote = **perfil de frequência** (forma, lema, classe; contagem e amplitude por documento) + **tabelas de features por texto**; corpus completo como download opcional; liga com D6 (hospedagem). Comparação de textos individuais e corpora pequenos contra eles.

### B7 Verificação e lançamento do beta
- [ ] Projetos reais, Windows/Linux (bloqueio de arquivos, caminhos, limpeza de órfãs), macOS 12 Intel (Python 3.11, só biblioteca padrão); roteiro em `verificacao/`; `0.6.0b1` (`python build/release.py --version 0.6.0-beta.1`; recompilar só quando o usuário pedir).

## Registro de mudanças neste plano

- 2026-09-29: plano criado a partir de `armazenamento.md` e das respostas do usuário.
