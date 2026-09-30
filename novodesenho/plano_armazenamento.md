# Plano e pendências: armazenamento (beta 0.6) e o que falta no projeto

**Três documentos, cada um com um papel:** este (o que foi feito, o que falta, o que decidir) · `armazenamento.md` (eficiência e formato de arquivo: evidência, proposta) · `macintel.md` (testes na máquina lenta de referência). Regras do repositório: `AGENTS.md`. Substitui o antigo `pendencias.md` (incorporado na seção 6); os relatos detalhados dos passos A1–A6 e B3 estão no histórico do Git.

## 1. Estado atual (atualizar a cada passo)

- **Fase A e B3 concluídas; Comparar como tarefa e barra de progresso própria feitos; aguardam o Mac Intel** (`macintel.md` seção 4): build com as correções, etapa I do teste (1ª abertura com índice em cache).
- **Próximo passo:** o passo 1 da seção 3 (índice sob demanda por entrada, hash gravado, conexão por thread, fila de tarefas), depois de o usuário responder as decisões 1 e 2 (seção 4).
- **Versão:** `0.6.0a2.dev0` · branch `new_out26` (fase de depuração; `new_set26` fica congelada no fecho da fase anterior) · ponto de retorno: tag local `pre-armazenamento-0.6`. Release em rascunho `v0.6.0-alpha.1` no GitHub (build **anterior** às correções de Comparar); pacotes novos saem pela branch `release-test/armazenamento-0.6-dev` (só artefatos, sem tag).
- **Diretrizes do usuário:** o mais **leve**, de **fácil computação em máquina antiga** (só biblioteca padrão; nada de `zstandard`, `pyarrow`, DuckDB; Mac Intel = Python 3.11, macOS 12) e **retrocompatível** (todo formato atual legível para sempre; formato novo opt-in, rotulado beta; conversão nunca apaga o original; sempre exportar ao formato clássico). Usar **features**, não "traços".

## 2. Como trabalhar

1. **Um passo por vez.** Ao concluir: atualizar este arquivo, rodar os testes do que mexeu e fazer **um commit** `[passo] mensagem curta em português` (sem coautoria de agente; nunca `git add -A`; adicionar arquivos pelo nome).
2. **Submódulo:** a lógica vive em `libs/ttwtools/ttwtools`; commit e `git push` **dentro dele primeiro**, depois o ponteiro no app. Rota fina em `app/routes`; tela só apresenta; todo recurso novo = função pública + subcomando + rota + tela; textos por chave (`pt` e `en`, em `libs/ttwtools/ttwtools/data/i18n/ui.*.json`); depois de mexer em função pública: `cd libs/ttwtools && python docs/gerar_referencia.py`.
3. **Disco (já houve 71 GB de lixo temporário):** antes de teste que abra `ttwa_files/*` conferir `df -h /` (mínimo 20 GB livres); um processo longo por vez, com o usuário sabendo; trabalhar em **cópias** e apagar o que criar; nunca deixar processo em segundo plano sem necessidade. Testes com projetos pequenos gerados; o real só nas medições marcadas.
4. **Testes:** `pytest libs/ttwtools/tests -q` e `pytest tests -q` (`conda activate ttw314`); `cd frontend-vue && npm test && npm run e2e` ao fim de passos de tela. Cada passo acrescenta teste, inclusive "não deixa lixo temporário".
5. **Não recompilar o pacote** até o usuário pedir; rodar por `python -m app --mode desktop|web`. Pacotes no GitHub: `git push origin new_out26:release-test/armazenamento-0.6-dev` (artefatos) ou `python build/release.py --version X --allow-branch` (tag e rascunho; ver `RELEASING.md`).

## 3. Andamento

### Feito

