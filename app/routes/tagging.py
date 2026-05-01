"""
routes/tagging.py — Dispara o pipeline biberplus/ttwtools e salva no .ttwa.
"""

from __future__ import annotations

import tempfile
import threading
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app import state as app_state

class TqdmCatcher:
    def __init__(self, job_id, orig_stderr, jobs_dict):
        self.job_id = job_id
        self.orig_stderr = orig_stderr
        self.jobs_dict = jobs_dict
        self.buf = ""

    def write(self, s):
        self.orig_stderr.write(s)
        self.buf += s
        if '\r' in s or '\n' in s:
            lines = self.buf.replace('\r', '\n').split('\n')
            for line in reversed(lines[:-1]):
                stripped = line.strip()
                if stripped and '%' in stripped:
                    self.jobs_dict[self.job_id]["tqdm"] = stripped
                    break
            self.buf = lines[-1]

    def flush(self):
        self.orig_stderr.flush()

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
    tagger: str = "biberplus"        # "biberplus" | "mfte" | "mfte_ext" | "stanza_upos" | "stanza_xpos"
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

    # Use an explicit daemon thread to avoid BackgroundTasks stalls in frozen app builds.
    threading.Thread(
        target=_tag_job,
        args=(job_id, req, app_state.current_project_path),
        daemon=True,
    ).start()
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
    _jobs[job_id]["msg"] = f"Tagueando {req.corpus_name}..."

    import sys
    old_stderr = sys.stderr
    sys.stderr = TqdmCatcher(job_id, old_stderr, _jobs)
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            corpus_dir = tmp / req.corpus_name
            tagged_dir = tmp / f"{corpus_dir.name}_tagged"

            if req.source == "project":
                # Exporta textos do .ttwa para o temp
                with TTWAProject.open(project_path) as proj:
                    proj.export_corpus_to_folder(req.corpus_name, corpus_dir)
            else:
                if not req.folder_path:
                    raise ValueError("folder_path é obrigatório quando source='folder'.")
                corpus_dir = Path(req.folder_path)

            if req.tagger == "biberplus":
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
                
                raw_csv = tmp / f"{corpus_dir.name}_biberfeatures_rawcount.csv"
                ttwtools.normalize_biber_features(str(raw_csv))
                norm_csv = tmp / f"{corpus_dir.name}_biberfeatures_norm1000.csv"

            elif req.tagger in ("stanza_upos", "stanza_xpos"):
                mode = "upos" if req.tagger == "stanza_upos" else "xpos"
                ttwtools.extract_stanza_pos_features_from_folder(
                    folder_path_str=str(corpus_dir),
                    mode=mode,
                    output_dir=str(tmp),
                    save_tagged=req.save_tagged,
                    use_gpu=False,
                )
                raw_csv = tmp / f"{corpus_dir.name}_stanza_{mode}_rawcount.csv"
                ttwtools.normalize_stanza_pos_features(str(raw_csv))
                norm_csv = tmp / f"{corpus_dir.name}_stanza_{mode}_norm1000.csv"

            else:
                # mfte ou mfte_ext (legacy "stanza" falls through as extended=False)
                extended = (req.tagger == "mfte_ext")
                ttwtools.mfte(
                    folder_path_str=str(corpus_dir),
                    output_dir=str(tmp),
                    save_tagged=req.save_tagged,
                    use_gpu=False,
                    extended=extended,
                )
                
                raw_csv = tmp / f"{corpus_dir.name}_mfte_rawcount.csv"
                ttwtools.normalize_mfte_features(str(raw_csv))
                norm_csv = tmp / f"{corpus_dir.name}_mfte_norm1000.csv"

            # Importa de volta ao .ttwa
            with TTWAProject.open(project_path) as proj:
                proj.save_feature_table_from_csv(
                    req.corpus_name, raw_csv, "rawcount", tagger_type=req.tagger
                )
                if norm_csv.exists():
                    proj.save_feature_table_from_csv(
                        req.corpus_name, norm_csv, "norm1000", tagger_type=req.tagger
                    )
                if req.save_tagged and tagged_dir.exists():
                    proj.save_tagged_folder(req.corpus_name, tagged_dir, glob="*.jsonl", tagger_type=req.tagger)

        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["msg"] = "Tagging concluído com sucesso."

    except Exception as exc:
        _jobs[job_id]["status"] = "error"
        _jobs[job_id]["error"] = str(exc)
        _jobs[job_id]["msg"] = str(exc)
    finally:
        sys.stderr = old_stderr


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _require_project():
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")
