"""
server.py — FastAPI application factory para ttwtools-app.
"""

from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app._version import __version__, version_info


def _ensure_ttwtools_importable() -> None:
    """Adds local development paths so `import ttwtools` works reliably.

    Priority:
    1. Submodule in this repo: libs/ttwtools/
    2. Sibling repo during local development: ../ttwtools/
    """
    base = Path(__file__).resolve().parent.parent
    candidates = [
        base / "libs" / "ttwtools",
        base.parent / "ttwtools",
    ]

    for path in candidates:
        package_dir = path / "ttwtools"
        if package_dir.is_dir() and (package_dir / "__init__.py").is_file():
            path_str = str(path)
            if path_str not in sys.path:
                sys.path.insert(0, path_str)
            return


def _frontend_dir() -> Path:
    """Localiza a pasta frontend corretamente dentro e fora do bundle PyInstaller."""
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).parent.parent))
    return base / "frontend"


def build_app(open_file: str | None = None) -> FastAPI:
    _ensure_ttwtools_importable()

    app = FastAPI(
        title="ttwtools-app",
        version=__version__,
        docs_url="/api/docs",
        redoc_url=None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ------------------------------------------------------------------
    # Rotas da API
    # ------------------------------------------------------------------
    from app.routes import corpus, tagging, analysis, project as project_routes, quickrun, utils, tags, viz

    @app.get("/api/version", tags=["meta"])
    def get_version() -> dict:
        return version_info()

    app.include_router(corpus.router,          prefix="/api/corpus",    tags=["corpus"])
    app.include_router(tagging.router,         prefix="/api/tagging",   tags=["tagging"])
    app.include_router(analysis.router,        prefix="/api/analysis",  tags=["analysis"])
    app.include_router(project_routes.router,  prefix="/api/project",   tags=["project"])
    app.include_router(quickrun.router,        prefix="/api/quickrun",  tags=["quickrun"])
    app.include_router(utils.router,           prefix="/api/utils",     tags=["utils"])
    app.include_router(tags.router,            prefix="/api/tags",      tags=["tags"])
    app.include_router(viz.router,             prefix="/api/viz",       tags=["viz"])

    # ------------------------------------------------------------------
    # Estado global mínimo: arquivo .ttwa aberto
    # ------------------------------------------------------------------
    from app import state as app_state

    if open_file:
        p = Path(open_file).resolve()
        if p.suffix.lower() == '.ttwt':
            # .ttwt needs decompression — queue for frontend (shows progress bar)
            app_state.pending_open_path = str(p)
        else:
            app_state.current_project_path = str(p)

    # ------------------------------------------------------------------
    # Frontend estático
    # ------------------------------------------------------------------
    frontend = _frontend_dir()
    if frontend.is_dir():
        app.mount("/", StaticFiles(directory=str(frontend), html=True), name="frontend")
    else:
        @app.get("/")
        def root():
            return {"message": "Frontend não encontrado. Execute o build do frontend."}

    return app
