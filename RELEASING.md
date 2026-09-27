# Como lançar uma versão do TTWtools

> Como gerar e publicar uma versão do aplicativo. Desenvolvimento e testes: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Regra de versão

- **Uma fonte só:** o campo `version` do `pyproject.toml` do app. `app/_version.py`, `python -m app --version`, `GET /api/version` e o título da API leem dali. No pacote congelado, o build grava `app/_build_info.py` (fora do git) com a versão e o commit.
- **SemVer:** `MAJOR.MINOR.PATCH`, com pré-lançamentos `alpha`, `beta` e `rc`.
- O `pyproject.toml` usa a grafia **PEP 440**; a **tag** usa a grafia **SemVer** com `v` na frente. `app._version.semver()` converte:

  | `pyproject.toml` | Tag git | Quando |
  |---|---|---|
  | `0.4.0.dev0` | (sem tag) | desenvolvimento entre lançamentos |
  | `0.4.0a1` | `v0.4.0-alpha.1` | release de teste |
  | `0.4.0b1` | `v0.4.0-beta.1` | funcionalidades completas, em teste |
  | `0.4.0rc1` | `v0.4.0-rc.1` | candidata final |
  | `0.4.0` | `v0.4.0` | lançamento |

- O pacote `ttwtools` (submódulo `libs/ttwtools`) tem versão e tags próprias no repositório dele; `GET /api/version` mostra as duas.

## Changelog

- `CHANGELOG.md` no formato Keep a Changelog. Cada passo concluído do plano acrescenta uma linha em `[Unreleased]`.
- Ao lançar: renomear `[Unreleased]` para `[X.Y.Z] — AAAA-MM-DD`, abrir um `[Unreleased]` vazio e atualizar os links de comparação no fim do arquivo.

## Fluxo de uma release

1. **Trabalho numa branch** (ex.: `new_set26`), com `CHANGELOG.md` → `[Unreleased]` atualizado a cada passo.
2. **PR para a `main`** e mesclar quando o CI (`ci.yml`) estiver verde.
3. Na `main`, atualizada e limpa: `python build/release.py --version X.Y.Z --dry-run` (confere tudo e mostra o plano).
4. `python build/release.py --version X.Y.Z`: grava a versão (PEP 440) no `pyproject.toml`, move `[Unreleased]` para `[X.Y.Z] — data` com a versão do pacote `ttwtools`, faz o commit `release: vX.Y.Z`, cria a tag anotada e envia. O script recusa se a árvore estiver suja, se a branch não for a `main` (salvo `--allow-branch`), se a tag já existir ou se o submódulo apontar para um commit não publicado.
5. O CI (`release.yml`) valida a tag, gera os pacotes nos 4 sistemas (com `--selftest` e, no macOS, `check_macos_min.py`) e cria a **release em rascunho** com `SHA256SUMS.txt` e as notas tiradas do CHANGELOG. Versões com `-alpha`, `-beta` ou `-rc` saem como *pre-release*.
6. **Conferir o rascunho:** baixar ao menos um pacote e abrir; no macOS, testar também numa máquina com macOS 12. Se precisar de um pacote feito localmente (ex.: macOS Intel sem runner), gerar com `python build/build.py --arch x86_64` e enviar com `bash build/release_github.sh --tag vX.Y.Z`.
7. **Publicar** o rascunho no GitHub.
8. Voltar o `pyproject.toml` para a próxima versão de desenvolvimento (ex.: `0.4.1.dev0`) e abrir um `[Unreleased]` vazio (o `release.py` já deixa o cabeçalho).

## Pré-lançamentos

- `python build/release.py --version 0.4.0-alpha.1` (ou `-beta.N`, `-rc.N`). Para testar o pipeline a partir de uma branch de trabalho: `--allow-branch`.
- Para só gerar pacotes sem release: `git push origin <branch>:release-test/<nome>` (o `release.yml` roda sem publicar).

## Corrigir uma release ruim

- **Nunca** apagar nem reescrever uma tag já publicada (quem baixou ficaria com um pacote que não corresponde à tag).
- Rascunho ainda não publicado com defeito: apagar o rascunho e a tag (`gh release delete vX --cleanup-tag`), corrigir, lançar de novo.
- Release publicada com defeito: corrigir e lançar uma nova versão `PATCH` (ex.: `0.4.1`), explicando no CHANGELOG.

## Checklist antes de uma versão final

- [ ] CI verde na `main` nos 4 sistemas.
- [ ] `CHANGELOG.md` → `[Unreleased]` completo (uma linha por mudança visível).
- [ ] Submódulo `ttwtools` com tag própria (`git -C libs/ttwtools tag vX.Y.Z && git -C libs/ttwtools push --tags`) e versão no `libs/ttwtools/pyproject.toml`.
- [ ] Roteiro manual do passo 6.2 do plano executado com o pacote `-rc` (incluindo macOS 12 Intel).
- [ ] Pacotes baixados da release abrem e o `SHA256SUMS.txt` confere (`shasum -a 256 -c SHA256SUMS.txt`).

## Corpora do catálogo

Os pacotes de corpus não fazem parte da release do aplicativo: são gerados por `tools/corpora/` e publicados junto com um `catalogo.json` (local ainda a decidir, decisão D6 do plano). Veja [`tools/corpora/README.md`](tools/corpora/README.md).

## Submódulo `ttwtools`

- Antes de lançar, o commit do submódulo precisa estar no GitHub (`git -C libs/ttwtools push`); o `release.py` confere.
- O pacote tem versão própria (`libs/ttwtools/pyproject.toml`); a linha "Pacote `ttwtools` X (commit ...)" entra nas notas de cada release do app.
