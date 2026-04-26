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


class ExportRequest(BaseModel):
    export_corpora: bool = True
    export_tagged: bool = True
    export_tables: bool = True
    export_kfa: bool = True
    dest_folder: str | None = None   # defaults to <ttwa_stem>/ next to the .ttwa


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


@router.post("/export")
def export_project(req: ExportRequest):
    """Exporta conteúdos do projeto .ttwa para uma pasta no disco."""
    _require_project()
    import io
    from ttwtools.project import TTWAProject

    ttwa_path = Path(app_state.current_project_path)

    if req.dest_folder:
        dest = Path(req.dest_folder).resolve()
    else:
        dest = ttwa_path.parent / ttwa_path.stem

    dest.mkdir(parents=True, exist_ok=True)

    counts = {"corpora": 0, "tagged": 0, "tables": 0, "kfa": 0}

    with TTWAProject.open(app_state.current_project_path) as proj:
        corpus_names = proj.list_corpus_names()

        for cname in corpus_names:
            # ── Original corpus files ──────────────────────────────────
            if req.export_corpora:
                corpus_dir = dest / "corpora" / cname
                corpus_dir.mkdir(parents=True, exist_ok=True)
                rows = proj._con.execute(
                    "SELECT filename, content FROM corpus_files WHERE corpus_name = ?",
                    (cname,),
                ).fetchall()
                for row in rows:
                    (corpus_dir / row["filename"]).write_text(row["content"], encoding="utf-8")
                    counts["corpora"] += 1

            # ── Tagged files (JSONL / TSV) ─────────────────────────────
            if req.export_tagged:
                tagged_dir = dest / "tagged" / cname
                tagged_dir.mkdir(parents=True, exist_ok=True)
                rows = proj._con.execute(
                    "SELECT filename, content FROM tagged_files WHERE corpus_name = ?",
                    (cname,),
                ).fetchall()
                for row in rows:
                    (tagged_dir / row["filename"]).write_text(row["content"], encoding="utf-8")
                    counts["tagged"] += 1

            # ── Feature tables (CSV) ───────────────────────────────────
            if req.export_tables:
                tables_dir = dest / "tables"
                tables_dir.mkdir(parents=True, exist_ok=True)
                ft_list = proj.list_feature_tables()
                for ft in ft_list:
                    if ft["corpus_name"] != cname:
                        continue
                    df = proj.load_feature_table(cname, ft["table_type"], tagger_type=ft["tagger_type"])
                    if df is not None:
                        csv_name = f"{cname}_{ft['tagger_type']}_{ft['table_type']}.csv"
                        df.to_csv(tables_dir / csv_name, index=False)
                        counts["tables"] += 1

        # ── KFA results (CSV) ─────────────────────────────────────────
        if req.export_kfa:
            kfa_dir = dest / "kfa"
            kfa_dir.mkdir(parents=True, exist_ok=True)
            for kfa in proj.list_kfa_results():
                df = proj.load_kfa_result(
                    kfa["corpus1_name"], kfa["corpus2_name"],
                    min_effect=kfa["min_effect"], join_method=kfa["join_method"],
                )
                if df is not None:
                    csv_name = (
                        f"kfa_{kfa['corpus1_name']}_vs_{kfa['corpus2_name']}"
                        f"_d{kfa['min_effect']}_{kfa['join_method']}.csv"
                    )
                    df.to_csv(kfa_dir / csv_name, index=False)
                    counts["kfa"] += 1

    return {
        "status": "exported",
        "dest": str(dest),
        **counts,
    }


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _require_project():
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto. Use /api/project/open primeiro.")
