# Migração da casca do aplicativo: de pywebview para Tauri

Branch `tauri_1` (aberta em 2026-10-03, a partir de `main` em `a0f65a8`). **Frente experimental**: o pywebview continua sendo a casca oficial e **só sai quando o Tauri passar nos critérios da seção 7**.

## 1. Diretrizes (decididas)

0. **Preferência do usuário (2026-10-03):** seguir com o Tauri, apesar dos ganhos tímidos medidos (a motivação é ciclo de vida, instaladores e manutenção, não desempenho). Os critérios da seção 7 continuam valendo para a troca final.

1. **Compatibilidade**: macOS 12 (Intel e Apple Silicon), Windows e Linux, como hoje (`plano.md` seção 2). A casca nova não pode fechar nenhuma porta que a atual abre.
2. **Qualidade visual**: a interface Vue/Tailwind/daisyUI **não muda**; a aparência tem de ser a mesma na janela. No macOS os dois usam o mesmo motor (WKWebView), então a expectativa é de diferença zero; no Windows (WebView2) e no Linux (WebKitGTK) conferir.
3. **Mesmas capacidades**: tudo o que o aplicativo faz hoje dentro da janela (seção 3) continua fazendo. É a matriz de paridade que decide, não a impressão.
4. **Medir antes de decidir**: o benchmark da seção 5 existe **antes** do Tauri, com a linha de base do pywebview. O código do pywebview só é removido no fim (fase 6).
5. **O que não muda**: lógica no pacote `libs/ttwtools`, rotas em `app/routes`, interface em `frontend-vue`. A migração troca **só a casca** (janela, diálogos, associação de arquivos, ciclo de vida). Escopo continua sendo o aplicativo local.

## 2. Arquitetura proposta

```
Tauri (Rust, janela nativa)  ──spawn──▶  sidecar: o mesmo app Python (FastAPI + uvicorn) sem pywebview
        │                                        ▲
        └── janela aponta para http://127.0.0.1:<porta> ┘   (o mesmo URL que o pywebview abre hoje)
```

- O **sidecar é o executável PyInstaller atual**, sem `webview` (`build/ttwtools-app.spec`, linhas dos `hidden += ['webview', ...]`) e rodando no modo `web` (já existe), com porta livre escolhida pelo Rust (`--port`).
- `externalBin` do Tauri espera **um arquivo** por triplo de alvo; o nosso pacote é uma **pasta** (onedir, com torch, spaCy). Proposta: a pasta entra como `bundle.resources` e o Rust a executa pelo caminho resolvido (`std::process::Command`), não pelo mecanismo `sidecar()`. A decidir no spike.
- O Rust espera `GET /api/health`, só então navega a janela; ao fechar, encerra o sidecar (e a árvore dele); se o sidecar morrer, mostra erro em vez de janela em branco.
- **Alternativa descartada**: reescrever o servidor em Rust (fora de escopo; o pacote Python é o produto).
- **Expectativa honesta**: no macOS o ganho de renderização é nulo (mesmo WKWebView). O Tauri paga se melhorar o ciclo de vida (janela, menus, atualização, notarização, instaladores) sem piorar partida, memória e tamanho. O pacote é dominado por torch/spaCy, que o Tauri não reduz. O benchmark decide.

## 3. Matriz de paridade (o que o pywebview faz hoje e o que o Tauri precisa fazer)

