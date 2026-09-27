# Plano de implementação — novo TTWtools (app + pacote `ttwtools`)

Este arquivo é a **fonte única de andamento** da implementação. O desenho está em `novodesenho/novomodelo.md` (consulte só as seções citadas em cada passo).

## Estado atual (atualizar ao fim de cada passo)

- **Passo atual:** 6.2, o usuário executa o roteiro com a `v0.4.0-rc.1` (rascunho de pre-release no GitHub, pacotes dos 4 sistemas). Aguardam o usuário também: 4.3 (licenças e D6), 5.2 (dados reais do OANC/MASC) e 6.3 (release 0.4.0). Ajustes pequenos da interface nova, apontados pelo usuário, ficaram para depois
- **Último passo concluído:** 3.11 (2026-09-27); Fases 0 (exceto teste no macOS 12), 1, 2, 3 e 4 (exceto publicação do catálogo) prontas
- **Branch de trabalho:** `new_set26` (app) · submódulo `libs/ttwtools` no `main` dele
- **Versão alvo:** `0.4.0` (D1 resolvida); `v0.4.0-rc.1` lançada da `main` em 2026-09-27; `new_set26` em `0.4.0rc2.dev0`
- **Bloqueios / decisões pendentes:** ver "Decisões pendentes" no fim

## Como usar (leia isto primeiro, é curto)

1. **Leia só:** este cabeçalho, a tabela de andamento e **o passo atual**. Ache o passo com `grep -n '^### ' novodesenho/plano_implementacao.md` e leia só aquele trecho (`Read` com `offset` e `limit`).
2. **Não leia arquivos inteiros grandes.** Use `grep -n` e `Read` com `offset`/`limit`. Em especial: `libs/ttwtools/ttwtools/project.py` (1.141 linhas), `novodesenho/novomodelo.md` (só as seções citadas). **Nunca abra** `repomix-output.xml`, `libs/repomix-output.xml`, `ttwa_files/`, `node_modules/`, `dist/` nem `test_corpora/full`.
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
| `app/` | Servidor FastAPI local: `server.py`, `__main__.py` (modos `desktop` com pywebview e `web`), `state.py`, `routes/{api_new,corpus,jobs,project,sources,tagging,utils}.py` (rotas antigas sem uso removidas no 3.11) |
| `frontend-vue/` | Interface (Vue 3, Vite, Tailwind/DaisyUI). O build vai para `frontend/` (fora do git), que o servidor serve (`_frontend_dir`). A interface antiga (`frontend-src/`) saiu no 3.11 |
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
| 0.4 | CI multi-plataforma | 0.3 | [x] | 2026-09-26 | ver `git log --grep '\[0.4\]'` |
| 0.5 | Processo de release | 0.4 | [x] | 2026-09-26 | ver `git log --grep '\[0.5\]'` |
| 0.6 | Release de teste (alpha) | 0.5 | [ ] | | |
| **Fase 1 — Pacote `ttwtools`** | | | | | |
| 1.1 | Testes e linha de comando base | 0.1 | [x] | 2026-09-26 | ttwtools `87bf693` |
| 1.2 | Esquema v3 do projeto (`.ttwa` e `.ttwl`) | 1.1 | [x] | 2026-09-26 | ttwtools `5b7d8e5` |
| 1.3 | Importação de corpus e metadados | 1.2 | [x] | 2026-09-26 | ttwtools `3bbe8a4` |
| 1.4 | Camadas e cache | 1.2 | [x] | 2026-09-26 | ttwtools `82ec09b` |
| 1.5 | Opções e tagsets dos taggers | 1.4 | [x] | 2026-09-26 | ttwtools `3e0dc35` |
| 1.6 | Formatos de entrada e saída | 1.2 | [x] | 2026-09-26 | ttwtools `4a0abc3` |
| 1.7 | Estatísticas do corpus | 1.4 | [x] | 2026-09-26 | ttwtools `64e4a1d` |
| 1.8 | Busca, KWIC, frequência, colocados, dispersão | 1.4 | [x] | 2026-09-26 | ttwtools `49c88ee` |
| 1.9 | Referência e palavras-chave | 1.8 | [x] | 2026-09-26 | ttwtools `55c8bce` |
| 1.10 | Ajuda e traduções no pacote | 1.1 | [x] | 2026-09-26 | ttwtools `aff3deb` |
| **Fase 2 — Servidor local** | | | | | |
| 2.1 | Rotas finas, versão e tarefas | 1.2 | [x] | 2026-09-26 | ver `git log --grep '\[2.1\]'` |
| 2.2 | Rotas dos recursos novos | 2.1, 1.5–1.9 | [x] | 2026-09-26 | ver `git log --grep '\[2.2\]'` |
| **Fase 3 — Interface Vue** | | | | | |
| 3.1 | Esqueleto Vue | 0.3 | [x] | 2026-09-26 | ver `git log --grep '\[3.1–3.4\]'` |
| 3.2 | Casca responsiva, tema e traduções | 3.1 | [x] | 2026-09-26 | ver `git log --grep '\[3.1–3.4\]'` |
| 3.3 | Cliente da API e tarefas | 3.1, 2.1 | [x] | 2026-09-26 | ver `git log --grep '\[3.1–3.4\]'` |
| 3.4 | Corpora: biblioteca, importar, visão geral | 3.2, 3.3, 2.2 | [x] | 2026-09-26 | ver `git log --grep '\[3.1–3.4\]'` |
| 3.5 | Escolha de tagger e "Personalizar" | 3.4 | [x] | 2026-09-26 | ver `git log --grep '\[3.5\]'` |
| 3.6 | Explorar | 3.4 | [x] | 2026-09-26 | ver `git log --grep '\[3.6\]'` |
| 3.7 | Comparar | 3.6 | [x] | 2026-09-26 | ver `git log --grep '\[3.7\]'` |
| 3.8 | Ajuda e Aprender | 3.2 | [x] | 2026-09-26 | ver `git log --grep '\[3.8\]'` |
| 3.9 | Exportar e "copiar como código" | 3.6 | [x] | 2026-09-26 | ver `git log --grep '\[3.9\]'` |
| 3.10 | Acessibilidade e testes de interface | 3.7 | [x] | 2026-09-26 | ver `git log --grep '\[3.10\]'` |
| 3.11 | Remover a interface antiga | 3.10 | [x] | 2026-09-27 | ver `git log --grep '\[3.11'` |
| **Fase 4 — Catálogo de corpora** | | | | | |
| 4.1 | Formato de pacote e catálogo | 1.2 | [x] | 2026-09-26 | ver `git log --grep '\[4.1'` |
| 4.2 | Baixar, instalar e atualizar | 4.1 | [x] | 2026-09-26 | ver `git log --grep '\[4.1'` |
| 4.3 | Primeiros corpora | 4.2, 1.6 | [!] | 2026-09-26 | scripts prontos; licenças e publicação (D6) aguardam o usuário |
| 4.4 | Listas de frequência de referência | 4.3, 1.9 | [x] | 2026-09-26 | ver `git log --grep '\[4.3'` |
| **Fase 5 — Extras** | | | | | |
| 5.1 | Laboratório: comparar N grupos | 1.7, 3.7 | [x] | 2026-09-26 | ver `git log --grep '\[5.1'` |
| 5.2 | Importador TEI e GrAF (OANC/BNC) | 1.6 | [!] | 2026-09-26 | falta testar com dados reais (anc.org inacessível) |
| 5.3 | Português | 1.5, 4.3 | [x] | 2026-09-27 | ver `git log --grep '\[5.3'` |
| **Fase 6 — Fechamento** | | | | | |
| 6.1 | Documentação | 3.11 | [x] | 2026-09-27 | ver `git log --grep '\[6.1'` |
| 6.2 | Verificação em cada sistema | 6.1 | [!] | 2026-09-27 | roteiro pronto; execução pelo usuário |
| 6.2a | Correções da verificação | 6.2 | [~] | 2026-09-27 | ver `git log --grep '\[6.2a'` |
| 6.3 | Release 0.4.0 | 6.2a | [ ] | | |

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

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[0.4\]'` · Agente/máquina: Claude (Opus 5.5) / GitHub Actions
- **Ler antes:** `.github/workflows/build.yml`, `githubaction.md` (só a parte da matriz), o `build/build.py` da 0.3.
- **Fazer:**
  - [x] **`ci.yml`** (a cada push e PR): instala o ambiente, roda `pytest`, faz o build do frontend e valida `--version`. Rápido, sem PyInstaller.
  - [x] **`release.yml`** (em tag `v*.*.*` e `workflow_dispatch` para testes): matriz com macOS arm64 (`macos-14`), macOS Intel, Windows (`windows-latest`) e Linux (`ubuntu-latest`). Cada job: checkout com submódulos e LFS, ambiente, `python build/build.py`, **`--selftest` do binário**, e envio do arquivo como artefato.
  - [x] Conferir o **rótulo atual do runner Intel** (o `macos-13` foi descontinuado; o workflow atual já o tem comentado). Se não houver runner Intel gratuito, registrar como pendência e manter só arm64 no macOS; o **pacote Intel será feito localmente** (`python build/build.py --arch x86_64`, sob Rosetta) e enviado à release com `release_github.sh`.
  - [x] No job do macOS arm64, exportar `MACOSX_DEPLOYMENT_TARGET=12.0` e rodar `check_macos_min.py` (o job **falha** se algo exigir macOS acima de 12.3, o mínimo do arm64).
  - [x] Usar no CI o **mesmo conjunto de versões** decidido em 0.1 (não o `environment.yml` de desenvolvimento, se ele tiver torch que exija macOS mais novo).
  - [x] Cache de pip, do npm e do trabalho do PyInstaller para reduzir tempo.
  - [x] Job final `publish`: baixa os artefatos, gera `SHA256SUMS.txt`, cria a release **em rascunho** (`draft`) com as notas tiradas da seção da versão no `CHANGELOG.md`; versões com `-alpha`, `-beta` ou `-rc` saem marcadas como *pre-release*.
  - [x] **Validação da tag:** o job falha se a tag não for igual à versão do `pyproject.toml` ou se o `CHANGELOG.md` não tiver a seção daquela versão.
  - [x] Passos de **assinatura e notarização** (macOS) e assinatura (Windows) deixados como blocos comentados, com o que precisa ser criado (ver "Decisões pendentes").
- **Pronto quando:** `workflow_dispatch` gera os pacotes disponíveis e o `--selftest` passa em cada sistema.
- **Relato:**
```
Feito: ci.yml (push/PR: dependências, pytest do app e do pacote, frontend, --version; ~2 min) e release.yml (tag v*.*.*, workflow_dispatch ou push em release-test/**: validate → build em 4 sistemas com --selftest → publish em rascunho com SHA256SUMS e notas do CHANGELOG).
Arquivos: .github/workflows/{ci.yml, release.yml (era build.yml)}, build/build.py (--install-deps, --deps-only, log do selftest no Windows), build/release_notes.py (novo), app/__main__.py (stdout/stderr None no Windows).
Testes: run 36271945470 (release-test/0.4): macOS arm64 246 MB (máx. 12.3 OK), macOS Intel macos-15-intel 332 MB (torch 2.2.2 + numpy 1.26.4, máx. 12.0 OK), Windows zip 258 MB, Linux tar.gz 382 MB; --selftest OK nos 4. CI verde.
Pendências: publish só roda com tag (validação testada localmente com release_notes.py); primeira tag em 0.6. Assinatura/notarização comentadas (D4).
Observações: ver "Detalhes 0.4".
Próximo: 0.5 (processo de release) ou 1.5.
```
**Detalhes 0.4:**
- **Runner Intel existe:** `macos-15-intel` roda o build x86_64 com Python 3.11 e `build/constraints-macos-x86_64.txt` → D3 resolvida (o pacote Intel não precisa mais ser feito localmente).
- **Sem LFS no checkout** (desvio do plano): só `ttwa_files/` (exemplos, 500 MB) está no LFS e nada no CI usa; evita gastar a cota de 1 GB/mês.
- **Dependências no CI:** `setup-python` + `python build/build.py --install-deps` (lê o `environment.yml`, marca pyobjc como só macOS e uvloop fora do Windows, aplica as versões fixas do alvo). No Linux o torch vem do índice CPU (sem CUDA). O Python do setup-python no macOS arm64 exige 11.0 (o do conda pedia 12.1).
- **`workflow_dispatch` só funciona com o arquivo na `main`**; para testar da branch, `git push origin <branch>:release-test/<nome>`.
- **Windows:** o executável de janela tem stdout/stderr None; o uvicorn falhava ao configurar o log e o PyInstaller abria uma caixa de erro que travava o CI. Corrigido em `app/__main__.py` (aponta para os.devnull) e o `--selftest` nunca deixa exceção escapar. O autoteste grava em `TTW_SELFTEST_LOG`, que o build imprime.
- Tempos: Linux ~8 min, macOS arm64 ~6 min, macOS Intel ~12 min, Windows ~20 min.


