# Como lançar uma versão do TTWtools

> Esqueleto criado no passo 0.2. O passo a passo completo (CI, pacotes, publicação) entra no passo 0.5.

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

## Lançar (resumo; detalhar em 0.5)

1. Ajustar `version` no `pyproject.toml` e fechar a seção no `CHANGELOG.md`.
2. `pytest tests -q` e commit `release: vX.Y.Z`.
3. `git tag vX.Y.Z` (grafia SemVer) e `git push origin vX.Y.Z`; o CI gera os pacotes.
4. Pacote macOS Intel: gerado localmente e enviado à release (ver plano, passos 0.4 e 0.5).
5. Voltar o `pyproject.toml` para a próxima `.dev0`.