| # | Capacidade hoje | Onde está | Equivalente no Tauri | Risco |
|---|---|---|---|---|
| 1 | Janela 1280×800, mínimo 900×600, título "TTWtools" | `app/__main__.py` `_run_desktop` | `tauri.conf.json` | baixo |
| 2 | Servidor FastAPI em thread, janela espera a porta | `_run_desktop`, `_wait_for_server` | Rust sobe o sidecar e espera `/api/health` | médio (ciclo de vida, processo órfão) |
| 3 | Diálogos nativos abrir/salvar/pasta | `app/routes/utils.py` (`_webview_dialog`; reserva osascript/tkinter no modo web) | plugin `dialog` chamado pelo frontend quando houver `window.__TAURI__`; reserva atual (rotas) fica para o modo web. Página servida por `http://` precisa de permissão `remote.urls` na capability | médio |
| 4 | Downloads (exportar tabelas, gráficos, corpora): `<a download>` com `Blob` | `frontend-vue/src/utils/export.js`; `webview.settings["ALLOW_DOWNLOADS"]` | handler de download do wry **ou** trocar, só dentro do Tauri, por diálogo "salvar" + gravação (rota existente ou plugin `fs`). Blob no WKWebView é ponto sabidamente frágil | **alto** (spike obrigatório) |
| 5 | Fechar com alterações não salvas pede confirmação (texto em pt e en) | `_watch_unsaved` (thread, 1 s) + `localization` | `CloseRequested` + `prevent_close` + consulta `GET /api/project/unsaved` (já existe) + diálogo `ask` | médio |
| 6 | Abrir arquivo pela associação (Finder/Explorer): `.ttwa .ttwl .ttwal .ttwc .ttwcl .ttwt` | macOS: Apple Event `odoc` via pyobjc (`_ODHandler`); resto: argumento de linha de comando; interface consulta `/api/project/pending-open` ao iniciar e no foco | macOS: `RunEvent::Opened`; Windows/Linux: argumento + plugin `single-instance` (segunda instância entrega o arquivo à primeira); o Rust grava o caminho no servidor (rota nova, que só faz `state.pending_open_path = ...`) ou passa `--open` | **alto** (cada sistema é diferente) |
| 7 | Ícones por formato e associações | `build/assoc`, `build/fileicons`, `Info.plist` no spec, scripts `.bat`/`.sh` | `bundle.fileAssociations` (macOS e Linux) e NSIS/MSI (Windows). Hoje distribuímos zip/dmg **sem instalador**; mudar isso é decisão (seção 8) | alto |
| 8 | Ícone da janela e do app (inclusive `icon.png` ao lado do executável no Linux) | `_run_desktop`, `build/icon.*` | `bundle.icon` | baixo |
| 9 | Tema claro/escuro do sistema (`prefers-color-scheme`) | interface (`theme.js`) | herdado do motor; conferir no Windows/Linux | baixo |
| 10 | Copiar/colar, atalhos de edição | motor | no macOS os atalhos exigem menu "Editar" na barra: o Tauri traz menu padrão, conferir | médio |
| 11 | Foco da janela relê `pending-open` | `App.vue` (`window.focus`) | igual (é a página) | baixo |
| 12 | Autoteste do pacote (`--selftest`, CI) | `app/__main__.py`, `build/build.py` | continua no sidecar; **somar** teste de que o Tauri abre e fecha | médio |
| 13 | Tamanho mínimo e versões de sistema | `build/check_macos_min.py`, `MACOSX_DEPLOYMENT_TARGET` 12.0 (Intel) / 12.3 (arm64) | Tauri 2 aceita macOS ≥ 10.15; alvo `x86_64-apple-darwin` e `aarch64-apple-darwin`; estender o `check_macos_min.py` ao binário Rust | médio |
| 14 | Windows | pywebview usa WebView2 | WebView2 também; Windows 10 sem o runtime precisa do instalador (online ou embutido) | médio |
| 15 | Linux | pywebview (GTK ou Qt) | WebKitGTK **4.1** (Tauri 2); distros antigas sem 4.1 ficam de fora: levantar quais usamos no CI e quais prometemos | **alto** |

Itens 3, 4, 6 e 15 são os que podem inviabilizar; entram primeiro no spike.

## 4. Fases

