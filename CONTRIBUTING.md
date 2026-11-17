# Como contribuir, testar e lançar

Guia único para quem mexe no código. Desenho: [`novodesenho/novomodelo.md`](novodesenho/novomodelo.md). Estado, próximos passos e pendências: [`novodesenho/plano.md`](novodesenho/plano.md). Agentes (Claude, Gemini…) seguem também [`AGENTS.md`](AGENTS.md).

## Ambiente

```bash
git lfs install
git clone --recurse-submodules https://github.com/luaguiaroliveira/ttwtools-app.git && cd ttwtools-app
```

| Máquina | Ambiente | Como criar |
|---|---|---|
| Mac Apple Silicon, Windows, Linux | `ttw314` (Python 3.14, torch 2.11) | `conda env create -f environment.yml -n ttw314` |
| Mac Intel (macOS 12) | `ttw311` (Python 3.11, `torch==2.2.2`, `numpy==1.26.4`) | `python build/build.py --arch x86_64 --create-env` (num Mac Apple Silicon, sob Rosetta) ou um conda Intel com `build/constraints-macos-x86_64.txt` |

```bash
conda activate ttw314
pip install --no-deps -e libs/ttwtools -e . && pip install pytest
(cd frontend-vue && npm ci)               # Node.js 22
```

## Rodar e testar

```bash
(cd frontend-vue && npm run build)
python -m app --mode web --port 8765      # http://127.0.0.1:8765 (serve frontend/)
python -m app --mode desktop              # janela nativa (pywebview)
(cd frontend-vue && npm run dev)          # interface com recarga; usa a API em :8765
pytest tests -q                           # servidor (rotas)
pytest libs/ttwtools/tests -q             # pacote
(cd frontend-vue && npm test)             # interface (Vitest)
(cd frontend-vue && PYTHON=$(which python) npm run e2e)   # ponta a ponta + acessibilidade (Playwright, Chrome instalado)
```

Rode os testes do que mexeu. O teste do fluxo em português exige `ttwtools catalog download-model pt_core_news_sm`. O CI (`ci.yml`) roda tudo em macOS, Windows e Linux a cada push. Parar o servidor: Ctrl+C ou `kill $(lsof -ti :8765)`. Os testes nunca tocam no cache nem nos dados reais do usuário (fixture `_isolated_cache`).

## Regras

- **A lógica fica no pacote** (`libs/ttwtools/ttwtools`): a rota em `app/routes` só chama a função; a tela só apresenta. Todo recurso novo: função pública, subcomando `ttwtools` e, quando fizer sentido, rota e tela com "Copiar como código". Depois de mexer em função pública: `cd libs/ttwtools && python docs/gerar_referencia.py`.
- **Textos de interface** por chave de tradução (`pt` e `en`, `libs/ttwtools/ttwtools/data/i18n/ui.*.json`). **Nada reprocessa** o que já existe numa camada equivalente.
- **Compatibilidade:** macOS 12 (Intel, Safari 17.6), Windows e Linux; sem CSS/JS que o Safari 17 não tenha; formato de arquivo só com biblioteca padrão.
- **Submódulo** `libs/ttwtools` é outro repositório: commit e `git push` nele primeiro, depois o commit do ponteiro no app.
- **Commits:** mensagens curtas, em português, começando por `[passo]`; sem coautoria de agente; nunca `git add -A` (projetos reais em LFS mudam ao abrir); não reescrever histórico publicado.
- **Corpora:** nada entra no catálogo sem licença conferida na fonte (`tools/corpora/README.md`).

## Onde está cada coisa

`app/` servidor FastAPI (rotas, tarefas em segundo plano, janela) · `frontend-vue/` interface (Vue 3, Vite, Tailwind/daisyUI; testes em `src/test` e `e2e/`) · `libs/ttwtools/` pacote (projeto, camadas, taggers, consultas, estatísticas, catálogo) · `tools/corpora/` preparo de corpora do catálogo · `build/` e `.github/workflows/` empacotamento e CI · `novodesenho/` desenho, plano e memória.

## Pacotes do aplicativo e distribuição

### Nomenclatura oficial dos pacotes

