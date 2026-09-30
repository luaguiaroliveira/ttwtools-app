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

## Pacotes do aplicativo

```bash
python build/build.py                     # pacote do sistema atual em dist/release/
python build/build.py --arch x86_64       # macOS Intel, num Mac Apple Silicon (sob Rosetta)
```

O `build.py` fixa as versões do alvo, compila a interface, roda o PyInstaller, testa o binário (`--selftest`) e, no macOS, confere a versão mínima do sistema (12.0 Intel, 12.3 Apple Silicon). Um build completo leva de 20 a 30 min por sistema (o torch pesa ~2 GB). **Sem assinatura** por enquanto: o macOS avisa ao abrir; contornar com botão direito → Abrir ou `xattr -dr com.apple.quarantine /Applications/TTWtools.app`. Assinar exige certificado Developer ID e os segredos `MACOS_CERT_P12` e `MACOS_CERT_PASSWORD` (comentário em `release.yml`; decisão D4).

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
