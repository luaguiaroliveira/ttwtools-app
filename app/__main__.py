"""
__main__.py — Entry point do ttwtools-app.

Modos de execução:
  - Web:     `python -m app --mode web [--port 8765]`
             Inicia apenas o servidor FastAPI; abrir http://localhost:8765 no browser.
  - Desktop: `python -m app` (padrão)
             Inicia FastAPI em thread background e abre janela pywebview.
"""

from __future__ import annotations

import argparse
import os
import sys
import threading
from pathlib import Path


def _prewarm_torch() -> None:
    """Pre-import torch and torch.distributed on the main thread.

    When frozen (PyInstaller), importing torch.distributed from a secondary
    thread triggers a pybind11 duplicate-type-registration abort because
    torch._C is already loaded on the main thread.  Forcing the import here,
    on the main thread, avoids the race condition entirely.

    IMPORTANT: torch.distributed.distributed_c10d imports unittest at the
    module level.  If unittest is excluded from the frozen bundle, the import
    fails after pybind11 has already registered the C++ types (GradBucket etc.)
    in libtorch_python.dylib.  Python then removes the module from sys.modules.
    When a background thread later re-imports torch.distributed, pybind11 tries
    to register the same types again and calls abort().  The spec must NOT
    exclude unittest; this function pins the C extension in sys.modules as an
    additional safety net.
    """
    import sys as _sys
    try:
        import torch  # noqa: F401
        import torch.distributed  # noqa: F401
    except Exception as _e:
        # Log but continue — the pinning step below still helps.
        print(f"[prewarm] torch.distributed import warning: {_e}", flush=True)
    # Pin torch._C._distributed_c10d so it is never removed from sys.modules
    # and its C-level init (c10d_init / pybind11 type registration) never runs
    # a second time, even if torch.distributed is evicted from sys.modules.
    _c10d = _sys.modules.get('torch._C._distributed_c10d')
    if _c10d is not None:
        # Re-set unconditionally to prevent any cleanup code from removing it.
        _sys.modules['torch._C._distributed_c10d'] = _c10d
    else:
        print("[prewarm] WARNING: torch._C._distributed_c10d not in sys.modules after prewarm", flush=True)


def _ensure_std_streams() -> None:
    """No executável de janela do Windows (PyInstaller, console=False) stdout e
    stderr são None; o uvicorn e o logging quebram ao usá-los, e o PyInstaller
    mostra a exceção numa caixa de diálogo. Aponta-os para os.devnull."""
    import os
    for name in ("stdout", "stderr"):
        if getattr(sys, name) is None:
            setattr(sys, name, open(os.devnull, "w", encoding="utf-8"))


def _parent_alive(pid: int) -> bool:
    """O processo `pid` ainda existe? (os.kill(pid, 0) no Windows MATARIA o processo: usa a API do sistema)"""
    if sys.platform == "win32":
        import ctypes
        handle = ctypes.windll.kernel32.OpenProcess(0x00100000, False, pid)   # SYNCHRONIZE
        if not handle:
            return False
        try:
            return ctypes.windll.kernel32.WaitForSingleObject(handle, 0) == 0x102   # WAIT_TIMEOUT: ainda roda
        finally:
            ctypes.windll.kernel32.CloseHandle(handle)
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def _watch_parent() -> None:
    """Casca Tauri: ela passa TTW_PARENT_PID; se cair sem avisar (kill, falha), o servidor sai em vez de
    ficar órfão. SIGTERM de si mesmo roda a limpeza (cópia de trabalho) instalada em app/state.py."""
    raw = os.environ.get("TTW_PARENT_PID", "")
    if not raw.isdigit():
        return
    parent = int(raw)

    def watch():
        import signal
        import time
        while _parent_alive(parent):
            time.sleep(1)
        os.kill(os.getpid(), signal.SIGTERM) if sys.platform != "win32" else os._exit(0)

    threading.Thread(target=watch, daemon=True, name="parent-watch").start()


