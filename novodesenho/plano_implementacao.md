# Plano de implementação — novo TTWtools (app + pacote `ttwtools`)

Este arquivo é a **fonte única de andamento** da implementação. O desenho está em `novodesenho/novomodelo.md` (consulte só as seções citadas em cada passo).

## Estado atual (atualizar ao fim de cada passo)

- **Passo atual:** 0.4 (CI rodando); 1.1 a 1.4 feitos em paralelo
- **Último passo concluído:** 0.3 (2026-09-26)
- **Branch de trabalho:** `new_set26` (app) · submódulo `libs/ttwtools` no `main` dele
- **Versão alvo:** `0.4.0` (D1 resolvida); `pyproject.toml` em `0.4.0.dev0`
- **Bloqueios / decisões pendentes:** ver "Decisões pendentes" no fim

## Como usar (leia isto primeiro, é curto)

1. **Leia só:** este cabeçalho, a tabela de andamento e **o passo atual**. Ache o passo com `grep -n '^### ' novodesenho/plano_implementacao.md` e leia só aquele trecho (`Read` com `offset` e `limit`).
2. **Não leia arquivos inteiros grandes.** Use `grep -n` e `Read` com `offset`/`limit`. Em especial: `frontend-src/index.html` (1.250 linhas), `libs/ttwtools/ttwtools/project.py` (1.141 linhas), `novodesenho/novomodelo.md` (só as seções citadas). **Nunca abra** `repomix-output.xml`, `libs/repomix-output.xml`, `ttwa_files/`, `node_modules/`, `dist/` nem `test_corpora/full`.
3. **Um passo por vez.** Cada passo cabe em uma sessão. Não comece o próximo sem fechar o atual.
4. **Ao concluir um passo:** marque `[x]` nos subpassos e na tabela, preencha o **Relato** (modelo abaixo), atualize "Estado atual", rode os testes do passo e **faça um commit** com a mensagem começando pelo número do passo (ex.: `[1.2] esquema v3 do projeto`).
5. **Se travar,** marque `[!]`, escreva o motivo no Relato e siga para um passo que não dependa dele (a coluna "Depende de" diz quais).

**Modelo de relato** (no máximo 6 linhas, sem trecho de código longo):
```
Feito: o que ficou pronto, em uma frase.
Arquivos: principais criados/alterados.
Testes: comando rodado e resultado (ex.: pytest libs/ttwtools/tests -q → 42 passed).
Pendências: o que ficou de fora e por quê (ou "nenhuma").
Observações: decisões tomadas, riscos, algo que o próximo agente precisa saber.
Próximo: passo seguinte recomendado.
```

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado.

## Convenções (valem para todos os passos)

- **Paridade GUI e pacote** (`novomodelo.md` §10): a lógica vive em `libs/ttwtools/ttwtools`; a rota em `app/routes` só chama a função; a tela só apresenta. Todo recurso novo tem função pública + subcomando de linha de comando + (depois) rota + tela.
- **Interface única, sem perfis,** com opções avançadas em painéis recolhidos (§5).
- **Todo texto de interface** sai por chave de tradução (`pt` e `en`), nunca escrito direto no componente (§5 item 6).
- **Escopo:** só o aplicativo local. Não implementar envio de arquivos pelo navegador, privacidade do site, PWA nem ajuste fino para celular (§2, "Escopo da primeira fase").
- **Commits:** mensagem curta em português, começando por `[passo]`. **Nunca** incluir Claude nem outro agente como autor ou coautor (sem `Co-Authored-By`).
- **Submódulo `libs/ttwtools` é outro repositório** (`github.com/luaguiaroliveira/ttwtools`). Mudanças nele: commit e `git push` **dentro do submódulo primeiro**; depois, no app, `git add libs/ttwtools` e commit do novo ponteiro. Sem isso, outra máquina não recebe o código.
- **Testes:** `pytest` para o pacote (`libs/ttwtools/tests`) e para as rotas (`tests/`); corpus de teste pequeno em `test_corpora/5`. Cada passo cita o comando.
- **Sem retrabalho de etiquetagem:** nenhuma função nova pode reprocessar o que já existe em camada equivalente (§9.4, §11.4).
- **Changelog:** uma linha por passo concluído em `CHANGELOG.md`, seção `[Unreleased]`.

## Compatibilidade mínima (requisito fixo)

**O aplicativo empacotado precisa continuar rodando no macOS 12 (Monterey)**, em Intel (x86_64) e em Apple Silicon (arm64), além de Windows e Linux. Consequências que os passos abaixo já incluem:

1. **Alvo de implantação:** todo build de macOS define `MACOSX_DEPLOYMENT_TARGET` (**12.0 no Intel, 12.3 no arm64**, decidido em 0.3: as rodas arm64 do scipy exigem 12.3) (hoje nenhum script define isso). Depois do build, `build/check_macos_min.py` percorre todos os arquivos Mach-O do pacote (`.dylib`, `.so` e executáveis; `vtool -show-build` ou `otool -l`) e **falha se algum exigir um macOS mais novo que 12.0**. Roda em local e no CI (passos 0.3 e 0.4).
2. **Intel (confirmado: a máquina com macOS 12 do usuário é Intel, com Safari 17.6):** o build atual sob Rosetta (`build/build_intel_local.sh`, no commit `a28c79a`) usa **Python 3.11** e **`torch==2.2.2`**, porque as versões novas do torch não têm pacote para Intel Mac. Como o `environment.yml` do desenvolvimento (Python 3.14, `torch==2.11.0`) não serve ao Intel, o plano prevê **um conjunto de versões compatível** (ver 0.1 e 0.3). O torch 2.2.x foi compilado para NumPy 1.x, então no Intel provavelmente é preciso `numpy<2` (**a verificar**).
3. **Stanza e MFTE dependem do torch:** onde o torch não puder ser empacotado (Intel, ou versão que exija macOS mais novo que 12), esses taggers ficam **indisponíveis com aviso claro**, e spaCy e BiberPlus continuam funcionando. A função `taggers.available()` (passo 1.5) já deve devolver "instalado, indisponível neste sistema" com o motivo.
4. **Janela do aplicativo:** no macOS o pywebview usa o WebKit do sistema, que acompanha o Safari instalado. Tailwind 4 exige Safari 16.4 ou mais novo, e a máquina com macOS 12 tem **Safari 17.6**, então o Tailwind 4 deve funcionar (decisão D11 resolvida). Ainda assim, testar a interface lá (3.1 e 6.2), porque nada disso foi verificado na prática.
5. **Fora do alcance do CI gratuito:** o CI só cobre o macOS arm64. O pacote Intel continua sendo feito **localmente** e enviado à release por `build/release_github.sh` (ver 0.4 e 0.5), até haver runner Intel.
6. **Testar de verdade:** cada release de teste é aberta em uma máquina com macOS 12 (0.6) e o roteiro final inclui macOS 12 (6.2).

## Máquinas e ambientes conda do usuário

| Máquina | Sistema | Ambiente conda | Python | Observação |
|---|---|---|---|---|
| Mac de desenvolvimento | macOS 15, Apple Silicon (arm64) | `ttw314` | 3.14 (`environment.yml`) | Roda o CI local, o servidor e o build arm64 |
| Mac Intel | macOS 12, Intel (x86_64), Safari 17.6 | `ttw311` | 3.11 | Alvo de compatibilidade; `torch==2.2.2` |

O script antigo `build_intel_local.sh` (no commit `a28c79a`) criava, para o build Intel sob Rosetta no Mac de desenvolvimento, um ambiente separado chamado `ttw311-x86` em `~/miniconda3-x86`. Não confundir com o `ttw311` do Mac Intel de verdade. O `LEIAME.md` foi atualizado em 2026-09-26 (antes citava `ttw313`, Python 3.12) e será revisado de novo no passo 6.1.

## Como retomar em outra máquina ou com outro agente

```
git fetch --all && git switch new_set26 && git pull
git submodule update --init --recursive          # requer git-lfs instalado (git lfs install)
conda env create -f environment.yml -n ttw314 && conda activate ttw314   # Mac Apple Silicon; no Mac Intel use o ambiente ttw311
pip install --no-deps -e libs/ttwtools -e . && pip install pytest   # instalações editáveis apontam para ESTE clone (ver Relato 0.1)
cd frontend-vue && npm ci                        # a partir do passo 3.1
```
Depois: ler o cabeçalho deste plano, achar o **Passo atual** e o último Relato preenchido.

## Mapa do código (para não explorar de novo)

| Onde | O quê |
|---|---|
| `app/` | Servidor FastAPI local: `server.py`, `__main__.py` (modos `desktop` com pywebview e `web`), `state.py`, `routes/{analysis,corpus,project,quickrun,tagging,tags,utils,viz}.py` |
| `frontend-src/` | Interface **atual** (JS puro, Vite, Tailwind/DaisyUI, D3): `index.html`, `src/{api,chart,main,state,ui}.js`, `src/views/*`. O build vai para `frontend/`, que o servidor serve (`_frontend_dir`) |
| `libs/ttwtools/` | Pacote (submódulo): `ttwtools/{analysis,project,tagged_io,tagging,__init__}.py`, `ttwtools/taggers/{biberplus,mfte,spacy_pos,stanza_pos}.py`, `tags_biber.json` |
| `build/` | **Removida** no commit `5c4b862`. Recuperar do commit `a28c79a`: `git show a28c79a:build/<arquivo>` (spec, hooks, scripts de build e release, ícone) |
| `.github/workflows/build.yml` | CI atual: só macOS arm64, dispara em tag `v*.*.*`, cria release |
| Versões hoje | Tags `v0.3.3 … v0.3.7`; `CHANGELOG.md` até `0.3.6`; `pyproject.toml` e `app/server.py` dizem `0.1.0` (**inconsistente**, corrigir em 0.2) |
| Dados de teste | `test_corpora/{5,100,full}` (`full` é grande), `ttwa_files/` (LFS, 500 MB, não abrir) |
| Documentos | `novodesenho/novomodelo.md`, `plano_visualizacoes.md`, `githubaction.md`, `LEIAME.md`, `CHANGELOG.md` |

