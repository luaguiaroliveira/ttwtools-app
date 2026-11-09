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
    catalog_id: str | None = None     # catalog: use /api/catalog/install (passo 4.2)
    format: Literal["txt", "conllu", "nltk", "tei", "graf"] = "txt"   # folder: formato dos arquivos
    tagset: str | None = None         # nltk: nome do tagset das etiquetas


class ImportRequest(BaseModel):
    corpus_name: str
    source: CorpusSource
    filename_fields: list[str] | None = None
    delimiter: str = "_"
    metadata_csv: str | None = None
    text_column: str = "text"


class SubfoldersImportRequest(BaseModel):
    source: CorpusSource
    filename_fields: list[str] | None = None
    delimiter: str = "_"
    metadata_csv: str | None = None
    glob: str = "*.txt"
    names: list[str] | None = None


@router.get("/preview-names")
def preview_names(path: str, delimiter: str = "_", fields: str | None = None):
    """Como os nomes dos arquivos da pasta viram metadados (ttwtools.preview_filenames), sem importar."""
    import ttwtools
    return ttwtools.preview_filenames(path, delimiter, fields.split(",") if fields else None)


@router.get("/subfolders")
def list_subfolders(path: str, glob: str = "*.txt"):
    """Subpastas com arquivos que casam com `glob` (ttwtools.subfolders), uma por corpus."""
    import ttwtools
    return {"folders": ttwtools.subfolders(path, glob)}


@router.post("/import")
def import_corpus(req: ImportRequest):
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")
    import ttwtools
    src = req.source
    if src.kind == "catalog":
        raise HTTPException(status_code=422, detail="Corpora do catálogo: use /api/catalog/install.")
    if src.kind == "folder" and not src.path:
        raise HTTPException(status_code=422, detail="source.path é obrigatório para kind='folder'.")
    if src.kind == "text" and not src.text:
        raise HTTPException(status_code=422, detail="source.text é obrigatório para kind='text'.")
    with ttwtools.open_project(app_state.current_project_path) as proj:
        if src.kind == "folder" and src.format != "txt":     # arquivos já anotados: documento + camada
            from ttwtools import formats
            fn = {"conllu": formats.import_conllu, "tei": formats.import_tei, "graf": formats.import_graf,
                  "nltk": lambda p, path, name: formats.import_nltk_tagged(p, path, name, tagset=src.tagset or "")}
            try:
                return fn[src.format](proj, src.path, req.corpus_name)
            except (FileNotFoundError, NotADirectoryError, ValueError, SyntaxError) as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
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


@router.post("/import-subfolders")
def import_subfolders(req: SubfoldersImportRequest):
    """Importa cada subpasta da pasta escolhida como um corpus com o nome da subpasta."""
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")
    if req.source.kind != "folder" or not req.source.path:
        raise HTTPException(status_code=422, detail="A importação por subpastas precisa de uma pasta.")
    import ttwtools
    with ttwtools.open_project(app_state.current_project_path) as proj:
        try:
            return ttwtools.import_subfolders(
                proj, req.source.path, glob=req.glob, filename_fields=req.filename_fields,
                delimiter=req.delimiter, metadata_csv=req.metadata_csv, names=req.names)
        except (FileNotFoundError, NotADirectoryError, ValueError) as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
