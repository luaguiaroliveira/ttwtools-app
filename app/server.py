"""
server.py — FastAPI application factory para ttwtools-app.
"""

from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
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


class SafeJSONResponse(JSONResponse):
    """JSON que troca NaN e infinito por null (tabelas de traços têm células vazias)."""

    def render(self, content) -> bytes:
        import json
        import math

        def clean(obj):
            if isinstance(obj, float):
                return None if math.isnan(obj) or math.isinf(obj) else obj
            if isinstance(obj, dict):
                return {k: clean(v) for k, v in obj.items()}
            if isinstance(obj, (list, tuple)):
                return [clean(v) for v in obj]
            return obj

        return json.dumps(clean(content), ensure_ascii=False, allow_nan=False, separators=(",", ":")).encode("utf-8")


def _frontend_dir() -> Path:
    """Localiza a pasta frontend corretamente dentro e fora do bundle PyInstaller.

    TTW_FRONTEND_DIR aponta outra pasta (ex.: frontend-vue/dist durante a transição)."""
    import os
    if os.environ.get("TTW_FRONTEND_DIR"):
        return Path(os.environ["TTW_FRONTEND_DIR"])
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).parent.parent))
    return base / "frontend"


def build_app(open_file: str | None = None) -> FastAPI:
    _ensure_ttwtools_importable()

    app = FastAPI(
        title="ttwtools-app",
        version=__version__,
        docs_url="/api/docs",
        redoc_url=None,
        default_response_class=SafeJSONResponse,
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
    from app.routes import jobs as jobs_routes, sources as sources_routes

    @app.get("/api/version", tags=["meta"])
    def get_version() -> dict:
        return version_info()

    @app.get("/api/health", tags=["meta"])
    def get_health() -> dict:
        from app import state as _state
        return {"status": "ok", "version": __version__, "project": _state.current_project_path}

    app.include_router(corpus.router,          prefix="/api/corpus",    tags=["corpus"])
    app.include_router(tagging.router,         prefix="/api/tagging",   tags=["tagging"])
    app.include_router(analysis.router,        prefix="/api/analysis",  tags=["analysis"])
    app.include_router(project_routes.router,  prefix="/api/project",   tags=["project"])
    app.include_router(quickrun.router,        prefix="/api/quickrun",  tags=["quickrun"])
    app.include_router(utils.router,           prefix="/api/utils",     tags=["utils"])
    app.include_router(tags.router,            prefix="/api/tags",      tags=["tags"])
    app.include_router(viz.router,             prefix="/api/viz",       tags=["viz"])
    app.include_router(jobs_routes.router,     prefix="/api/jobs",      tags=["jobs"])
    app.include_router(sources_routes.router,  prefix="/api/corpora",   tags=["corpora"])
    from app.routes import api_new
    app.include_router(api_new.router,         prefix="/api")

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
    @app.middleware("http")
    async def _no_cache_html(request, call_next):
        # o index.html muda a cada build (nomes dos assets com hash): sempre revalidar
        response = await call_next(request)
        if not request.url.path.startswith("/api") and response.headers.get("content-type", "").startswith("text/html"):
            response.headers["Cache-Control"] = "no-cache"
        return response

    frontend = _frontend_dir()
    if frontend.is_dir():
        app.mount("/", StaticFiles(directory=str(frontend), html=True), name="frontend")
    else:
        @app.get("/")
        def root():
            return {"message": "Frontend não encontrado. Execute o build do frontend."}

    return app
