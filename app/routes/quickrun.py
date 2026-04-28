"""
routes/quickrun.py — Pipeline completo a partir de duas pastas de corpus.

POST /api/quickrun/start
    Inicia em background: tagging → normalização → KFA → salva .ttwa
GET  /api/quickrun/status/{job_id}
    Polled pelo frontend para progresso em tempo real
"""

from __future__ import annotations

import tempfile
import threading
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

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
    min_effect: float = 0.0   # ignorado: análise sempre salva todos os d
    usenlp: bool = False
    n_processes: int = 4
    overwrite: bool = True
    taggers: list[str] = Field(default_factory=lambda: ["biberplus"])


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/start")
def quickrun_start(req: QuickRunRequest, background_tasks: BackgroundTasks):
    """Inicia o pipeline completo em background. Retorna job_id para polling."""
    # Avoid accidental double-start from UI (double click / stale retries).
    if any(j.get("status") in {"queued", "running"} for j in _jobs.values()):
        raise HTTPException(status_code=409, detail="Ja existe um pipeline em execucao.")

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": "queued", "step": "queued", "message": "Na fila...", "error": None, "ttwa_path": None}
    # Use an explicit daemon thread to avoid BackgroundTasks stalls in frozen app builds.
    threading.Thread(target=_run_pipeline, args=(job_id, req), daemon=True).start()
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
    def _upd(step: str, msg: str = ""):
        _jobs[job_id].update({"status": "running", "step": step, "message": msg})

    try:
        _upd("queued", "Inicializando pipeline...")

        import ttwtools
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
            from ttwtools.project import TTWAProject, TTWA_MODE_FULL, TTWA_MODE_COMPACT
            mode = TTWA_MODE_FULL if req.mode == "full" else TTWA_MODE_COMPACT

            proj = TTWAProject.create(out_ttwa, name=f"{req.corpus1_name} vs {req.corpus2_name}", overwrite=req.overwrite)
            proj.set_meta("project_mode", mode)

            if req.mode == "full":
                if c1_folder.is_dir():
                    proj.add_corpus_folder(req.corpus1_name, c1_folder)
                if c2_folder.is_dir():
                    proj.add_corpus_folder(req.corpus2_name, c2_folder)

            total_features = 0

            # Be defensive with incoming payloads (e.g., stale frontend sending
            # an empty selection): always run at least one valid tagger.
            allowed_taggers = {"biberplus", "stanza", "mfte", "mfte_ext"}
            selected_taggers: list[str] = []
            for tagger in (req.taggers or []):
                normalized = str(tagger).strip().lower().replace("-", "_")
                if normalized in allowed_taggers and normalized not in selected_taggers:
                    selected_taggers.append(normalized)
            if not selected_taggers:
                selected_taggers = ["biberplus"]
                _upd("tagging", "Nenhum tagger valido selecionado; usando biberplus.")

            for current_tagger in selected_taggers:
                with tempfile.TemporaryDirectory() as tmpdir:
                    tmp = Path(tmpdir)
                    # ── Tagging corpus 1 ────────────────────────────────────────────
                    _upd("tagging", f"[{current_tagger}] Tagueando {req.corpus1_name}…")
                    if current_tagger in ("biberplus", "stanza"):
                        ttwtools.biberplus(
                            folder_path_str=str(c1_folder),
                            configdict={"n_processes": req.n_processes, "function_words": False},
                            usenlp=(req.usenlp or current_tagger == "stanza") or None,
                            save_tagged=True,
                            output_dir=str(tmp),
                        )
                    else:
                        ttwtools.mfte(
                            folder_path_str=str(c1_folder),
                            output_dir=str(tmp),
                            save_tagged=True,
                            use_gpu=False,
                            extended=(current_tagger == "mfte_ext"),
                        )

                    # ── Tagging corpus 2 ────────────────────────────────────────────
                    _upd("tagging", f"[{current_tagger}] Tagueando {req.corpus2_name}…")
                    if current_tagger in ("biberplus", "stanza"):
                        ttwtools.biberplus(
                            folder_path_str=str(c2_folder),
                            configdict={"n_processes": req.n_processes, "function_words": False},
                            usenlp=(req.usenlp or current_tagger == "stanza") or None,
                            save_tagged=True,
                            output_dir=str(tmp),
                        )
                    else:
                        ttwtools.mfte(
                            folder_path_str=str(c2_folder),
                            output_dir=str(tmp),
                            save_tagged=True,
                            use_gpu=False,
                            extended=(current_tagger == "mfte_ext"),
                        )

                    # ── Normalização ────────────────────────────────────────────────
                    _upd("normalizing", f"[{current_tagger}] Normalizando features…")
                    tag_suffix = "biberfeatures" if current_tagger in ("biberplus", "stanza") else "mfte"

                    raw1 = tmp / f"{c1_folder.name}_{tag_suffix}_rawcount.csv"
                    raw2 = tmp / f"{c2_folder.name}_{tag_suffix}_rawcount.csv"

                    if current_tagger in ("biberplus", "stanza"):
                        ttwtools.normalize_biber_features(str(raw1))
                        ttwtools.normalize_biber_features(str(raw2))
                    else:
                        ttwtools.normalize_mfte_features(str(raw1))
                        ttwtools.normalize_mfte_features(str(raw2))

                    norm1 = tmp / f"{c1_folder.name}_{tag_suffix}_norm1000.csv"
                    norm2 = tmp / f"{c2_folder.name}_{tag_suffix}_norm1000.csv"

                    # ── KFA ─────────────────────────────────────────────────────────
                    _upd("kfa", f"[{current_tagger}] Calculando Key Feature Analysis…")
                    kfa_df = ttwtools.kfa(
                        str(norm1), str(norm2),
                        min_effect_size=0.0,   # sempre salva todos os d
                        join=req.join,
                    )

                    # ── Salvar no Projeto ─────────────────────────────────────────────────
                    _upd("saving", f"[{current_tagger}] Salvando dados no projeto…")

                    tagged1 = tmp / f"{c1_folder.name}_tagged"
                    tagged2 = tmp / f"{c2_folder.name}_tagged"
                    
                    for cname, raw_csv, norm_csv, folder, tagged_folder in [
                        (req.corpus1_name, raw1, norm1, c1_folder, tagged1),
                        (req.corpus2_name, raw2, norm2, c2_folder, tagged2),
                    ]:
                        # add_corpus_folder was moved outside this loop
                        if tagged_folder.exists():
                            proj.save_tagged_folder(cname, tagged_folder, glob="*.jsonl", tagger_type=current_tagger)
                        proj.save_feature_table_from_csv(cname, raw_csv, "rawcount", tagger_type=current_tagger)
                        proj.save_feature_table_from_csv(cname, norm_csv, "norm1000", tagger_type=current_tagger)

                    if kfa_df is not None:
                        proj.save_kfa_result(
                            req.corpus1_name,
                            req.corpus2_name,
                            kfa_df,
                            min_effect=0.0,    # sempre salva todos os d
                            join_method=req.join,
                            tagger_type=current_tagger,
                        )
                        total_features += len(kfa_df)

            proj.close()

        finally:
            sys.stderr = old_stderr

        # Marca projeto como aberto
        app_state.current_project_path = str(out_ttwa)

        _jobs[job_id].update({
            "status": "done",
            "step": "done",
            "message": f"{total_features} features  |  {out_ttwa.name}",
            "ttwa_path": str(out_ttwa),
        })

    except Exception as exc:
        _jobs[job_id].update({
            "status": "error",
            "step": "error",
            "message": str(exc),
            "error": str(exc),
        })