Todo pacote de distribuição gerado para uma release segue rigorosamente o padrão:
`TTWtools-<versão>-<sistema>-<arquitetura>.<extensão>`

Onde `<versão>` é o número da versão sem o prefixo `v` (ex.: `0.8.6`).

| Plataforma | Arquitetura | Arquivo Final | Tipo |
|---|---|---|---|
| macOS Apple Silicon | `arm64` | `TTWtools-<versão>-macos-arm64.dmg` | Imagem de disco UDZO |
| macOS Intel | `x86_64` | `TTWtools-<versão>-macos-x86_64.dmg` | Imagem de disco UDZO |
| Windows (portátil) | `x86_64` | `TTWtools-<versão>-windows-x86_64.zip` | ZIP portátil autossuficiente |
| Windows (instalador) | `x86_64` | `TTWtools-<versão>-windows-x86_64.msi` | Instalador MSI por usuário |
| Linux | `x86_64` | `TTWtools-<versão>-linux-x86_64.tar.gz` | Tarball com binário e scripts |

### Licença e arquivos obrigatórios no pacote

- **Licença do aplicativo (`ttwtools-app`):** **GNU GPL v3.0 ou posterior (GPL-3.0-or-later)**.
  - O aplicativo executável agrega os etiquetadores **MFTE** (GPL 3.0), **BiberPlus** modificado (MIT) e **Stanza** (Apache 2.0). A combinação binária distribuída é regida pela GPL 3.0.
- **Licença do pacote Python (`ttwtools` em `libs/ttwtools`):** **MIT License**.
  - O código-fonte da biblioteca permanece permissivo e independente.
- **Conteúdo obrigatório dentro de cada pacote (`.dmg`, `.zip`, `.msi`, `.tar.gz`):**
  1. `TTWtools` / `TTWtools.app` / `TTWtools.exe` com modelo básico spaCy (`en_core_web_sm`) embutido;
  2. `LEIAME.md`: instruções didáticas de instalação, autorização do Gatekeeper no macOS (`xattr -cr /Applications/TTWtools.app`) e notas de licença/código-fonte;
  3. `LICENSE.txt`: texto integral da licença GNU GPL v3.0.
  *(Os scripts `build/build.py` e `build/tauri_app.py` copiam `build/LEIAME.md` e `LICENSE` automaticamente para o staging do DMG e pasta de saída de cada plataforma).*

### Como gerar o build em cada sistema

#### macOS Apple Silicon (`arm64`)
```bash
conda activate ttw314
cd frontend-vue && npm ci && npm run build && cd ..
python build/build.py --install-deps
# Ou com a casca Tauri (se configurada):
# python build/build.py --install-deps --shell tauri && python build/tauri_app.py --package
```
Saída: `dist/release/TTWtools-<versão>-macos-arm64.dmg`.

#### macOS Intel (`x86_64`)
No Mac Intel (macOS 12, Python 3.11, `torch==2.2.2`, `numpy==1.26.4`):
```bash
conda activate ttw311
cd frontend-vue && npm ci && npm run build && cd ..
python build/build.py --install-deps
```
Em Mac Apple Silicon (compilando sob Rosetta com o Python x86_64 do `CONDA_X86`):
```bash
python build/build.py --arch x86_64
```
Saída: `dist/release/TTWtools-<versão>-macos-x86_64.dmg`.

#### Windows (`x86_64`)
No Windows 10/11 64-bit (Python 3.14 ou 3.11):
```cmd
cd frontend-vue && npm ci && npm run build && cd ..
python build\build.py --install-deps
```
Gera `dist\release\TTWtools-<versão>-windows-x86_64.zip`. Para gerar o `.msi` (instalador por usuário, atalho e associações de arquivos):
```cmd
python build\make_msi.py --wix <pasta_do_wix_3.14>
```
Saída: `dist\release\TTWtools-<versão>-windows-x86_64.msi`.

