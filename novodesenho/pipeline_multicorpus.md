# Plano: Etiquetagem Multi-Corpus e Fila Unificada de Pipeline

> **Documento de Handoff para o próximo agente.**  
> Siga rigorosamente as regras em `AGENTS.md` e o percurso em `novodesenho/memoria_para_IA.md`.

---

## 1. Contexto e Motivação

Ao importar mais de um corpus em um projeto (situação padrão em análises comparativas como KFA, Palavras-chave ou Dispersão), o usuário precisa etiquetar ambos os corpora (por exemplo, aplicando spaCy e estatísticas básicas aos dois).

**Problema atual:**
- A tela de Etiquetagem (`TaggingView.vue`) vincula toda a interação a um único corpus selecionado no dropdown (`/api/corpora/{corpus}/pipeline`).
- Para etiquetar 2 corpora, o usuário precisa:
  1. Selecionar o Corpus 1 e adicionar as camadas.
  2. Executar a análise do Corpus 1 e aguardar o término completo.
  3. Mudar o dropdown para o Corpus 2 e adicionar as mesmas camadas.
  4. Executar a análise do Corpus 2.
- Se o usuário tentar enfileirar passos no Corpus 2 enquanto o Corpus 1 está na fila, a interface só executa o corpus ativo no momento.

**Objetivo:**
Permitir que o usuário configure e enfileire análises/etiquetagens para múltiplos corpora e dispare a execução em lote de uma só vez, com progresso unificado.

---

## 2. Requisitos de Negócio e UX

1. **Adicionar a todos os corpora de uma vez:**
   - Quando o projeto tiver mais de um corpus (`corpora.length > 1`), exibir um controle/checkbox:
     `[ ] Acrescentar a todos os corpora ({n})` (chave i18n `pipeline.apply_to_all`).
   - Se marcado, ao clicar em *+ Acrescentar à lista* (em *Estatísticas básicas* ou em qualquer *TaggerCard*), o passo é adicionado à lista "a executar" de cada um dos corpora do projeto.
   - Se desmarcado, adiciona normalmente apenas ao corpus ativo.

2. **Fila unificada ("A executar"):**
   - A lista de passos pendentes deve exibir os passos de todos os corpora que possuem pendências no projeto.
   - Cada item da lista exibe um selo/badge com o nome do corpus correspondente (ex.: `[Corpus 1] spaCy · rápido`).
   - Se todos os passos pertencerem ao corpus ativo, o badge pode ser omitido ou mantido para clareza.
   - Cada item pode ser removido individualmente da fila do seu respectivo corpus.

3. **Execução sequencial consolidada:**
   - O botão *Executar análise e etiquetagem* dispara a execução de **todos os corpora com passos pendentes** em sequência, sob uma única tarefa de background (`jobs.start("pipeline", ...)`).
   - A barra de progresso (`PipelineProgress.vue`) exibe a fração geral de conclusão e informa o corpus em execução em cada etapa (ex.: `Corpus 1 · spaCy: doc 3/10` → `Corpus 2 · stats: texto`).

4. **Compatibilidade e retrocompatibilidade:**
   - As rotas existentes (`/api/corpora/{corpus}/pipeline/*`) continuam funcionando inalteradas.
   - A CLI `ttwtools pipeline` ganha a opção `--all` / `--all-corpora`.

---

## 3. Desenho Técnico por Camada

### Camada 1: Pacote Python `libs/ttwtools` (Submódulo)
*Lembre-se: commit e push no submódulo primeiro!*

1. **`libs/ttwtools/ttwtools/pipeline.py`:**
   - `pending_steps_all(project: TTWAProject) -> dict[str, list[dict]]`:
     Retorna `{c["name"]: pending_steps(project, c["name"]) for c in _corpora(project)}` filtrando apenas os que tiverem passos.
   - `add_step_all(project: TTWAProject, step: Mapping[str, Any], corpora: list[str] | None = None) -> dict[str, list[dict]]`:
     Adiciona o passo para a lista de corpora indicada (ou todos do projeto se `None`). Retorna `{corpus: steps}`.
   - `run_all(project: TTWAProject, corpora: list[str] | None = None, progress=None, on_step=None) -> dict`:
     Executa sequencialmente `run_steps` para cada corpus.
     - `on_step(global_index, state)`: envia o estado de cada passo com o campo extra `"corpus": corpus_name`.
     - Devolve `{"done": [...], "remaining": {corpus: [...]}}`.
2. **`libs/ttwtools/ttwtools/__init__.py`:**
   - Exportar `pending_steps_all`, `add_step_all`, `run_all`.
3. **`libs/ttwtools/ttwtools/cli.py`:**
   - Em `_configure_pipeline`: permitir `--corpus` opcional se `--all` estiver presente em `run`, `list`, `clear`.
   - Em `_cmd_pipeline`: tratar `--all` chamando `pending_steps_all` ou `run_all`.
4. **`libs/ttwtools/ttwtools/data/i18n/ui.pt.json` e `ui.en.json`:**
   - `"pipeline.apply_to_all"`: `"Acrescentar a todos os corpora ({n})"` / `"Add to all corpora ({n})"`
   - `"pipeline.run_all"`: `"Executar análise e etiquetagem em todos os corpora ({n})"` / `"Run analysis and tagging on all corpora ({n})"`
   - `"pipeline.corpus_step"`: `"{corpus} · {step}"`