**Índice de `novomodelo.md`:** §2 objetivo e escopo · §3 três portas · §4 ferramentas · §5 decisões de arquitetura · §9 formatos e projeto `.ttwa`/`.ttwl` (9.4 tabelas) · §10 princípio GUI+pacote · §11 tagger, tagset e opções (11.1 a 11.5) · §12 estatísticas · §13 ajuda · §14 N grupos · §15 OCTOBOX · §16 palavras-chave e referência · §17 interface (17.3 telas, 17.6 arquitetura) · §18 privacidade (adiada).

## Tabela de andamento

| Passo | Título | Depende de | Estado | Data | Commit |
|---|---|---|---|---|---|
| **Fase 0 — Base: versão, build e release** | | | | | |
| 0.1 | Conferir base e ambiente | — | [x] | 2026-09-26 | ver `git log --grep '\[0.1\]'` |
| 0.2 | Versão única e changelog | 0.1 | [x] | 2026-09-26 | ver `git log --grep '\[0.2\]'` |
| 0.3 | Restaurar e modernizar o build (PyInstaller) | 0.2 | [x] | 2026-09-26 | ver `git log --grep '\[0.3\]'` |
| 0.4 | CI multi-plataforma | 0.3 | [~] | | |
| 0.5 | Processo de release | 0.4 | [ ] | | |
| 0.6 | Release de teste (alpha) | 0.5 | [ ] | | |
| **Fase 1 — Pacote `ttwtools`** | | | | | |
| 1.1 | Testes e linha de comando base | 0.1 | [x] | 2026-09-26 | ttwtools `87bf693` |
| 1.2 | Esquema v3 do projeto (`.ttwa` e `.ttwl`) | 1.1 | [x] | 2026-09-26 | ttwtools `5b7d8e5` |
| 1.3 | Importação de corpus e metadados | 1.2 | [x] | 2026-09-26 | ttwtools `3bbe8a4` |
| 1.4 | Camadas e cache | 1.2 | [x] | 2026-09-26 | ttwtools `82ec09b` |
| 1.5 | Opções e tagsets dos taggers | 1.4 | [ ] | | |
| 1.6 | Formatos de entrada e saída | 1.2 | [ ] | | |
| 1.7 | Estatísticas do corpus | 1.4 | [ ] | | |
| 1.8 | Busca, KWIC, frequência, colocados, dispersão | 1.4 | [ ] | | |
| 1.9 | Referência e palavras-chave | 1.8 | [ ] | | |
| 1.10 | Ajuda e traduções no pacote | 1.1 | [ ] | | |
| **Fase 2 — Servidor local** | | | | | |
| 2.1 | Rotas finas, versão e tarefas | 1.2 | [ ] | | |
| 2.2 | Rotas dos recursos novos | 2.1, 1.5–1.9 | [ ] | | |
| **Fase 3 — Interface Vue** | | | | | |
| 3.1 | Esqueleto Vue | 0.3 | [ ] | | |
| 3.2 | Casca responsiva, tema e traduções | 3.1 | [ ] | | |
| 3.3 | Cliente da API e tarefas | 3.1, 2.1 | [ ] | | |
| 3.4 | Corpora: biblioteca, importar, visão geral | 3.2, 3.3, 2.2 | [ ] | | |
| 3.5 | Escolha de tagger e "Personalizar" | 3.4 | [ ] | | |
| 3.6 | Explorar | 3.4 | [ ] | | |
| 3.7 | Comparar | 3.6 | [ ] | | |
| 3.8 | Ajuda e Aprender | 3.2 | [ ] | | |
| 3.9 | Exportar e "copiar como código" | 3.6 | [ ] | | |
| 3.10 | Acessibilidade e testes de interface | 3.7 | [ ] | | |
| 3.11 | Remover a interface antiga | 3.10 | [ ] | | |
| **Fase 4 — Catálogo de corpora** | | | | | |
| 4.1 | Formato de pacote e catálogo | 1.2 | [ ] | | |
| 4.2 | Baixar, instalar e atualizar | 4.1 | [ ] | | |
| 4.3 | Primeiros corpora | 4.2, 1.6 | [ ] | | |
| 4.4 | Listas de frequência de referência | 4.3, 1.9 | [ ] | | |
| **Fase 5 — Extras** | | | | | |
| 5.1 | Laboratório: comparar N grupos | 1.7, 3.7 | [ ] | | |
| 5.2 | Importador TEI e GrAF (OANC/BNC) | 1.6 | [ ] | | |
| 5.3 | Português | 1.5, 4.3 | [ ] | | |
| **Fase 6 — Fechamento** | | | | | |
| 6.1 | Documentação | 3.11 | [ ] | | |
| 6.2 | Verificação em cada sistema | 6.1 | [ ] | | |
| 6.3 | Release 0.4.0 | 6.2 | [ ] | | |

**Ordem sugerida:** Fase 0 inteira primeiro (prova o pipeline de build e release com o código atual). Depois 1.1 a 1.4, 2.1 e 3.1 a 3.3 (base), e então os recursos (1.5–1.10 com 2.2 e 3.4–3.9) em ordem de valor: **Corpora → Explorar → tagger e Personalizar → Comparar → Ajuda**. Fases 4 e 5 podem correr em paralelo depois de 1.6.

**Marcos de release** (tags de teste, ver 0.5): `v0.4.0-alpha.1` ao fim da Fase 0 · `-alpha.2` ao fim da 1.4+2.1 · `-beta.1` quando 3.7 estiver pronto · `-rc.1` ao fim da Fase 5 · `v0.4.0` no 6.3.

---

# Fase 0 — Base: versão, build e release

Objetivo: desde o começo ter **um único lugar** para a versão e um pipeline que gera os pacotes para macOS, Windows e Linux e publica no GitHub. Tudo com o código **atual**, antes de mudar funcionalidade.

