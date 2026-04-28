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


def main() -> None:
    _prewarm_torch()
    parser = argparse.ArgumentParser(prog="ttwtools-app")
    parser.add_argument(
        "--mode",
        choices=["desktop", "web"],
        default="desktop",
        help="'desktop' abre janela nativa (pywebview); 'web' inicia apenas o servidor.",
    )
    parser.add_argument("--host", default="127.0.0.1", help="Host do servidor HTTP.")
    parser.add_argument("--port", type=int, default=8765, help="Porta do servidor HTTP.")
    parser.add_argument(
        "--open",
        metavar="FILE.ttwa",
        default=None,
        help="Abre um arquivo .ttwa ao iniciar.",
    )
    args = parser.parse_args()

    from app.server import build_app

    fastapi_app = build_app(open_file=args.open)

    if args.mode == "web":
        _run_server_foreground(fastapi_app, args.host, args.port)
    else:
        _run_desktop(fastapi_app, args.host, args.port)


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
    webview.create_window(
        title="ttwtools",
        url=url,
        width=1280,
        height=800,
        resizable=True,
        min_size=(900, 600),
    )
    webview.start(debug=False)


def _wait_for_server(host: str, port: int, timeout: float = 10.0) -> None:
    """Aguarda o servidor HTTP responder antes de abrir a janela."""
    import socket
    import time

    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection((host, port), timeout=0.5):
                return
        except OSError:
            time.sleep(0.1)
    raise RuntimeError(f"Servidor não respondeu em {timeout}s em {host}:{port}.")


if __name__ == "__main__":
    main()