- **F0, feita (2026-10-03):** este plano, o benchmark e a linha de base do pywebview (seção 5).
- **F1, spike:** `src-tauri/` mínimo (`cargo`/Tauri 2 já disponíveis: `cargo 1.88`) que sobe o app em modo `web` e abre a janela. Rodar o benchmark com `--shell cmd`; capturar as telas; conferir tema escuro. **Provar** diálogo, download com Blob e abrir arquivo no macOS antes de seguir. Saída: relatório curto + go/no-go do spike.
- **F2, paridade funcional:** itens 3 a 6, 10 e 11 da matriz, com o frontend detectando `window.__TAURI__` e mantendo o caminho atual para o modo `web`. Testes: e2e Playwright atuais (rodam contra o servidor e continuam valendo), mais um roteiro manual da casca.
- **F3, sidecar empacotado:** spec do PyInstaller sem `webview`, porta pelo Rust, encerramento sem órfãos, `--selftest`.
- **F4, pacotes por sistema:** macOS arm64 e Intel (alvo 12), Windows, Linux; associações e ícones; CI (`.github/workflows`) com Rust; `check_macos_min.py`.
- **F5, verificação:** matriz de paridade 100%, benchmark comparado, comparação visual, Mac Intel real, Windows e Linux reais (`verificacao.md`).
- **F6, decisão e remoção:** só com a seção 7 cumprida: tirar `pywebview` (`pyproject.toml`, `requirements.txt`, `environment.yml`, spec), `_webview_dialog`, `_ODHandler`, `_run_desktop`. Antes de remover: **gerar a linha de base visual** do pywebview (seção 5) e guardá-la.

## 5. Benchmark (pronto)

Arquivos: `tools/bench/shell_bench.py` (harness), `app/bench.py` (marcas de tempo no servidor, ativas só com `TTW_BENCH_FILE`), `tests/test_bench.py`, resultados em `tools/bench/resultados/`. Só biblioteca padrão; com `psutil` (opcional; no Windows obrigatório) mede também a CPU.

Medir é do **servidor**, igual nas duas cascas: ele anota quando um navegador (User-Agent `Mozilla`) pede a página, o primeiro script e `/api/project/pending-open` (a interface montou). O monitoramento do harness não conta.

```
PY=~/miniconda3/envs/ttw314/bin/python
# linha de base sem janela (a casca = diferença para ela) e pywebview
$PY tools/bench/shell_bench.py run --shell web      --label web      --scenarios startup
$PY tools/bench/shell_bench.py run --shell pywebview --label pywebview --scenarios startup,open,visual
# Tauri: qualquer comando; {port} e {open} são trocados; TTW_PORT e TTW_BENCH_FILE vão no ambiente
$PY tools/bench/shell_bench.py run --shell cmd --label tauri --scenarios startup,open,visual,size \
    --cmd "path/TTWtools.app/Contents/MacOS/ttwtools --port {port}" --bundle path/TTWtools.app
$PY tools/bench/shell_bench.py compare tools/bench/resultados/pywebview-darwin-arm64.json tools/bench/resultados/tauri-darwin-arm64.json
$PY tools/bench/shell_bench.py compare-visual <pywebview.json> <tauri.json>
```

| Cenário | Mede | Observação |
|---|---|---|
| `startup` | servidor pronto, página pedida, script pedido, **interface montada**; RSS ao montar e 10 s depois; nº de processos; CPU em repouso | 3 repetições (mediana); pasta de dados temporária |
| `open` | abrir arquivo pelo argumento (como a associação) e o projeto ficar aberto | usa **cópia** de `libs/ttwtools/tests/data/v2_small.ttwa` (abrir altera o arquivo) |
| `visual` | captura da janela de 7 telas sem projeto; `compare-visual` dá % de pixels diferentes e imagens de diferença | **macOS**, exige permissão de **Gravação de Tela** ao terminal; `TTW_START_HASH` escolhe a tela |
| `size` | tamanho do pacote em disco | `--bundle` |

