"""
routes/project.py — Gerenciamento de arquivos .ttwa (abrir, criar, resumo, exportar).
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
    """Selective export — items is a list of paths like:
    'corpora/CorpusA/file.txt', 'tagged/CorpusA/file.jsonl',
    'tables/Corpus_mfte_rawcount.csv', 'kfa/kfa_A_vs_B_d0.2_union.csv'
    If items is empty or None, exports everything.
    """
    items: list[str] | None = None
    dest_folder: str | None = None


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


@router.get("/manifest")
def project_manifest():
    """Returns a flat list of all exportable items in the project, grouped
    by category.  The frontend uses this to build the selection tree."""
    _require_project()
    from ttwtools.project import TTWAProject

    items: list[dict] = []

    with TTWAProject.open(app_state.current_project_path) as proj:
        corpus_names = proj.list_corpus_names()

        for cname in corpus_names:
            for fn in proj.list_corpus_files(cname):
                items.append({
                    "category": "corpora",
                    "corpus": cname,
                    "filename": fn,
                    "path": f"corpora/{cname}/{fn}",
                })

            for fn in proj.list_tagged_files(cname):
                items.append({
                    "category": "tagged",
                    "corpus": cname,
                    "filename": fn,
                    "path": f"tagged/{cname}/{fn}",
                })

        for ft in proj.list_feature_tables():
            csv_name = f"{ft['corpus_name']}_{ft['tagger_type']}_{ft['table_type']}.csv"
            items.append({
                "category": "tables",
                "corpus": ft["corpus_name"],
                "tagger_type": ft["tagger_type"],
                "table_type": ft["table_type"],
                "filename": csv_name,
                "path": f"tables/{csv_name}",
            })

        for kfa in proj.list_kfa_results():
            csv_name = (
                f"kfa_{kfa['corpus1_name']}_vs_{kfa['corpus2_name']}"
                f"_d{kfa['min_effect']}_{kfa['join_method']}.csv"
            )
            items.append({
                "category": "kfa",
                "corpus1": kfa["corpus1_name"],
                "corpus2": kfa["corpus2_name"],
                "min_effect": kfa["min_effect"],
                "join_method": kfa["join_method"],
                "filename": csv_name,
                "path": f"kfa/{csv_name}",
            })

    return {"items": items}


@router.post("/export")
def export_project(req: ExportRequest):
    """Exporta conteúdos do projeto .ttwa para uma pasta no disco.
    If req.items is provided, only those items are exported.
    Otherwise everything is exported."""
    _require_project()
    from ttwtools.project import TTWAProject

    ttwa_path = Path(app_state.current_project_path)

    if req.dest_folder:
        dest = Path(req.dest_folder).resolve()
    else:
        dest = ttwa_path.parent / ttwa_path.stem

    dest.mkdir(parents=True, exist_ok=True)

    selected = set(req.items) if req.items else None

    counts = {"corpora": 0, "tagged": 0, "tables": 0, "kfa": 0}

    with TTWAProject.open(app_state.current_project_path) as proj:
        corpus_names = proj.list_corpus_names()

        for cname in corpus_names:
            rows = proj._con.execute(
                "SELECT filename, content FROM corpus_files WHERE corpus_name = ?",
                (cname,),
            ).fetchall()
            for row in rows:
                path_key = f"corpora/{cname}/{row['filename']}"
                if selected is not None and path_key not in selected:
                    continue
                out = dest / "corpora" / cname
                out.mkdir(parents=True, exist_ok=True)
                (out / row["filename"]).write_text(row["content"], encoding="utf-8")
                counts["corpora"] += 1

            rows = proj._con.execute(
                "SELECT filename, content FROM tagged_files WHERE corpus_name = ?",
                (cname,),
            ).fetchall()
            for row in rows:
                path_key = f"tagged/{cname}/{row['filename']}"
                if selected is not None and path_key not in selected:
                    continue
                out = dest / "tagged" / cname
                out.mkdir(parents=True, exist_ok=True)
                (out / row["filename"]).write_text(row["content"], encoding="utf-8")
                counts["tagged"] += 1

        for ft in proj.list_feature_tables():
            csv_name = f"{ft['corpus_name']}_{ft['tagger_type']}_{ft['table_type']}.csv"
            path_key = f"tables/{csv_name}"
            if selected is not None and path_key not in selected:
                continue
            df = proj.load_feature_table(
                ft["corpus_name"], ft["table_type"], tagger_type=ft["tagger_type"]
            )
            if df is not None:
                tables_dir = dest / "tables"
                tables_dir.mkdir(parents=True, exist_ok=True)
                df.to_csv(tables_dir / csv_name, index=False)
                counts["tables"] += 1

        for kfa in proj.list_kfa_results():
            csv_name = (
                f"kfa_{kfa['corpus1_name']}_vs_{kfa['corpus2_name']}"
                f"_d{kfa['min_effect']}_{kfa['join_method']}.csv"
            )
            path_key = f"kfa/{csv_name}"
            if selected is not None and path_key not in selected:
                continue
            df = proj.load_kfa_result(
                kfa["corpus1_name"], kfa["corpus2_name"],
                min_effect=kfa["min_effect"], join_method=kfa["join_method"],
            )
            if df is not None:
                kfa_dir = dest / "kfa"
                kfa_dir.mkdir(parents=True, exist_ok=True)
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