def main() -> None:
    _ensure_std_streams()
    if "--version" in sys.argv[1:]:
        # Responde antes de carregar torch e o resto do app.
        from app._version import version_info
        info = version_info()
        print(f"TTWtools {info['app']} (ttwtools {info['ttwtools']}, commit {info['commit']})")
        return
    if "--selftest" in sys.argv[1:]:
        sys.exit(_selftest())

    _watch_parent()
    _prewarm_torch()
    # Register macOS 'odoc' handler as early as possible so queued startup
    # events are delivered naturally when webview.start() runs the Cocoa loop.
    _register_macos_open_handler()

    parser = argparse.ArgumentParser(prog="ttwtools-app")
    parser.add_argument(
        "--mode",
        choices=["desktop", "web"],
        default="desktop",
        help="'desktop' abre janela nativa (pywebview); 'web' inicia apenas o servidor.",
    )
    parser.add_argument("--version", action="store_true", help="Mostra a versão e sai.")
    parser.add_argument("--selftest", action="store_true",
                        help="Sobe o servidor numa porta livre, confere /api/version e sai (0 = OK).")
    parser.add_argument("--host", default="127.0.0.1", help="Host do servidor HTTP.")
    parser.add_argument(
        "--port",
        type=int,
        default=None,
        help="Porta do servidor HTTP (padrão: 8765, ou porta livre se ocupada no modo desktop).",
    )
    parser.add_argument(
        "--open",
        metavar="FILE",
        default=None,
        help="Abre um arquivo .ttwa, .ttwl, .ttwal, .ttwc, .ttwcl ou .ttwt ao iniciar.",
    )
    args = parser.parse_args()

    port = args.port
    if port is None:
        port = 8765 if args.mode == "web" else _find_free_port(args.host, 8765)

    # Prefer --open flag; fall back to bare positional sys.argv (CLI / dev use).
    open_file = args.open
    if not open_file:
        for arg in sys.argv[1:]:
            if not arg.startswith('-') and Path(arg).suffix.lower() in ('.ttwa', '.ttwl', '.ttwal', '.ttwc', '.ttwcl', '.ttwt'):
                open_file = arg
                break

    from app.server import build_app

    fastapi_app = build_app(open_file=open_file)

    if args.mode == "web":
        _run_server_foreground(fastapi_app, args.host, port)
    else:
        _run_desktop(fastapi_app, args.host, port)


# ---------------------------------------------------------------------------
# macOS Apple Event support for file-open associations
# ---------------------------------------------------------------------------
#
# Design:
# - ONE handler instance defined at MODULE LEVEL so it is never GC'd and the
#   ObjC class is registered once (frozen-app-safe).
# - Handles BOTH the startup case (odoc queued before run loop starts) and the
#   runtime case (user opens another file while app is already running).
# - Events are queued by the system; they are delivered on the first run loop
#   iteration inside webview.start(), so we do NOT need to pump a run loop
#   manually. We just register the handler early and let pywebview's event
#   loop deliver the event naturally.
# - Sets app_state.pending_open_path; frontend polls /api/project/pending-open
#   on startup (checkInitialProject) and on window focus.

_odoc_handler = None   # module-level reference — must survive forever

# ---------------------------------------------------------------------------
# _ODHandler must be defined at MODULE LEVEL.
# In PyInstaller frozen apps, NSObject subclasses defined inside functions
# fail silently: ObjC class registration happens at class-body execution time
# and may be discarded or fail to register when nested inside a function scope.
# ---------------------------------------------------------------------------
if sys.platform == 'darwin':
    try:
        from AppKit import NSObject as _NSObject

        class _ODHandler(_NSObject):
            def handleOdoc_reply_(self, event, reply):  # selector: handleOdoc:reply:
                from urllib.parse import urlparse, unquote
                try:
                    desc = event.paramDescriptorForKeyword_(0x2D2D2D2D)
                    if desc is None:
                        return
                    for i in range(1, desc.numberOfItems() + 1):
                        item = desc.descriptorAtIndex_(i)
                        furl = item.coerceToDescriptorType_(0x6675726C)
                        if furl:
                            raw = furl.stringValue()
                            path = unquote(urlparse(raw).path)
                            if path:
                                from app import state as _s
                                _s.pending_open_path = path
                                return  # use first file only
                except Exception:
                    pass

    except Exception:
        _ODHandler = None  # type: ignore[assignment,misc]
