"""
routes/quickrun.py — Pipeline completo a partir de duas pastas de corpus.

POST /api/quickrun/start
    Inicia em background: tagging → normalização → KFA → salva .ttwa
GET  /api/quickrun/status/{job_id}
    Polled pelo frontend para progresso em tempo real
"""

from __future__ import annotations

import tempfile
import uuid
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

# job_id → {status, step, message, error, ttwa_path}
_jobs: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

class QuickRunRequest(BaseModel):
    corpus1_name: str
    corpus1_folder: str
    corpus2_name: str
    corpus2_folder: str
    output_ttwa: str          # caminho completo do arquivo .ttwa a criar
    mode: str = "full"        # "full" | "compact"
    join: str = "intersection"
    min_effect: float = 0.2
    usenlp: bool = False
    n_processes: int = 4
    overwrite: bool = True
    tagger: str = "biberplus"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/start")
def quickrun_start(req: QuickRunRequest, background_tasks: BackgroundTasks):
    """Inicia o pipeline completo em background. Retorna job_id para polling."""
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": "queued", "step": "aguardando", "message": "", "error": None, "ttwa_path": None}
    background_tasks.add_task(_run_pipeline, job_id, req)
    return {"job_id": job_id}


@router.get("/status/{job_id}")
def quickrun_status(job_id: str):
    job = _jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job não encontrado.")
    return job


# ---------------------------------------------------------------------------
# Pipeline background
# ---------------------------------------------------------------------------

def _run_pipeline(job_id: str, req: QuickRunRequest) -> None:
    import ttwtools
    from ttwtools.project import save_analysis_to_project

    def _upd(step: str, msg: str = ""):
        _jobs[job_id].update({"status": "running", "step": step, "message": msg})

    try:
        c1_folder = Path(req.corpus1_folder).resolve()
        c2_folder = Path(req.corpus2_folder).resolve()

        for label, folder in [(req.corpus1_name, c1_folder), (req.corpus2_name, c2_folder)]:
            if not folder.is_dir():
                raise NotADirectoryError(f"Pasta não encontrada: '{folder}'")
            if not list(folder.glob("*.txt")):
                raise ValueError(f"Nenhum arquivo .txt encontrado em '{folder}'.")

        out_ttwa = Path(req.output_ttwa).resolve()
        if out_ttwa.suffix.lower() != ".ttwa":
            out_ttwa = out_ttwa.with_suffix(".ttwa")
        out_ttwa.parent.mkdir(parents=True, exist_ok=True)
        # Verifica permissão de escrita no diretório antes de iniciar
        import os
        if not os.access(out_ttwa.parent, os.W_OK):
            raise PermissionError(
                f"Sem permissão de escrita em '{out_ttwa.parent}'. "
                "Escolha uma pasta dentro do seu diretório home."
            )

        import sys
        old_stderr = sys.stderr
        sys.stderr = TqdmCatcher(job_id, old_stderr, _jobs)
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                tmp = Path(tmpdir)

                # ── Tagging corpus 1 ────────────────────────────────────────────
                _upd("tagging", f"Tagueando {req.corpus1_name}…")
                if req.tagger == "biberplus":
                    ttwtools.biberplus(
                        folder_path_str=str(c1_folder),
                        configdict={"n_processes": req.n_processes, "function_words": False},
                        usenlp=req.usenlp or None,
                        save_tagged=True,
                        output_dir=str(tmp),
                    )
                else:
                    ttwtools.mfte(
                        folder_path_str=str(c1_folder),
                        output_dir=str(tmp),
                        save_tagged=True,
                        extended=(req.tagger == "mfte"),
                    )

                # ── Tagging corpus 2 ────────────────────────────────────────────
                _upd("tagging", f"Tagueando {req.corpus2_name}…")
                if req.tagger == "biberplus":
                    ttwtools.biberplus(
                        folder_path_str=str(c2_folder),
                        configdict={"n_processes": req.n_processes, "function_words": False},
                        usenlp=req.usenlp or None,
                        save_tagged=True,
                        output_dir=str(tmp),
                    )
                else:
                    ttwtools.mfte(
                        folder_path_str=str(c2_folder),
                        output_dir=str(tmp),
                        save_tagged=True,
                        extended=(req.tagger == "mfte"),
                    )

                # ── Normalização ────────────────────────────────────────────────
                _upd("normalizing", "Normalizando features…")
                tag_suffix = "biberfeatures" if req.tagger == "biberplus" else "mfte"
                
                raw1 = tmp / f"{c1_folder.name}_{tag_suffix}_rawcount.csv"
                raw2 = tmp / f"{c2_folder.name}_{tag_suffix}_rawcount.csv"
                
                if req.tagger == "biberplus":
                    ttwtools.normalize_biber_features(str(raw1))
                    ttwtools.normalize_biber_features(str(raw2))
                else:
                    ttwtools.normalize_mfte_features(str(raw1))
                    ttwtools.normalize_mfte_features(str(raw2))
                    
                norm1 = tmp / f"{c1_folder.name}_{tag_suffix}_norm1000.csv"
                norm2 = tmp / f"{c2_folder.name}_{tag_suffix}_norm1000.csv"

                # ── KFA ─────────────────────────────────────────────────────────
                _upd("kfa", "Calculando Key Feature Analysis…")
                kfa_df = ttwtools.kfa(
                    str(norm1), str(norm2),
                    min_effect_size=req.min_effect,
                    join=req.join,
                )

                # ── Salvar .ttwa ─────────────────────────────────────────────────
                _upd("saving", f"Salvando {out_ttwa.name}…")
                from ttwtools.project import TTWAProject, TTWA_MODE_FULL, TTWA_MODE_COMPACT
                mode = TTWA_MODE_FULL if req.mode == "full" else TTWA_MODE_COMPACT
                
                proj = TTWAProject.create(out_ttwa, name=f"{req.corpus1_name} vs {req.corpus2_name}", overwrite=req.overwrite)
                proj.set_meta("project_mode", mode)
                
                tagged1 = tmp / f"{c1_folder.name}_tagged"
                tagged2 = tmp / f"{c2_folder.name}_tagged"
                
                for cname, raw_csv, norm_csv, folder, tagged_folder in [
                    (req.corpus1_name, raw1, norm1, c1_folder, tagged1),
                    (req.corpus2_name, raw2, norm2, c2_folder, tagged2),
                ]:
                    if req.mode == "full" and folder:
                        proj.add_corpus_folder(cname, folder)
                    if tagged_folder.exists():
                        proj.save_tagged_folder(cname, tagged_folder, glob="*.jsonl")
                    proj.save_feature_table_from_csv(cname, raw_csv, "rawcount", tagger_type=req.tagger)
                    proj.save_feature_table_from_csv(cname, norm_csv, "norm1000", tagger_type=req.tagger)
                
                if kfa_df is not None:
                    proj.save_kfa_result(
                        req.corpus1_name,
                        req.corpus2_name,
                        kfa_df,
                        min_effect=req.min_effect,
                        join_method=req.join,
                    )
                
                n_features = len(kfa_df)
                proj.close()
        finally:
            sys.stderr = old_stderr

        # Marca projeto como aberto
        app_state.current_project_path = str(out_ttwa)

        _jobs[job_id].update({
            "status": "done",
            "step": "done",
            "message": f"{n_features} features  |  {out_ttwa.name}",
            "ttwa_path": str(out_ttwa),
        })

    except Exception as exc:
        _jobs[job_id].update({
            "status": "error",
            "step": "error",
            "message": str(exc),
            "error": str(exc),
        })