| Passo | Resultado |
|---|---|
| A1 Compactar projeto | `ttwtools compact`: remove `tagged_files` legados comprovados iguais às camadas (tolera `tags` = upos/xpos em Stanza/spaCy); banco 2.979 → 2.571 MB |
| A2 Espaço livre | `storage.ensure_free_space` antes de salvar, salvar como, exportar, abrir e importar; erro 507 traduzido |
| A3 Pastas e cache | `storage`: pastas com dono, cache com limite (5 GB) e LRU, painel "Uso de disco", `ttwtools cache`; corrigido `.part` deixado por gravação cancelada |
| A4 Índices | 7 → 5 (−21% no arquivo, mesma velocidade); `tools/bench_indexes.py` |
| A5 Camadas colunares | `layerfmt` `TCL1`: −45% sobre JSON+zlib; `.ttwcl` do corpus grande 466 → 104 MB |
| A6 Fecho da Fase A | medição ponta a ponta; CHANGELOG |
| B3 Índice em cache | `searchindex`: ATTACH somente leitura + view `tokens`; etapas com progresso; 1ª abertura 38–44 s (M4), depois 1 s; `ttwtools index status/build/clear`; desliga com `TTWTOOLS_INDEX_CACHE=0` |
| Compatibilidade | testes pelo app: formatos antigos (direto, gzip, xz; esquema 0.2) e novos abrem e respondem igual |
| Comparar robusto | `?async=1` em palavras-chave, KFA, faixas, galeria e Laboratório (tarefa com andamento e cancelar); KFA por documento e reaproveitada; tabelas de features em memória; `ProgressBar` própria |
| Ferramentas de medição | `tools/bench_storage.py` (as três opções, relatório em Markdown) |

### Próximos passos (detalhe e ganho em `armazenamento.md` seção 5)

1. **Índice sob demanda por entrada** (só na 1ª consulta posicional), **hash de blob gravado uma vez**, **conexão por thread**, **fila de tarefas pesadas** (núcleos − 1). Sem mudar o formato.
2. **Estatísticas B** (matriz documento × tipo, contagens de features) ao empacotar/etiquetar; KFA, palavras-chave, faixas e frequência passam a usá-las; **resultados derivados fora do arquivo** (sem ativar "não salvo"). Primeiro no cache, sem mudar o formato.
3. **SQL nos laços quentes** (`frequency`, `collocates`, `feature_table` com `json_each`, regex no léxico), **PRAGMAs** medidos, **orçamentos por máquina** no `bench_storage.py`.
4. **Protótipo `TCL2`** (ids + léxico por corpus) e índice com ids: medir tamanho e regex antes de fixar o formato. Desenhar já com as **costuras** para código nativo opcional (`armazenamento.md` seção 9: ainda não; experimento de dois dias depois de medir no Intel).
5. **Pasta-pacote com perfis Compacto/Pronto** (antigos B1, B2, B4).
6. **Converter antigos** e corpora do catálogo (antigos B5, B6), e **verificação e lançamento do beta** (antigo B7: Windows, Linux, macOS 12; `0.6.0b1`).

## 4. Decisões do usuário

**Tomadas:** `.ttwa` = manifesto; pasta-pacote (ZIP só para enviar); índice em cache com barra de etapas; léxico por corpus; corpora clássicos só com perfil de frequência + features; Fase A primeiro; depois B3 com o Mac Intel como referência.

**Abertas** (recomendações em `armazenamento.md` seção 8):
1. Estatísticas B **sempre dentro do arquivo**, mesmo no compacto?
2. Índice **só sob demanda** ou construir ao abrir?
3. `TCL2` com ids e léxico por corpus, mesmo que o cache deixe de ser compartilhado entre projetos sem relação?
4. Resultados derivados **fora do arquivo**?
5. **Teto de espera no Intel** por operação (respostas em `macintel.md` seção 6).

**Questões de desenho do `.ttwc` × `.ttwa`** (resolver no passo 5): o `.ttwa` referencia os `.ttwc` por caminho + hash (como o `.ttwl`) ou os embute; o que fazer com camadas e resultados quando um `.ttwc` muda depois da análise; a etiquetagem usada numa comparação mora sempre no `.ttwc`; migrar os `.ttwa` atuais (separar ou aceitar tudo embutido); **definição de "leve"** (hoje `.ttwcl` e `.ttwal` saem sem tabelas de busca, o `.ttwl` não; o texto é ~1% do arquivo); relação com os pacotes do catálogo (D6); limite do SQLite (BNC e Hansard pedem outra estratégia, NM §9.5); destino do `.ttwt` antigo; paridade GUI/CLI para montar, embutir e separar.

## 5. Pendências abertas de armazenamento