Limites conhecidos: (a) RSS soma páginas compartilhadas entre processos: serve para comparar cascas, não como consumo absoluto; (b) no macOS o WKWebView roda em processos `com.apple.WebKit.*` fora da árvore do app, que o harness soma por diferença (pids novos desde a partida): **feche o Safari e outros apps WebKit** durante a medição; (c) não mede renderização nem interação dentro da página (iguais no macOS por construção; no Windows/Linux, se importar, acrescentar marcas no frontend); (d) o pacote final (PyInstaller) ainda não foi medido, só o app a partir do código-fonte.

**Linha de base (2026-10-03, MacBook Apple Silicon M4, macOS 15, Python 3.13 em `ttw314`, a partir do código-fonte, mediana de 3):**

| métrica | web (sem janela) | pywebview | casca |
|---|---:|---:|---|
| servidor pronto | 1,10 s | 1,09 s | — |
| página pedida | — | 1,48 s | |
| interface montada | — | 1,65 s | **+0,55 s** sobre o servidor |
| RSS ao montar | 292 MB | 485 MB | **+193 MB**, 4 processos |
| RSS em repouso | 264 MB | 437 MB | +173 MB |
| CPU em repouso | 0,16 % | 1,86 % | |
| abrir arquivo | — | 1,8 s | ok |

**Linha de base visual (feita 2026-10-03):** 7 telas em `tools/bench/resultados/visual/pywebview-visual-*.png` (2560×1600, **tema escuro**, porque o app segue o tema do sistema; para o claro, trocar a aparência do macOS e repetir com outro `--label`). Referência até o fim da fase 6; comparar com `compare-visual`. Este benchmark não mede o Mac Intel nem Windows/Linux: repetir lá o mesmo comando.

## 5b. Spike F1: resultado parcial (2026-10-03)

`src-tauri/` (Tauri 2.11.6, Rust 1.88 do Homebrew) sobe `python -m app --mode web` numa porta livre, espera `/api/health`, abre a janela 1280×800 (mínimo 900×600) e encerra o servidor ao sair. **Só desenvolvimento**: usa `TTW_PYTHON` e `TTW_APP_DIR`; o sidecar empacotado é a F3. Compilar: `cd src-tauri && cargo build` (o `.cargo/config.toml` faz o cargo escolher versões compatíveis com o Rust instalado, pois o Tauri mais novo pede 1.90; no CI usar Rust atual e regerar o `Cargo.lock`).

Medido no mesmo M4, binário **debug** (mediana de 3), contra o pywebview:

| métrica | pywebview | Tauri | variação |
|---|---:|---:|---:|
| interface montada | 1,65 s | 1,55 s | −6 % |
| RSS ao montar | 485 MB | 510 MB | +5 % |
| RSS em repouso | 437 MB | 417 MB | −5 % |
| processos | 4 | 5 | +1 |
| CPU em repouso | 1,86 % | 1,93 % | ≈ |
| abrir arquivo (`--open`) | 1,84 s | 1,71 s | ok |

**Visual: 0,00 % de pixels diferentes nas 7 telas** (tolerância 16/255, tema escuro), como previsto: mesmo WKWebView. Dentro dos critérios da seção 7 neste Mac. **Ainda não provado** (próximos passos, nesta ordem): diálogo de abrir/salvar/pasta, download por `Blob`, abrir arquivo com o app já aberto (`RunEvent::Opened`), confirmar fechar com alterações não salvas, menu Editar (copiar/colar), ícone do app; depois Windows e Linux.

## 5c. Estado da paridade (F2 parcial, 2026-10-03, macOS arm64, binário debug)

