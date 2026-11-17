# ttwtools-app.spec — PyInstaller build spec
#
# Uso normal: `python build/build.py` (compila o frontend, grava app/_build_info.py,
# roda este spec, testa e empacota). Direto: `pyinstaller build/ttwtools-app.spec`.
#
# Variáveis de ambiente:
#   TTW_FRONTEND_DIR  pasta com a interface compilada (padrão: frontend/, gerada por frontend-vue)
#
# Pré-requisito: python -m spacy download en_core_web_sm
# Só o en_core_web_sm é embutido; modelos grandes são baixados depois (passo 4.2).

import importlib.util
import os
import sys
from pathlib import Path
from PyInstaller.utils.hooks import collect_data_files, collect_submodules, collect_all, copy_metadata

ROOT = Path(SPECPATH).parent  # pasta raiz do repositório

# TTW_SHELL=tauri: só o servidor (sem pywebview, sem .app), pasta dist/<alvo>/ttwtools-server, que o Tauri
# leva em resources e executa (novodesenho/tauri.md, fase F3). Padrão: pywebview, o pacote atual.
SHELL = os.environ.get('TTW_SHELL', 'pywebview')
assert SHELL in ('pywebview', 'tauri'), f"TTW_SHELL inválido: {SHELL}"

# ttwtools source: o install editável usa PEP 660 e o PyInstaller não consegue
# rastrear o mecanismo de import customizado, então incluímos os fontes diretamente.
# Tenta primeiro o submodule local, depois o repositório irmão.
for _candidate in [
    ROOT / 'libs' / 'ttwtools' / 'ttwtools',          # submodule dentro do app
    ROOT.parent / 'ttwtools' / 'ttwtools',             # repositório irmão (dev)
]:
    if _candidate.exists() and (_candidate / '__init__.py').exists():
        TTWTOOLS_SRC = _candidate
        break
else:
    raise SystemExit("ttwtools source not found — ajuste TTWTOOLS_SRC no spec")

# ---------------------------------------------------------------------------
# Dados a incluir no bundle
# ---------------------------------------------------------------------------
datas = []
binaries = []

# ttwtools: arquivos de dados (tagsets, descritores, ajuda...) por glob, fora os .py
# (os módulos entram pela análise de imports) e os caches.
for _f in TTWTOOLS_SRC.rglob('*'):
    if _f.is_file() and _f.suffix not in ('.py', '.pyc') and '__pycache__' not in _f.parts:
        datas += [(str(_f), str(Path('ttwtools') / _f.parent.relative_to(TTWTOOLS_SRC)))]

# Metadados de pacotes lidos por importlib.metadata no app (GET /api/version)
# (as versões entram no registro das camadas: sem o metadado viram "unknown" e o cache de camadas não casa com o do desenvolvimento)
for _dist in ['ttwtools', 'spacy', 'biberplus', 'mfte', 'stanza', 'en-core-web-sm']:
    try:
        datas += copy_metadata(_dist)
    except Exception:
        pass

# Frontend compilado (JS puro hoje; Vue a partir do passo 3.1)
FRONTEND_DIR = Path(os.environ.get('TTW_FRONTEND_DIR', ROOT / 'frontend'))
if not (FRONTEND_DIR / 'index.html').is_file():
    raise SystemExit(f"frontend não encontrado em {FRONTEND_DIR} — compile a interface antes")
datas += [(str(FRONTEND_DIR), 'frontend')]

# Licença e Leiame
if (ROOT / 'LICENSE').is_file():
    datas += [(str(ROOT / 'LICENSE'), '.')]
if (ROOT / 'build' / 'LEIAME.md').is_file():
    datas += [(str(ROOT / 'build' / 'LEIAME.md'), '.')]

# Ícones dos formatos de arquivo: no macOS vão para Contents/Resources (o Finder os lê de lá); no Windows e no Linux
# o build.py os copia para a pasta do pacote, com os scripts de associação (build/assoc).
if sys.platform == 'darwin' and SHELL == 'pywebview':
    for _ext in ('ttwa', 'ttwl', 'ttwt', 'ttwal', 'ttwc', 'ttwcl'):
        datas += [(str(ROOT / 'build' / 'fileicons' / f'{_ext}.icns'), '.')]

# spaCy: bundle completo do modelo (codigo + dados + binarios + hidden imports)
# para evitar erro [E050] em app congelado do PyInstaller.
model_hidden = []
for model in ['en_core_web_sm']:
    try:
        model_datas, model_bins, model_hiddens = collect_all(model)
        datas += model_datas
        binaries += model_bins
        model_hidden += model_hiddens
    except Exception:
        pass  # modelo não instalado — ignorar

# biberplus: arquivos de configuração/recursos
try:
    datas += collect_data_files('biberplus')
except Exception:
    pass

# ---------------------------------------------------------------------------
# Hidden imports (pacotes que PyInstaller não detecta automaticamente)
# ---------------------------------------------------------------------------
hidden = []
# ttwtools: lista explícita pois collect_submodules falha com install editável PEP 660
# ttwtools: lista tirada dos fontes, pois collect_submodules falha com install editável PEP 660
hidden += ['.'.join(('ttwtools',) + _m.relative_to(TTWTOOLS_SRC).with_suffix('').parts).removesuffix('.__init__')
           for _m in TTWTOOLS_SRC.rglob('*.py') if '__pycache__' not in _m.parts]
