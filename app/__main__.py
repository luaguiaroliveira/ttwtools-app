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


def main() -> None:
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
