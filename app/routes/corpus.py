"""
routes/corpus.py — Upload e consulta de corpora no projeto .ttwa.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from app import state as app_state

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ImportFolderRequest(BaseModel):
    corpus_name: str
    folder_path: str
    glob: str = "*.txt"


class ImportTaggedFolderRequest(BaseModel):
    corpus_name: str
    tagged_folder: str
    glob: str = "*.tsv"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/import-folder")
def import_corpus_folder(req: ImportFolderRequest):
    """Importa todos os .txt de uma pasta para o corpus no projeto aberto."""
    _require_project()
    from ttwtools.project import TTWAProject

    try:
        with TTWAProject.open(app_state.current_project_path) as proj:
            n = proj.add_corpus_folder(req.corpus_name, req.folder_path, glob=req.glob)
    except (NotADirectoryError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"imported": n, "corpus_name": req.corpus_name}


@router.post("/upload")
async def upload_corpus_file(
    corpus_name: str = Form(...),
    file: UploadFile = File(...),
):
    """Upload de um arquivo .txt individual para o corpus."""
    _require_project()
    from ttwtools.project import TTWAProject

    content = (await file.read()).decode("utf-8", errors="ignore")
    with TTWAProject.open(app_state.current_project_path) as proj:
        proj.add_corpus_file(corpus_name, Path(file.filename or "unnamed.txt"), )
        # Sobrescreve usando o conteúdo do upload diretamente
        proj._con.execute(
            "INSERT INTO corpus_files (corpus_name, filename, content) VALUES (?, ?, ?)"
            " ON CONFLICT(corpus_name, filename) DO UPDATE SET content=excluded.content",
            (corpus_name, file.filename or "unnamed.txt", content),
        )
        proj._con.commit()

    return {"status": "uploaded", "filename": file.filename, "corpus_name": corpus_name}


@router.post("/import-tagged")
def import_tagged_folder(req: ImportTaggedFolderRequest):
    """Importa arquivos .tsv tagueados para o projeto."""
    _require_project()
    from ttwtools.project import TTWAProject

    try:
        with TTWAProject.open(app_state.current_project_path) as proj:
            n = proj.save_tagged_folder(req.corpus_name, req.tagged_folder, glob=req.glob)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"imported": n, "corpus_name": req.corpus_name}


@router.get("/list")
def list_corpora():
    """Lista todos os corpora do projeto."""
    _require_project()
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
        return {"corpora": proj.list_corpus_names()}


@router.get("/{corpus_name}/files")
def list_corpus_files(corpus_name: str):
    """Lista os arquivos de um corpus."""
    _require_project()
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
        return {"corpus_name": corpus_name, "files": proj.list_corpus_files(corpus_name)}


@router.get("/{corpus_name}/file/{filename}")
def get_corpus_file(corpus_name: str, filename: str):
    """Retorna o conteúdo de um arquivo do corpus."""
    _require_project()
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
        content = proj.get_corpus_file(corpus_name, filename)

    if content is None:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado no corpus.")
    return PlainTextResponse(content)


@router.get("/{corpus_name}/export")
def export_corpus(corpus_name: str, dest: str):
    """Exporta os arquivos de um corpus para uma pasta no disco."""
    _require_project()
    from ttwtools.project import TTWAProject

    try:
        with TTWAProject.open(app_state.current_project_path) as proj:
            n = proj.export_corpus_to_folder(corpus_name, dest)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"exported": n, "dest": dest}


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _require_project():
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")
