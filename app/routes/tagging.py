"""
routes/tagging.py — Dispara o pipeline biberplus/ttwtools e salva no .ttwa.
"""

from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app import state as app_state

router = APIRouter()

# Registro simples de jobs em background {job_id: status_dict}
_jobs: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TagRequest(BaseModel):
    corpus_name: str
    # Ou aponta para pasta no disco, ou usa o corpus já no .ttwa
    source: str = "project"          # "project" | "folder"
    folder_path: str | None = None   # obrigatório se source == "folder"
    save_tagged: bool = True
    usenlp: bool = False
    n_processes: int = 4
    function_words: bool = False


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/run")
def run_tagging(req: TagRequest, background_tasks: BackgroundTasks):
    """
    Inicia o tagging Biber para um corpus.

    Se source='project', exporta os textos do .ttwa para um diretório temporário,
    executa o biberplus e salva os resultados de volta no .ttwa.
    """
    _require_project()

    import uuid

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": "queued", "corpus_name": req.corpus_name}

    background_tasks.add_task(_tag_job, job_id, req, app_state.current_project_path)
    return {"job_id": job_id, "status": "queued"}


@router.get("/status/{job_id}")
def tagging_status(job_id: str):
    """Retorna o status de um job de tagging."""
    job = _jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job não encontrado.")
    return job


# ---------------------------------------------------------------------------
# Job background
# ---------------------------------------------------------------------------

def _tag_job(job_id: str, req: TagRequest, project_path: str) -> None:
    from ttwtools.project import TTWAProject
    import ttwtools

    _jobs[job_id]["status"] = "running"

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            corpus_dir = tmp / req.corpus_name
            tagged_dir = tmp / f"{req.corpus_name}_tagged"

            if req.source == "project":
                # Exporta textos do .ttwa para o temp
                with TTWAProject.open(project_path) as proj:
                    proj.export_corpus_to_folder(req.corpus_name, corpus_dir)
            else:
                if not req.folder_path:
                    raise ValueError("folder_path é obrigatório quando source='folder'.")
                corpus_dir = Path(req.folder_path)

            configdict = {
                "n_processes": req.n_processes,
                "function_words": req.function_words,
            }

            ttwtools.biberplus(
                folder_path_str=str(corpus_dir),
                configdict=configdict,
                usenlp=req.usenlp or None,
                save_tagged=req.save_tagged,
                output_dir=str(tmp),
            )

            # Normaliza
            raw_csv = tmp / f"{req.corpus_name}_biberfeatures_rawcount.csv"
            ttwtools.normalize_biber_features(str(raw_csv))
            norm_csv = tmp / f"{req.corpus_name}_biberfeatures_norm1000.csv"

            # Importa de volta ao .ttwa
            with TTWAProject.open(project_path) as proj:
                proj.save_feature_table_from_csv(req.corpus_name, raw_csv, "rawcount")
                if norm_csv.exists():
                    proj.save_feature_table_from_csv(req.corpus_name, norm_csv, "norm1000")
                if req.save_tagged and tagged_dir.exists():
                    proj.save_tagged_folder(req.corpus_name, tagged_dir)

        _jobs[job_id]["status"] = "done"

    except Exception as exc:
        _jobs[job_id]["status"] = "error"
        _jobs[job_id]["error"] = str(exc)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _require_project():
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")