| # | Item | Estado |
|---|---|---|
| 1, 2 | Janela e ciclo de vida do servidor | **feito e testado**: abre, espera `/api/health`, encerra o servidor ao sair; se a casca morrer (inclusive `kill -9`) o servidor sai em ~2 s (`TTW_PARENT_PID`, `app/__main__.py`) |
| 3 | Diálogos abrir/salvar/pasta | **implementado** (`src-tauri/src/main.rs`, `frontend-vue/src/api/shell.js`); a **ponte IPC a partir da origem `http://127.0.0.1` está provada** por autoteste (`TTW_TAURI_SELFTEST=<pasta>`: grava 4 bytes por `save_file` e sai com 0). Os diálogos em si **precisam de olho humano** (roteiro abaixo) |
| 4 | Download (CSV, TXT, SVG, PNG) | **implementado** como "salvar como" + gravação binária (`export.js` → `shell.saveAs`); caminho de gravação testado; o diálogo e o fluxo de ponta a ponta **precisam de olho humano** |
| 5 | Confirmar fechar com não salvo | **implementado** (`CloseRequested` + `/api/project/unsaved`, texto pt/en); **precisa de olho humano** |
| 6 | Abrir arquivo | **testado**: segunda instância com `--open` entrega o arquivo à primeira, que abre o projeto (plugin `single-instance`, `POST /api/project/pending-open`). Evento `RunEvent::Opened` do macOS (duplo clique no Finder) **implementado, só testável com o `.app` empacotado** (F4) |
| 8 | Ícone | só no pacote (F4) |
| 10 | Copiar/colar | menu padrão do Tauri; **conferir à mão** |
| 7, 12–15 | Associações, selftest do pacote, macOS 12 Intel, Windows, Linux | pendentes (F3 e F4) |

Descobertas: (a) comandos do app chamados de **origem remota** exigem permissão por comando (`build.rs` com `AppManifest::commands` + `allow-<comando>` na capability) além de `remote.urls` e `withGlobalTauri`; sem isso o erro é "not allowed. Plugin not found"; (b) `window.__TAURI__` existe na página servida por `http://127.0.0.1`; (c) `.on_page_load` dispara `Finished` para a URL externa e dá para injetar JS com `webview.eval`; (d) `os.kill(pid, 0)` no Windows mata o processo: o `_parent_alive` usa a API do sistema.

**Roteiro manual (5 minutos, no Mac):** `cd src-tauri && cargo build`, depois
`TTW_PYTHON=~/miniconda3/envs/ttw314/bin/python ./target/debug/ttwtools-tauri`
1. Arquivo > **Abrir...**: aparece o seletor nativo só com `.ttwa/.ttwl/...`; escolher abre o projeto; cancelar não faz nada.
2. **Novo...** / **Salvar como...**: o diálogo de salvar sugere o nome e, sem extensão, o app a acrescenta.
3. Em um corpus, **exportar tabela CSV**: abre "salvar como"; conferir que o arquivo gravado abre certo (também SVG e PNG de um gráfico).
4. Fazer uma alteração num projeto compactado e **fechar a janela**: pergunta em pt/en; "Cancelar" mantém aberto; "Fechar" sai.
5. Selecionar texto e **⌘C / ⌘V** funcionam.
Marque o que falhar aqui; é o que decide a F2.

**Resultado (usuário, 2026-10-03, macOS arm64): o roteiro manual passou, "funciona bem".** Itens 3, 4, 5 e 10 da matriz verificados à mão.

## 5d. F3: servidor empacotado (feito 2026-10-03, macOS arm64)

`python build/build.py --shell tauri` gera `dist/<alvo>/ttwtools-server/` (spec com `TTW_SHELL=tauri`: sem `webview`, sem `.app`). **Rode com o Python do ambiente do projeto** (`~/miniconda3/envs/ttw314/bin/python build/build.py ...`): com o Python base (sem uvicorn) o PyInstaller termina "com sucesso" mas o pacote sai sem o servidor e o autoteste falha com `No module named 'uvicorn'` (o `collect_submodules` vazio não avisa). **Agora o `build.py` confere os módulos antes e aborta com a mensagem certa** (`check_build_modules`). Resultado: autoteste ok (torch, Stanza, spaCy, API, interface), `check_macos_min` ok (436 Mach-O, nenhum acima de 12.3), **702 MB** (o `TTWtools.app` do pywebview tem 703 MB: o Tauri não muda o tamanho). `TTW_SERVER=<exe> ./src-tauri/target/debug/ttwtools-tauri` abre a janela com o servidor empacotado, a ponte IPC passa e não sobra processo órfão.