else:
    _ODHandler = None  # type: ignore[assignment,misc]


def _register_macos_open_handler() -> None:
    """Register the 'odoc' Apple Event handler.  Safe to call before the Cocoa
    run loop starts; the OS queues startup events and delivers them on the
    first run loop iteration inside webview.start()."""
    global _odoc_handler
    if sys.platform != 'darwin' or _ODHandler is None:
        return
    try:
        from AppKit import NSAppleEventManager

        _odoc_handler = _ODHandler.alloc().init()
        NSAppleEventManager.sharedAppleEventManager() \
            .setEventHandler_andSelector_forEventClass_andEventID_(
                _odoc_handler,
                'handleOdoc:reply:',
                0x61657674,   # kCoreEventClass  'aevt'
                0x6F646F63,   # kAEOpenDocuments 'odoc'
            )
        print('[ttwtools] Apple Event odoc handler registered.', flush=True)
    except Exception as exc:
        print(f'[ttwtools] Apple Event handler unavailable: {exc}', flush=True)


# ---------------------------------------------------------------------------
# Autoteste do pacote (usado pelo build e pelo CI)
# ---------------------------------------------------------------------------

def _selftest() -> int:
    """Sobe o servidor numa porta livre, confere GET /api/version e testa os
    componentes. Falha (1) só no essencial: servidor, versão e spaCy. torch e
    Stanza ausentes ou quebrados viram AVISO (Stanza/MFTE ficam indisponíveis)."""
    import os

    # Sem console (executável de janela no Windows) o stdout é None; o build lê o arquivo.
    log_path = os.environ.get("TTW_SELFTEST_LOG")
    log_file = open(log_path, "w", encoding="utf-8") if log_path else None

    def emit(line: str) -> None:
        print(line, flush=True)
        if log_file:
            log_file.write(line + "\n")
            log_file.flush()

    try:
        return _selftest_checks(emit)
    except BaseException as exc:  # nunca deixar a exceção virar diálogo no Windows
        import traceback
        emit("[selftest] erro inesperado: " + "".join(traceback.format_exception(exc)))
        emit("FALHOU")
        return 1
    finally:
        if log_file:
            log_file.close()


def _selftest_checks(emit) -> int:
    import json
    import socket
    import time
    import urllib.request

    import uvicorn

    from app._version import __version__
    from app.server import build_app

    ok = True

    def report(name: str, passed: bool, detail: str = "", essential: bool = True) -> None:
        nonlocal ok
        label = "ok" if passed else ("FALHOU" if essential else "AVISO")
        emit(f"[selftest] {name}: {label}{' — ' + detail if detail else ''}")
        if not passed and essential:
            ok = False

    torch_ok = stanza_ok = False
    try:
        import torch
        import numpy as np
        _prewarm_torch()
        torch.from_numpy(np.arange(3.0))  # falha com numpy 2 no torch 2.2 (Intel)
        torch_ok = True
        report("torch", True, f"{torch.__version__}, numpy {np.__version__}", essential=False)
    except Exception as exc:
        report("torch", False, f"{type(exc).__name__}: {exc}", essential=False)

    try:
        import stanza
        stanza_ok = True
        report("stanza", True, stanza.__version__, essential=False)
    except Exception as exc:
        report("stanza", False, f"{type(exc).__name__}: {exc}", essential=False)

    # MFTE é importado dentro de função nos backends; se torch e Stanza existem, o
    # pacote precisa tê-lo (senão o etiquetador fica indisponível). Onde não há torch,
    # a ausência é esperada e vira aviso.
    try:
        import MFTE
        report("mfte", True, getattr(MFTE, "__version__", ""), essential=False)
    except Exception as exc:
        report("mfte", False, f"{type(exc).__name__}: {exc}", essential=torch_ok and stanza_ok)

    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        report("spacy", True, f"{spacy.__version__}, {len(nlp('A small test.'))} tokens")
    except Exception as exc:
        report("spacy", False, f"{type(exc).__name__}: {exc}")

    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    server = uvicorn.Server(uvicorn.Config(build_app(), host="127.0.0.1", port=port, log_level="warning"))
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    try:
        deadline = time.time() + 30
        while not server.started and time.time() < deadline:
            time.sleep(0.1)
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/version", timeout=10) as resp:
            data = json.load(resp)
        report("/api/version", data.get("app") == __version__, json.dumps(data))
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=10) as resp:
            report("/api/health", json.load(resp).get("status") == "ok")
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=10) as resp:
            report("frontend", resp.status == 200 and b"<html" in resp.read(4096).lower())
    except Exception as exc:
        report("servidor", False, f"{type(exc).__name__}: {exc}")
    finally:
        server.should_exit = True
        thread.join(timeout=10)

    emit("OK" if ok else "FALHOU")
    return 0 if ok else 1


