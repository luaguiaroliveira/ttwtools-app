# ttwtools-app.spec — PyInstaller build spec
#
# Uso:
#   pyinstaller build/ttwtools-app.spec
#
# Pré-requisitos:
#   pip install pyinstaller pyinstaller-hooks-contrib
#   # spaCy models devem estar instalados no ambiente:
#   python -m spacy download en_core_web_sm
#   # (opcional) python -m spacy download en_core_web_trf

import sys
from pathlib import Path
from PyInstaller.utils.hooks import collect_data_files, collect_submodules, collect_all

ROOT = Path(SPECPATH).parent  # pasta raiz do repositório

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

# ttwtools: fontes Python + dados (tags_biber.json)
datas += [(str(TTWTOOLS_SRC), 'ttwtools')]

# Frontend (HTML/CSS/JS)
datas += [(str(ROOT / 'frontend'), 'frontend')]

# spaCy: bundle completo dos modelos (codigo + dados + binarios + hidden imports)
# para evitar erro [E050] em app congelado do PyInstaller.
model_hidden = []
for model in ['en_core_web_sm', 'en_core_web_trf']:
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
hidden += ['ttwtools', 'ttwtools.analysis', 'ttwtools.tagging', 'ttwtools.project']
hidden += collect_submodules('fastapi')
hidden += collect_submodules('uvicorn')
hidden += collect_submodules('starlette')
hidden += collect_submodules('anyio')
hidden += ['webview', 'webview.platforms.cocoa', 'webview.platforms.winforms',
           'webview.platforms.gtk', 'webview.platforms.qt']
hidden += ['spacy', 'thinc', 'blis', 'murmurhash', 'cymem', 'preshed',
           'srsly', 'catalogue', 'wasabi', 'typer', 'click']
hidden += ['en_core_web_sm', 'en_core_web_sm.about']
hidden += model_hidden
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
    excludes=['tkinter', 'test'],  # 'unittest' must stay: torch.distributed.distributed_c10d imports it
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data)

# ---------------------------------------------------------------------------
# Executável
# ---------------------------------------------------------------------------
exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='ttwtools',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,     # sem janela de console; mudar para True para debug
    icon=str(ROOT / 'build' / 'icon.icns') if (sys.platform == 'darwin' and (ROOT / 'build' / 'icon.icns').exists())
         else (str(ROOT / 'build' / 'icon.ico') if (sys.platform == 'win32' and (ROOT / 'build' / 'icon.ico').exists()) else None),
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
    upx=True,
    upx_exclude=[],
    name='ttwtools',
)

# macOS: criar .app bundle
if sys.platform == 'darwin':
    app = BUNDLE(
        coll,
        name='ttwtools.app',
        icon=str(ROOT / 'build' / 'icon.icns') if (ROOT / 'build' / 'icon.icns').exists() else None,
        bundle_identifier='br.edu.ttwtools.app',
        info_plist={
            'NSHighResolutionCapable': True,
            'CFBundleDocumentTypes': [{
                'CFBundleTypeName':       'TTW Archive',
                'CFBundleTypeExtensions': ['ttwa'],
                'CFBundleTypeMIMETypes':  ['application/x-ttwa+sqlite3'],
                'CFBundleTypeRole':       'Editor',
            }],
        },
    )