### 0.5 Processo de release

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[0.5\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon
- **Ler antes:** `git show a28c79a:build/release_github.sh` (só a lista de opções), `RELEASING.md` da 0.2.
- **Fazer:**
  - [x] Script `build/release.py` com `--dry-run`: confere árvore limpa e branch `main`, atualiza a versão no `pyproject.toml`, move `[Unreleased]` para a seção da versão com a data, faz o commit `release: vX.Y.Z`, cria a tag `vX.Y.Z` e faz o push (o CI faz o resto).
  - [x] Submódulo: antes de liberar, conferir que o ponteiro de `libs/ttwtools` aponta para um commit **já publicado** e (se houver tag) registrar a versão dele nas notas.
  - [x] Completar `RELEASING.md`: fluxo em passos (branch → PR → `main` → `release.py` → conferir rascunho → publicar), como fazer pré-lançamento, como corrigir uma release ruim (nova `PATCH`, nunca reescrever tag publicada).
  - [x] Manter `build/release_github.sh` (envio manual dos pacotes feitos localmente) como alternativa, atualizado para os novos nomes de arquivo.
- **Pronto quando:** `python build/release.py --dry-run --version 0.4.0-alpha.1` lista tudo que faria, sem alterar nada.
- **Relato:**
```
Feito: build/release.py (--dry-run, --allow-branch, --no-push): confere árvore limpa, branch main, tag inexistente e submódulo publicado; grava versão PEP 440; move [Unreleased] para [X.Y.Z] — data com a linha "Pacote ttwtools X (commit…)"; atualiza links; valida com release_notes.py; commit, tag anotada e push. RELEASING.md completo (fluxo, pré-lançamentos, corrigir release ruim, submódulo). build/release_github.sh reescrito (nomes TTWtools-<versão>-<so>-<arq>, refaz SHA256SUMS.txt).
Arquivos: build/{release.py (novo), release_github.sh (novo)}, RELEASING.md, build/build.py (grava TTWTOOLS_VERSION), app/_version.py, tests/test_release.py; submódulo: pyproject 0.2.0.dev0.
Testes: pytest tests -q → 27 passed; `python build/release.py --dry-run --version 0.4.0-alpha.1` lista os passos e os problemas (branch ≠ main, árvore suja) sem alterar nada; release_github.sh --dry-run lista os pacotes.
Pendências: nenhuma.
Observações: pacote ttwtools passa a 0.2.0.dev0 (a Fase 1 mudou a API); /api/version passa a ler a versão do próprio pacote (a dos metadados da instalação editável envelhecia) e, no binário, a gravada no build.
Próximo: 0.6.
```

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

- Estado: [x] · Data: 2026-09-26 · Commit: ttwtools `3e0dc35` (+ ponteiro no app) · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Ler antes:** `novomodelo.md` §11 e §11.1 a §11.5; `taggers/__init__.py` (116 linhas); assinaturas em `spacy_pos.py` (linhas 206–232 e 389–418) e `stanza_pos.py` (linhas 75–110, 229–262 e 630–667).
- **Fazer:**
  - [x] Confirmar nas **versões instaladas** os nomes e valores reais das opções de spaCy e Stanza (a tabela do §11.1 é candidata, não verificada) e registrar diferenças no Relato.
  - [x] Pasta `libs/ttwtools/ttwtools/data/taggers/` com um `<tagger>.options.json` (descritor: `id`, `grupo`, `tipo`, `padrao`, `valores`, `afeta_resultado`, `explicacao`, `impacto`, disponibilidade) e um `<tagger>.tagset.json` (`tag`, `group`, `definition`, `example`) por tagger. Começar por Biber (converter `tags_biber.json`), UPOS e PTB; depois MFTE e XPOS do Stanza.
  - [x] Textos de `explicacao` e `definition` como **chaves de tradução** (`pt`, `en`), não texto solto.
  - [x] API: `ttwtools.taggers.available()`, `.options(id)`, `.get_tagset(id)`, `.run(tagger, corpus, options={...})` com validação contra o descritor; parâmetros antigos continuam como atalhos.
  - [x] Tirar do código o que está fixo: componentes do spaCy (`_DISABLED`), processadores e idioma do Stanza.
  - [x] Predefinições ("Rápido", "Recomendado", "Mais preciso") no descritor.
  - [x] Linha de comando: `ttwtools tagger-options <id>`, `ttwtools tagset <id>`, `ttwtools tag ... --set chave=valor --preset nome`.
  - [x] Modelo ausente: erro claro com o comando para instalar.
  - [x] **Disponibilidade por sistema:** `available()` devolve para cada tagger `disponivel` (sim ou não) e o **motivo** (por exemplo "torch não incluído neste pacote do macOS Intel"). Importar `torch`/`stanza` só quando o tagger for usado (já é assim) e tratar `ImportError` como "indisponível", nunca como falha do aplicativo.
  - [x] Testes: validar opções inválidas, `config_hash` estável, listar tagset, tagger indisponível.
- **Pronto quando:** `ttwtools tagger-options spacy_upos` mostra a tabela com explicações e `ttwtools tag ... --set` altera de fato o comportamento.
- **Relato:**
```
Feito: descritores data/taggers/{spacy,stanza,mfte,biberplus}.options.json (opções, atalhos, tagsets, requisitos, predefinições rapido/recomendado/preciso) e tagsets data/tagsets/{upos 17, ptb 50, biber 95, mfte 172}.tagset.json; 272 textos pt/en em data/i18n (ttwtools.i18n). API ttwtools.taggers.available/options/get_tagset/run/validate_options/preset; build_request/tag_corpus validam e aceitam preset; CLI tagger-options, tagset, tag --set/--preset.
Arquivos (submódulo): ttwtools/{i18n.py, taggers/catalog.py} (novos), data/ (novo), backends.py, annotate.py, cli.py, taggers/{__init__,spacy_pos,stanza_pos,mfte}.py, layers.py, __init__.py, pyproject.toml, tests/test_taggers_catalog.py.
Testes: pytest libs/ttwtools/tests -q → 64 passed (todas as chaves com pt e en; opções inválidas; config_hash estável; tagsets; torch quebrado e módulo ausente → indisponível com motivo; spaCy sem lema com preset rapido; modelo ausente → comando; Stanza não baixa em silêncio). App: 8 passed, --selftest OK.
Pendências: definições do MFTE redigidas a partir do código (marcadas "review": true) — revisar com a documentação do autor; exemplos do Biber vazios; rotas e tela (2.2, 3.5); D9 (padrão recomendado medido) segue aberta.
Observações: ver "Detalhes 1.5".
Próximo: 1.6.
```
**Detalhes 1.5 (diferenças em relação ao §11.1, conferidas nas versões instaladas):**
- **spaCy 3.8.13:** o parâmetro de processos é `n_process` (não `n_processes`); `spacy.load` aceita `disable`/`enable`/`exclude`; o `en_core_web_sm` 3.8.0 tem os pipes `tok2vec, tagger, parser, attribute_ruler, lemmatizer, ner` e **não tem `morphologizer`** (UPOS e morfologia vêm do `attribute_ruler`). Componentes expostos: `pos, tag, lemma, morph`; parser e NER sempre desligados, lematizador só se `lemma` for pedido (`spacy_pos.disabled_pipes`). Tagger com 50 rótulos PTB (inclui `_SP`, `XX`, `NFP`, `HYPH`, `ADD`, `AFX`).
- **Stanza 1.11.1:** o pacote padrão do inglês é `combined` (não `ewt`); há `default`, `default_fast`, `default_accurate` (transformer electra-large) e treebanks (`ewt`, `gum`, `partut`, `lines`, `atis`, `eslspok`, `craft`, `genia`, `mimic`), com variantes `_charlm/_nocharlm/_electra-large`. `tokenize_no_ssplit`, `tokenize_pretokenized` e `pos_batch_size` entram por `**kwargs` e funcionam (testado). Com `download_method=REUSE_RESOURCES` o Stanza **baixa em silêncio** o que falta (baixou 37 MB do `gum` no teste); os adaptadores agora usam `download=False` e dão erro com o comando.
- **MFTE:** o pacote não traz descrições das tags; lista montada do código (e da saída real); `mfte_ext` = atalho com `extended=True`.
- **BiberPlus:** opções que mudam o resultado: `function_words`, `binary_tags`; `usenlp` (tokenização por spaCy) ficou só no caminho antigo por pasta.
- **Disponibilidade:** `available()` não levanta exceção; testa import e a ponte torch↔numpy (caso do Intel com numpy 2) e se o modelo padrão está instalado; devolve `motivo` traduzido e `comando`.
- **Atalhos com nome de submódulo** (`biberplus`, `mfte`): importar o submódulo sobrescrevia a função no pacote (defeito antigo no `mfte`); `ttwtools.biberplus`/`ttwtools.mfte` agora sempre devolvem a função.


### 1.6 Formatos de entrada e saída

- Estado: [x] · Data: 2026-09-26 · Commit: ttwtools `4a0abc3` (+ ponteiro no app) · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Ler antes:** `novomodelo.md` §9.2.
- **Fazer:**
  - [x] `formats/conllu.py`: leitura para `tokens` e escrita a partir de uma camada (UD).
  - [x] `formats/vrt.py`: escrita (abre no CWB e no Sketch Engine).
  - [x] `formats/nltk_tagged.py`: leitura de texto anotado `palavra/TAG` (Brown, LOB).
  - [x] Saída CSV/JSONL/Parquet opcional (Parquet só se `pyarrow` já for dependência; senão, deixar como extra).
  - [x] Subcomandos `ttwtools import --format ...` e `ttwtools export --format ...`.
  - [x] Testes de ida e volta (CoNLL-U → tokens → CoNLL-U).
- **Pronto quando:** um arquivo CoNLL-U pequeno vira corpus com camada, e volta a CoNLL-U sem perdas de colunas usadas.
- **Relato:**
```
Feito: pacote ttwtools/formats: conllu.py (leitura → documentos + camada `conllu`; escrita de qualquer camada), vrt.py (escrita), nltk_tagged.py (leitura palavra/TAG), tables.py (CSV, JSONL canônico por documento, Parquet se houver pyarrow); CLI `import --format conllu|nltk` e `export --to conllu|vrt|csv|jsonl|parquet`.
Arquivos (submódulo): ttwtools/formats/{__init__,common,conllu,vrt,nltk_tagged,tables}.py (novos), cli.py, taggers/stanza_pos.py (grava `sent`), pyproject.toml (pacote formats; extra `parquet`), tests/test_formats.py, tests/data/sample.conllu.
Testes: pytest libs/ttwtools/tests -q → 71 passed; CoNLL-U → projeto → CoNLL-U devolve as 10 colunas iguais (com token de várias palavras, nó vazio, SpaceAfter=No, 2 documentos) e as linhas `# text`.
Pendências: Parquet só com `pip install pyarrow` (não é dependência); comentários de frase do CoNLL-U original (sent_id, newpar) não voltam (sent_id é gerado); nós vazios (1.1) são descartados na leitura.
Observações: texto reconstruído com `# text` (ou formas + SpaceAfter); frases separadas por espaço e parágrafos (`# newpar`) por linha em branco. Na escrita, frases vêm do índice `sent` da camada (CoNLL-U, Stanza, palavra/TAG) ou da pontuação final (spaCy, que roda sem parser); SpaceAfter=No calculado pelas posições. VRT: p-attributes word, xpos, upos, lemma, tags; metadados do documento viram atributos de <text> (nomes saneados). palavra/TAG: etiqueta após a última barra; sem espaço antes de pontuação/aspas de fechamento.
Próximo: 1.7.
```

### 1.7 Estatísticas do corpus

- Estado: [x] · Data: 2026-09-26 · Commit: ttwtools `64e4a1d` (+ ponteiro no app) · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Ler antes:** `novomodelo.md` §12.
- **Fazer:**
  - [x] `describe(project, corpus)` **sem tagger**: arquivos, palavras, types, hapax, TTR, TTR padronizada por blocos, CTTR e MATTR, comprimento médio de palavra, tamanho dos documentos (mín., mediana, máx., desvio), frases aproximadas, palavras mais frequentes e dados para a curva de Zipf. Marcar que são estimativas.
  - [x] `describe(..., layer=...)`: distribuição de classes, densidade lexical, comprimento de frase real, lemas por classe, média e desvio por documento.
  - [x] Salvar o resultado em `analyses` e reaproveitar se nada mudou (mesmo hash).
  - [x] Stopwords por idioma e listas próprias (acrescentar ou substituir).
  - [x] `ttwtools describe`.
  - [x] Testes com valores calculados à mão num corpus minúsculo.
- **Pronto quando:** os números do corpus de teste batem com os esperados e a segunda chamada vem do cache.
- **Relato:**
```
Feito: ttwtools/stats.py com describe() (§12.1 sem tagger, marcado "estimated"; §12.2 com layer=ferramenta), cache em analyses pelo hash de textos+camadas+parâmetros, stopwords en/pt (data/stopwords, acrescentar/substituir), CLI `ttwtools describe <projeto|pasta>`.
Arquivos (submódulo): ttwtools/stats.py, data/stopwords/{en,pt}.txt (novos), cli.py, __init__.py, pyproject.toml (txt em package-data), tests/test_stats.py.
Testes: pytest libs/ttwtools/tests -q → 76 passed (TTR, CTTR, STTR, MATTR, hapax, frases, tamanhos e mais frequentes conferidos à mão num corpus de 2 textos; 2ª chamada do cache; texto/parâmetro/camada refeita invalidam).
Pendências: faixas de frequência lexical (§15.2 item 6) dependem das listas de referência (4.4). Lista de stopwords é curta (editável).
Observações: palavras = tokens com letras (números e pontuação fora); types em minúsculas; STTR em blocos de 1000 dentro de cada documento (blocos incompletos fora; None se nenhum); MATTR janela 50 (documento menor usa TTR simples); frases aproximadas = [.!?]+ seguido de espaço/aspas/fim. Com camada: palavras = UPOS fora de PUNCT/SYM/X (sem UPOS: tokens com letras); densidade lexical = NOUN+PROPN+VERB+ADJ+ADV sobre palavras; média/desvio por documento por 1000 palavras para tags e UPOS principais.
Próximo: 1.8.
```

### 1.8 Busca, KWIC, frequência, colocados, dispersão

- Estado: [x] · Data: 2026-09-26 · Commit: ttwtools `49c88ee` (+ ponteiro no app) · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Ler antes:** `novomodelo.md` §4 e §15.1 (linhas de frequência, dispersão e KWIC).
- **Fazer:**
  - [x] `search(project, corpus, padrao, ...)`: palavra, frase ou regex, sobre forma, lema, classe ou combinação; contagem total e por documento/grupo.
  - [x] `kwic(...)`: palavra + N de cada lado + frase + classe gramatical + arquivo e posição para abrir o contexto; **paginação** no SQL (`limit`/`offset`), ordenação por contexto esquerdo ou direito.
  - [x] `frequency(...)`: unidade escolhível (forma, lema, palavra+classe, só classe, n-grama), por documento, grupo ou corpus.
  - [x] `collocates(...)`: log-likelihood, informação mútua, T-score e frequência, com janela e posição.
  - [x] `dispersion(...)`: DP de Gries e Range, com dados para o gráfico de barras.
  - [x] Funciona **sem camada de etiquetas** (só formas) e melhora com camada.
  - [x] Subcomandos `search`, `kwic`, `freq`, `collocates`, `dispersion`.
  - [x] Teste de desempenho simples: KWIC em corpus de alguns milhões de tokens em poucos segundos (registrar o tempo no Relato).
- **Pronto quando:** KWIC paginado devolve o mesmo resultado pela linha de comando e pela função, e os índices de `tokens` são usados (conferir com `EXPLAIN QUERY PLAN`).
- **Relato:**
```
Feito: ttwtools/query.py (search, kwic, frequency, collocates, dispersion, explain) sobre `tokens`, com sintaxe de consulta (palavra, frase, * ?, /regex/, lemma=, pos=, upos=, xpos=, tag=, &); sem camada, cria a camada `simple` (tokenizador do pacote, sem dependências); índices de expressão lower(word)/lower(lemma) e upos; CLI search, kwic, freq, collocates, dispersion.
Arquivos (submódulo): ttwtools/query.py (novo), backends.py (SimpleBackend), project.py (índices), cli.py, __init__.py, tests/test_query.py.
Testes: pytest libs/ttwtools/tests -q → 83 passed (contagens, KWIC paginado e ordenado, CLI --json igual à função, MI/T/esperado e DP/DP_norm conferidos à mão, EXPLAIN QUERY PLAN usa idx_tokens_lword também no prefixo `ca*`).
Desempenho (Mac M-series, 2.000 docs, 2,61 M tokens, 405 MB): KWIC palavra 0,05 s; frase "the government" 0,94 s; prefixo 0,02 s; regex 0,88 s; página 2001 de "the" (155 mil ocorrências) 0,13 s; frequência de formas 2,2 s. Gravar a camada `simple` levou 70 s (inserção com 7 índices).
Pendências: consulta de frase é feita a partir do 1º token (frases começando com palavra muito frequente são as mais lentas); regex e curingas no meio não usam índice.
Observações: busca não distingue maiúsculas (também a regex); `pos=` casa UPOS ou XPOS; "palavras" = UPOS fora de PUNCT/SYM/X (sem UPOS: tokens com letras). Colocados: E = f(nó)·f(col)·janela/N; MI = log2(O/E); T = (O−E)/√O; LL por tabela 2×2 (padrão #LancsBox). DP de Gries com tamanhos em tokens da camada.
Próximo: 1.9.
```

### 1.9 Referência e palavras-chave

- Estado: [x] · Data: 2026-09-26 · Commit: ttwtools `55c8bce` (+ ponteiro no app) · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Ler antes:** `novomodelo.md` §16 (16.1 a 16.7).
- **Fazer:**
  - [x] Formato da **lista de frequências de referência** (arquivo pequeno: item, classe opcional, frequência, número de documentos) e do metadado (ficha do corpus).
  - [x] `keywords(target, reference, unit, measure, min_freq, min_range, ...)`: log-likelihood, log ratio, %DIFF e log-odds; correção para comparações múltiplas; referência pode ser corpus indexado, lista de frequências ou "os demais grupos".
  - [x] Verificações de comparabilidade: idioma, tagger e versão; devolver avisos estruturados (a interface os mostra).
  - [x] `ttwtools keywords --target ... --reference ...`.
  - [x] Testes com casos conhecidos (valores de log-likelihood calculados de outra forma).
- **Pronto quando:** as palavras-chave de um corpus de teste contra outro batem com os valores esperados e os avisos de comparabilidade aparecem quando devem.
- **Relato:**
```
Feito: ttwtools/keywords.py (keywords, corpus_freqs, FreqTable, make/read/write_reference_list, comparability, medidas), avisos traduzidos (data/i18n/keywords.*.json), CLI keywords e reference-list.
Arquivos (submódulo): ttwtools/keywords.py (novo), data/i18n/keywords.{pt,en}.json, annotate.py (tag_corpus filenames=), query.py (camada simple só onde falta), cli.py, __init__.py, tests/test_keywords.py.
Testes: pytest libs/ttwtools/tests -q → 93 passed (LL igual ao cálculo independente com scipy.special.xlogy em 4 casos, incluindo zeros; exemplo clássico 100/50 em 10 mil → 16,99; log ratio, %DIFF, log-odds, qui-quadrado 3,841→0,05; Bonferroni e FDR; avisos de idioma, tagger, dados iguais, referência sem textos por item).
Pendências: referências do catálogo (4.4); log-odds com prior informativo (Monroe et al.) não implementado — usada razão de chances com +0,5.
Observações: referência pode ser lista .tsv (1ª linha = ficha JSON), outro corpus do projeto, rest:<metadado> (com where) ou FreqTable. Filtros: min_freq no lado que "ganha", min_range nos textos do alvo. Ordenação por |medida|, positivos antes dos negativos; top por direção. Resultado salvo em analyses com referência e versão. Defeito corrigido: a camada `simple` só era criada quando nenhum documento tinha camada; agora completa só os que faltam.
Próximo: 1.10.
```

### 1.10 Ajuda e traduções no pacote

- Estado: [x] · Data: 2026-09-26 · Commit: ttwtools `aff3deb` (+ ponteiro no app) · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Ler antes:** `novomodelo.md` §13.2 e §5 (item 6).
- **Fazer:**
  - [x] Pasta `libs/ttwtools/ttwtools/data/help/<idioma>/...md` e `tours/*.json`, com o formato do §13.2.
  - [x] `ttwtools.help.get(topico, lang)` com idioma de reserva (inglês) e `ttwtools help <topico>`.
  - [x] Carregador de traduções compartilhado (`ttwtools.i18n.t(chave, lang)`) que os descritores de tagger (1.5) usam.
  - [x] Escrever os primeiros tópicos: `cohens_d`, `normalizacao_por_mil`, `kwic`, `tagset_biber`, `keyness`, `dispersao` (curtos, com "como ler" e "cuidados").
  - [x] Teste: todo tópico existe em `pt` e `en` (ou cai no reserva sem erro).
- **Pronto quando:** `ttwtools help cohens_d --lang pt` mostra o texto.
- **Relato:**
```
Feito: ttwtools/help.py (get, topics, search, tour, render; reserva em inglês), data/help/{pt,en}/{metricas,telas,conceitos}/*.md com os 6 tópicos pedidos (cada um com "Como ler" e "Cuidados"), tour data/help/tours/primeiro_corpus.json, textos em data/i18n/help.*.json; CLI `ttwtools help [tópico] [--lang] [--search]`. O carregador ttwtools.i18n (feito em 1.5) é o compartilhado.
Arquivos (submódulo): ttwtools/help.py, data/help/** (novos), data/i18n/help.{pt,en}.json, cli.py, pyproject.toml (md em package-data), tests/test_help.py.
Testes: pytest libs/ttwtools/tests -q → 97 passed (6 tópicos em pt e en com as seções, relacionados existem, reserva no inglês, tour, busca, CLI). `ttwtools help cohens_d --lang pt` mostra o texto.
Pendências: glossário e demais tópicos entram com as telas (3.8). Todos os subcomandos do CLI estão implementados (não há mais "ainda não implementado").
Observações: cabeçalho simples `chave: valor` (sem depender de YAML). Tópicos são achados por id em qualquer subpasta; `texto_ref` do tour aponta para o tópico (o balão usa o `resumo`).
Próximo: 2.1.
```

---

# Fase 2 — Servidor local (`app/`)

### 2.1 Rotas finas, versão e tarefas

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[2.1\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Ler antes:** `app/server.py`, `app/state.py`, `app/routes/tagging.py` (só o modelo de tarefa em segundo plano, linhas ~64–130), `app/routes/utils.py`.
- **Fazer:**
  - [x] Módulo único de **tarefas em segundo plano** (`app/jobs.py`): criar, consultar progresso, cancelar. Reaproveitar o padrão de `/run` e `/status/{job_id}` para todas as tarefas demoradas.
  - [x] Passar as rotas atuais para o novo estado de projeto (`.ttwa` e `.ttwl`) e remover regra de negócio que estiver nelas (mover para o pacote).
  - [x] `GET /api/version`, `GET /api/health` (usados pelo `--selftest`).
  - [x] Substituir o diálogo de pasta por servidor (`pick-folder`) por uma camada única `fonte de corpus` que hoje só aceita pasta local, catálogo e texto colado.
  - [x] Testes de rota com `TestClient` do FastAPI.
- **Pronto quando:** as telas antigas continuam funcionando e os testes de rota passam.
- **Relato:**
```
Feito: app/jobs.py (registro único: new/start/progress/cancel, JobCancelled) e rotas /api/jobs (listar, consultar, cancelar); os dicionários de tarefa de tagging, quickrun e project apontam para o mesmo registro (rotas de status antigas iguais); GET /api/health (usado no --selftest); resposta JSON padrão troca NaN/inf por null; POST /api/corpora/import com fonte única {kind: folder|text|catalog}; .ttwl nos seletores de arquivo, na abertura e no Info.plist.
Arquivos: app/{jobs.py, routes/jobs.py, routes/sources.py} (novos), app/server.py, app/__main__.py, app/routes/{tagging,quickrun,project,utils,corpus}.py, build/ttwtools-app.spec, tests/{conftest.py, test_routes_base.py}.
Testes: pytest tests -q → 14 passed (tarefa ok/cancelada/erro, projeto v2 migrado pelas rotas antigas, rota de traços sem o erro 500, .ttwl nas rotas antigas, importação por pasta/texto/catálogo); /api/tagging/run antigo roda e o resultado entra como camada; --selftest OK.
Pendências: a regra de negócio ainda dentro das rotas antigas (quickrun, analysis, viz) não foi movida: essas rotas saem com a interface antiga (3.11), e as telas novas usam só as rotas finas do 2.2. pick-folder continua para a interface antiga.
Observações: o erro 500 de /api/analysis/features vinha de NaN no JSON; resolvido de forma geral (SafeJSONResponse). quickrun verifica "ocupado" só entre tarefas do mesmo tipo.
Próximo: 2.2.
```

### 2.2 Rotas dos recursos novos

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[2.2\]'` (ttwtools `0f66554`) · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon, `ttw314`
- **Fazer** (cada rota é só uma chamada à função do pacote):
  - [x] `GET /api/taggers`, `GET /api/taggers/{id}/options`, `GET /api/taggers/{id}/tagset`; `POST /api/tagging/run` com campo `options`.
  - [x] `GET /api/corpora/{id}/overview` (1.7) e `POST` para calcular.
  - [x] `GET /api/explore/kwic` (paginado), `/search`, `/frequency`, `/collocates`, `/dispersion`.
  - [x] `POST /api/compare/keywords`; `GET /api/references` (a partir da 4.1, por enquanto lista vazia).
  - [x] `GET /api/help/{topico}?lang=` e `GET /api/i18n/{lang}`.
  - [x] Endpoint que devolve o **comando de linha de comando equivalente** de cada análise (base do "copiar como código").
  - [x] Documentação automática em `/api/docs` conferida.
  - [x] Testes de rota.
- **Pronto quando:** cada recurso do pacote tem rota testada e nenhuma rota tem lógica própria.
- **Relato:**
```
Feito: app/routes/api_new.py com as rotas finas: /api/taggers (+ options, tagset), POST /api/tagging/layers (tarefa), /api/corpora/{c}/overview (GET guardado, POST calcula em tarefa), /api/explore/{search,kwic,frequency,collocates,dispersion}, POST /api/compare/keywords, /api/references (vazio até 4.1), /api/help, /api/help/{tópico}, /api/help/tours/{id}, /api/i18n/{lang}, POST /api/code (comando e código Python equivalentes, via ttwtools.codegen).
Arquivos: app/routes/api_new.py (novo), app/server.py, tests/{test_routes_new.py, conftest.py}; submódulo: ttwtools/codegen.py (novo), stats.py (cache_only), keywords.py → keyness.py, tests/test_codegen.py.
Testes: pytest tests -q → 21 passed; pytest libs/ttwtools/tests -q → 108 passed. O comando de /api/code, executado no CLI, devolve o mesmo JSON da rota /api/explore/kwic; o Python gerado roda e dá o mesmo resultado; /api/docs e /openapi.json listam as rotas.
Pendências: etiquetar com opções ficou em POST /api/tagging/layers (não em /api/tagging/run, que é da interface antiga e continua igual até 3.11).
Observações: rotas não têm lógica própria: validam, chamam a função do pacote e traduzem ValueError/KeyError em 422. Tarefas longas (etiquetar, visão geral) usam app/jobs.py. O módulo ttwtools.keywords escondia a função ttwtools.keywords depois de importado; virou ttwtools.keyness.
Próximo: 3.1 (interface Vue) ou 0.5/0.6 (release).
```

---

# Fase 3 — Interface Vue

Decisões: Vue 3, o mais leve possível (`novomodelo.md` §17.6). A interface nova nasce em **`frontend-vue/`**; a antiga (`frontend-src/`) continua funcionando até o passo 3.11. O build da nova também vai para `frontend/` (o servidor não muda). Uma variável de ambiente `TTW_UI=legacy|vue` escolhe qual compilar durante a transição.

### 3.1 Esqueleto Vue

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[3.1–3.4\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon
- **Ler antes:** `frontend-src/package.json`, `frontend-src/vite.config.js`, `frontend-src/tailwind.config.js`.
- **Fazer:**
  - [x] Criar `frontend-vue/` com Vue 3, Vite, Vue Router, Pinia e `vue-i18n`; Tailwind 4 e DaisyUI (sem Shoelace).
  - [x] Vite com saída em `../frontend` e carregamento **por rota** (importação dinâmica).
  - [x] Página mínima que chama `GET /api/version` e mostra o número.
  - [x] `build/build.py` (0.3) escolhe a pasta pelo `TTW_UI`.
  - [x] Meta de tamanho: registrar o tamanho comprimido da primeira tela no Relato (alvo: abaixo de cerca de 200 KB).
  - [~] **Compatibilidade com o WebKit do macOS 12 (Safari 17.6):** definir `build.target` do Vite como `safari16` e abrir a página mínima **na máquina Intel com macOS 12**, dentro do app empacotado. Se o Tailwind 4 falhar lá mesmo assim, reabrir a decisão D11 (Tailwind 3 com DaisyUI 4) antes de seguir para 3.2.
  - [x] `npm run build` funciona no CI (`ci.yml`).
- **Pronto quando:** o app empacotado abre a página mínima Vue mostrando a versão.
- **Relato:**
```
Feito: frontend-vue/ com Vue 3.5, Vite 8, Vue Router 5 (hash), Pinia 4, vue-i18n 11, Tailwind 4.3 + DaisyUI 5.7 (sem Shoelace); telas por importação dinâmica; build.target safari16; página inicial mostra /api/version; TTW_UI=vue no build.py; ci.yml roda npm test e build.
Arquivos: frontend-vue/** (novo), build/build.py, app/server.py (TTW_FRONTEND_DIR, index.html sem cache), .gitignore, .github/workflows/ci.yml.
Testes: vite build ok; primeira tela ~73 KB gzip (JS 58,6 + CSS 13,9; meta 200 KB); app empacotado com TTW_UI=vue: --selftest OK, check_macos_min 12.3 OK, janela abre (1280×800) servindo a página Vue.
Pendências: abrir o pacote na máquina Intel com macOS 12 (Safari 17.6) — só o usuário (D11 continua "a confirmar").
Observações: saída em frontend-vue/dist (não em ../frontend, que é versionada e guarda a interface antiga); passa a ../frontend no 3.11. Servidor em modo web com TTW_FRONTEND_DIR=frontend-vue/dist.
Próximo: 3.2.
```

### 3.2 Casca responsiva, tema e traduções

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[3.1–3.4\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon
- **Ler antes:** `novomodelo.md` §17.3 e §17.4.
- **Fazer:**
  - [x] Casca: cabeçalho com faixa do **corpus ativo** (corpus e camada), navegação (Corpora, Explorar, Comparar, Aprender) e menu Projeto/Configurações. Barra inferior no celular, trilho no tablet, barra lateral no computador (Tailwind por faixas de largura).
  - [x] Roteamento por URL (`#/corpora`, `#/explorar/kwic`, ...) e "voltar" funcionando.
  - [x] Tema claro, escuro e alto contraste, seguindo a preferência do sistema por padrão; guardar a escolha.
  - [x] Traduções `pt` e `en` carregadas de `GET /api/i18n/{lang}`, seletor de idioma da interface (independente do idioma do corpus).
  - [x] Componentes base acessíveis: botão, menu, janela, gaveta, painel recolhível, tabela, balão.
  - [x] Layout testado nas larguras 390, 768 e 1280 px (captura de tela guardada em `docs/telas/`).
- **Pronto quando:** navegar entre os quatro destinos vazios funciona nas três larguras, com troca de idioma e de tema.
- **Relato:**
```
Feito: casca com faixa do corpus ativo (corpus e camada), navegação Corpora/Explorar/Comparar/Aprender (barra inferior < 768 px, trilho 768–1023, lateral ≥ 1024), menu de configurações com tema (sistema/claro/escuro/alto contraste, guardado) e idioma da interface (pt/en, guardado); rotas #/corpora, #/explorar/:ferramenta, #/comparar, #/aprender/:tópico; componentes base: Collapsible, AppDialog (<dialog>), HelpTip (balão), JobProgress, PagedTable, BarChart, StatCard; link "pular para o conteúdo", foco visível, prefers-reduced-motion.
Arquivos: frontend-vue/src/{App.vue, router.js, i18n.js, theme.js, style.css, components/*}; textos em libs/ttwtools/ttwtools/data/i18n/ui.{pt,en}.json (servidos por /api/i18n).
Testes: navegador (Chrome) a 390, 800 e 1280 px: layouts corretos (captura em docs/telas/3.2-larguras-390-800-1280.jpg); troca de idioma e de tema; voltar do navegador.
Pendências: gaveta (drawer) entra com o painel de tags (3.5/3.6).
Observações: vue-i18n com chave plana e compilador próprio só de {parâmetro} (os textos têm "@" e "|" literais). Com zoom fracionário do navegador, 768 px pode cair na faixa do celular (artefato de arredondamento).
Próximo: 3.3.
```

### 3.3 Cliente da API e tarefas

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[3.1–3.4\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon
- **Fazer:**
  - [x] Cliente único de API (`src/api/`) tipado, com tratamento de erro padrão.
  - [x] Composable de **tarefa em segundo plano** (iniciar, progresso, cancelar, retomar ao reabrir a tela).
  - [x] Componente de **tabela paginada/virtual** ligado a rotas paginadas.
  - [x] Estado global mínimo (Pinia): projeto aberto, corpus ativo, camada ativa.
  - [x] Testes de unidade (Vitest) do cliente e do composable.
- **Pronto quando:** uma tarefa de exemplo mostra progresso e pode ser cancelada.
- **Relato:**
```
Feito: cliente único (src/api/client.js: ApiError com status/detail, rede → status 0; src/api/index.js com todos os caminhos), composable useJob (iniciar, acompanhar, cancelar, retomar via sessionStorage), PagedTable ligado a rotas paginadas, store Pinia (projeto, corpus e camada ativos, lista de corpora; guarda a escolha), tarefa de exemplo POST /api/jobs/demo com painel "Diagnóstico" na tela inicial.
Arquivos: frontend-vue/src/{api/*, composables/useJob.js, stores/session.js, components/{JobProgress,PagedTable}.vue, views/HomeView.vue}, app/routes/jobs.py (demo), src/test/*.test.js.
Testes: npx vitest run → 9 passed (cliente: URL, POST, erro HTTP, rede, vazio; useJob: progresso até o fim, cancelar, retomar, erro); navegador: tarefa de exemplo mostra "8 de 20" com barra e cancela ("Cancelado 9 de 20").
Pendências: nenhuma.
Observações: —
Próximo: 3.4.
```

### 3.4 Corpora: biblioteca, importar, visão geral

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[3.1–3.4\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon
- **Ler antes:** `novomodelo.md` §3, §12 e §17.3.
- **Fazer:**
  - [x] Tela **Corpora**: lista dos corpora do projeto e do catálogo (vazio até a Fase 4), abrir/criar/salvar projeto `.ttwa`/`.ttwl`, exportar o corpus ao lado do `.ttwl`.
  - [x] Assistente **Adicionar corpus** (origem → metadados e grupos → o que fazer agora).
  - [x] **Visão geral do corpus** (§12): números grandes, gráficos, convite discreto a etiquetar; mostra o nível pós-etiquetagem quando houver camada.
  - [x] Lista de camadas do corpus, com a configuração usada em cada uma.
  - [x] Faixa do corpus ativo ligada a essa escolha.
- **Pronto quando:** importar uma pasta de `.txt` e ver a visão geral funciona pelo aplicativo.
- **Relato:**
```
Feito: tela Corpora com barra do projeto (abrir por caminho ou seletor nativo, criar, separar/embutir corpus, exportar textos ao lado, aviso de textos ausentes no .ttwl), biblioteca (cartões, escolher corpus ativo), catálogo (vazio até a Fase 4), assistente Adicionar corpus (origem → metadados/grupos → o que fazer agora), visão geral (números grandes, palavras mais frequentes com "ver como tabela", nível pós-etiquetagem com classes e densidade lexical) calculada em tarefa, lista de camadas com configuração e "usar".
Arquivos: frontend-vue/src/{views/CorporaView.vue, components/{ProjectBar,AddCorpusWizard,CorpusOverview,LayersList,BarChart,StatCard}.vue, stores/session.js}; app/routes/api_new.py (/api/project/info, /convert, /export-corpus, /api/corpora, /documents, /layers); submódulo: corpus.list_corpora/layer_summary.
Testes: pytest tests -q → 28 passed; libs 109 passed; navegador: criar projeto → importar pasta de 100 ensaios com campos no nome → visão geral (100 documentos, 111.706 palavras, 11.055 formas, MATTR 0,792…).
Pendências: gráficos D3 e curva de Zipf entram com Explorar (3.6); etiquetar pela tela é o 3.5.
Observações: números no formato do idioma da interface; index.html com Cache-Control: no-cache (o navegador guardava a versão anterior).
Próximo: 3.5.
```

### 3.5 Escolha de tagger e "Personalizar"

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[3.5\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon
- **Ler antes:** `novomodelo.md` §11 e §11.2.
- **Fazer:**
  - [x] Seletor de tagger (lista de `GET /api/taggers`, filtrada pelo idioma do corpus).
  - [x] Botão **"ver tags"**: painel com o tagset (busca, grupos, definição, exemplo).
  - [x] Botão **"Personalizar"**: painel recolhido, gerado **a partir do descritor** de opções (não escrito à mão), com grupos, marca "muda o resultado / só velocidade", explicação e impacto; linha de resumo; "restaurar recomendado"; predefinições; combinações inválidas desativadas.
  - [x] Aviso de reaproveitamento: "X de Y documentos já têm esta camada; serão processados Z".
  - [x] Progresso da etiquetagem pela tarefa em segundo plano (3.3), com retomada.
- **Pronto quando:** etiquetar com spaCy mudando o modelo e um componente pela tela, e reexecutar sem reprocessar.
- **Relato:**
```
Feito: painel Etiquetar na tela Corpora: seletor de tagger (de /api/taggers; indisponíveis desativados com motivo e comando), "Ver tags" (gaveta com tagset, busca e grupos), predefinições Rápido/Recomendado/Mais preciso, "Personalizar" gerado do descritor (grupos, tipo de campo, "muda o resultado / só muda a velocidade", padrão, explicação, impacto; valores não instalados desativados com o comando), resumo da configuração, "restaurar recomendado", aviso "X de Y já têm esta camada; Z serão processados" (POST /api/tagging/plan), etiquetagem em tarefa com progresso, cancelamento e retomada.
Arquivos: frontend-vue/src/components/{TaggerPanel,OptionsForm,TagsetDrawer}.vue, views/CorporaView.vue, api/index.js; app/routes/api_new.py (/api/tagging/plan; options com availability); submódulo: annotate.plan_tagging, taggers.value_availability, textos ui.*.json.
Testes: pytest tests -q → 29 passed; libs → 111 passed; navegador: spaCy sem lema pelo "Personalizar" em 100 ensaios → "100 etiquetados"; reexecutar → "0 etiquetados, 100 reaproveitados" e o aviso "Nada a processar".
Pendências: mudar o modelo pela tela não foi testado porque só o en_core_web_sm está instalado (os demais aparecem desativados com "python -m spacy download ..."). Filtro de taggers pelo idioma do corpus depende de o corpus ter idioma (hoje só inglês).
Observações: só as opções diferentes do padrão vão no pedido (o comando equivalente fica curto).
Próximo: 3.6.
```

### 3.6 Explorar

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[3.6\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon
- **Ler antes:** `novomodelo.md` §4 e §17.4 (esboço do KWIC); `frontend-src/src/views/text-viewer.js` (962 linhas, só a estrutura com `grep -n "^export\|^function"`).
- **Fazer:**
  - [x] Busca de palavra (quantas vezes ocorre, por documento e grupo).
  - [x] **KWIC** paginado: contexto esquerdo, palavra, contexto direito, classe, arquivo; toque/clique abre o contexto completo e o arquivo; versão em cartões no celular.
  - [x] Frequência (unidade escolhível), colocados e dispersão (gráfico de barras).
  - [x] **Leitor de texto** com etiquetas coloridas (portar `text-viewer.js`; painel de tags como gaveta; definições ao toque e ao teclado, não só ao passar o mouse).
  - [~] Gráficos reaproveitando os módulos D3 existentes (`chart.js`, `viz-*.js`) como componentes; cada um com "ver como tabela".
- **Pronto quando:** dá para buscar uma palavra, ver o KWIC, clicar e ler o texto com as tags.
- **Relato:**
```
Feito: tela Explorar com abas por URL (#/explorar/{busca,kwic,frequencia,colocados,dispersao,leitor}), cada ferramenta carregada sob demanda: busca (total, por documento ou por metadado, gráfico com "ver como tabela"), KWIC paginado e ordenável (tabela alinhada no computador, cartões no celular; clicar/Enter abre o leitor na posição), frequência (forma, lema, palavra+classe, classe, n-grama; por corpus, documento ou grupo; sem palavras funcionais), colocados (janela, unidade, LL/MI/T/freq, lado), dispersão (DP, DP normalizado, range e "código de barras" por texto, com tabela), leitor com etiquetas (cor por UPOS/XPOS/tags, legenda clicável que destaca uma classe, navegação anterior/próximo destacado, clique no token mostra palavra, lema, classes, traços e a definição do tagset; ocorrência do KWIC destacada).
Arquivos: frontend-vue/src/views/{ExploreView.vue, explore/{QueryBox,SearchTool,KwicTool,FrequencyTool,CollocatesTool,DispersionTool,ReaderTool}.vue}, api/index.js; app/routes/api_new.py (GET /api/corpora/{c}/text/{arquivo}); submódulo: query.read_document, textos.
Testes: pytest tests -q → 30 passed; libs → 112 passed; navegador com 100 ensaios etiquetados pelo spaCy: KWIC "society" → 46 linhas com classe NOUN; clique → leitor destacando "society" (1.268 tokens coloridos); seleção de token com definição; frequência; dispersão (DP 0,738, range 24/100).
Pendências: gráficos em SVG próprio (barras e código de barras), não os módulos D3 da interface antiga (chart.js e viz-*.js são da KFA/visualizações e entram em Comparar, 3.7). Leitor paginado (paged.js) não portado.
Observações: cada ferramenta tem menos de 3 KB comprimidos. KWIC com sentença inteira no title da linha.
Próximo: 3.7.
```

### 3.7 Comparar

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[3.7\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon
- **Ler antes:** `novomodelo.md` §16 e §17.3 ("Aba Resultados atual"); `frontend-src/src/views/{analysis,results}.js` só por `grep -n`.
- **Fazer:**
  - [x] **Palavras-chave** contra referência (seletor de referência com a ficha do corpus, avisos de comparabilidade, tabela que leva ao KWIC).
  - [x] **KFA**: portar a tela de análise e os resultados atuais (barras divergentes, dispersão, bolhas, faixas, mapa de calor, radar, violino, redução), trocando as sub-abas por uma galeria com seletor.
  - [x] Gráficos 3D e redução dimensional pesados carregados **sob demanda** (Plotly só aqui).
  - [x] Detalhe de feature (`feature-detail`) e abertura do texto com a tag marcada.
- **Pronto quando:** a KFA de dois corpora de teste dá o mesmo resultado que a interface antiga, e as palavras-chave funcionam contra outro corpus do projeto.
- **Relato:**
```
Feito: tela Comparar (#/comparar?tool=palavras-chave|kfa). Palavras-chave: referência = outro corpus, os demais grupos (metadado) ou lista .tsv; unidade, medida, freq. e textos mínimos, correção; avisos de comparabilidade; tabela com LL, log ratio, %DIFF, p corrigido e range; clicar leva ao KWIC. KFA: entre dois corpora ou dois grupos do mesmo corpus, camada, métrica (KFA/KFA2), |d| mínimo; barras divergentes clicáveis (com "ver como tabela"); detalhe do traço com um ponto por texto em cada lado e "Ver no leitor" com a tag destacada.
Arquivos: frontend-vue/src/views/{CompareView.vue, compare/{KeywordsTool,KfaTool}.vue}, components/DivergingBars.vue, explore/{KwicTool,ReaderTool}.vue (?q=, ?highlight=); app/routes/api_new.py (POST /api/compare/kfa, GET /api/compare/feature); submódulo: ttwtools/features.py (novo), taggers/biberplus.py (alinhamento sem perder tags), cli.py (compare), codegen (kfa), tests/test_features.py.
Testes: libs → 115 passed (tabelas das camadas migradas de MFTE e spaCy idênticas às antigas; camada nova do BiberPlus idêntica à tabela antiga e KFA2 com d igual ao resultado salvo pela versão 0.1.0, diferença < 1e-9); app → 31 passed; navegador: KFA bawe × corifa (spaCy, 100 × 100 textos, 11 traços com |d| ≥ 0,2) e detalhe; palavras-chave bawe × corifa → KWIC de "poem" (214).
Pendências: nenhuma. (Completado depois: galeria com seletor — barras do d, médias, bolhas, faixas por texto, mapa de calor, radar, violino, histograma, coordenadas paralelas, redução PCA/t-SNE/UMAP/MDS e PCA 3D com Plotly carregado só nele; dados em ttwtools.viz, fora das rotas; os 11 gráficos conferidos no navegador com 100 × 100 textos.)
Observações: KFA das camadas não reetiqueta; JSONL antigos do BiberPlus perderam tags de pontuação e de tokens não localizados (a camada migrada difere um pouco da tabela antiga; etiquetar de novo resolve).
Próximo: 3.8.
```

### 3.8 Ajuda e Aprender

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[3.8\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon
- **Ler antes:** `novomodelo.md` §13.
- **Fazer:**
  - [x] Componente **balão de ajuda** (`?`) ligado a `GET /api/help/{topico}`.
  - [x] **Tour guiado** com destaque (escolher e conferir a licença da biblioteca, ou escrever o overlay próprio) lendo os JSON de `tours/`.
  - [x] Botão **"Explicar esta tela"** (destaques com `rough-notation`, que já é dependência).
  - [x] Destino **Aprender**: glossário pesquisável, lista de tours, exemplos.
  - [x] Visual interativo do d de Cohen (duas curvas e controle deslizante) como primeiro exemplo.
  - [x] Balões colocados nas telas já feitas (tagger, KWIC, palavras-chave, KFA).
- **Pronto quando:** o tour do primeiro corpus roda de ponta a ponta e o balão do d de Cohen mostra o visual.
- **Relato:**
```
Feito: balão "?" (HelpTip, GET /api/help/{tópico}); tour guiado com overlay próprio (recorte do alvo, balão, teclado Esc/setas, cada passo leva à rota do alvo) lendo data/help/tours/*.json; "Explicar esta tela" (áreas marcadas com data-explain e explicações traduzidas); destino Aprender com busca, tópicos por área, lista de tours e página do tópico (Markdown mínimo, relacionados, aviso de texto em inglês); visual interativo do d de Cohen (duas normais, controle deslizante, sobreposição 2·Φ(−d/2)) na página e no balão do d; balões em tagger, KWIC, palavras-chave, colocados, dispersão e KFA; ids estáveis para o tour (#importar-corpus, #botao-tagger, #busca-kwic, #palavras-chave).
Arquivos: frontend-vue/src/{views/LearnView.vue, components/{TourOverlay,ExplainOverlay,CohenDVisual,HelpTip}.vue, composables/useTour.js, utils/markdown.js, test/markdown.test.js} e marcações nas telas; submódulo: tour com "rota" por passo, help.tour() devolve route, textos ui.*.json.
Testes: vitest → 10 passed; navegador: tour completo (4 passos em /corpora, /explorar/kwic, /comparar); d = 0,8 → 69% e d = 2,0 → 32% de sobreposição (valores teóricos); balão da KFA com o visual; "Explicar esta tela" com as notas.
Pendências: glossário próprio (hoje a busca percorre os tópicos); mais tours e tópicos conforme as telas amadurecem.
Observações: D7 resolvida — overlay próprio em vez de Driver.js/Shepherd/rough-notation (menos dependências, sem questão de licença).
Próximo: 3.9.
```

### 3.9 Exportar e "copiar como código"

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[3.9\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon
- **Fazer:**
  - [x] Exportar qualquer tabela em CSV/TXT e qualquer gráfico em PNG/SVG.
  - [x] Botão **"copiar como código"** em cada análise (comando `ttwtools ...` e trecho Python), usando o endpoint da 2.2.
  - [x] Exportar corpus/camadas em CoNLL-U e VRT (1.6).
- **Pronto quando:** o comando copiado de uma análise, rodado no terminal, dá o mesmo resultado que a tela.
- **Relato:**
```
Feito: menu Exportar (tabela em CSV/TXT; gráfico em SVG/PNG com as cores do tema) e botão "Copiar como código" (comando ttwtools e trecho Python, via POST /api/code, com copiar para a área de transferência) na busca, KWIC, frequência, colocados, dispersão, visão geral, palavras-chave, KFA e etiquetagem; exportar cada camada em CoNLL-U, VRT ou CSV (POST /api/corpora/{c}/export, conteúdo para baixar ou gravação num caminho); downloads liberados na janela do app (pywebview ALLOW_DOWNLOADS).
Arquivos: frontend-vue/src/{utils/export.js, components/{ExportMenu,CopyCode}.vue, test/export.test.js} e as telas; app/routes/api_new.py (export), app/__main__.py; submódulo: codegen (--where2; where1/where2 no Python da KFA), textos.
Testes: vitest → 12 passed; pytest tests → 32 passed; libs codegen/features → 15 passed; navegador: KWIC "society" → "Copiar como código" → o comando rodado no terminal devolveu JSON idêntico ao da tela (46 linhas).
Pendências: o download dentro da janela do pywebview (WebKit) não foi testado à mão; no navegador funciona.
Observações: o gerador inclui todo parâmetro informado (os padrões do CLI e da função podem diferir).
Próximo: 3.10.
```

### 3.10 Acessibilidade e testes de interface

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[3.10\]'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon
- **Fazer:**
  - [x] Passe de acessibilidade (meta WCAG 2.2 AA): rótulos, foco visível, teclado, contraste, paletas seguras para daltonismo, `prefers-reduced-motion`.
  - [x] Testes de ponta a ponta com Playwright nos fluxos: importar → visão geral → etiquetar → KWIC → palavras-chave → KFA, em 390, 768 e 1280 px.
  - [x] Conferir tamanho do pacote da interface e tempo de abertura.
- **Pronto quando:** os fluxos passam nas três larguras e a verificação de acessibilidade não acusa erros graves.
- **Relato:**
```
Feito: testes de ponta a ponta com Playwright (Chrome do sistema, sem baixar navegadores; o servidor Python sobe sozinho) no fluxo importar (assistente) → visão geral → etiquetar (spaCy) → KWIC → palavras-chave → KFA, em 390, 768 e 1280 px, e varredura das demais telas nos temas escuro e alto contraste; verificação axe-core (WCAG 2.0/2.1/2.2 A e AA) em cada tela, falhando em violações sérias ou críticas; CI roda `npm run e2e`.
Correções de acessibilidade achadas pelo axe: abas inativas com contraste 3,3:1 (DaisyUI) → 82% do texto; texto em cor primária no tema escuro 3,6:1 → clareado; gráfico de barras clicável dentro de role="img" → role="group"; bloco de código rolável sem foco → tabindex.
Arquivos: frontend-vue/{playwright.config.js, e2e/fluxo.spec.js, .gitignore, package.json (e2e)}, src/style.css, components/DivergingBars.vue, utils/markdown.js; .github/workflows/ci.yml.
Testes: npx playwright test → 6 passed (3 larguras × 2 cenários); vitest → 12 passed.
Medidas: interface compilada 436 KB; primeira tela ≈ 81 KB comprimidos (JS 61,9 + CSS 19,1); abertura 50–80 ms (Chrome, servidor local).
Pendências: teste com leitor de tela real; conferir no WebKit do macOS 12 (Safari 17.6) — só na máquina do usuário.
Observações: paleta do leitor (10 cores categóricas) não depende só de cor (legenda com rótulo e contagem, destaque por seleção).
Próximo: 3.11.
```

### 3.11 Remover a interface antiga

- Estado: [x] · Data: 2026-09-27 · Commit: ver `git log --grep '\[3.11'` · Agente/máquina: Claude (Opus 5.5) / Mac Apple Silicon
- **Fazer:**
  - [x] Conferir que nada de `frontend-src/` ficou sem equivalente na nova (lista de telas do plano).
  - [x] Remover `frontend-src/`, o `TTW_UI` e o Shoelace; ajustar `build/build.py`, `ci.yml` e `release.yml`.
  - [x] `CHANGELOG.md`.
- **Pronto quando:** o build e o CI passam sem `frontend-src/`.
- **Relato:**
```
Feito: conferência das telas antigas (home, corpus, quickrun, tagging, analysis, results, feature-detail, text-viewer, export, viz-comparison, viz-reduction, viz-single). Lacunas encontradas e fechadas na interface nova: abrir .ttwt (descompactação com progresso) e arquivo pendente (duplo clique/--open, consultado ao abrir e ao focar a janela); salvar como .ttwt/.ttwa; exportar o projeto inteiro para uma pasta; galeria da KFA (ver 3.7); impressão do leitor (folha de estilo de impressão, sem paged.js). "Nova análise" (quickrun) virou assistente + etiquetar + KFA; migração v0.1→v0.3 é automática.
Bloqueio: remover frontend-src/, TTW_UI e Shoelace apaga arquivos que não foram criados nesta sessão (regra do AGENTS.md): aguarda o usuário revisar a interface nova e confirmar. Quando confirmado: apagar frontend-src/ e frontend/ (build antigo versionado), Vite do Vue passar a sair em ../frontend, build.py sem TTW_UI (padrão Vue), ci.yml sem o passo do frontend antigo, rotas antigas sem uso (quickrun, viz, tags, analysis) removidas.
Testes: e2e (6 passed) e vitest após as lacunas.
Próximo: com a confirmação, fazer a remoção; enquanto isso, Fases 4 e 5.
```
- **Retomar aqui (2026-09-27, Vue como padrão).** O usuário rodou `python -m app` e viu a interface antiga, porque o servidor servia `frontend/` por padrão. Ele pediu a Vue como padrão, **sem** autorizar ainda apagar `frontend-src/`. Feito no branch `vue-padrao` (criado a partir do `new_set26`):
  - `app/server.py` `_frontend_dir()`: no bundle, `<_MEIPASS>/frontend`; fora dele, `frontend-vue/dist` se houver `index.html`, senão `frontend/` com aviso no console. `TTW_FRONTEND_DIR` continua sobrepondo (`TTW_FRONTEND_DIR=frontend` = interface antiga).
  - `build/build.py`: `TTW_UI` padrão `vue` (`TTW_UI=legacy` para a antiga). `release.yml`: cache do npm em `frontend-vue/package-lock.json`. Comentário do `.spec`. `LEIAME.md`, `README.md` e `CONTRIBUTING.md` sem `TTW_FRONTEND_DIR` nos comandos.
  - Conferido: `npm run build` ok; `_frontend_dir()` devolve `frontend-vue/dist`.
  - **Falta verificar:** `pytest tests -q` no worktree deu 11 failed/2 errors porque o submódulo `libs/ttwtools` não estava inicializado ali (falta `tests/data/v2_small.ttwa`). O usuário interrompeu antes do `git submodule update --init`, então rode os testes num clone com o submódulo e confira se as falhas somem. Rodar também o e2e (`frontend-vue/playwright.config.js` ainda passa `TTW_FRONTEND_DIR`, o que é inofensivo) e o `ci.yml` (continua compilando as duas interfaces).
  - **Testar em desktop (usuário):** `cd frontend-vue && npm run build && cd .. && python -m app --mode desktop`. Conferir na janela pywebview os diálogos nativos (abrir/salvar `.ttwt`/`.ttwa`, escolher pasta), abrir arquivo por `--open` e duplo clique, e tema claro/escuro. No pacote: `python build/build.py` já sai com a Vue.
  - **Depois (precisa de confirmação explícita do usuário):** o resto do 3.11, conforme o Bloqueio acima (apagar `frontend-src/` e `frontend/`, Vite saindo em `../frontend`, tirar o frontend antigo do `ci.yml`, remover as rotas antigas sem uso), mais a linha do `CHANGELOG.md`. Depois vêm a `-rc.1` e o 6.2.
- **Conclusão (2026-09-27).** O usuário conferiu a interface nova (abrir `.ttwa` incluso) e autorizou a remoção completa.
```
Feito: apagados frontend-src/ e frontend/ (build antigo versionado) e as rotas sem uso na Vue (analysis, quickrun, tags, viz); o Vite grava em ../frontend (no .gitignore); _frontend_dir() serve frontend/ (TTW_FRONTEND_DIR continua sobrepondo); build.py sem TTW_UI; ci.yml só com a Vue; playwright sem TTW_FRONTEND_DIR. Shoelace já não era usado na Vue.
Arquivos: app/server.py, app/__init__.py, app/routes/__init__.py, app/jobs.py, build/build.py, build/ttwtools-app.spec, .github/workflows/ci.yml, frontend-vue/{vite,playwright}.config.js, .gitignore, tests/test_routes_base.py, LEIAME/README/CONTRIBUTING/AGENTS, CHANGELOG.
Testes: pytest tests -q → 37 passed (no worktree as falhas eram só o submódulo); npm test → 12 passed; npm run e2e → 6 passed; build.py --skip-frontend --no-package → selftest OK (frontend ok), check_macos_min 12.3 OK.
Pendências: /api/corpus (list, files, file) também não tem uso na Vue, mas ficou (fora do que foi autorizado); só test_routes_base o usa. Ajustes pequenos da interface anotados pelo usuário para depois.
Próximo: gerar a -rc.1 (já com a interface nova) e executar o 6.2.
```

---

# Fase 4 — Catálogo de corpora

### 4.1 Formato de pacote e catálogo

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[4.1'` · Agente/máquina: Claude (Opus) / Mac arm64
- **Ler antes:** `novomodelo.md` §6, §9.5 e §16.3 a §16.5.
- **Fazer:**
  - [x] Formato de **pacote de corpus**: um `.ttwa` já indexado e etiquetado, ou só a lista de frequências, mais uma **ficha** (`ficha.json`: idioma, variedade, período, gêneros, tamanho, licença e fonte, camadas com tagger e versão, hash).
  - [x] **Catálogo** (`catalogo.json`) publicado como arquivo de uma release do GitHub (ou de um repositório de dados), com URL, tamanho e hash de cada pacote.
  - [x] **Regra de licença:** nenhum corpus entra no catálogo sem a licença conferida na fonte e registrada na ficha. Corpus de licença restrita fica só como receita de importação, sem redistribuição.
- **Pronto quando:** existe o esquema do catálogo e um pacote de exemplo valida contra ele.
- **Relato:**
  - Feito: `ttwtools.corpus_catalog`: `validate_ficha`/`validate_catalog` (campos obrigatórios; `license.redistributable`, `license.verified_on`; pacote sem licença conferida é recusado; licença restrita → entrada `kind: "recipe"`, sem arquivo), `make_package` (zip `<id>-<versão>.zip` com `ficha.json`, `corpus.ttwa` e `referencia-<unidade>.tsv`; tamanho, camadas com tagger/versão e sha256 preenchidos), `write_catalog`/`load_catalog` (arquivo local ou http).
  - Testes: `libs/ttwtools/tests/test_corpus_catalog.py` (6).
  - Decisões: o catálogo **não tem URL padrão** enquanto D6 (hospedagem; repositório privado) não for resolvida: a pessoa informa o endereço (configuração em `settings.json` da pasta de dados ou `TTWTOOLS_CATALOG_URL`).
  - Pendências: escolher onde publicar `catalogo.json` (D6).

### 4.2 Baixar, instalar e atualizar

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[4.1'` · Agente/máquina: Claude (Opus) / Mac arm64
- **Fazer:**
  - [x] Pasta de dados do usuário por sistema (padrão do sistema operacional), com corpora e modelos baixados.
  - [x] `ttwtools catalog list|install|remove|update`, com conferência de hash e progresso.
  - [x] Tela em Corpora para instalar, ver a ficha e remover.
  - [x] Download de **modelos** de spaCy e Stanza sob demanda (informando o tamanho), fora do binário.
- **Pronto quando:** instalar um pacote pequeno pelo catálogo e abri-lo na interface funciona.
- **Relato:**
  - Feito: pasta de dados via `platformdirs` (`TTWTOOLS_DATA_DIR` para sobrepor); `install` (download com progresso, conferência de sha256, extração em `<dados>/corpora/<id>/<versão>`), `installed`, `remove`, `updates`; `ttwtools catalog list|installed|install|remove|update|validate|models|download-model`. `ttwtools.models`: modelos spaCy baixados como roda do GitHub (versão pela `compatibility.json`) e extraídos em `<dados>/models/python`, que `activate()` põe no `sys.path` (funciona no binário, sem pip); Stanza em `<dados>/models/stanza`. App: rotas `/api/catalog` (GET, `/url`, `/install` como tarefa, `/remove`), `/api/models` e `/api/models/download`; `activate()` na partida do servidor; painel **Catálogo** em Corpora (visível mesmo sem projeto aberto): endereço, fichas, instalar com progresso, instalados com Abrir/Remover e aviso de atualização, modelos spaCy com Baixar.
  - Testes: `tests/test_routes_new.py::test_catalog_routes`; conferido no navegador: instalar o pacote de demonstração e abri-lo na interface.
  - Pendências: download de Stanza só pela linha de comando/rota (`stanza:<idioma>`), sem botão; tamanho do modelo aparece só no progresso.

### 4.3 Primeiros corpora

- Estado: [!] · Data: 2026-09-26 · Commit: ver `git log --grep '\[4.3'` · Agente/máquina: Claude (Opus) / Mac arm64 — aguarda licenças conferidas e D6
- **Fazer:**
  - [x] Scripts de preparo em `tools/corpora/` (reproduzíveis) para: Brown e LOB (via NLTK), Universal Dependencies (inglês) e um corpus de demonstração pequeno com metadados (obras em domínio público, para os tours).
  - [!] Conferir e registrar a licença de cada um na ficha.
  - [!] Publicar no catálogo.
- **Pronto quando:** Brown está instalável pelo catálogo, já etiquetado, e abre na visão geral.
- **Relato:**
  - Feito: `tools/corpora/` com `_common.py`, `demo.py` (18 capítulos de Alice, Tom Sawyer e Sherlock Holmes, Projeto Gutenberg, sem cabeçalho/licença do PG e sem o `_itálico_`; metadados autor, obra, ano, variedade, capítulo), `brown.py` (nltk_data; etiquetas originais como camada `nltk_tagged`, tagset "brown", + spaCy; metadados category/section), `ud_english.py` (EWT r2.18, 1.174 documentos, camada `conllu`; genre/split; no 5.3 virou `ud.py --treebank en-ewt|pt-bosque`), `lob.py` (só receita; prepara localmente a cópia da pessoa), `build_catalog.py` e `README.md`. Cada script grava pacote + entrada; sem `--license-verified` e `--redistributable` sai só receita. Pacotes já saem com a visão geral calculada.
  - Conferido localmente (catálogo em pasta temporária): Brown completo (500 textos, 1.033.053 palavras, 114 MB, 2,5 min) instalado pela rota do catálogo e aberto; demo (5 MB) instalado e aberto pela tela; EWT (20 MB, 17 s).
  - Licenças encontradas (a pessoa confere e registra a data): Brown — README do nltk_data diz "Distributed with the permission of the copyright holder, redistribution permitted."; EWT — CC BY-SA 4.0 (LICENSE.txt); demo — domínio público nos EUA; LOB — ICAME, sem redistribuição.
  - Pendências (usuário): conferir as licenças e gerar com `--license-verified`; decidir onde publicar (D6). Observação: o texto do Gutenberg usa apóstrofo curvo (’) e o Brown, reto ('): em palavras-chave, `’s`/`n’t` aparecem como chave; avaliar normalizar apóstrofos na tokenização ou na comparação.

### 4.4 Listas de frequência de referência

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[4.3'` · Agente/máquina: Claude (Opus) / Mac arm64
- **Fazer:**
  - [x] Gerar a lista de frequências de cada corpus do catálogo (forma, lema, classe, número de documentos).
  - [x] Ligar ao seletor de referência de 3.7 e às faixas de frequência lexical.
  - [x] Conferir a licença da lista derivada, separada da do texto.
- **Pronto quando:** palavras-chave de um corpus do usuário contra Brown funcionam sem instalar o Brown completo (só a lista).
- **Relato:**
  - Feito: `corpus_catalog.make_reference_package` (pacote `<id>-lista`, só `referencia-form|lemma|pos.tsv`, licença própria em `license.reference_list`), `reference_lists()`, `reference_list_path()`; `catalog:<id>[@versão]` aceito como referência em `keywords()` e em `frequency_bands()` (novo: perfil de frequência lexical por faixas 1–1000, 1001–2000... + fora da lista, ocorrências e tipos, exemplos); `ttwtools bands`, `ttwtools catalog references`; rotas `/api/references` (listas instaladas) e `/api/compare/bands`; seletor "lista do catálogo" nas palavras-chave; aba **Faixas de frequência** em Comparar (gráfico, tabela, exportar, copiar como código); ajuda `faixas_frequencia` (pt/en).
  - Testes: `test_corpus_catalog.py` (+2), `test_routes_new.py::test_catalog_routes` ampliado; no navegador: demo × lista do Brown (398 KB, sem o Brown completo) → 75,6% das ocorrências nas 1.000 primeiras; palavras-chave contra `catalog:brown` funcionam.
  - Correção junto: o Vitest pegava `e2e/fluxo.spec.js` (Playwright) e o CI da interface estava vermelho desde o 3.10; `vite.config.js` agora inclui só `src/**/*.test.js`.

---

# Fase 5 — Extras

### 5.1 Laboratório: comparar N grupos

- Estado: [x] · Data: 2026-09-26 · Commit: ver `git log --grep '\[5.1'` · Agente/máquina: Claude (Opus) / Mac arm64
- **Ler antes:** `novomodelo.md` §14.
- **Fazer:**
  - [x] `ttwtools.experimental.compare_groups(...)`: um contra todos, par a par (matriz), meu texto contra referências; depois mapa de perfis e dendrograma.
  - [x] Aba **Laboratório** com aviso de experimental, escolha de grupos (pasta, metadado, seleção) e balão para cada método.
  - [x] Avisos de cuidado: comparações múltiplas, grupos pequenos ou desiguais.
- **Pronto quando:** "um contra todos" roda para 3 grupos e aparece na tela.
- **Relato:**
  - Feito: `ttwtools.experimental` (API experimental): `groups_by_metadata`, `compare_groups(proj, grupos, camada, method=...)` com `one_vs_rest` (d por traço, kfa/kfa2), `pairwise` (matriz N×N de média de |d| e traços por par), `anova` (Kruskal-Wallis, epsilon², p corrigido FDR/Bonferroni), `profile` (PCA via viz.reduction), `dendrogram` (Ward sobre perfis médios padronizados, coordenadas do scipy) e `nearest` ("meu texto": distância pela raiz do z² médio e traços que mais afastam). Avisos traduzidos: experimental, grupos pequenos (< 5 textos), tamanhos desiguais (≥ 3×), comparações múltiplas. Resultado salvo em `analyses` (tipo `lab`). CLI: `ttwtools compare --group-by CHAVE | --group [RÓTULO=]CORPUS[:CHAVE=VALOR] --method ...`; copiar como código (`lab`). Rota `POST /api/lab/compare`. Aba **Laboratório** (selo "experimental") em Comparar: grupos por metadado do corpus ativo ou um por corpus, camada, traços, método com explicação sempre visível e balão `laboratorio` (pt/en), resultado de cada método (tabelas com cor pelo d/z, matriz, dendrograma em SVG, PCA), exportar.
  - Testes: `libs/ttwtools/tests/test_experimental.py` (9), `tests/test_routes_new.py::test_lab_compare_route`; no navegador: demo agrupado por autor, um contra todos, dendrograma e meu texto contra referências.
  - Pendências: grupos por seleção manual de textos e por pasta/padrão no nome (hoje: metadado ou corpus inteiro); itens 3 (pares só nos traços significativos), 6–8 e 10 do §14 ficam para depois.

### 5.2 Importador TEI e GrAF (OANC/BNC)

- Estado: [!] · Data: 2026-09-26 · Commit: ver `git log --grep '\[5.2'` · Agente/máquina: Claude (Opus) / Mac arm64 — falta testar com dados reais do OANC/MASC
- **Fazer:**
  - [x] Leitura de TEI XML e do XML standoff (GrAF) do OANC/MASC para `documents` e `tokens`, conferindo as posições contra o texto original.
  - [!] Receita de preparo do OANC/MASC em `tools/corpora/` e ficha com a licença conferida.
- **Pronto quando:** um trecho do OANC importado tem camada e abre no KWIC.
- **Relato:**
  - Feito: `ttwtools.formats.tei` (`parse_tei`/`import_tei`: TEI P5 e XML do BNC; um documento por `<TEI>`/`<bncDoc>`, texto com parágrafos, sem `note`/`fw`; com `<w>`/`<c>`/`<pc>` vira camada `tei` com forma, lema `lemma|hw`, etiqueta `c5|pos|msd|type|ana` e frases de `<s>`; metadados título, autor, data, `catRef`, `classCode`, tipo do `wtext`) e `ttwtools.formats.graf` (`read_header`, `parse_graf`, `import_graf`: cabeçalho `.anc`/`.hdr` → `.txt` + anotações; regiões, nós e anotações lidos de todos os arquivos do documento, pois o OANC liga tokens de `-hepple` a regiões de `-seg`; tokens de `-penn`/`-hepple` com lema, PTB e UPOS (tabela PTB→UPOS); frases de `-s`; cada token conferido contra `string` e as divergências contadas em `offset_mismatches`; metadados do cabeçalho e subpasta). `ttwtools import --format tei|graf` (auto por `.xml`/`.anc`); rota `/api/corpora/import` com `source.format` e seletor de formato no assistente "Adicionar corpus" (txt, CoNLL-U, palavra/TAG, TEI, GrAF). Receita `tools/corpora/masc.py` (`--id masc|oanc`, `--source` com a cópia local).
  - Testes: `libs/ttwtools/tests/test_formats_tei_graf.py` (4: BNC, teiCorpus P5, GrAF com posições/frases/KWIC, divergência + CLI), `tests/test_routes_base.py::test_import_route_graf_and_tei_formats`.
  - Pendências: anc.org não respondeu daqui (sem acesso aos dados reais); os testes usam arquivos no formato documentado do MASC/OANC. Falta rodar `masc.py` numa cópia real do MASC/OANC (conferir `offset_mismatches` = 0 e o KWIC) e conferir a licença.

### 5.3 Português

- Estado: [x] · Data: 2026-09-27 · Commit: ver `git log --grep '\[5.3'` · Agente/máquina: Claude (Opus) / Mac arm64
- **Fazer:**
  - [x] Descritores e tagsets para os modelos de português (spaCy e Stanza), com traduções.
  - [x] Corpus de referência em português com licença clara (avaliar UD português, Tycho Brahe, Corpus Brasileiro).
  - [x] Teste do fluxo completo em português.
- **Pronto quando:** etiquetar e explorar um corpus em português pela interface.
- **Relato:**
  - Feito: descritores com português — spaCy `pt_core_news_sm|md|lg` (no spaCy pt a etiqueta fina é a própria UPOS; sem PTB) e Stanza `lang=pt` com os pacotes bosque, cintil, dantestocks, gsd, petrogold e porttinari (conferidos no resources.json 1.11); `por_idioma` valida o pacote pelo idioma e filtra a lista na tela; disponibilidade dos pacotes por idioma (`package@pt`). `taggers.language_defaults(tagger, idioma, atual)` adapta as opções ao idioma do corpus mantendo o tamanho do modelo (trf → lg em pt); a rota de opções devolve `corpus_lang`, `suggested` e `suggested_presets`, e o painel "Etiquetar" já abre com o modelo pt num corpus em português. `stats.guess_language` (idioma das camadas; senão palavras funcionais numa amostra) passou a escolher a lista de palavras funcionais em `describe`, `freq` e na rota de frequência (antes era sempre inglês); lista pt ampliada. CoNLL-U aceita `# newdoc_id`. Referência em português: `tools/corpora/ud.py --treebank pt-bosque` (UD Portuguese Bosque r2.18, CC BY-SA 4.0, 1.961 documentos, metadados fonte/variedade CF = pt-BR, CP = pt-PT; pacote 17 MB + lista 217 KB).
  - Avaliados e deixados para depois: Tycho Brahe (português histórico; licença própria, a conferir) e Corpus Brasileiro (sem licença de redistribuição clara) — ficariam como receita.
  - Testes: `libs/ttwtools/tests/test_portugues.py` (5; o fluxo completo roda quando `pt_core_news_sm` está instalado; no CI o modelo é baixado pelo `ttwtools catalog download-model`), `tests/test_routes_new.py::test_tagger_options_suggest_language`. Conferido na interface: 10 capítulos de *Dom Casmurro* etiquetados com `pt_core_news_sm` (6.256 tokens) e KWIC por lema (`lemma=olho`); download real do modelo pelo catálogo.
  - Observações: o lema do spaCy pt para contrações sai como "a o" (à), "de o"...; textos com ortografia antiga (1899) etiquetam razoavelmente, mas os lemas de grafias antigas não são normalizados.

---

# Fase 6 — Fechamento

### 6.1 Documentação

- Estado: [x] · Data: 2026-09-27 · Commit: ver `git log --grep '\[6.1'` · Agente/máquina: Claude (Opus) / Mac arm64
- **Fazer:**
  - [x] Atualizar `README.md`/`LEIAME.md` (instalação, uso do aplicativo, uso pela linha de comando, formatos, projeto `.ttwa`/`.ttwl`).
  - [x] Documentação do pacote (`libs/ttwtools/docs`): guia rápido e referência de cada função pública.
  - [x] Guia de contribuição curto e `RELEASING.md` revisado.
  - [ ] Atualizar o artigo/descrição (ELC) apenas se você pedir. *(não pedido)*
- **Pronto quando:** alguém consegue instalar e fazer a primeira análise só com o `LEIAME.md`.
- **Relato:**
  - Feito: `LEIAME.md` (pt) e `README.md` (en) reescritos para quem usa: instalar por sistema (avisos de assinatura no macOS/Windows, Intel), primeira análise em 6 passos, cada tela, projetos `.ttwa`/`.ttwl`/`.ttwt` e camadas, catálogo e pasta de dados, idiomas, linha de comando e Python, tabela de formatos, rodar a partir do código; avisam que o pacote ainda abre a interface antiga até o 3.11. As instruções de desenvolvimento e build (desatualizadas: `build_mac.sh`, `build_win.bat`) foram para o novo `CONTRIBUTING.md` (ambientes ttw314/ttw311, rodar, testes, `build.py`, regras, mapa do repositório). `RELEASING.md` revisto (checklist de versão final, corpora fora da release). Pacote: `docs/guia_rapido.md` (fluxo completo, português, catálogo, laboratório, formatos, CLI, variáveis de ambiente), `docs/referencia.md` gerada das docstrings por `docs/gerar_referencia.py` (165 funções; 33 docstrings que faltavam foram escritas; teste `test_docs.py` confere a cobertura), `README.md` do pacote com a visão atual no topo e as notas da 0.1 como histórico, `CHANGELOG.md` do pacote com as fases 4–6.
  - Conferência: os exemplos de Python do guia foram executados num corpus de teste; os rótulos citados no README batem com as traduções da interface; as opções de linha de comando conferidas com `--help`.
  - Correção encontrada ao rodar o guia: sem `layer`, `lemma=`/`pos=` usavam a camada mais recente mesmo sem o campo (BiberPlus sem lema → 0 resultados); agora usam a mais recente que tem o campo (`query._needs`, teste em `test_query.py`).
  - Pendências: "pronto quando" (alguém instalar só com o LEIAME) depende de um teste com uma pessoa; o README ainda descreve a interface nova como a de `frontend-vue/` até a remoção da antiga (3.11).

### 6.2 Verificação em cada sistema

- Estado: [!] · Data: 2026-09-27 · Commit: ver `git log --grep '\[6.2'` · Agente/máquina: Claude (Opus) / Mac arm64 — roteiro pronto; execução pelo usuário
- **Fazer:**
  - [ ] Roteiro manual (10 a 15 itens) executado em macOS (arm64 e, se possível, Intel), **incluindo a máquina com macOS 12**, Windows e Linux com o pacote da `-rc.1`. No macOS 12, conferir também que os taggers indisponíveis (se houver) aparecem com o motivo.
  - [ ] Registrar problemas por sistema (janela, caminhos, permissões, assinatura) e corrigir ou listar como conhecidos.
- **Pronto quando:** o roteiro passou em todos os sistemas suportados, ou as exceções estão documentadas.
- **Relato:**
  - Feito: roteiro de 15 itens em [`roteiro_verificacao.md`](roteiro_verificacao.md) (instalar, versão, projeto, importação com metadados, visão geral, etiquetagem e cache, taggers indisponíveis com motivo, exploração, palavras-chave, KFA e galeria, copiar como código, catálogo e modelo, português, salvar/reabrir `.ttwt`, ajuda e acessibilidade), com a tabela de resultado por sistema.
  - `-rc.1` (2026-09-27): PR #3 mesclado na `main`; `release.py --version 0.4.0-rc.1` → `release.yml` verde nos 4 sistemas; rascunho de pre-release com os pacotes e `SHA256SUMS.txt`. Conferido: dmg arm64 baixado da release bate com o SHA256SUMS, `--selftest` OK (0.4.0rc1, interface nova).
  - Pendências (usuário): executar o roteiro em macOS arm64, macOS 12 Intel, Windows e Linux com os pacotes da `-rc.1`; o rascunho continua sem publicar.

### 6.2a Correções da verificação

Um subitem por problema apontado nos arquivos de `verificacao/`, com a origem (arquivo e item). Ideias maiores, que não são correção, vão para "Depois da 0.4.0".

- Estado: [~] · Data: 2026-09-27 · Commit: ver `git log --grep '\[6.2a'` · Agente/máquina: Claude (Opus 5.5) / Mac arm64
- **Fazer:**
  - [x] `macos-arm64` item 3: "unable to open database file" ao criar `~/projeto2.ttwa`. O `~` não era expandido: agora é, no pacote (projeto, importação, exportação, `.ttwt`, taggers) e nas rotas. Testes em `test_project.py` e `test_routes_base.py`.
  - [x] `macos-arm64` item 3: projeto com botões tradicionais. **Novo projeto…**, **Abrir projeto…** e **Salvar cópia…** abrem os diálogos do sistema (pywebview no desktop nos 3 sistemas; AppleScript/tkinter no modo web; rota nova `/api/utils/pick-save`). Aviso de que o projeto grava sozinho. Digitar o caminho e as opções (converter, exportar) ficam em painel recolhido.
  - [x] `macos-arm64` item 3: área própria **Módulos** (novo destino na navegação): modelos agrupados por idioma, com uma linha sobre para que serve e detalhes recolhidos (identificador, fonte, de onde baixa, licença, dados de treino, tamanho); corpora do catálogo com a ficha; endereço do catálogo e pasta de dados em "Configurações avançadas". Fichas no pacote (`data/models.json`, `models.model_info()`, `list_models(lang)`, `ttwtools catalog models`), com licenças e tamanhos conferidos nos metadados oficiais do spaCy. `en_core_web_trf` aparece como indisponível, com o motivo (falta `spacy_curated_transformers`), e o pacote recusa baixá-lo. Stanza en/pt entram na lista.
  - [x] Encontrado junto: `useJob.start()` volta antes do fim da tarefa, então recarregar depois de instalar ou baixar (catálogo, modelos) e a mensagem de "Salvar como" saíam cedo demais; agora observam o estado da tarefa.
  - [x] `macos-arm64` item 4 (conversa): o passo 2 do assistente ("Metadados e grupos") confundia. Saiu: o assistente tem dois passos, e as informações sobre os textos viraram painel **opcional recolhido** no passo 1, com os pedaços do nome de um arquivo real, uma caixa por pedaço (em branco = ignorar), separador por lista, tabela "como vai ficar" com 5 arquivos, aviso de nomes com outro nº de pedaços e a planilha CSV como alternativa (botão "Escolher planilha…", formato explicado num "Como deve ser a planilha?"). Pacote: `preview_filenames()`, `ttwtools names`, campo vazio em `fields` pula o pedaço; rota `GET /api/corpora/preview-names`; seletor de arquivo com `kind=csv`. Princípio registrado: opcional = painel recolhido num passo existente, explicado, com detalhes sob demanda.
  - [ ] Testar os diálogos nativos na janela desktop (macOS, Windows, Linux): o CI e o e2e rodam no modo web.
  - [ ] Demais itens do roteiro, conforme o usuário preencher.
- **Depois da 0.4.0:** _(ideias maiores que surgirem na verificação)_
- **Relato:** _(preencher ao fechar)_

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
| D3 | Runner Intel para macOS (o `macos-13` foi descontinuado); enquanto não houver, o pacote Intel é feito localmente | 0.4 | **resolvida em 0.4:** runner `macos-15-intel` funciona; o build local (`--arch x86_64`) fica como reserva |
| D10 | **macOS 12 (Intel, confirmado):** o pacote Intel usa Python 3.11 e `torch==2.2.2` (com `numpy<2`, a verificar). Se Stanza/MFTE não funcionarem nessa combinação, o pacote Intel fica sem eles (spaCy e BiberPlus continuam) | 0.1, 0.3 | **resolvida em 0.1:** macOS 12.7.6 Monterey, Safari 17.6 (confirmados). `numpy<2` é obrigatório (com numpy 2 Stanza/MFTE falham em silêncio); com `numpy==1.26.4` os 4 taggers funcionam e dão o mesmo resultado do arm64. Falta abrir o pacote numa máquina macOS 12 real (0.6) |
| D11 | Tailwind 4 no macOS 12: **manter Tailwind 4**, pois o Safari dessa máquina é o 17.6 (o mínimo é 16.4). Reabrir só se o teste em 3.1 falhar | 3.1 | resolvida em 2026-09-26 (a confirmar no teste) |
| D4 | **Assinatura e notarização:** macOS (conta de desenvolvedor da Apple) e Windows (certificado). Sem elas, o sistema mostra avisos ao abrir o pacote | 0.4, 6.2 | aberta; o pipeline nasce sem assinar |
| D5 | Formato do pacote no Windows e no Linux (`.zip`/`.tar.gz` simples agora; instalador e AppImage depois) | 0.3 | aberta (padrão: simples) |
| D6 | Onde hospedar o catálogo de corpora (release do GitHub ou repositório de dados) | 4.1 | aberta |
| D7 | Biblioteca para o tour com destaque, ou overlay próprio (checar licença) | 3.8 | **resolvida em 3.8:** overlay próprio (sem dependência nem questão de licença) |
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