# ---------------------------------------------------------------------------
# Modos de execução
# ---------------------------------------------------------------------------

def _run_server_foreground(fastapi_app, host: str, port: int) -> None:
    import uvicorn

    print(f"  ttwtools-app  →  http://{host}:{port}")
    uvicorn.run(fastapi_app, host=host, port=port, log_level="warning")


def _run_desktop(fastapi_app, host: str, port: int) -> None:
    import uvicorn
    import webview  # pywebview

    # Servidor FastAPI em thread daemon
    def _server():
        uvicorn.run(fastapi_app, host=host, port=port, log_level="warning")

    t = threading.Thread(target=_server, daemon=True)
    t.start()

    # Aguarda o servidor subir
    _wait_for_server(host, port)

    url = f"http://{host}:{port}"
    if os.environ.get("TTW_START_HASH"):             # benchmark visual: abre direto numa tela (#/comparar)
        url += "#" + os.environ["TTW_START_HASH"].lstrip("#")
    webview.settings["ALLOW_DOWNLOADS"] = True     # exportar tabelas, gráficos e corpora pela janela
    window = webview.create_window(
        title="TTWtools",
        url=url,
        width=1280,
        height=800,
        resizable=True,
        min_size=(900, 600),
    )
    # projeto compactado com alterações não salvas: o sistema pede confirmação ao fechar
    # (confirm_close é lido na hora de fechar nos três sistemas)
    def _watch_unsaved():
        import time
        from app import state as app_state
        while True:
            try:
                window.confirm_close = app_state.unsaved()
            except Exception:  # noqa: BLE001
                pass
            time.sleep(1)

    threading.Thread(target=_watch_unsaved, daemon=True, name="unsaved-watch").start()

    localization = {
        "global.quitConfirmation": "Há alterações não salvas no projeto (use Arquivo → Salvar). Fechar mesmo assim?\n"
                                   "There are unsaved changes in the project (use File → Save). Quit anyway?",
    }
    # Linux: o ícone da janela vem do icon.png ao lado do executável (Windows/macOS usam o embutido)
    icon = Path(sys.executable).parent / "icon.png"
    if sys.platform.startswith("linux") and getattr(sys, "frozen", False) and icon.is_file():
        try:
            webview.start(debug=False, localization=localization, icon=str(icon))
            return
        except TypeError:  # pywebview antigo, sem o parâmetro icon
            pass
    webview.start(debug=False, localization=localization)


def _port_is_free(host: str, port: int) -> bool:
    """Verifica se a porta está livre para bind no host."""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind((host, port))
            return True
    except OSError:
        return False


def _find_free_port(host: str, preferred: int = 8765) -> int:
    """Retorna a porta preferida se estiver livre; caso contrário, uma porta efêmera disponível."""
    if _port_is_free(host, preferred):
        return preferred
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((host, 0))
        return s.getsockname()[1]


def _wait_for_server(host: str, port: int, timeout: float = 10.0) -> None:
    """Aguarda o servidor HTTP do TTWtools responder com status ok antes de abrir a janela."""
    import json
    import time
    import urllib.request

    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            req = urllib.request.Request(f"http://{host}:{port}/api/health")
            with urllib.request.urlopen(req, timeout=0.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    if data.get("status") == "ok":
                        return
        except Exception:
            time.sleep(0.1)
    raise RuntimeError(f"Servidor TTWtools não respondeu em {timeout}s em {host}:{port}.")


if __name__ == "__main__":
    main()
