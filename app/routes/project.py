"""
routes/project.py — Gerenciamento de arquivos .ttwa (abrir, criar, resumo).
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import state as app_state

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CreateProjectRequest(BaseModel):
    path: str
    name: str = ""
    description: str = ""
    overwrite: bool = False


class OpenProjectRequest(BaseModel):
    path: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/create")
def create_project(req: CreateProjectRequest):
    """Cria um novo arquivo .ttwa vazio."""
    from ttwtools.project import TTWAProject

    try:
        proj = TTWAProject.create(
            req.path,
            name=req.name,
            description=req.description,
            overwrite=req.overwrite,
        )
        proj.close()
    except FileExistsError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    app_state.current_project_path = str(Path(req.path).resolve())
    return {"status": "created", "path": app_state.current_project_path}


@router.post("/open")
def open_project(req: OpenProjectRequest):
    """Define o arquivo .ttwa ativo."""
    p = Path(req.path).resolve()
    if not p.exists():
        raise HTTPException(status_code=404, detail=f"Arquivo não encontrado: {p}")
    app_state.current_project_path = str(p)
    return {"status": "opened", "path": str(p)}


@router.get("/summary")
def project_summary():
    """Retorna o resumo do projeto atualmente aberto."""
    _require_project()
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
        return proj.summary()


@router.get("/meta")
def project_meta():
    """Retorna os metadados do projeto."""
    _require_project()
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
        return proj.all_meta()


@router.get("/current")
def current_project():
    """Retorna o caminho do projeto aberto (ou null)."""
    return {"path": app_state.current_project_path}


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _require_project():
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto. Use /api/project/open primeiro.")