- Abrir compactado ainda descompacta tudo (2–3 GB de temporário): resolvido pela pasta-pacote (passo 5).
- Testar a limpeza de pastas órfãs (`os.kill(pid, 0)`, caminhos de temporário) no **Windows e no Linux**.
- Pico do `VACUUM` do Compactar (até ~2× o banco) só é avisado na tela.
- `ttwa_files/essays_bawe_somentetexto_corpus/` (22 MB, resto de exportação interrompida): **não apagada** por decisão do usuário.
- Sem trava leve por chave para dois processos construindo o mesmo índice (já é seguro por renome).
- Medições do Mac Intel que faltam: `macintel.md` seção 4.
- Formato colunar medido só com o preset rápido (sem lemas nem features morfológicas): medir ponta a ponta com tudo ligado (espere ~1,5× maior).
- **Limites do B3 (índice em cache):** a chave inclui ids de camada e de documento, então só é compartilhada por quem descende do mesmo arquivo (cópias, salvar como, `.ttwc` exportado), não por projetos sem relação; re-etiquetar um documento muda a chave do grupo inteiro e reconstrói aquela entrada; camadas apagadas na sessão ficam visíveis na view até reabrir (as consultas passam por `layers`, então não aparecem); acima de 10 bancos anexados o agrupamento sobe de nível (corpus × ferramenta → ferramenta → tudo junto).
- **Limites do A2 (espaço livre):** o tamanho descompactado lido do cabeçalho gzip dá a volta em 4 GB (usa 3× o arquivo quando fica menor que o arquivo); a migração v0.3 depois de abrir não é estimada.
- Migrar sem perder nada: teste que compara camada antiga e nova token a token, com projetos reais antigos de `ttwa_files/` (vale para o passo 6).

## 6. Outras pendências do projeto (incorporadas de `pendencias.md`)

**Release.** `0.5.0` gravada, tag `v0.5.0` **só local**, sem release (falta decidir o push; recompilar com o ícone novo; teste em macOS 12). Rascunhos no GitHub: `v0.4.0-alpha.1`, `v0.4.0-rc.1`, `v0.6.0-alpha.1`. Submódulo `ttwtools` em `0.2.0.dev0`, sem tag própria. 6.3: congelar (tag do submódulo, CHANGELOG), conferir rascunho, publicar, `SHA256SUMS.txt`.

**Decisões do plano de implementação** (`plano_implementacao.md`): D4 assinatura e notarização; D5 formato do pacote no Windows e Linux; D6 onde hospedar o catálogo (aguarda o usuário, junto das licenças 4.3); D8 nomes dos destinos e do rótulo do corpus ativo; D9 padrão recomendado de cada tagger (medir tempo e qualidade); 5.2 dados reais do OANC/MASC.

**Verificação** (6.2 e 6.2a): mensagens de erro do servidor sempre em português, mapear para chaves pt/en; testar os diálogos nativos na janela desktop (CI e e2e só em modo web); continuar `verificacao/macos-arm64.md` e os roteiros de Windows, Linux e macOS 12 Intel (máquinas fora daqui); revisar LEIAME/README com os nomes novos das telas e formatos.

**Redesign visual** (`plano_redesign_ui.md`): etapas 5 (Vue Bits: rota `/lab`, BorderGlow/GlareHover, medir CPU), 6 (responsivo em 1440/1280/1024/768/390) e 7; capturas antes/depois; daltonismo dos gráficos; tabelas com ordenação clicável e números à direita, painel lateral redimensionável; componentes base como `.vue` próprios; menu Recentes não fecha ao clicar fora; modal de progresso ainda não cobre busca, frequência e colocados de Explorar.

**Leitor, etiquetas e Explorar/Comparar:** abrir o Leitor **na ocorrência** clicada na Dispersão; 18 tags do MFTE sem correspondência na lista 1.6 (e 18 códigos da planilha sem tag), traduzir nome e exemplos e conferir a licença de reuso; dica global das etiquetas só em KWIC, Frequência (classe) e painel do token; "Explicar esta tela" (botão retirado, evento `ttw:explain` mantido) para os guias de Aprender; bug não reproduzido de aba em branco em Frequência/Colocados depois do Leitor; exportar SVG/PNG da Dispersão não testado após a mudança para linhas em HTML; Busca e Colocados com camadas só de tags sem teste automatizado.

**Questões antigas do desenho** (`novomodelo.md`): NM §8 (idiomas de interface além de pt/en, português como idioma de corpus, opções em primeiro plano, limite dos corpora embutidos, formatos de importação além de `.txt`); NM §9.5 (corpora embutidos como pacotes baixáveis, limite do SQLite); NM §17.9 (nomes dos destinos; PWA e hospedagem adiados à fase web).

**Documentos antigos com caixas soltas** (não conferidos): `plano_visualizacoes.md`, `libs/ttwtools/plano.md`, `libs/ttwtools/todoc.md` têm `[ ]` de fases já superadas; revisar item a item. `plano_escrita.md` e `ferramentaescrita.md`: Escrita experimental, sem lista própria.