### 0.1 Conferir base e ambiente

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[0.1\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, macOS 15.6.1, `ttw314`; Intel testado sob Rosetta com `ttw311-x86`
- **Ler antes:** `pyproject.toml`, `environment.yml`, `requirements.txt`, `.github/workflows/build.yml` (162 linhas).
- **Fazer:**
  - [x] Confirmar branch `new_set26` e submódulo em dia (`git status`, `git submodule status`).
  - [x] Ativar o ambiente conda da máquina (`ttw314` no Mac Apple Silicon, `ttw311` no Mac Intel; ver "Máquinas e ambientes conda") e rodar o app atual (`python -m app --mode web`) para ver que abre.
  - [x] Rodar os testes que existirem no submódulo (`libs/ttwtools`), anotar o resultado base (ou "não há testes").
  - [x] Anotar no Relato: versões de Python, spaCy, Stanza, torch e PyInstaller instaladas.
  - [x] Verificar se `torch`, `stanza` e `spacy` têm pacotes para a versão do Python usada em **Windows e Linux** (se faltar, decidir fixar 3.13).
  - [x] **macOS 12:** já informado em 2026-09-26: máquina **Intel**, **Safari 17.6**. Anotar no Relato a versão exata do macOS (12.x) e confirmar o Safari com Safari > Sobre o Safari.
  - [x] **Levantar quais dependências não rodam no macOS 12:** com o pacote atual já compilado (ou os pacotes instalados), listar os arquivos Mach-O cujo mínimo de macOS seja maior que 12.0 (`vtool -show-build <arquivo>`), principalmente os do `torch`. Anotar quais versões de `torch`, `numpy`, `spaCy`, `thinc` e `pywebview` satisfazem o alvo 12.0 em **Intel (prioridade)** e em **arm64**. Confirmar se `torch==2.2.2` com `numpy<2` e `stanza` funcionam juntos no Intel (Stanza e MFTE dependem disso).
  - [x] Propor o **conjunto de versões por plataforma** (Python e torch) e registrar em "Decisões pendentes" (D2 e D10).
- **Pronto quando:** o app atual abre e os números de base estão no Relato, incluindo a lista de dependências incompatíveis com o macOS 12.
- **Relato:**
```
Feito: app atual abre (--mode web, HTTP 200, 40 rotas); os 4 taggers rodam em test_corpora/5 no arm64 e no Intel (Rosetta).
Arquivos: só este plano (nenhum código mudou). Ambiente ttw314 corrigido: ttwtools e ttwtools-app estavam instalados
  em modo editável apontando para caminhos antigos (…/repositorios_lu/ttwtools, fora de ttw/); reinstalados de libs/ttwtools e da raiz.
Testes: não há testes no app nem no submódulo (base = 0). pytest instalado no ttw314 (faltava).
Pendências: nenhuma. Máquina Intel confirmada pelo usuário: macOS 12.7.6 (Monterey), Safari 17.6. CHANGELOG: sem linha,
  pois 0.1 não mudou código e o CHANGELOG é reorganizado em 0.2.
Observações: (ver "Levantamento 0.1" abaixo)
Próximo: 0.2.
```
**Levantamento 0.1 (versões e macOS 12):**

| | arm64 (`ttw314`) | Intel (`ttw311-x86`, Rosetta) |
|---|---|---|
| Python | 3.14.3 (conda defaults) | 3.11.13 |
| spaCy / thinc / en_core_web_sm | 3.8.13 / 8.3.13 / 3.8.0 | iguais |
| Stanza / MFTE / BiberPlus | 1.11.1 / 1.0.0.7 / 0.4.0 | iguais |
| torch | 2.11.0 | 2.2.2 |
| numpy / scipy | 2.4.4 / 1.17.1 | 2.4.4 / 1.17.1 (**numpy precisa ser <2**, ver abaixo) |
| pywebview / PyInstaller | 6.1 / 6.19.0 | 6.1 / 6.20.0 |

1. **Intel, torch 2.2.2 + numpy 2 = falha silenciosa:** `torch.from_numpy` dá `RuntimeError: Numpy is not available`; Stanza e MFTE **não acusam erro**, mas gravam 0 palavras em todos os documentos (a exceção por documento é engolida). Com `numpy==1.26.4` (venv descartável, `pip check` limpo, pandas 3.0.2/scipy 1.17.1/sklearn 1.8.0 aceitam numpy 1.26) os 4 taggers dão CSVs **idênticos** aos do arm64. → **Intel exige `numpy<2`** (D10 resolvida). **Para 1.5:** `taggers.available()` deve testar a ponte torch↔numpy, e os taggers não podem engolir erro por documento sem avisar.
2. **Binários acima do macOS 12.0** (varredura `otool -l` do pacote `dist/dist-macsilicon` de 2026-05-05 e do `ttw311-x86`): só **numpy 2.4.4** e **scipy 1.17.1**, porque o pip num macOS 15 escolhe as rodas `macosx_14_0` (Accelerate). Existem rodas compatíveis: numpy `macosx_11_0_arm64`/`macosx_10_9_x86_64` (1.26: 10.9), scipy `macosx_12_0_arm64`/`macosx_10_14_x86_64`. O pip ignora `MACOSX_DEPLOYMENT_TARGET` na escolha de rodas; em 0.3, instalar essas duas com `--platform macosx_12_0_<arch> --only-binary=:all:` (ou fixar o arquivo da roda) e deixar `check_macos_min.py` pegar regressões. torch 2.11 (arm64) pede 11.0; torch 2.2.2 (Intel) pede 10.13; sklearn 12.0; demais ≤ 12.0.
3. **Python do conda defaults 3.14 (arm64) pede macOS 12.1** (`libpython3.14.dylib`, `python3.14`, openssl, sqlite, expat, zstd). Na prática roda em qualquer 12.x atualizado, mas falharia na checagem estrita de 12.0. Opções para 0.3: aceitar 12.1 como mínimo real do arm64, ou compilar com o Python do python.org (mínimo 10.13). O Python 3.11 do `ttw311-x86` pede 10.15.
4. **Windows e Linux com Python 3.14:** há rodas `cp314` de torch 2.11.0 (`win_amd64`, `manylinux_2_28` x86_64/aarch64), spaCy, thinc, blis, numpy e scipy; Stanza, MFTE e BiberPlus são puro Python. Não é preciso fixar 3.13.

### 0.2 Versão única e changelog

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[0.2\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Ler antes:** `pyproject.toml` (linha `version`), `app/server.py` (`version=`), `CHANGELOG.md` (topo), `git tag | tail`, `libs/ttwtools/pyproject.toml`.
- **Regra de versão (SemVer):** `MAJOR.MINOR.PATCH`, com pré-lançamentos `-alpha.N`, `-beta.N`, `-rc.N`. Tag do app = `v` + versão do `pyproject.toml` do app. O pacote `ttwtools` tem versão e tags próprias no repositório dele.
- **Fazer:**
  - [x] Decidir a versão da linha nova (sugestão: `0.4.0`, pois o esquema do `.ttwa` muda) e registrar em "Decisões pendentes".
  - [x] `pyproject.toml` do app é a **fonte única**: corrigir de `0.1.0` para a versão real atual (`0.3.7`) e depois para `0.4.0.dev0` na linha nova.
  - [x] Criar `app/_version.py` lido por `app/__init__.py` (`__version__`), com este fallback: `importlib.metadata` → arquivo `_version.py` gerado no build (no binário congelado os metadados podem faltar).
  - [x] Trocar o `version="0.1.0"` fixo de `app/server.py` por `__version__`; criar `GET /api/version` devolvendo versão do app, do `ttwtools` e o hash do commit.
  - [x] Opção `--version` em `python -m app`.
  - [x] Padronizar `CHANGELOG.md` (formato "Keep a Changelog", seção `[Unreleased]` no topo) e alinhar com as tags existentes.
  - [x] Documentar a regra em `RELEASING.md` (esqueleto; completar em 0.5).
- **Pronto quando:** `python -m app --version`, `GET /api/version` e `pyproject.toml` mostram o mesmo número.
- **Relato:**
```
Feito: versão única 0.4.0.dev0 no pyproject; __version__, `python -m app --version` (responde antes de carregar o torch, 0,2 s) e GET /api/version {app, app_semver, ttwtools, commit}.
Arquivos: app/_version.py (novo), app/__init__.py, app/__main__.py, app/server.py, pyproject.toml (requires-python >=3.11), .gitignore, CHANGELOG.md, RELEASING.md (novo), tests/test_version.py (novo).
Testes: pytest tests -q → 8 passed; servidor real: /api/version = 0.4.0.dev0, / = 200.
Pendências: nenhuma. O salto intermediário para 0.3.7 foi omitido (iria direto para 0.4.0.dev0 no mesmo passo).
Observações: ordem de leitura diferente da prevista: app/_build_info.py (gerado no build, fora do git) → pyproject.toml → importlib.metadata, porque a instalação editável guarda a versão da época da instalação e ficaria desatualizada. Em 0.3 o build.py grava app/_build_info.py (VERSION, COMMIT). pyproject usa PEP 440 (0.4.0a1) e a tag SemVer (v0.4.0-alpha.1); app._version.semver() converte (regra em RELEASING.md). CHANGELOG: "[Unreleased] 2026-05-01" antigo virou [0.3.0]; 0.3.1–0.3.5 (só CI) e 0.3.7 reconstruídos do git. ttwtools não tem __version__ (lido por metadados; no binário, copiar metadados no spec em 0.3).
Próximo: 0.3.
```

### 0.3 Restaurar e modernizar o build (PyInstaller)

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[0.3\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon (`ttw314`) e Intel sob Rosetta (`ttw311-x86`)
- **Ler antes:** `git show a28c79a:build/ttwtools-app.spec` (spec), `git show a28c79a:build/hooks/hook-spacy.py`, `git show a28c79a:build/build_mac.sh`, `git show a28c79a:build/build_win.bat`.
- **Fazer:**
  - [x] Restaurar do commit `a28c79a` para `build/`: `ttwtools-app.spec`, `hooks/hook-spacy.py`, `icon.icns` (`git restore --source=a28c79a -- build/<arquivo>`). Não restaurar os `.pyc`; garantir `__pycache__/` no `.gitignore`.
  - [x] Criar um **único `build/build.py`** (Python, multiplataforma) que: compila o frontend (`npm ci && npm run build`), escreve `app/_build_info.py` (`VERSION`, `COMMIT`; ver Relato 0.2), roda o PyInstaller com o spec e empacota o resultado (DMG no macOS, `.zip` no Windows, `.tar.gz` no Linux), nomeando `TTWtools-<versão>-<so>-<arq>.<ext>`. Os `build_mac.sh` e `build_win.bat` viram invólucros de uma linha.
  - [x] Ajustar o spec: pasta do frontend por variável (a interface Vue entra na 3.1 sem mexer no resto), incluir os arquivos de dados novos do pacote (tagsets, descritores, ajuda) por **glob**, e **não embutir modelos grandes** (só `en_core_web_sm`; os demais serão baixados depois, passo 4.2).
  - [x] Ícones para Windows (`.ico`) e Linux (`.png`) a partir do `icon.icns`.
  - [x] Modo de teste embutido: `TTWtools --selftest` sobe o servidor numa porta livre, chama `GET /api/version`, imprime `OK` e sai com código 0.
  - [x] **Alvo macOS 12:** `build.py` define `MACOSX_DEPLOYMENT_TARGET=12.0` no macOS e aceita `--arch arm64|x86_64` (o `x86_64` reproduz o que fazia `build_intel_local.sh`: Rosetta, Miniconda x86_64, ambiente com o conjunto de versões da 0.1).
  - [x] **Ambientes por plataforma:** manter o `environment.yml` de desenvolvimento e criar arquivos de restrição por alvo (por exemplo `build/constraints-macos-x86_64.txt` com `torch==2.2.2` e `numpy<2`, se confirmado). O `build.py` escolhe o arquivo pelo alvo.
  - [x] **`build/check_macos_min.py`:** percorre o pacote gerado e falha se algum Mach-O exigir macOS acima do mínimo do alvo (**12.3 no arm64**, pelas rodas do scipy; **12.0 no Intel**; decisão de 2026-09-26); imprime os arquivos culpados. Instalar numpy e scipy com rodas de macOS ≤ 12 (Relato 0.1, item 2). Chamado ao fim do `build.py` no macOS.
  - [x] **Dependência ausente vira aviso, não erro:** se `torch` ou `stanza` não estiver no pacote, o app abre normalmente e Stanza/MFTE aparecem como indisponíveis (ver 1.5).
  - [x] Rodar o build **local no seu sistema** e o `--selftest` no binário gerado.
- **Pronto quando:** `python build/build.py` gera o pacote do seu sistema, o `--selftest` passa no binário e `check_macos_min.py` passa (ou lista o que impede o macOS 12, com decisão registrada).
- **Observações a registrar:** tamanho do pacote; se o `pywebview` abriu a janela; no Linux o modo janela exige bibliotecas do sistema (GTK/WebKit), e o `--mode web` é a alternativa.
- **Relato:**
```
Feito: `python build/build.py [--arch x86_64] [--create-env]` gera, testa e empacota; builds arm64 e Intel (Rosetta) feitos, --selftest OK nos dois, check_macos_min OK.
Arquivos: build/{build.py, check_macos_min.py, ttwtools-app.spec, hooks/hook-spacy.py, icon.icns|ico|png, constraints-macos-x86_64.txt, build_mac.sh, build_win.bat}; app/__main__.py (--selftest); .gitignore.
Testes: pytest tests -q → 8 passed; binário arm64 e x86_64 `--selftest` → OK; check_macos_min: arm64 máx. 12.3, Intel máx. 12.0; janela pywebview abriu (1280×800) no .app arm64.
Pendências: Windows e Linux não testados aqui (primeira prova no CI, 0.4). umap-learn (viz UMAP, opcional) está no ttw314 mas fora do environment.yml: entra no pacote local, não no do CI nem no Intel.
Observações: ver "Detalhes 0.3" abaixo.
Próximo: 0.4.
```
**Detalhes 0.3:**
- **Mínimo real do arm64 é macOS 12.3**, não 12.1: todas as rodas `macosx_12_0_arm64` do scipy (1.16.2 a 1.17.1) trazem binários e `libgfortran` com mínimo 12.3. Irrelevante na prática (Monterey atualizado); `LSMinimumSystemVersion` do `.app` segue o alvo.
- **Tamanhos:** arm64 `.app` 703 MB, DMG 288 MB (maio: 532/235 MB; a diferença é sobretudo `llvmlite`/`numba` do umap-learn). Intel DMG 330 MB. Saída: `dist/<so>-<arq>/` e `dist/release/TTWtools-<semver>-<so>-<arq>.<ext>`.
- **O build ajusta o ambiente:** aplica `build/constraints-<so>-<arq>.txt` e, no macOS, troca numpy/scipy por rodas `macosx_12_0` (o pip ignora `MACOSX_DEPLOYMENT_TARGET`). Já feito: `ttw314` com numpy/scipy de rodas 11/12; `ttw311-x86` com `numpy==1.26.4` e scipy 10.14. `--skip-env-fixes` desliga isso.
- **`--selftest`** (fora do app de janela): torch (inclui a ponte torch↔numpy), Stanza, spaCy+`en_core_web_sm`, servidor em porta livre, `/api/version`, frontend. torch/Stanza quebrados → AVISO (não falha); o resto → FALHOU, código 1.
- **Spec:** frontend por `TTW_FRONTEND_DIR`; dados do `ttwtools` por glob (fora `.py`); submódulos do `ttwtools` listados dos fontes; metadados do `ttwtools` copiados; só `en_core_web_sm` (o `en_core_web_trf` saiu); UPX desligado; versão e mínimo no `Info.plist`. Modelos do Stanza ficam fora do pacote (cache do usuário, `~/Library/Caches/stanza`, 184 MB).
- `build_intel_local.sh` não foi restaurado: virou `build.py --arch x86_64 [--create-env]`. `release_github.sh` fica para 0.5.


### 0.4 CI multi-plataforma

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `.github/workflows/build.yml`, `githubaction.md` (só a parte da matriz), o `build/build.py` da 0.3.
- **Fazer:**
  - [ ] **`ci.yml`** (a cada push e PR): instala o ambiente, roda `pytest`, faz o build do frontend e valida `--version`. Rápido, sem PyInstaller.
  - [ ] **`release.yml`** (em tag `v*.*.*` e `workflow_dispatch` para testes): matriz com macOS arm64 (`macos-14`), macOS Intel, Windows (`windows-latest`) e Linux (`ubuntu-latest`). Cada job: checkout com submódulos e LFS, ambiente, `python build/build.py`, **`--selftest` do binário**, e envio do arquivo como artefato.
  - [ ] Conferir o **rótulo atual do runner Intel** (o `macos-13` foi descontinuado; o workflow atual já o tem comentado). Se não houver runner Intel gratuito, registrar como pendência e manter só arm64 no macOS; o **pacote Intel será feito localmente** (`python build/build.py --arch x86_64`, sob Rosetta) e enviado à release com `release_github.sh`.
  - [ ] No job do macOS arm64, exportar `MACOSX_DEPLOYMENT_TARGET=12.0` e rodar `check_macos_min.py` (o job **falha** se algo exigir macOS acima de 12.3, o mínimo do arm64).
  - [ ] Usar no CI o **mesmo conjunto de versões** decidido em 0.1 (não o `environment.yml` de desenvolvimento, se ele tiver torch que exija macOS mais novo).
  - [ ] Cache de pip, do npm e do trabalho do PyInstaller para reduzir tempo.
  - [ ] Job final `publish`: baixa os artefatos, gera `SHA256SUMS.txt`, cria a release **em rascunho** (`draft`) com as notas tiradas da seção da versão no `CHANGELOG.md`; versões com `-alpha`, `-beta` ou `-rc` saem marcadas como *pre-release*.
  - [ ] **Validação da tag:** o job falha se a tag não for igual à versão do `pyproject.toml` ou se o `CHANGELOG.md` não tiver a seção daquela versão.
  - [ ] Passos de **assinatura e notarização** (macOS) e assinatura (Windows) deixados como blocos comentados, com o que precisa ser criado (ver "Decisões pendentes").
- **Pronto quando:** `workflow_dispatch` gera os pacotes disponíveis e o `--selftest` passa em cada sistema.
- **Relato:** _(preencher)_

### 0.5 Processo de release

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `git show a28c79a:build/release_github.sh` (só a lista de opções), `RELEASING.md` da 0.2.
- **Fazer:**
  - [ ] Script `build/release.py` com `--dry-run`: confere árvore limpa e branch `main`, atualiza a versão no `pyproject.toml`, move `[Unreleased]` para a seção da versão com a data, faz o commit `release: vX.Y.Z`, cria a tag `vX.Y.Z` e faz o push (o CI faz o resto).
  - [ ] Submódulo: antes de liberar, conferir que o ponteiro de `libs/ttwtools` aponta para um commit **já publicado** e (se houver tag) registrar a versão dele nas notas.
  - [ ] Completar `RELEASING.md`: fluxo em passos (branch → PR → `main` → `release.py` → conferir rascunho → publicar), como fazer pré-lançamento, como corrigir uma release ruim (nova `PATCH`, nunca reescrever tag publicada).
  - [ ] Manter `build/release_github.sh` (envio manual dos pacotes feitos localmente) como alternativa, atualizado para os novos nomes de arquivo.
- **Pronto quando:** `python build/release.py --dry-run --version 0.4.0-alpha.1` lista tudo que faria, sem alterar nada.
- **Relato:** _(preencher)_

### 0.6 Release de teste (alpha)

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Mesclar a Fase 0 no `main` (PR da `new_set26`, ou branch própria da Fase 0 se for preferível para não misturar com os documentos).
  - [ ] Rodar `release.py` para `0.4.0-alpha.1`; conferir no GitHub: rascunho criado, pacotes de cada sistema, `SHA256SUMS.txt`, marcado como *pre-release*.
  - [ ] Baixar e abrir o pacote em pelo menos **um** sistema diferente do de desenvolvimento.
  - [ ] **Abrir o pacote macOS na máquina com macOS 12** (Intel ou arm64, conforme a que existir): a janela abre, a interface carrega e o `--selftest` passa. Registrar o que falhar (biblioteca ausente, versão do Safari, torch).
  - [ ] Se houver pacote Intel feito localmente, enviá-lo ao rascunho com `release_github.sh`.
  - [ ] Registrar aqui o tempo total do CI e o tamanho de cada pacote.
- **Pronto quando:** existe uma release em rascunho com pacotes de todos os sistemas possíveis, ao menos um foi aberto de verdade e o macOS 12 foi testado.
- **Relato:** _(preencher)_

---

# Fase 1 — Pacote `ttwtools` (repositório `libs/ttwtools`)

Trabalhar sempre dentro de `libs/ttwtools`, com testes. Lembrar: commit e push no submódulo primeiro, depois o ponteiro no app.

### 1.1 Testes e linha de comando base

- Estado: [x] · Data: 2026-09-26 · Commit: ttwtools `87bf693` (+ ponteiro no app) · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Ler antes:** `libs/ttwtools/pyproject.toml`, `libs/ttwtools/ttwtools/__init__.py`.
- **Fazer:**
  - [x] Pasta `libs/ttwtools/tests/` com `conftest.py` e uma fixture que copia `test_corpora/5` para uma pasta temporária.
  - [x] Teste de fumaça do que já existe (criar projeto, salvar e ler arquivo etiquetado JSONL, `kfa`).
  - [x] Linha de comando `ttwtools` (entrada em `pyproject.toml`, biblioteca padrão `argparse`, sem dependência nova) com `--version` e a estrutura de subcomandos (`describe`, `tag`, `tagger-options`, `tagset`, `kwic`, `freq`, `keywords`, `compare`, `help`), cada um por enquanto respondendo "ainda não implementado".
  - [x] Saída padronizada: tabela legível, `--json` e `--csv`.
- **Pronto quando:** `pytest -q` passa e `ttwtools --version` funciona.
- **Relato:**
```
Feito: tests/ com 21 testes (fumaça: projeto .ttwa, JSONL, BiberPlus+KFA; CLI); `ttwtools` (entrada no pyproject e `python -m ttwtools`) com --version e os 9 subcomandos respondendo "ainda não implementado" (código 3); saída tabela/--json/--csv por `ttwtools.cli.emit`.
Arquivos (submódulo): ttwtools/{cli.py, _version.py, __main__.py, __init__.py}, tests/{conftest.py, test_smoke.py, test_cli.py}, pyproject.toml, CHANGELOG.md. App: ci.yml roda também pytest libs/ttwtools/tests.
Testes: pytest libs/ttwtools/tests -q → 21 passed; pytest tests -q (app) → 8 passed; app --selftest OK.
Pendências: nenhuma. Versão do pacote segue 0.1.0 (sobe quando houver API nova de fato).
Observações: `import ttwtools` levava 4,2 s (importava spaCy/biberplus); agora é preguiçoso (PEP 562, mesmos nomes públicos; conferido que todos os `ttwtools.X` usados pelo app resolvem) e `ttwtools --version` leva 0,04 s. Fixture `corpus5` usa examples/test_corpora do próprio pacote (mesmos textos de test_corpora/5; TTWTOOLS_TEST_CORPORA muda a pasta). Cada subcomando novo deve trocar o handler `_not_implemented` e usar `emit`.
Próximo: 1.2 (ou fechar 0.4 quando o CI terminar).
```

### 1.2 Esquema v3 do projeto (`.ttwa` e `.ttwl`)

- Estado: [x] · Data: 2026-09-26 · Commit: ttwtools `5b7d8e5` (+ ponteiro no app) · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Ler antes:** `novomodelo.md` §9.3 e §9.4; em `project.py` só `_SCHEMA_SQL` (linhas ~80–135), as funções `_migrate_*` e `upgrade_to_v2`.
- **Fazer:**
  - [x] Tabelas novas: `documents` (com hash de conteúdo), `document_meta` (chave e valor), `layers` (`tool`, `tool_version`, `model`, `config` em JSON, `config_hash`, `text_hash`, `created_at`), `tokens` (`doc_id`, `layer_id`, `idx`, `start_char`, `end_char`, `word`, `lemma`, `upos`, `xpos`, `feats`, `tags`) com índices em `word`, `lemma`, `xpos`, e `analyses` genérica (`type`, `params`, `layer_refs`, `result`, `created_at`).
  - [x] Marcar a versão do esquema em `project_meta` e migração **v2 → v3** que preenche `tokens` a partir dos blocos JSONL existentes, sem apagar o que já existia.
  - [x] Tipo de projeto: `.ttwa` (texto dentro) e `.ttwl` (sem texto: guarda caminho relativo e hash por documento).
  - [x] Funções: `open_project` (detecta o tipo), `export_corpus_next_to(project)`, `relink_corpus(project, pasta)` conferindo hashes, `embed_corpus` (`.ttwl` → `.ttwa`) e `detach_corpus` (`.ttwa` → `.ttwl` mais pasta).
  - [x] Manter compatível a leitura de projetos v2 (abrir e migrar com aviso).
  - [x] Testes: criar, migrar um `.ttwa` v2 pequeno, converter entre os dois tipos, corpus ausente e corpus alterado.
- **Pronto quando:** um `.ttwa` v2 real (use um pequeno, não o de 346 MB) abre, migra e devolve os mesmos resultados.
- **Relato:**
```
Feito: esquema "0.3" com documents, document_meta, layers, tokens (índices word/lemma/xpos/doc) e analyses; migração ao abrir (só acrescenta; tabelas antigas intactas) com aviso e `migration_report`; .ttwl com export_corpus_next_to, relink_corpus, embed_corpus, detach_corpus e check_corpus.
Arquivos (submódulo): ttwtools/project.py, ttwtools/layers.py (novo), __init__.py, tests/test_project_v3.py, tests/data/v2_small.ttwa (590 KB, gerado pelo ttwtools 0.1.0 antes da mudança). App: routes/corpus.py (upload usa add_corpus_text).
Testes: pytest libs/ttwtools/tests -q → 31 passed; pytest tests -q → 8 passed; rotas do app sobre o v2 migrado: abrir, listar, arquivos, KFA, resumo e tokens OK.
Pendências: GET /api/analysis/features/... dá 500 (NaN no JSON) — erro ANTERIOR (a tabela de traços do BiberPlus tem NaN), tratar em 2.1. kfa_results ainda não é copiado para analyses (fica para 1.9). Migração de projeto grande ao abrir pode demorar (feita dentro da rota); em 2.1 levar para tarefa com progresso.
Observações: ver "Detalhes 1.2".
Próximo: 1.3 ou 1.4.
```
**Detalhes 1.2:**
- **Versão do esquema:** segue a série existente: `0.1` (texto puro), `0.2` (comprimido; `SCHEMA_VERSION_COMPRESSED`), `0.3` (`SCHEMA_VERSION_CURRENT`). Projetos 0.1 passam por `upgrade_to_v2` antes. O app antigo continua abrindo um 0.3 (tabelas novas são ignoradas), mas não indexa `tokens` do que etiquetar.
- **Texto:** continua em `corpus_files` (compatível); `documents` guarda `content_hash` (SHA-256 do texto lido como em `add_corpus_folder`) e, no `.ttwl`, `rel_path` relativo à pasta do projeto. Exportação grava com `newline=""` para o hash não mudar entre sistemas.
- **Camadas:** `tool` = nome guardado em `tagged_files` (`spacy`/`stanza` unificados); `config` = metadado JSONL menos tagger/versão/arquivo; `config_hash` ignora `device`, `use_gpu`, `n_processes`, `batch_size`, `combined_pass` (§11.4). Chave única `(doc, tool, versão, modelo, config_hash)`; salvar de novo substitui. `find_layer()` já faz a busca de cache por `text_hash` (base para 1.4).
- **Tokens:** `ptb` do spaCy vira `xpos`; `xpos` vazio vira NULL; `tags` em JSON; campos desconhecidos em `extra` (coluna a mais que o plano, para não perder dados).
- **Tipo:** `project_meta.project_kind` (`ttwa`/`ttwl`), com a extensão como reserva. Conversões criam arquivo novo (cópia pelo backup do SQLite) e não mexem no original.


### 1.3 Importação de corpus e metadados

- Estado: [x] · Data: 2026-09-26 · Commit: ttwtools `3bbe8a4` (+ ponteiro no app) · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Ler antes:** `novomodelo.md` §14.1 e §15.2 (itens 2, 7 e 8); em `project.py`, `add_corpus_folder` e `add_corpus_file`.
- **Fazer:**
  - [x] `import_corpus(project, origem, nome, ...)` aceitando pasta de `.txt`, um único texto (colado) e CSV com colunas de metadados.
  - [x] Metadados de grupo extraídos do nome do arquivo por delimitador e/ou de um CSV (`document_meta`).
  - [x] Tokenização configurável (pontuação, números, minúsculas, contrações) registrada na configuração.
  - [x] Filtro de documentos por metadado (função reutilizável para todas as análises).
  - [x] Testes com metadados no nome (`grupo_texto01.txt`) e com CSV.
- **Pronto quando:** dá para criar um corpus com grupos e listá-lo filtrado por grupo.
- **Relato:**
```
Feito: ttwtools/corpus.py com import_corpus (pasta, .txt, CSV com coluna de texto, texto colado; no .ttwl o texto colado/CSV vai para <projeto>_corpus/), metadados do nome do arquivo e de CSV em document_meta, TokenizerConfig/tokenize gravada por corpus, filter_documents/list_groups/metadata_keys. CLI: `ttwtools import` e `ttwtools documents --where chave=valor`.
Arquivos (submódulo): ttwtools/corpus.py (novo), cli.py (IMPLEMENTED + import/documents), __init__.py, tests/test_corpus.py, CHANGELOG.md.
Testes: pytest libs/ttwtools/tests -q → 41 passed; CLI manual com CorIFAessaysNE_5 (campos separados por ".") e filtro modo=Ind E lingua=Ne → 5 documentos.
Pendências: stopwords por idioma (§15.2 item 7) ficam para 1.8 (frequência). Rotas e tela, nos passos 2.2 e 3.4.
Observações: filtro: chaves diferentes com E, valores da mesma chave com OU. No nome do arquivo o último campo fica com o resto. CSV: delimitador detectado (, ; tab), BOM aceito; metadados casam com ou sem .txt. Tokenizador simples é regex Unicode (palavras com apóstrofo interno, números com . ou ,); "split" separa n't/'s/'re/'ve/'ll/'d/'m (inglês).
Próximo: 1.4.
```

### 1.4 Camadas e cache

- Estado: [x] · Data: 2026-09-26 · Commit: ttwtools `82ec09b` (+ ponteiro no app) · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Ler antes:** `novomodelo.md` §9.4 e §11.4; `tagged_io.py` (161 linhas, inteiro).
- **Fazer:**
  - [x] `config_hash`: canonicalizar as opções **que afetam o resultado**, com os padrões escritos por extenso e a versão do modelo. Opções só de velocidade ficam fora.
  - [x] `find_layer(project, doc, request)`: regra de suficiência (mesmo modelo e componentes iguais ou mais). Uma camada com POS e lema atende um pedido só de POS.
  - [x] `tag_corpus(project, corpus, tagger, options)` que **pula** documentos com camada suficiente, processa só o que falta, grava a camada em `layers` e os tokens em `tokens`, e informa quantos foram reaproveitados.
  - [x] Retomada: se o processamento parar no meio, ao reexecutar continua do documento seguinte.
  - [x] Adaptar os taggers atuais para entregarem também `lemma`, `upos` e `feats` quando disponíveis (campos extras já são preservados pelo `tagged_io`).
  - [x] Testes: etiquetar duas vezes e conferir que a segunda não reprocessa; mudar o lote (não invalida) e o modelo (invalida).
- **Pronto quando:** a segunda execução do mesmo pedido termina sem chamar o tagger (comprovado por contador no teste).
- **Relato:**
```
Feito: tag_corpus etiqueta documento a documento a partir do texto do projeto, pula camadas suficientes, copia camada de outro documento com o mesmo texto, grava a cada documento (retomada) e informa tagged/reused/cloned/missing_text; find_layer com regra de suficiência (componentes iguais ou a mais); adaptadores por documento para spaCy, Stanza, MFTE e BiberPlus; CLI `ttwtools tag`.
Arquivos (submódulo): ttwtools/{annotate.py, backends.py} (novos), layers.py (layer_satisfies, PERFORMANCE_KEYS), project.py (save_layer, clone_layer; relink atualiza hash), taggers/{spacy_pos,stanza_pos,mfte}.py (lemma/feats/upos), cli.py, tests/test_annotate.py.
Testes: pytest libs/ttwtools/tests -q → 53 passed (contador do tagger falso: 2ª execução = 0 chamadas; lote não invalida; modelo e opção de resultado invalidam; retomada; cópia por hash; texto alterado reetiqueta). Manual: Stanza, Stanza+lema e MFTE em 5 textos; 2ª execução 0,0 s; offsets conferidos.
Pendências: tag_corpus não grava tagged_files (a interface antiga continua usando o fluxo por pasta); feature_tables a partir de tokens fica para 1.7. Opções completas e tagsets: 1.5.
Observações: ver "Detalhes 1.4".
Próximo: 1.5.
```
**Detalhes 1.4:**
- **Identidade da camada:** `config` = opções que mudam o resultado com os padrões por extenso + `components` (ordenados) + `model_version`; desempenho (`n_processes`, `batch_size`, `processing_size`, `device`, `use_gpu`...) fica fora. Opção desconhecida ou componente inexistente → erro claro.
- **Componentes:** spaCy `pos,tag,lemma,morph` (padrão: todos; vêm juntos no pipeline); Stanza `pos,morph` (padrão) e `lemma` (outro processador); MFTE `mfte,pos,morph`; BiberPlus `biber`. No spaCy/Stanza as classes ficam em `upos`/`xpos` e `tags` vai vazio (tags é para taggers de traços: BiberPlus, MFTE).
- **Versão do modelo spaCy** vem dos metadados do pacote do modelo (não carrega o pipeline); por isso um pedido todo reaproveitado não carrega spaCy nem Stanza.
- **Texto alterado:** a camada guarda o `text_hash` do texto etiquetado; `find_layer` exige o hash atual do documento. `relink_corpus(accept_changed=True)` agora atualiza o hash do documento (antes deixava o antigo).


### 1.5 Opções e tagsets dos taggers

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §11 e §11.1 a §11.5; `taggers/__init__.py` (116 linhas); assinaturas em `spacy_pos.py` (linhas 206–232 e 389–418) e `stanza_pos.py` (linhas 75–110, 229–262 e 630–667).
- **Fazer:**
  - [ ] Confirmar nas **versões instaladas** os nomes e valores reais das opções de spaCy e Stanza (a tabela do §11.1 é candidata, não verificada) e registrar diferenças no Relato.
  - [ ] Pasta `libs/ttwtools/ttwtools/data/taggers/` com um `<tagger>.options.json` (descritor: `id`, `grupo`, `tipo`, `padrao`, `valores`, `afeta_resultado`, `explicacao`, `impacto`, disponibilidade) e um `<tagger>.tagset.json` (`tag`, `group`, `definition`, `example`) por tagger. Começar por Biber (converter `tags_biber.json`), UPOS e PTB; depois MFTE e XPOS do Stanza.
  - [ ] Textos de `explicacao` e `definition` como **chaves de tradução** (`pt`, `en`), não texto solto.
  - [ ] API: `ttwtools.taggers.available()`, `.options(id)`, `.get_tagset(id)`, `.run(tagger, corpus, options={...})` com validação contra o descritor; parâmetros antigos continuam como atalhos.
  - [ ] Tirar do código o que está fixo: componentes do spaCy (`_DISABLED`), processadores e idioma do Stanza.
  - [ ] Predefinições ("Rápido", "Recomendado", "Mais preciso") no descritor.
  - [ ] Linha de comando: `ttwtools tagger-options <id>`, `ttwtools tagset <id>`, `ttwtools tag ... --set chave=valor --preset nome`.
  - [ ] Modelo ausente: erro claro com o comando para instalar.
  - [ ] **Disponibilidade por sistema:** `available()` devolve para cada tagger `disponivel` (sim ou não) e o **motivo** (por exemplo "torch não incluído neste pacote do macOS Intel"). Importar `torch`/`stanza` só quando o tagger for usado (já é assim) e tratar `ImportError` como "indisponível", nunca como falha do aplicativo.
  - [ ] Testes: validar opções inválidas, `config_hash` estável, listar tagset, tagger indisponível.
- **Pronto quando:** `ttwtools tagger-options spacy_upos` mostra a tabela com explicações e `ttwtools tag ... --set` altera de fato o comportamento.
- **Relato:** _(preencher)_

### 1.6 Formatos de entrada e saída

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §9.2.
- **Fazer:**
  - [ ] `formats/conllu.py`: leitura para `tokens` e escrita a partir de uma camada (UD).
  - [ ] `formats/vrt.py`: escrita (abre no CWB e no Sketch Engine).
  - [ ] `formats/nltk_tagged.py`: leitura de texto anotado `palavra/TAG` (Brown, LOB).
  - [ ] Saída CSV/JSONL/Parquet opcional (Parquet só se `pyarrow` já for dependência; senão, deixar como extra).
  - [ ] Subcomandos `ttwtools import --format ...` e `ttwtools export --format ...`.
  - [ ] Testes de ida e volta (CoNLL-U → tokens → CoNLL-U).
- **Pronto quando:** um arquivo CoNLL-U pequeno vira corpus com camada, e volta a CoNLL-U sem perdas de colunas usadas.
- **Relato:** _(preencher)_

### 1.7 Estatísticas do corpus

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §12.
- **Fazer:**
  - [ ] `describe(project, corpus)` **sem tagger**: arquivos, palavras, types, hapax, TTR, TTR padronizada por blocos, CTTR e MATTR, comprimento médio de palavra, tamanho dos documentos (mín., mediana, máx., desvio), frases aproximadas, palavras mais frequentes e dados para a curva de Zipf. Marcar que são estimativas.
  - [ ] `describe(..., layer=...)`: distribuição de classes, densidade lexical, comprimento de frase real, lemas por classe, média e desvio por documento.
  - [ ] Salvar o resultado em `analyses` e reaproveitar se nada mudou (mesmo hash).
  - [ ] Stopwords por idioma e listas próprias (acrescentar ou substituir).
  - [ ] `ttwtools describe`.
  - [ ] Testes com valores calculados à mão num corpus minúsculo.
- **Pronto quando:** os números do corpus de teste batem com os esperados e a segunda chamada vem do cache.
- **Relato:** _(preencher)_

### 1.8 Busca, KWIC, frequência, colocados, dispersão

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §4 e §15.1 (linhas de frequência, dispersão e KWIC).
- **Fazer:**
  - [ ] `search(project, corpus, padrao, ...)`: palavra, frase ou regex, sobre forma, lema, classe ou combinação; contagem total e por documento/grupo.
  - [ ] `kwic(...)`: palavra + N de cada lado + frase + classe gramatical + arquivo e posição para abrir o contexto; **paginação** no SQL (`limit`/`offset`), ordenação por contexto esquerdo ou direito.
  - [ ] `frequency(...)`: unidade escolhível (forma, lema, palavra+classe, só classe, n-grama), por documento, grupo ou corpus.
  - [ ] `collocates(...)`: log-likelihood, informação mútua, T-score e frequência, com janela e posição.
  - [ ] `dispersion(...)`: DP de Gries e Range, com dados para o gráfico de barras.
  - [ ] Funciona **sem camada de etiquetas** (só formas) e melhora com camada.
  - [ ] Subcomandos `search`, `kwic`, `freq`, `collocates`, `dispersion`.
  - [ ] Teste de desempenho simples: KWIC em corpus de alguns milhões de tokens em poucos segundos (registrar o tempo no Relato).
- **Pronto quando:** KWIC paginado devolve o mesmo resultado pela linha de comando e pela função, e os índices de `tokens` são usados (conferir com `EXPLAIN QUERY PLAN`).
- **Relato:** _(preencher)_

### 1.9 Referência e palavras-chave

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §16 (16.1 a 16.7).
- **Fazer:**
  - [ ] Formato da **lista de frequências de referência** (arquivo pequeno: item, classe opcional, frequência, número de documentos) e do metadado (ficha do corpus).
  - [ ] `keywords(target, reference, unit, measure, min_freq, min_range, ...)`: log-likelihood, log ratio, %DIFF e log-odds; correção para comparações múltiplas; referência pode ser corpus indexado, lista de frequências ou "os demais grupos".
  - [ ] Verificações de comparabilidade: idioma, tagger e versão; devolver avisos estruturados (a interface os mostra).
  - [ ] `ttwtools keywords --target ... --reference ...`.
  - [ ] Testes com casos conhecidos (valores de log-likelihood calculados de outra forma).
- **Pronto quando:** as palavras-chave de um corpus de teste contra outro batem com os valores esperados e os avisos de comparabilidade aparecem quando devem.
- **Relato:** _(preencher)_

### 1.10 Ajuda e traduções no pacote

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §13.2 e §5 (item 6).
- **Fazer:**
  - [ ] Pasta `libs/ttwtools/ttwtools/data/help/<idioma>/...md` e `tours/*.json`, com o formato do §13.2.
  - [ ] `ttwtools.help.get(topico, lang)` com idioma de reserva (inglês) e `ttwtools help <topico>`.
  - [ ] Carregador de traduções compartilhado (`ttwtools.i18n.t(chave, lang)`) que os descritores de tagger (1.5) usam.
  - [ ] Escrever os primeiros tópicos: `cohens_d`, `normalizacao_por_mil`, `kwic`, `tagset_biber`, `keyness`, `dispersao` (curtos, com "como ler" e "cuidados").
  - [ ] Teste: todo tópico existe em `pt` e `en` (ou cai no reserva sem erro).
- **Pronto quando:** `ttwtools help cohens_d --lang pt` mostra o texto.
- **Relato:** _(preencher)_

---

# Fase 2 — Servidor local (`app/`)

### 2.1 Rotas finas, versão e tarefas

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `app/server.py`, `app/state.py`, `app/routes/tagging.py` (só o modelo de tarefa em segundo plano, linhas ~64–130), `app/routes/utils.py`.
- **Fazer:**
  - [ ] Módulo único de **tarefas em segundo plano** (`app/jobs.py`): criar, consultar progresso, cancelar. Reaproveitar o padrão de `/run` e `/status/{job_id}` para todas as tarefas demoradas.
  - [ ] Passar as rotas atuais para o novo estado de projeto (`.ttwa` e `.ttwl`) e remover regra de negócio que estiver nelas (mover para o pacote).
  - [ ] `GET /api/version`, `GET /api/health` (usados pelo `--selftest`).
  - [ ] Substituir o diálogo de pasta por servidor (`pick-folder`) por uma camada única `fonte de corpus` que hoje só aceita pasta local, catálogo e texto colado.
  - [ ] Testes de rota com `TestClient` do FastAPI.
- **Pronto quando:** as telas antigas continuam funcionando e os testes de rota passam.
- **Relato:** _(preencher)_

### 2.2 Rotas dos recursos novos

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer** (cada rota é só uma chamada à função do pacote):
  - [ ] `GET /api/taggers`, `GET /api/taggers/{id}/options`, `GET /api/taggers/{id}/tagset`; `POST /api/tagging/run` com campo `options`.
  - [ ] `GET /api/corpora/{id}/overview` (1.7) e `POST` para calcular.
  - [ ] `GET /api/explore/kwic` (paginado), `/search`, `/frequency`, `/collocates`, `/dispersion`.
  - [ ] `POST /api/compare/keywords`; `GET /api/references` (a partir da 4.1, por enquanto lista vazia).
  - [ ] `GET /api/help/{topico}?lang=` e `GET /api/i18n/{lang}`.
  - [ ] Endpoint que devolve o **comando de linha de comando equivalente** de cada análise (base do "copiar como código").
  - [ ] Documentação automática em `/api/docs` conferida.
  - [ ] Testes de rota.
- **Pronto quando:** cada recurso do pacote tem rota testada e nenhuma rota tem lógica própria.
- **Relato:** _(preencher)_

---

# Fase 3 — Interface Vue

Decisões: Vue 3, o mais leve possível (`novomodelo.md` §17.6). A interface nova nasce em **`frontend-vue/`**; a antiga (`frontend-src/`) continua funcionando até o passo 3.11. O build da nova também vai para `frontend/` (o servidor não muda). Uma variável de ambiente `TTW_UI=legacy|vue` escolhe qual compilar durante a transição.

### 3.1 Esqueleto Vue

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `frontend-src/package.json`, `frontend-src/vite.config.js`, `frontend-src/tailwind.config.js`.
- **Fazer:**
  - [ ] Criar `frontend-vue/` com Vue 3, Vite, Vue Router, Pinia e `vue-i18n`; Tailwind 4 e DaisyUI (sem Shoelace).
  - [ ] Vite com saída em `../frontend` e carregamento **por rota** (importação dinâmica).
  - [ ] Página mínima que chama `GET /api/version` e mostra o número.
  - [ ] `build/build.py` (0.3) escolhe a pasta pelo `TTW_UI`.
  - [ ] Meta de tamanho: registrar o tamanho comprimido da primeira tela no Relato (alvo: abaixo de cerca de 200 KB).
  - [ ] **Compatibilidade com o WebKit do macOS 12 (Safari 17.6):** definir `build.target` do Vite como `safari16` e abrir a página mínima **na máquina Intel com macOS 12**, dentro do app empacotado. Se o Tailwind 4 falhar lá mesmo assim, reabrir a decisão D11 (Tailwind 3 com DaisyUI 4) antes de seguir para 3.2.
  - [ ] `npm run build` funciona no CI (`ci.yml`).
- **Pronto quando:** o app empacotado abre a página mínima Vue mostrando a versão.
- **Relato:** _(preencher)_

### 3.2 Casca responsiva, tema e traduções

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §17.3 e §17.4.
- **Fazer:**
  - [ ] Casca: cabeçalho com faixa do **corpus ativo** (corpus e camada), navegação (Corpora, Explorar, Comparar, Aprender) e menu Projeto/Configurações. Barra inferior no celular, trilho no tablet, barra lateral no computador (Tailwind por faixas de largura).
  - [ ] Roteamento por URL (`#/corpora`, `#/explorar/kwic`, ...) e "voltar" funcionando.
  - [ ] Tema claro, escuro e alto contraste, seguindo a preferência do sistema por padrão; guardar a escolha.
  - [ ] Traduções `pt` e `en` carregadas de `GET /api/i18n/{lang}`, seletor de idioma da interface (independente do idioma do corpus).
  - [ ] Componentes base acessíveis: botão, menu, janela, gaveta, painel recolhível, tabela, balão.
  - [ ] Layout testado nas larguras 390, 768 e 1280 px (captura de tela guardada em `docs/telas/`).
- **Pronto quando:** navegar entre os quatro destinos vazios funciona nas três larguras, com troca de idioma e de tema.
- **Relato:** _(preencher)_

### 3.3 Cliente da API e tarefas

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Cliente único de API (`src/api/`) tipado, com tratamento de erro padrão.
  - [ ] Composable de **tarefa em segundo plano** (iniciar, progresso, cancelar, retomar ao reabrir a tela).
  - [ ] Componente de **tabela paginada/virtual** ligado a rotas paginadas.
  - [ ] Estado global mínimo (Pinia): projeto aberto, corpus ativo, camada ativa.
  - [ ] Testes de unidade (Vitest) do cliente e do composable.
- **Pronto quando:** uma tarefa de exemplo mostra progresso e pode ser cancelada.
- **Relato:** _(preencher)_

### 3.4 Corpora: biblioteca, importar, visão geral

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §3, §12 e §17.3.
- **Fazer:**
  - [ ] Tela **Corpora**: lista dos corpora do projeto e do catálogo (vazio até a Fase 4), abrir/criar/salvar projeto `.ttwa`/`.ttwl`, exportar o corpus ao lado do `.ttwl`.
  - [ ] Assistente **Adicionar corpus** (origem → metadados e grupos → o que fazer agora).
  - [ ] **Visão geral do corpus** (§12): números grandes, gráficos, convite discreto a etiquetar; mostra o nível pós-etiquetagem quando houver camada.
  - [ ] Lista de camadas do corpus, com a configuração usada em cada uma.
  - [ ] Faixa do corpus ativo ligada a essa escolha.
- **Pronto quando:** importar uma pasta de `.txt` e ver a visão geral funciona pelo aplicativo.
- **Relato:** _(preencher)_

### 3.5 Escolha de tagger e "Personalizar"

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §11 e §11.2.
- **Fazer:**
  - [ ] Seletor de tagger (lista de `GET /api/taggers`, filtrada pelo idioma do corpus).
  - [ ] Botão **"ver tags"**: painel com o tagset (busca, grupos, definição, exemplo).
  - [ ] Botão **"Personalizar"**: painel recolhido, gerado **a partir do descritor** de opções (não escrito à mão), com grupos, marca "muda o resultado / só velocidade", explicação e impacto; linha de resumo; "restaurar recomendado"; predefinições; combinações inválidas desativadas.
  - [ ] Aviso de reaproveitamento: "X de Y documentos já têm esta camada; serão processados Z".
  - [ ] Progresso da etiquetagem pela tarefa em segundo plano (3.3), com retomada.
- **Pronto quando:** etiquetar com spaCy mudando o modelo e um componente pela tela, e reexecutar sem reprocessar.
- **Relato:** _(preencher)_

### 3.6 Explorar

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §4 e §17.4 (esboço do KWIC); `frontend-src/src/views/text-viewer.js` (962 linhas, só a estrutura com `grep -n "^export\|^function"`).
- **Fazer:**
  - [ ] Busca de palavra (quantas vezes ocorre, por documento e grupo).
  - [ ] **KWIC** paginado: contexto esquerdo, palavra, contexto direito, classe, arquivo; toque/clique abre o contexto completo e o arquivo; versão em cartões no celular.
  - [ ] Frequência (unidade escolhível), colocados e dispersão (gráfico de barras).
  - [ ] **Leitor de texto** com etiquetas coloridas (portar `text-viewer.js`; painel de tags como gaveta; definições ao toque e ao teclado, não só ao passar o mouse).
  - [ ] Gráficos reaproveitando os módulos D3 existentes (`chart.js`, `viz-*.js`) como componentes; cada um com "ver como tabela".
- **Pronto quando:** dá para buscar uma palavra, ver o KWIC, clicar e ler o texto com as tags.
- **Relato:** _(preencher)_

### 3.7 Comparar

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §16 e §17.3 ("Aba Resultados atual"); `frontend-src/src/views/{analysis,results}.js` só por `grep -n`.
- **Fazer:**
  - [ ] **Palavras-chave** contra referência (seletor de referência com a ficha do corpus, avisos de comparabilidade, tabela que leva ao KWIC).
  - [ ] **KFA**: portar a tela de análise e os resultados atuais (barras divergentes, dispersão, bolhas, faixas, mapa de calor, radar, violino, redução), trocando as sub-abas por uma galeria com seletor.
  - [ ] Gráficos 3D e redução dimensional pesados carregados **sob demanda** (Plotly só aqui).
  - [ ] Detalhe de feature (`feature-detail`) e abertura do texto com a tag marcada.
- **Pronto quando:** a KFA de dois corpora de teste dá o mesmo resultado que a interface antiga, e as palavras-chave funcionam contra outro corpus do projeto.
- **Relato:** _(preencher)_

### 3.8 Ajuda e Aprender

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §13.
- **Fazer:**
  - [ ] Componente **balão de ajuda** (`?`) ligado a `GET /api/help/{topico}`.
  - [ ] **Tour guiado** com destaque (escolher e conferir a licença da biblioteca, ou escrever o overlay próprio) lendo os JSON de `tours/`.
  - [ ] Botão **"Explicar esta tela"** (destaques com `rough-notation`, que já é dependência).
  - [ ] Destino **Aprender**: glossário pesquisável, lista de tours, exemplos.
  - [ ] Visual interativo do d de Cohen (duas curvas e controle deslizante) como primeiro exemplo.
  - [ ] Balões colocados nas telas já feitas (tagger, KWIC, palavras-chave, KFA).
- **Pronto quando:** o tour do primeiro corpus roda de ponta a ponta e o balão do d de Cohen mostra o visual.
- **Relato:** _(preencher)_

### 3.9 Exportar e "copiar como código"

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Exportar qualquer tabela em CSV/TXT e qualquer gráfico em PNG/SVG.
  - [ ] Botão **"copiar como código"** em cada análise (comando `ttwtools ...` e trecho Python), usando o endpoint da 2.2.
  - [ ] Exportar corpus/camadas em CoNLL-U e VRT (1.6).
- **Pronto quando:** o comando copiado de uma análise, rodado no terminal, dá o mesmo resultado que a tela.
- **Relato:** _(preencher)_

### 3.10 Acessibilidade e testes de interface

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Passe de acessibilidade (meta WCAG 2.2 AA): rótulos, foco visível, teclado, contraste, paletas seguras para daltonismo, `prefers-reduced-motion`.
  - [ ] Testes de ponta a ponta com Playwright nos fluxos: importar → visão geral → etiquetar → KWIC → palavras-chave → KFA, em 390, 768 e 1280 px.
  - [ ] Conferir tamanho do pacote da interface e tempo de abertura.
- **Pronto quando:** os fluxos passam nas três larguras e a verificação de acessibilidade não acusa erros graves.
- **Relato:** _(preencher)_

### 3.11 Remover a interface antiga

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Conferir que nada de `frontend-src/` ficou sem equivalente na nova (lista de telas do plano).
  - [ ] Remover `frontend-src/`, o `TTW_UI` e o Shoelace; ajustar `build/build.py`, `ci.yml` e `release.yml`.
  - [ ] `CHANGELOG.md`.
- **Pronto quando:** o build e o CI passam sem `frontend-src/`.
- **Relato:** _(preencher)_

---

# Fase 4 — Catálogo de corpora

### 4.1 Formato de pacote e catálogo

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §6, §9.5 e §16.3 a §16.5.
- **Fazer:**
  - [ ] Formato de **pacote de corpus**: um `.ttwa` já indexado e etiquetado, ou só a lista de frequências, mais uma **ficha** (`ficha.json`: idioma, variedade, período, gêneros, tamanho, licença e fonte, camadas com tagger e versão, hash).
  - [ ] **Catálogo** (`catalogo.json`) publicado como arquivo de uma release do GitHub (ou de um repositório de dados), com URL, tamanho e hash de cada pacote.
  - [ ] **Regra de licença:** nenhum corpus entra no catálogo sem a licença conferida na fonte e registrada na ficha. Corpus de licença restrita fica só como receita de importação, sem redistribuição.
- **Pronto quando:** existe o esquema do catálogo e um pacote de exemplo valida contra ele.
- **Relato:** _(preencher)_

### 4.2 Baixar, instalar e atualizar

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Pasta de dados do usuário por sistema (padrão do sistema operacional), com corpora e modelos baixados.
  - [ ] `ttwtools catalog list|install|remove|update`, com conferência de hash e progresso.
  - [ ] Tela em Corpora para instalar, ver a ficha e remover.
  - [ ] Download de **modelos** de spaCy e Stanza sob demanda (informando o tamanho), fora do binário.
- **Pronto quando:** instalar um pacote pequeno pelo catálogo e abri-lo na interface funciona.
- **Relato:** _(preencher)_

### 4.3 Primeiros corpora

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Scripts de preparo em `tools/corpora/` (reproduzíveis) para: Brown e LOB (via NLTK), Universal Dependencies (inglês) e um corpus de demonstração pequeno com metadados (obras em domínio público, para os tours).
  - [ ] Conferir e registrar a licença de cada um na ficha.
  - [ ] Publicar no catálogo.
- **Pronto quando:** Brown está instalável pelo catálogo, já etiquetado, e abre na visão geral.
- **Relato:** _(preencher)_

### 4.4 Listas de frequência de referência

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Gerar a lista de frequências de cada corpus do catálogo (forma, lema, classe, número de documentos).
  - [ ] Ligar ao seletor de referência de 3.7 e às faixas de frequência lexical.
  - [ ] Conferir a licença da lista derivada, separada da do texto.
- **Pronto quando:** palavras-chave de um corpus do usuário contra Brown funcionam sem instalar o Brown completo (só a lista).
- **Relato:** _(preencher)_

---

# Fase 5 — Extras

### 5.1 Laboratório: comparar N grupos

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Ler antes:** `novomodelo.md` §14.
- **Fazer:**
  - [ ] `ttwtools.experimental.compare_groups(...)`: um contra todos, par a par (matriz), meu texto contra referências; depois mapa de perfis e dendrograma.
  - [ ] Aba **Laboratório** com aviso de experimental, escolha de grupos (pasta, metadado, seleção) e balão para cada método.
  - [ ] Avisos de cuidado: comparações múltiplas, grupos pequenos ou desiguais.
- **Pronto quando:** "um contra todos" roda para 3 grupos e aparece na tela.
- **Relato:** _(preencher)_

### 5.2 Importador TEI e GrAF (OANC/BNC)

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Leitura de TEI XML e do XML standoff (GrAF) do OANC/MASC para `documents` e `tokens`, conferindo as posições contra o texto original.
  - [ ] Receita de preparo do OANC/MASC em `tools/corpora/` e ficha com a licença conferida.
- **Pronto quando:** um trecho do OANC importado tem camada e abre no KWIC.
- **Relato:** _(preencher)_

### 5.3 Português

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Descritores e tagsets para os modelos de português (spaCy e Stanza), com traduções.
  - [ ] Corpus de referência em português com licença clara (avaliar UD português, Tycho Brahe, Corpus Brasileiro).
  - [ ] Teste do fluxo completo em português.
- **Pronto quando:** etiquetar e explorar um corpus em português pela interface.
- **Relato:** _(preencher)_

---

# Fase 6 — Fechamento

### 6.1 Documentação

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Atualizar `README.md`/`LEIAME.md` (instalação, uso do aplicativo, uso pela linha de comando, formatos, projeto `.ttwa`/`.ttwl`).
  - [ ] Documentação do pacote (`libs/ttwtools/docs`): guia rápido e referência de cada função pública.
  - [ ] Guia de contribuição curto e `RELEASING.md` revisado.
  - [ ] Atualizar o artigo/descrição (ELC) apenas se você pedir.
- **Pronto quando:** alguém consegue instalar e fazer a primeira análise só com o `LEIAME.md`.
- **Relato:** _(preencher)_

### 6.2 Verificação em cada sistema

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Roteiro manual (10 a 15 itens) executado em macOS (arm64 e, se possível, Intel), **incluindo a máquina com macOS 12**, Windows e Linux com o pacote da `-rc.1`. No macOS 12, conferir também que os taggers indisponíveis (se houver) aparecem com o motivo.
  - [ ] Registrar problemas por sistema (janela, caminhos, permissões, assinatura) e corrigir ou listar como conhecidos.
- **Pronto quando:** o roteiro passou em todos os sistemas suportados, ou as exceções estão documentadas.
- **Relato:** _(preencher)_

### 6.3 Release 0.4.0

- Estado: [ ] · Data: — · Commit: — · Agente/máquina: —
- **Fazer:**
  - [ ] Congelar: versão do submódulo com tag própria, `CHANGELOG.md` completo.
  - [ ] `python build/release.py --version 0.4.0`; conferir o rascunho; publicar.
  - [ ] Conferir que os pacotes baixados da release abrem e que `SHA256SUMS.txt` bate.
- **Pronto quando:** a release `v0.4.0` está pública com pacotes e notas.
- **Relato:** _(preencher)_

---

## Decisões pendentes

| # | Decisão | Onde afeta | Situação |
|---|---|---|---|
| D1 | Número da versão da linha nova (`0.4.0` ou outra) | 0.2 | **resolvida em 2026-09-26:** `0.4.0` |
| D2 | Versão do Python e do torch **por plataforma** (hoje: dev em 3.14 com `torch==2.11.0`; Intel em 3.11 com `torch==2.2.2`). Considerar unificar em uma versão só (3.11 ou 3.12) para reduzir divergência. Como o Intel exige 3.11, a unificação em 3.11 é a candidata natural | 0.1, 0.3, 0.4 | **resolvida em 2026-09-26 (usuário aprovou):** manter **dois conjuntos**. (a) macOS arm64, Windows e Linux: Python 3.14, `torch==2.11.0`, numpy 2.4.4/scipy 1.17.1 com rodas de macOS ≤ 12 (rodas cp314 existem nos três sistemas). (b) macOS Intel: Python 3.11, `torch==2.2.2`, `numpy==1.26.4`; o resto igual. Unificar em 3.11 não traria ganho: as demais versões já coincidem e o 3.14 tem suporte mais longo |
| D3 | Runner Intel para macOS (o `macos-13` foi descontinuado); enquanto não houver, o pacote Intel é feito localmente | 0.4 | aberta |
| D10 | **macOS 12 (Intel, confirmado):** o pacote Intel usa Python 3.11 e `torch==2.2.2` (com `numpy<2`, a verificar). Se Stanza/MFTE não funcionarem nessa combinação, o pacote Intel fica sem eles (spaCy e BiberPlus continuam) | 0.1, 0.3 | **resolvida em 0.1:** macOS 12.7.6 Monterey, Safari 17.6 (confirmados). `numpy<2` é obrigatório (com numpy 2 Stanza/MFTE falham em silêncio); com `numpy==1.26.4` os 4 taggers funcionam e dão o mesmo resultado do arm64. Falta abrir o pacote numa máquina macOS 12 real (0.6) |
| D11 | Tailwind 4 no macOS 12: **manter Tailwind 4**, pois o Safari dessa máquina é o 17.6 (o mínimo é 16.4). Reabrir só se o teste em 3.1 falhar | 3.1 | resolvida em 2026-09-26 (a confirmar no teste) |
| D4 | **Assinatura e notarização:** macOS (conta de desenvolvedor da Apple) e Windows (certificado). Sem elas, o sistema mostra avisos ao abrir o pacote | 0.4, 6.2 | aberta; o pipeline nasce sem assinar |
| D5 | Formato do pacote no Windows e no Linux (`.zip`/`.tar.gz` simples agora; instalador e AppImage depois) | 0.3 | aberta (padrão: simples) |
| D6 | Onde hospedar o catálogo de corpora (release do GitHub ou repositório de dados) | 4.1 | aberta |
| D7 | Biblioteca para o tour com destaque, ou overlay próprio (checar licença) | 3.8 | aberta |
| D8 | Nomes dos destinos e do rótulo do corpus ativo | 3.2 | aberta |
| D9 | Padrão recomendado de cada tagger (medir tempo e qualidade) | 1.5 | aberta |

## Registro de mudanças neste plano

_(Se um passo for dividido, reordenado ou descartado, anote aqui em uma linha: data, passo, motivo.)_

- 2026-09-26: plano criado.
- 2026-09-26: requisito de compatibilidade com macOS 12 (Intel e arm64) acrescentado: nova seção "Compatibilidade mínima" e ajustes nos passos 0.1, 0.3, 0.4, 0.6, 1.5, 3.1 e 6.2, mais as decisões D2, D3, D10 e D11.
- 2026-09-26: registrados os ambientes conda por máquina (`ttw314` no Mac Apple Silicon, `ttw311` no Mac Intel).
- 2026-09-26: o usuário informou que o macOS 12 é Intel com Safari 17.6. D11 resolvida (manter Tailwind 4); D10 parcialmente resolvida (Intel confirmado, falta verificar Stanza/MFTE com `torch==2.2.2`).
- 2026-09-26: 0.1 concluído; D10 resolvida (Intel exige `numpy<2`); proposta para D2 registrada; nova linha em "Como retomar" (reinstalação editável).
- 2026-09-26: D1 (`0.4.0`) e D2 (dois conjuntos de versões) resolvidas; mínimo real do pacote arm64 passa a macOS 12.1 (Python 3.14 do conda), Intel segue 12.0 (ajustes em 0.3 e 0.4). 0.2 concluído; o build grava `app/_build_info.py` em vez de `app/_version.py`.
- 2026-09-26: 0.3 concluído; mínimo do arm64 revisto de 12.1 para **12.3** (rodas do scipy), Intel segue 12.0.