hidden += collect_submodules('fastapi')
hidden += collect_submodules('uvicorn')
hidden += collect_submodules('starlette')
hidden += collect_submodules('anyio')
hidden += ['app._build_info']
if SHELL == 'pywebview':
    hidden += ['webview', 'webview.platforms.cocoa', 'webview.platforms.winforms',
               'webview.platforms.gtk', 'webview.platforms.qt']
hidden += ['spacy', 'thinc', 'blis', 'murmurhash', 'cymem', 'preshed',
           'srsly', 'catalogue', 'wasabi', 'typer', 'click']
hidden += ['en_core_web_sm', 'en_core_web_sm.about']
hidden += model_hidden
# MFTE é Python puro e importado dentro de função; inclua explicitamente para não
# depender da análise estática (sem isso o etiquetador sai indisponível no pacote).
# `Constituency_tags` é importado por MFTE como módulo de topo.
for _mod in ['MFTE', 'Constituency_tags']:
    try:
        if importlib.util.find_spec(_mod) is not None:
            hidden.append(_mod)
    except Exception:
        pass
# stdlib modules needed by torch.distributed.distributed_c10d at runtime
hidden += ['unittest', 'unittest.case', 'unittest.mock']

# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------
a = Analysis(
    [str(ROOT / 'app' / '__main__.py')],
    pathex=[str(ROOT), str(TTWTOOLS_SRC.parent)],  # TTWTOOLS_SRC.parent contém o pacote ttwtools/
    binaries=binaries,
    datas=datas,
    hiddenimports=hidden,
    hookspath=[str(ROOT / 'build' / 'hooks')],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'test'] + (['webview'] if SHELL == 'tauri' else []),  # 'unittest' must stay: torch.distributed.distributed_c10d imports it
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data)

# Ícone por sistema (o .png do Linux é copiado ao lado do executável pelo build.py)
ICON = {'darwin': ROOT / 'build' / 'icon.icns', 'win32': ROOT / 'build' / 'icon.ico'}.get(sys.platform)
ICON = str(ICON) if ICON and ICON.exists() else None

# ---------------------------------------------------------------------------
# Executável
# ---------------------------------------------------------------------------
exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='TTWtools' if SHELL == 'pywebview' else 'ttwtools-server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,     # sem janela de console; mudar para True para debug
    icon=ICON,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='TTWtools' if SHELL == 'pywebview' else 'ttwtools-server',
)

# macOS: criar .app bundle (só na casca pywebview; no Tauri o .app é do Tauri)
if sys.platform == 'darwin' and SHELL == 'pywebview':
    # Um tipo de documento e um UTI por formato, cada um com o seu ícone (build/fileicons/<ext>.icns, copiado para
    # Contents/Resources; gerado por assets/icone/make_file_icons.py). Os três primeiros mantêm os tipos MIME antigos.
    _FORMATS = [
        ('ttwa', 'TTW Archive', 'application/x-ttwa+sqlite3'),
        ('ttwl', 'TTW Light Project', 'application/x-ttwl+sqlite3'),
        ('ttwt', 'TTW Compressed Archive', 'application/x-ttwt'),
        ('ttwal', 'TTW Light Corpus Package', 'application/x-ttwal+sqlite3'),
        ('ttwc', 'TTW Corpus', 'application/x-ttwc+sqlite3'),
        ('ttwcl', 'TTW Light Corpus', 'application/x-ttwcl+sqlite3'),
    ]
    DOC_TYPES = [{
        'CFBundleTypeName': name, 'CFBundleTypeExtensions': [ext], 'CFBundleTypeMIMETypes': [mime],
        'CFBundleTypeRole': 'Editor', 'LSHandlerRank': 'Owner', 'LSItemContentTypes': [f'br.edu.ttwtools.{ext}'],
        'CFBundleTypeIconFile': f'{ext}.icns',
    } for ext, name, mime in _FORMATS]
    UTI_TYPES = [{
        'UTTypeIdentifier': f'br.edu.ttwtools.{ext}', 'UTTypeDescription': name,
        'UTTypeConformsTo': ['public.data', 'public.item'], 'UTTypeIconFile': f'{ext}.icns',
        'UTTypeTagSpecification': {'public.filename-extension': [ext], 'public.mime-type': mime},
    } for ext, name, mime in _FORMATS]
    app = BUNDLE(
        coll,
        name='TTWtools.app',
        icon=str(ROOT / 'build' / 'icon.icns') if (ROOT / 'build' / 'icon.icns').exists() else None,
        bundle_identifier='br.edu.ttwtools.app',
        version=os.environ.get('TTW_VERSION'),  # gravado pelo build.py
        info_plist={
            'NSHighResolutionCapable': True,
            'LSMinimumSystemVersion': os.environ.get('MACOSX_DEPLOYMENT_TARGET', '12.0'),
            'CFBundleDocumentTypes': DOC_TYPES,
            'UTExportedTypeDeclarations': UTI_TYPES,
        },
    )