Medido (mediana de 3; o pywebview da linha de base roda **do código-fonte**, então a comparação favorece-o um pouco): interface montada 1,60 s (pywebview 1,65 s); RSS em repouso 474 MB (+8 %; inclui o processo extra do carregador do PyInstaller); CPU em repouso 2,4 % (1,9 %). **Pywebview empacotado (2026-10-04, mediana de 3, `pywebview-packaged-darwin-arm64.json`):** interface montada 1,83 s; RSS em repouso 506 MB; CPU em repouso 2,1 %. Comparação justa: **Tauri 1,60 s (−13 %), 474 MB (−6 %), CPU 2,4 % (≈)**; dentro dos critérios. O cenário `open` não gravou resultado com `--cmd` do pywebview (não investigado; o `open` do Tauri foi verificado à mão na F2).

## 5e. F4: pacote macOS arm64 (2026-10-04, parcial)

`cd src-tauri && cargo tauri build --bundles app` (PATH com `~/.cargo/bin`; `tauri-cli` 2.11.5, ver `plano.md`) gera `src-tauri/target/release/bundle/macos/TTWtools.app`, assinado ad hoc (`signingIdentity "-"`), sem notarização. Configuração: `tauri.conf.json` (`bundle.resources` copia `../dist/macos-arm64/ttwtools-server` para `Resources/server`; `minimumSystemVersion` 12.0; `macOS.files` copia os 6 `.icns` de `build/fileicons`) e `src-tauri/Info.plist` (tipos de documento e UTIs dos 6 formatos, gerado com os mesmos dados do spec do PyInstaller; o `fileAssociations` do Tauri 2.11 não aceita ícone por extensão nem tipo exportado). Conferido: `Info.plist` com os 12 identificadores `br.edu.ttwtools.*`, ícones em `Resources`, o pacote abre sozinho, sobe `Resources/server/ttwtools-server`, `/api/health` ok e nenhum servidor órfão ao fechar.

**Tamanho (resolvido 2026-10-04):** o Tauri copiava os 29 links simbólicos do PyInstaller como arquivos (1,0 GB). `python build/tauri_app.py` (Python do `ttw314`, `cargo` no PATH, depois de `build.py --shell tauri`) roda `cargo tauri build`, refaz `Resources/server` com `ditto`, reassina (ad hoc) e roda `check_macos_min.py`: **710 MB** (pywebview: 703 MB), `codesign --verify --deep --strict` ok, 437 Mach-O nenhum acima de 12.3, abre e `/api/health` ok, sem órfão. **Abrir arquivo pelo LaunchServices (2026-10-04):** `open -a TTWtools.app arquivo.ttwa` derrubava o app (`state() called before manage() for Port`: o macOS entrega `RunEvent::Opened` antes de o `setup` terminar). Corrigido gerenciando `Port` no `Builder` (`main.rs`). Agora: app fechado + arquivo = abre com o projeto (`/api/project` mostra o caminho), uma só instância, sem órfão; o UTI `br.edu.ttwtools.ttwa` é reconhecido (`mdls`). Verificado por você na janela (2026-10-04): abrir uma cópia de `lemas_tcl2.ttwa` (139 MB) pelo `open -a` e depois um **segundo arquivo com o app já aberto** troca o projeto certinho. **Não verificado:** duplo clique real no Finder e os ícones por formato.
**Problemas abertos:** (2) Falta: `.dmg`; alvo Intel (12.0); Windows e Linux; CI com Rust. (3) O alvo `dist/macos-arm64/ttwtools-server` está fixo em `tauri.conf.json`: para outros alvos usar `--config` com sobreposição.