5. **Documentação de referência:**
   - `cd libs/ttwtools && python docs/gerar_referencia.py`
6. **Testes do pacote:**
   - Adicionar casos de teste em `libs/ttwtools/tests/test_pipeline.py` cobrindo múltiplos corpora com `pending_steps_all`, `add_step_all` e `run_all`.

---

### Camada 2: Servidor FastAPI (`app/`)

1. **`app/routes/api_new.py`:**
   - `GET /api/pipeline`:
     Retorna `{"steps": [{"corpus": c, **step_with_plan}, ...]}` concatenando todos os passos pendentes de todos os corpora do projeto atual.
   - `POST /api/pipeline/add`:
     Recebe body: `{"step": StepRequest, "corpora": list[str] | None, "all_corpora": bool = False}`.
     Adiciona o passo aos corpora especificados (ou a todos) e devolve a lista atualizada de passos.
   - `POST /api/pipeline/run`:
     Recebe body opcional: `{"corpora": list[str] | None}`.
     Inicia o job com `ttwtools.pipeline.run_all`.
     O estado `states` de cada passo no job inclui `"corpus": corpus_name`.
2. **Testes de integração:**
   - Adicionar testes em `tests/test_pipeline_multi.py` ou `tests/test_routes_api_new.py` validando os endpoints `/api/pipeline`, `/api/pipeline/add` e `/api/pipeline/run`.

---

### Camada 3: Frontend (`frontend-vue/`)

1. **`frontend-vue/src/views/TaggingView.vue`:**
   - Estado: `const applyToAll = ref(false)`.
   - Se `corpora.length > 1`, renderizar ao lado do seletor de corpus ou acima das seções de adição:
     `<label class="flex items-center gap-2 cursor-pointer text-sm">`
     `<input type="checkbox" v-model="applyToAll" class="checkbox checkbox-sm checkbox-primary" />`
     `<span>{{ t('pipeline.apply_to_all', { n: corpora.length }) }}</span></label>`
   - `loadSteps()`:
     Carrega os passos consolidados de todos os corpora (`GET /api/pipeline`) para preencher a fila "A executar".
   - `add(step)`:
     Se `applyToAll.value`, chama `POST /api/pipeline/add` com `all_corpora: true`.
     Se não, chama a rota habitual por corpus (`POST /api/corpora/${enc(corpus.value)}/pipeline`).
   - `remove(step)`:
     Remove usando o corpus do passo: `DELETE /api/corpora/${enc(step.corpus)}/pipeline/${step.index}`.
   - `run()`:
     Chama `POST /api/pipeline/run` para executar todos os corpora pendentes.
2. **`frontend-vue/src/components/PipelineProgress.vue`:**
   - Em cada passo da lista de progresso, se `s.corpus` existir, exibir:
     `<span class="badge badge-sm badge-neutral">{{ s.corpus }}</span>` ao lado do nome do etiquetador/estatísticas.
3. **Testes:**
   - Rodar `npm test` em `frontend-vue/`.

---

## 4. Roteiro Passo a Passo para o Agente

1. **Passo 1 (Submódulo `libs/ttwtools`):**
   - Editar `libs/ttwtools/ttwtools/pipeline.py` implementando `pending_steps_all`, `add_step_all`, `run_all`.
   - Atualizar `libs/ttwtools/ttwtools/__init__.py`.
   - Atualizar `libs/ttwtools/ttwtools/cli.py` para suportar `--all`.
   - Adicionar chaves i18n em `libs/ttwtools/ttwtools/data/i18n/ui.pt.json` e `ui.en.json`.
   - Adicionar testes em `libs/ttwtools/tests/test_pipeline.py`.
   - Rodar: `/Users/padovani/miniconda3/envs/ttw314/bin/pytest libs/ttwtools/tests -k pipeline`.
   - Rodar: `cd libs/ttwtools && python docs/gerar_referencia.py`.
   - Fazer commit no submódulo:
     `git -C libs/ttwtools commit -m "[passo] Pipeline multi-corpus: pending_steps_all, add_step_all e run_all"`.

2. **Passo 2 (Backend `app/`):**
   - Atualizar `app/routes/api_new.py` com as rotas unificadas `/api/pipeline`, `/api/pipeline/add`, `/api/pipeline/run`.
   - Rodar testes existentes: `/Users/padovani/miniconda3/envs/ttw314/bin/pytest tests -q`.
   - Fazer commit no app:
     `git commit app/routes/api_new.py -m "[passo] Rotas de pipeline multi-corpus"`.

3. **Passo 3 (Frontend `frontend-vue/`):**
   - Atualizar `frontend-vue/src/views/TaggingView.vue` e `PipelineProgress.vue`.
   - Rodar testes do frontend: `cd frontend-vue && npm test`.
   - Compilar frontend: `cd frontend-vue && npm run build`.
   - Fazer commit no app:
     `git commit frontend-vue/ -m "[passo] Interface de etiquetagem com suporte a multi-corpus"`.

4. **Passo 4 (Validação e Handoff):**
   - Abrir o app ou rodar teste manual com projeto contendo 2 corpora.
   - Atualizar `novodesenho/plano.md` (seção 1).
