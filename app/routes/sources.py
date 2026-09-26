"""
routes/sources.py — Fonte de corpus única: importar para o projeto aberto a partir
de uma pasta local, de texto colado ou (a partir do passo 4.2) do catálogo.

A rota só valida e chama `ttwtools.import_corpus`; a regra fica no pacote.
"""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import state as app_state

router = APIRouter()


class CorpusSource(BaseModel):
    kind: Literal["folder", "text", "catalog"]
    path: str | None = None           # folder: pasta de .txt (ou um .txt / .csv)
    text: str | None = None           # text: conteúdo colado
    filename: str | None = None       # text: nome do documento (padrão texto_colado.txt)
    catalog_id: str | None = None     # catalog: id do corpus no catálogo (passo 4.2)


class ImportRequest(BaseModel):
    corpus_name: str
    source: CorpusSource
    filename_fields: list[str] | None = None
    delimiter: str = "_"
    metadata_csv: str | None = None
    text_column: str = "text"


@router.post("/import")
def import_corpus(req: ImportRequest):
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")
    import ttwtools
    src = req.source
    if src.kind == "catalog":
        raise HTTPException(status_code=501, detail="Catálogo de corpora disponível a partir do passo 4.2.")
    if src.kind == "folder" and not src.path:
        raise HTTPException(status_code=422, detail="source.path é obrigatório para kind='folder'.")
    if src.kind == "text" and not src.text:
        raise HTTPException(status_code=422, detail="source.text é obrigatório para kind='text'.")
    with ttwtools.open_project(app_state.current_project_path) as proj:
        try:
            report = ttwtools.import_corpus(
                proj, src.path if src.kind == "folder" else None, req.corpus_name,
                text=src.text if src.kind == "text" else None,
                text_filename=src.filename or "texto_colado.txt",
                filename_fields=req.filename_fields, delimiter=req.delimiter,
                metadata_csv=req.metadata_csv, text_column=req.text_column,
            )
        except (FileNotFoundError, NotADirectoryError, ValueError) as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
    return report
