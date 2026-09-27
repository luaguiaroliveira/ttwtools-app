# Como contribuir

Guia curto para quem vai mexer no código. O desenho está em [`novodesenho/novomodelo.md`](novodesenho/novomodelo.md); o trabalho segue os passos de [`novodesenho/plano_implementacao.md`](novodesenho/plano_implementacao.md), cada um com relato ao ser concluído. Agentes (Claude, Gemini…) seguem também [`AGENTS.md`](AGENTS.md).

## Ambiente

```bash
git lfs install
git clone --recurse-submodules https://github.com/luaguiaroliveira/ttwtools-app.git
cd ttwtools-app
```

| Máquina | Ambiente | Como criar |
|---|---|---|
| Mac Apple Silicon, Windows, Linux | `ttw314` (Python 3.14, torch 2.11) | `conda env create -f environment.yml -n ttw314` |
| Mac Intel (macOS 12) | `ttw311` (Python 3.11, `torch==2.2.2`, `numpy==1.26.4`) | `python build/build.py --arch x86_64 --create-env` (num Mac Apple Silicon, sob Rosetta) ou um conda Intel com `build/constraints-macos-x86_64.txt` |

```bash
conda activate ttw314
pip install --no-deps -e libs/ttwtools -e .
(cd frontend-vue && npm ci)               # Node.js 22
```

## Rodar

```bash
(cd frontend-vue && npm run build)
python -m app --mode web --port 8765      # http://127.0.0.1:8765 (serve frontend-vue/dist)
python -m app --mode desktop                                                # janela nativa (pywebview)
(cd frontend-vue && npm run dev)          # interface com recarga automática; usa a API em :8765
```

Para parar o servidor: Ctrl+C, ou `kill $(lsof -ti :8765)`.

## Testes

Rode os testes do que mexeu:

```bash
pytest tests -q                           # servidor (rotas)
pytest libs/ttwtools/tests -q             # pacote
(cd frontend-vue && npm test)             # interface (Vitest)
(cd frontend-vue && PYTHON=$(which python) npm run e2e)   # ponta a ponta + acessibilidade (Playwright, usa o Chrome instalado)
```

O teste do fluxo em português roda se `pt_core_news_sm` estiver instalado (`ttwtools catalog download-model pt_core_news_sm`). O CI (`.github/workflows/ci.yml`) roda tudo isso em macOS, Windows e Linux a cada push.

## Pacotes do aplicativo

```bash
python build/build.py                     # pacote do sistema atual em dist/release/
python build/build.py --arch x86_64       # macOS Intel, num Mac Apple Silicon (sob Rosetta)
TTW_UI=legacy python build/build.py       # com a interface antiga (até a remoção dela no 3.11)
```

O `build.py` fixa as versões do alvo, compila a interface, roda o PyInstaller, testa o binário (`--selftest`) e, no macOS, confere a versão mínima do sistema (12.0 no Intel, 12.3 no Apple Silicon). Releases: [`RELEASING.md`](RELEASING.md).

## Regras

- **A lógica fica no pacote** (`libs/ttwtools/ttwtools`): a rota em `app/routes` só chama a função, e a tela só apresenta. Todo recurso novo existe como função pública, subcomando `ttwtools` e, quando fizer sentido, rota e tela, com "Copiar como código".
- **Textos de interface** saem por chave de tradução, em `pt` e `en` (`libs/ttwtools/ttwtools/data/i18n/`).
- **Nada reprocessa** o que já existe numa camada equivalente (cache de camadas por configuração).
- **Compatibilidade:** macOS 12 (Intel, Safari 17.6), Windows e Linux. Não use recursos de CSS/JS que o Safari 17 não tenha.
- **Submódulo:** `libs/ttwtools` é outro repositório. Faça o commit e o `git push` dentro dele primeiro e depois o commit do novo ponteiro no app.
- **Commits:** mensagens curtas, em português, começando pelo número do passo (ex.: `[5.3] português: ...`). Não reescreva histórico publicado.
- **Corpora:** nada entra no catálogo sem a licença conferida na fonte (veja [`tools/corpora/README.md`](tools/corpora/README.md)).

## Onde está cada coisa

| Onde | O quê |
|---|---|
| `app/` | servidor FastAPI local (rotas, tarefas em segundo plano, janela) |
| `frontend-vue/` | interface (Vue 3, Vite, Tailwind/DaisyUI); testes em `src/test` e `e2e/` |
| `frontend-src/` | interface antiga (será removida no passo 3.11) |
| `libs/ttwtools/` | pacote Python (submódulo): projeto, camadas, taggers, consultas, estatísticas, catálogo |
| `tools/corpora/` | scripts de preparo dos corpora do catálogo |
| `build/`, `.github/workflows/` | empacotamento (PyInstaller) e CI/releases |
| `novodesenho/` | desenho e plano de implementação |