#### Linux (`x86_64`)
No Ubuntu 22.04/24.04 ou Debian:
```bash
# 1. Dependências do sistema (Python, compilação e WebKit)
sudo apt-get update && sudo apt-get install -y python3-dev build-essential libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev libxdo-dev libssl-dev patchelf

# 2. Frontend e pacote Python
cd frontend-vue && npm ci && npm run build && cd ..
python build/build.py --install-deps
# Ou com Tauri (exige cargo install tauri-cli --version =2.11.5 --locked):
# python build/build.py --install-deps --shell tauri && python build/tauri_app.py --package
```
Saída: `dist/release/TTWtools-<versão>-linux-x86_64.tar.gz`.

O `.tar.gz` contém o executável `TTWtools`, `LEIAME.md`, `LICENSE.txt`, `icon.png` e os scripts `instalar-associacoes.sh` / `desinstalar-associacoes.sh`.

## Versão e changelog

- **Uma fonte só:** `version` no `pyproject.toml` do app (`app/_version.py`, `python -m app --version`, `GET /api/version` leem dali; o build grava `app/_build_info.py`, fora do git). SemVer com `alpha`, `beta`, `rc`; o `pyproject.toml` usa PEP 440 e a **tag** usa SemVer com `v`:

| `pyproject.toml` | Tag | Quando |
|---|---|---|
| `0.6.0a2.dev0` | (sem tag) | desenvolvimento entre lançamentos |
| `0.6.0a1` | `v0.6.0-alpha.1` | release de teste |
| `0.6.0b1` | `v0.6.0-beta.1` | funcionalidades completas, em teste |
| `0.6.0rc1` | `v0.6.0-rc.1` | candidata final |
| `0.6.0` | `v0.6.0` | lançamento |

- `CHANGELOG.md` (Keep a Changelog): uma linha por mudança visível em `[Unreleased]`; o pacote `ttwtools` tem changelog e versão próprios (`GET /api/version` mostra as duas).

## Release

1. Trabalhar numa branch, com `[Unreleased]` atualizado; PR para a `main` com o CI verde.
2. Na `main` limpa: `python build/release.py --version X.Y.Z --dry-run` (mostra o plano); depois sem `--dry-run`: grava a versão, move `[Unreleased]` para `[X.Y.Z] — data` com a versão do pacote, faz o commit `release: vX.Y.Z`, cria a tag anotada e envia. Recusa se a árvore estiver suja, se a branch não for a `main` (salvo `--allow-branch`), se a tag existir ou se o submódulo apontar para commit não publicado.
3. O `release.yml` valida a tag, gera os pacotes nos 4 sistemas (`--selftest` e, no macOS, `check_macos_min.py`) e cria a **release em rascunho** com `SHA256SUMS.txt` e as notas do CHANGELOG (`-alpha`, `-beta`, `-rc` saem como pre-release). Conferir o rascunho (baixar um pacote e abrir; macOS 12 numa máquina real), publicar, e voltar o `pyproject.toml` para a próxima versão de desenvolvimento (ex.: `0.6.0a2.dev0`).
4. **Só gerar pacotes, sem release:** `git push origin <branch>:release-test/<nome>` (artefatos no Actions; `gh run download <id> -n pkg-macos-x86_64`). Pacote Intel feito localmente: `python build/build.py --arch x86_64` e `bash build/release_github.sh --tag vX.Y.Z`.
5. **Release ruim:** nunca apagar nem reescrever tag já publicada. Rascunho com defeito: `gh release delete vX --cleanup-tag`, corrigir e lançar de novo. Publicada com defeito: nova versão `PATCH`, explicada no CHANGELOG.
6. **Antes de uma versão final:** CI verde na `main` nos 4 sistemas; `[Unreleased]` completo; tag própria do submódulo (`git -C libs/ttwtools tag vX.Y.Z && git -C libs/ttwtools push --tags`) e versão no `libs/ttwtools/pyproject.toml`; roteiro de `novodesenho/verificacao.md` com o pacote `-rc` (incluindo macOS 12 Intel); `shasum -a 256 -c SHA256SUMS.txt`.

Segredos do CI: `GH_PAT` (checkout do submódulo privado `libs/ttwtools`); `GITHUB_TOKEN` (automático) publica a release. Os pacotes de corpus do catálogo não fazem parte da release do aplicativo (`tools/corpora/README.md`; hospedagem: decisão D6).
