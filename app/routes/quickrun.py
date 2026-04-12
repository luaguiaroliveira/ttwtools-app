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

        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)

            # ── Tagging corpus 1 ────────────────────────────────────────────
            _upd("tagging", f"Tagueando {req.corpus1_name}…")
            ttwtools.biberplus(
                folder_path_str=str(c1_folder),
                configdict={"n_processes": req.n_processes, "function_words": False},
                usenlp=req.usenlp or None,
                save_tagged=True,
                output_dir=str(tmp),
            )

            # ── Tagging corpus 2 ────────────────────────────────────────────
            _upd("tagging", f"Tagueando {req.corpus2_name}…")
            ttwtools.biberplus(
                folder_path_str=str(c2_folder),
                configdict={"n_processes": req.n_processes, "function_words": False},
                usenlp=req.usenlp or None,
                save_tagged=True,
                output_dir=str(tmp),
            )

            # ── Normalização ────────────────────────────────────────────────
            _upd("normalizing", "Normalizando features…")
            raw1 = tmp / f"{req.corpus1_name}_biberfeatures_rawcount.csv"
            raw2 = tmp / f"{req.corpus2_name}_biberfeatures_rawcount.csv"
            ttwtools.normalize_biber_features(str(raw1))
            ttwtools.normalize_biber_features(str(raw2))
            norm1 = tmp / f"{req.corpus1_name}_biberfeatures_norm1000.csv"
            norm2 = tmp / f"{req.corpus2_name}_biberfeatures_norm1000.csv"

            # ── KFA ─────────────────────────────────────────────────────────
            _upd("kfa", "Calculando Key Feature Analysis…")
            kfa_df = ttwtools.kfa(
                str(norm1), str(norm2),
                min_effect_size=req.min_effect,
                join=req.join,
            )

            # ── Salvar .ttwa ─────────────────────────────────────────────────
            _upd("saving", f"Salvando {out_ttwa.name}…")
            tagged1 = tmp / f"{req.corpus1_name}_tagged"
            tagged2 = tmp / f"{req.corpus2_name}_tagged"

            proj = save_analysis_to_project(
                project_path=out_ttwa,
                corpus1_name=req.corpus1_name,
                corpus1_rawcount_csv=raw1,
                corpus1_norm1000_csv=norm1,
                corpus2_name=req.corpus2_name,
                corpus2_rawcount_csv=raw2,
                corpus2_norm1000_csv=norm2,
                kfa_results_df=kfa_df,
                corpus1_folder=c1_folder if req.mode == "full" else None,
                corpus2_folder=c2_folder if req.mode == "full" else None,
                corpus1_tagged_folder=tagged1 if tagged1.exists() else None,
                corpus2_tagged_folder=tagged2 if tagged2.exists() else None,
                project_name=f"{req.corpus1_name} vs {req.corpus2_name}",
                overwrite=req.overwrite,
                kfa_min_effect=req.min_effect,
                kfa_join_method=req.join,
                include_originals=(req.mode == "full"),
            )
            n_features = len(kfa_df)
            proj.close()

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
