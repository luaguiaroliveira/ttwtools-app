# Plano de implementação — novo armazenamento (beta da 0.6)

Fonte única de andamento desta frente. **Leia só este cabeçalho e o passo atual** (`grep -n '^### ' novodesenho/plano_armazenamento.md`). Análise, medidas e alternativas: `novodesenho/armazenamento.md` (consulte só a seção citada no passo). Pendências gerais: `novodesenho/pendencias.md`. Regras do repositório: `AGENTS.md`.

## Estado atual (atualizar ao fim de cada passo)

- **Passo atual:** A3 (A1 e A2 concluídos)
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
  - [ ] Módulo `ttwtools.storage`: `workdir(kind)` (cópias de trabalho, exportações, empacotamento; hoje `make_workdir` em `project.py`) e `cache_dir()` (índices e derivados; `platformdirs.user_cache_dir`, já usado pelo catálogo); marca `owner.pid`; registro de uso (tamanho, último uso).
  - [ ] Limite configurável do cache (padrão sugerido: 5 GB) com remoção LRU; `purge_orphans()` reúne o que já existe; limpeza ao iniciar e ao sair.
  - [ ] `ttwtools cache list|clear`; rota `/api/utils/disk-usage`; painel **Uso de disco** em Recursos (o que é, quanto ocupa, botão limpar) com aviso quando houver lixo grande ao iniciar.
  - [ ] Teste (fixture reutilizável) que garante **nenhum arquivo residual** depois de abrir, salvar, exportar, cancelar e falhar.
- **Pronto quando:** matar o processo no meio de uma exportação e reiniciar apaga os restos; o painel mostra o uso.
- **Relato:** _(preencher)_

### A4 Índices: medir e enxugar
- **Fazer:**
  - [ ] Benchmark (script em `libs/ttwtools/tests/` ou `tools/`, sobre um projeto **sintético grande** de ~2 M de tokens, não o real) do KWIC, frequência, colocados e dispersão com os 7 índices atuais × conjunto reduzido (`lower(word)`, `lower(lemma)`, `doc`, `upos`, `xpos`).
  - [ ] Se a perda for aceitável, reduzir; índices continuam recriáveis; `rebuild_search_tables` cria o conjunto novo; arquivos antigos abrem e são atualizados sob demanda.
- **Pronto quando:** tabela antes/depois (tamanho e tempo) no Relato; decisão registrada.
- **Relato:** _(preencher)_

### A5 Camadas em formato colunar (dentro de `layer_blobs`)
- Medido: 219,9 MB (JSON) → 49,5 MB cru → **15,0 MB com zlib** (camada de 3,76 M de tokens), contra 34,1 MB do JSON+zlib.
- **Fazer:**
  - [ ] `ttwtools.layerfmt`: `encode(tokens) -> bytes` / `decode(bytes) -> tokens`, cabeçalho com magia e **versão** (`TCL1`), dicionário local por documento (o léxico por corpus vem na Fase B), colunas em `array`/`struct` (sem numpy obrigatório), `zlib`. `decode` aceita também o blob JSON antigo (retrocompatível).
  - [ ] `pack_search_tables` e `rebuild_search_tables` gravam/leem o formato novo (blobs antigos continuam legíveis); teste de ida e volta token a token com camadas reais pequenas (spaCy, Stanza, MFTE, BiberPlus).
  - [ ] Medir tempo de codificar/decodificar em máquina lenta (registrar) e o tamanho no projeto real (uma vez).
- **Pronto quando:** `.ttwcl` leve do corpus grande cai bem abaixo dos 466 MB (esperado ~180 MB só removendo `tagged_files` e ~100 MB com o formato colunar).
- **Relato:** _(preencher)_

### A6 Fechar a Fase A
- **Fazer:**
  - [ ] Medição ponta a ponta no projeto real (com A2 ativo, um processo, sem monitor): abrir, exportar `.ttwcl`, compactar, reabrir; tabela no Relato; atualizar `armazenamento.md` §4.4 com números reais.
  - [ ] `CHANGELOG.md` `[Unreleased]` (Adicionado/Alterado/Corrigido), `pendencias.md` (marcar o feito), `plano_implementacao.md` "Estado atual".
  - [ ] Decidir com o usuário a Fase B com base nas medidas.
- **Relato:** _(preencher)_

## Fase B — pasta-pacote, índice em cache e `.ttwa` manifesto (só depois da A e da medição; **beta**)

Decisões já tomadas estão em "Estado atual". Detalhes de desenho: `armazenamento.md` §4.2–4.3.

### B1 Especificação do formato
- [ ] `libs/ttwtools/docs/formato-pacote.md`: pasta `nome.ttwc/` (arquivo com o mesmo nome continua sendo o `.ttwc` clássico; **pasta** = formato novo, reconhecido pelo tipo e pelo `manifest.json`), com `manifest.json` (versão, ids, hashes), `meta.sqlite` (documents, document_meta, catálogo de camadas, analyses, feature_tables, kfa_results, pending_steps, project_meta), `texts/` (por documento, compactado), `layers/` (colunar, **léxico compartilhado por corpus** em `lexicon/`), sem índice. Empacotar para enviar = ZIP da pasta (`nome.ttwc.zip`), abrir = descompactar ou ler direto; confirmar com o usuário o nome do ZIP.
- [ ] `.ttwa` = manifesto: corpora referenciados (id, nome, hash, caminho relativo/absoluto), resultados de comparação, perfis de frequência e tabelas de features usados; opção de embutir. Regras de versão e de erro para versões antigas.

### B2 Leitura e escrita do pacote (`ttwtools.bundle`)
- [ ] Abrir lendo só o manifesto; texto por documento; camada sob demanda; salvar **incremental** (objetos imutáveis novos + `meta.sqlite`), sem cópia de trabalho de vários GB; temporários só no destino/cache.

### B3 Índice de busca em cache por camada
- [ ] Construído sob demanda, em segundo plano, **com barra de progresso por etapa** ("Lendo a camada", "Criando o índice de formas", ...); compartilhado por hash entre projetos; consultas existentes rodam por `ATTACH` (o código de busca quase não muda); limite e LRU do A3.

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
