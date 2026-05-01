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
    tag_only: bool = False    # True = para após tagging (sem KFA)


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
    _jobs[job_id] = {
        "status": "queued", "step": "queued", "message": "Na fila...",
        "error": None, "ttwa_path": None,
        "taggers_progress": {},  # tagger_name → {status, msg}
    }
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

    def _tagger_upd(tagger: str, status: str, msg: str = ""):
        _jobs[job_id]["taggers_progress"][tagger] = {"status": status, "msg": msg}

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
            allowed_taggers = {"biberplus", "stanza", "mfte", "mfte_ext", "stanza_upos", "stanza_xpos", "spacy_upos", "spacy_ptb"}
            selected_taggers: list[str] = []
            for tagger in (req.taggers or []):
                normalized = str(tagger).strip().lower().replace("-", "_")
                if normalized in allowed_taggers and normalized not in selected_taggers:
                    selected_taggers.append(normalized)
            if not selected_taggers:
                selected_taggers = ["biberplus"]
                _upd("tagging", "Nenhum tagger valido selecionado; usando biberplus.")

            # ── Separate taggers into three groups ─────────────────────────────
            from ttwtools.taggers.stanza_pos import STANZA_BASED_TAGGERS
            from ttwtools.taggers.spacy_pos import SPACY_BASED_TAGGERS
            stanza_taggers = [t for t in selected_taggers if t in STANZA_BASED_TAGGERS]
            spacy_taggers  = [t for t in selected_taggers if t in SPACY_BASED_TAGGERS]
            biber_taggers  = [t for t in selected_taggers if t not in STANZA_BASED_TAGGERS and t not in SPACY_BASED_TAGGERS]

            # ── BiberPlus / legacy stanza taggers (each needs its own pass) ─────
            for current_tagger in biber_taggers:
                with tempfile.TemporaryDirectory() as tmpdir:
                    tmp = Path(tmpdir)
                    _tagger_upd(current_tagger, "running", f"Tagueando {req.corpus1_name} e {req.corpus2_name}…")
                    for corpus_folder, corpus_name in [
                        (c1_folder, req.corpus1_name),
                        (c2_folder, req.corpus2_name),
                    ]:
                        _upd("tagging", f"[{current_tagger}] Tagueando {corpus_name}…")
                        ttwtools.biberplus(
                            folder_path_str=str(corpus_folder),
                            configdict={"n_processes": req.n_processes, "function_words": False},
                            usenlp=(req.usenlp or current_tagger == "stanza") or None,
                            save_tagged=True,
                            output_dir=str(tmp),
                        )

                    _upd("normalizing", f"[{current_tagger}] Normalizando features…")
                    raw1 = tmp / f"{c1_folder.name}_biberfeatures_rawcount.csv"
                    raw2 = tmp / f"{c2_folder.name}_biberfeatures_rawcount.csv"
                    ttwtools.normalize_biber_features(str(raw1))
                    ttwtools.normalize_biber_features(str(raw2))
                    norm1 = tmp / f"{c1_folder.name}_biberfeatures_norm1000.csv"
                    norm2 = tmp / f"{c2_folder.name}_biberfeatures_norm1000.csv"

                    _upd("saving", f"[{current_tagger}] Salvando dados no projeto…")
                    tagged1 = tmp / f"{c1_folder.name}_tagged"
                    tagged2 = tmp / f"{c2_folder.name}_tagged"
                    for cname, raw_csv, norm_csv, tagged_folder in [
                        (req.corpus1_name, raw1, norm1, tagged1),
                        (req.corpus2_name, raw2, norm2, tagged2),
                    ]:
                        if tagged_folder.exists():
                            proj.save_tagged_folder(cname, tagged_folder, glob="*.jsonl", tagger_type=current_tagger)
                        proj.save_feature_table_from_csv(cname, raw_csv, "rawcount", tagger_type=current_tagger)
                        proj.save_feature_table_from_csv(cname, norm_csv, "norm1000", tagger_type=current_tagger)

                    if not req.tag_only:
                        _upd("kfa", f"[{current_tagger}] Calculando KFA…")
                        kfa_df = ttwtools.kfa(str(norm1), str(norm2), min_effect_size=0.0, join=req.join)
                        if kfa_df is not None:
                            proj.save_kfa_result(
                                req.corpus1_name, req.corpus2_name, kfa_df,
                                min_effect=0.0, join_method=req.join, tagger_type=current_tagger,
                            )
                            total_features += len(kfa_df)

                    _tagger_upd(current_tagger, "done", "Concluído")

            # ── Stanza-based taggers: single Stanza pass per corpus ──────────────
            if stanza_taggers:
                for t in stanza_taggers:
                    _tagger_upd(t, "running", f"Tagueando {req.corpus1_name} e {req.corpus2_name}…")
                _upd("tagging", f"[stanza combined] Tagueando {req.corpus1_name} e {req.corpus2_name} ({', '.join(stanza_taggers)})…")
                with tempfile.TemporaryDirectory() as tmpdir:
                    tmp = Path(tmpdir)

                    raw_paths: dict[str, dict[str, Path]] = {}   # corpus_name → {tagger → csv_path}
                    for corpus_folder, corpus_name in [
                        (c1_folder, req.corpus1_name),
                        (c2_folder, req.corpus2_name),
                    ]:
                        _upd("tagging", f"[stanza combined] Tagueando {corpus_name}…")
                        raw_paths[corpus_name] = ttwtools.extract_stanza_combined_features_from_folder(
                            folder_path_str=str(corpus_folder),
                            taggers=stanza_taggers,
                            output_dir=str(tmp),
                            save_tagged=True,
                            use_gpu=False,
                        )

                    # ── Normalise and KFA per tagger ────────────────────────────
                    _upd("normalizing", "[stanza combined] Normalizando features…")
                    for current_tagger in stanza_taggers:
                        raw1 = raw_paths[req.corpus1_name].get(current_tagger)
                        raw2 = raw_paths[req.corpus2_name].get(current_tagger)
                        if raw1 is None or raw2 is None:
                            print(f"  Aviso: CSV não encontrado para tagger '{current_tagger}'. Pulando KFA.")
                            continue

                        if current_tagger in ("stanza_upos", "stanza_xpos"):
                            ttwtools.normalize_stanza_pos_features(str(raw1))
                            ttwtools.normalize_stanza_pos_features(str(raw2))
                        else:
                            ttwtools.normalize_mfte_features(str(raw1))
                            ttwtools.normalize_mfte_features(str(raw2))

                        suffix = raw1.stem.replace("_rawcount", "")
                        norm1 = raw1.parent / f"{suffix}_norm1000.csv"
                        norm2 = raw2.parent / f"{raw2.stem.replace('_rawcount', '')}_norm1000.csv"

                        _upd("saving", f"[{current_tagger}] Salvando dados no projeto…")
                        tagged_dir = tmp / f"{c1_folder.name}_tagged"
                        tagged_dir2 = tmp / f"{c2_folder.name}_tagged"
                        for cname, raw_csv, norm_csv, tagged_folder in [
                            (req.corpus1_name, raw1, norm1, tagged_dir),
                            (req.corpus2_name, raw2, norm2, tagged_dir2),
                        ]:
                            if tagged_folder.exists():
                                proj.save_tagged_folder(cname, tagged_folder, glob=f"*_{current_tagger}.jsonl", tagger_type=current_tagger)
                            proj.save_feature_table_from_csv(cname, raw_csv, "rawcount", tagger_type=current_tagger)
                            proj.save_feature_table_from_csv(cname, norm_csv, "norm1000", tagger_type=current_tagger)
                        if not req.tag_only:
                            _upd("kfa", f"[{current_tagger}] Calculando KFA…")
                            kfa_df = ttwtools.kfa(str(norm1), str(norm2), min_effect_size=0.0, join=req.join)
                            if kfa_df is not None:
                                proj.save_kfa_result(
                                    req.corpus1_name, req.corpus2_name, kfa_df,
                                    min_effect=0.0, join_method=req.join, tagger_type=current_tagger,
                                )
                                total_features += len(kfa_df)
                        _tagger_upd(current_tagger, "done", "Concluído")

            # ── spaCy-based taggers: single nlp.pipe pass per corpus ────────────
            if spacy_taggers:
                for t in spacy_taggers:
                    _tagger_upd(t, "running", f"Tagueando {req.corpus1_name} e {req.corpus2_name}…")
                _upd("tagging", f"[spacy combined] Tagueando {req.corpus1_name} e {req.corpus2_name} ({', '.join(spacy_taggers)})…")
                with tempfile.TemporaryDirectory() as tmpdir:
                    tmp = Path(tmpdir)

                    raw_paths: dict[str, dict[str, Path]] = {}   # corpus_name → {tagger → csv_path}
                    for corpus_folder, corpus_name in [
                        (c1_folder, req.corpus1_name),
                        (c2_folder, req.corpus2_name),
                    ]:
                        _upd("tagging", f"[spacy combined] Tagueando {corpus_name}…")
                        raw_paths[corpus_name] = ttwtools.extract_spacy_combined_features_from_folder(
                            folder_path_str=str(corpus_folder),
                            taggers=spacy_taggers,
                            output_dir=str(tmp),
                            save_tagged=True,
                        )

                    _upd("normalizing", "[spacy combined] Normalizando features…")
                    for current_tagger in spacy_taggers:
                        raw1 = raw_paths[req.corpus1_name].get(current_tagger)
                        raw2 = raw_paths[req.corpus2_name].get(current_tagger)
                        if raw1 is None or raw2 is None:
                            print(f"  Aviso: CSV nao encontrado para tagger '{current_tagger}'. Pulando KFA.")
                            continue

                        ttwtools.normalize_spacy_pos_features(str(raw1))
                        ttwtools.normalize_spacy_pos_features(str(raw2))

                        suffix = raw1.stem.replace("_rawcount", "")
                        norm1 = raw1.parent / f"{suffix}_norm1000.csv"
                        norm2 = raw2.parent / f"{raw2.stem.replace('_rawcount', '')}_norm1000.csv"

                        _upd("kfa", f"[{current_tagger}] Calculando KFA…")
                        kfa_df = ttwtools.kfa(str(norm1), str(norm2), min_effect_size=0.0, join=req.join)

                        _upd("saving", f"[{current_tagger}] Salvando dados no projeto…")
                        tagged_dir = tmp / f"{c1_folder.name}_tagged"
                        tagged_dir2 = tmp / f"{c2_folder.name}_tagged"
                        for cname, raw_csv, norm_csv, tagged_folder in [
                            (req.corpus1_name, raw1, norm1, tagged_dir),
                            (req.corpus2_name, raw2, norm2, tagged_dir2),
                        ]:
                            if tagged_folder.exists():
                                proj.save_tagged_folder(cname, tagged_folder, glob=f"*_{current_tagger}.jsonl", tagger_type=current_tagger)
                            proj.save_feature_table_from_csv(cname, raw_csv, "rawcount", tagger_type=current_tagger)
                            proj.save_feature_table_from_csv(cname, norm_csv, "norm1000", tagger_type=current_tagger)
                        if not req.tag_only and kfa_df is not None:
                            proj.save_kfa_result(
                                req.corpus1_name, req.corpus2_name, kfa_df,
                                min_effect=0.0, join_method=req.join, tagger_type=current_tagger,
                            )
                            total_features += len(kfa_df)
                        _tagger_upd(current_tagger, "done", "Concluído")

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
