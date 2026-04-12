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


def _frontend_dir() -> Path:
    """Localiza a pasta frontend corretamente dentro e fora do bundle PyInstaller."""
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).parent.parent))
    return base / "frontend"


def build_app(open_file: str | None = None) -> FastAPI:
    app = FastAPI(
        title="ttwtools-app",
        version="0.1.0",
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
    from app.routes import corpus, tagging, analysis, project as project_routes, quickrun, utils

    app.include_router(corpus.router,          prefix="/api/corpus",    tags=["corpus"])
    app.include_router(tagging.router,         prefix="/api/tagging",   tags=["tagging"])
    app.include_router(analysis.router,        prefix="/api/analysis",  tags=["analysis"])
    app.include_router(project_routes.router,  prefix="/api/project",   tags=["project"])
    app.include_router(quickrun.router,        prefix="/api/quickrun",  tags=["quickrun"])
    app.include_router(utils.router,           prefix="/api/utils",     tags=["utils"])

    # ------------------------------------------------------------------
    # Estado global mínimo: arquivo .ttwa aberto
    # ------------------------------------------------------------------
    from app import state as app_state

    if open_file:
        app_state.current_project_path = str(Path(open_file).resolve())

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