## 6. Riscos

1. Downloads de `Blob` e diálogos em página `http://` dentro do WKWebView/Tauri (itens 3 e 4).
2. Associação de arquivos nos três sistemas, principalmente o evento de abertura com o app já aberto (item 6).
3. Linux: WebKitGTK 4.1 e empacotamento; Windows 10 sem WebView2.
4. Processo Python órfão se o Tauri cair; porta ocupada por outra sessão (usar sempre porta livre).
5. Intel macOS 12: compilar o Rust para `x86_64-apple-darwin` com deployment target 12.0 e conferir no Mac real (sem o Intel por ora).
6. Duplo conjunto de CI e de release durante a transição; cuidar para não quebrar o release atual (`release.py`, `build.py`).

## 7. Critérios para trocar (go/no-go)

Todos, em macOS arm64, macOS 12 Intel, Windows e Linux:

- Matriz de paridade da seção 3: **100 %** dos itens (nenhum "aceitável por ora").
- Visual: diferença por pixel pequena e explicada em todas as telas (claro e escuro), **e** sua revisão visual.
- Partida (`interface montada`) no máximo **+20 %** sobre o pywebview; RSS em repouso no máximo **+10 %**; pacote no máximo **+5 %**.
- Autoteste do pacote, e2e Playwright (27/27) e roteiro de `verificacao.md` passando; instalar/abrir pela associação funcionando.
- Nenhuma regressão de compatibilidade (`check_macos_min.py`, torch/numpy do Intel, Linux de referência).

Se algum critério falhar sem solução razoável, o pywebview fica e este branch é arquivado.

## 8. Decisões do usuário (2026-10-03) e consequências

1. **Instalador: sim** (Tauri: `.dmg` no macOS, NSIS no Windows, `.deb` e `.rpm` no Linux). No macOS, ver abaixo.
2. **Linux:** Debian/Ubuntu (`.deb`), Red Hat/Fedora (`.rpm`), Manjaro/Arch (o Tauri não gera pacote pacman: **AppImage** ou um `PKGBUILD` que instala o `.deb`/binário; decidir no F4). O `.deb`/`.rpm` depende de **WebKitGTK 4.1**: conferir no CI e anotar a versão mínima de cada família (Ubuntu 22.04+ e Debian 12+ têm; Debian 11 e Ubuntu 20.04 provavelmente ficam de fora).
3. **Windows:** embutir o WebView2 (`webviewInstallMode: offlineInstaller`, ~130 MB a mais no instalador, não exige internet).
4. **macOS sem conta Apple Developer (sem assinar nem notarizar):** o app continua rodando, mas o Gatekeeper avisa na primeira abertura. É o **mesmo** que o pacote atual (o `build/` não assina). Estratégia:
   - assinatura *ad hoc* (`signingIdentity: "-"` no Tauri): obrigatória no Apple Silicon, grátis; conferir no spike que o selo continua válido com o sidecar Python (torch etc.) dentro de `Resources`;
   - instruções por versão no instalador/site: macOS 12–14, clique direito > Abrir; macOS 15, Ajustes > Privacidade e Segurança > "Abrir mesmo assim"; alternativa `xattr -dr com.apple.quarantine /Applications/TTWtools.app`;
   - **atualização pelo próprio app** (plugin `updater` do Tauri, chave minisign própria, sem Apple): arquivos que o app baixa não ganham quarentena, então só a **primeira** instalação passa pelo aviso;
   - se a distribuição crescer, a conta paga (US$ 99/ano) elimina o aviso; não bloqueia a migração.
   - Windows tem o equivalente (SmartScreen sem certificado): mesma tática de instrução.
