"""
routes/project.py — Gerenciamento de arquivos .ttwa (abrir, criar, resumo, exportar).
"""

from __future__ import annotations

import threading
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app import state as app_state

router = APIRouter()

# Job registries
from app import jobs as _jobs_registry

# Registro único de tarefas (app/jobs.py); as rotas de status abaixo leem o mesmo dicionário
_upgrade_jobs: dict[str, dict] = _jobs_registry.JOBS
_open_jobs:    dict[str, dict] = _jobs_registry.JOBS
_saveas_jobs:  dict[str, dict] = _jobs_registry.JOBS


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
    'corpora/CorpusA/file.txt', 'tagged/mfte/CorpusA/file.jsonl',
    'tables/Corpus_mfte_rawcount.csv', 'kfa/kfa_A_vs_B_d0.2_union_mfte.csv'
    If items is empty or None, exports everything.
    """
    items: list[str] | None = None
    dest_folder: str | None = None


class UpgradeRequest(BaseModel):
    compress: bool = True


class SaveAsRequest(BaseModel):
    path: str
    format: str  # 'ttwt' | 'ttwa'


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
    """Abre um arquivo .ttwa (direto) ou .ttwt (inicia descompressão em background)."""
    p = Path(req.path).resolve()
    if not p.exists():
        raise HTTPException(status_code=404, detail=f"Arquivo não encontrado: {p}")

    if p.suffix.lower() == ".ttwt":
        # Decompression is slow — run in background and return a job_id
        job_id = _jobs_registry.new("open_ttwt")
        _open_jobs[job_id].update({
            "status": "running",
            "done": 0,
            "total": 0,
            "message": "Iniciando descompressão…",
            "result": None,
            "error": None,
        })
        threading.Thread(
            target=_run_open_ttwt,
            args=(job_id, str(p)),
            daemon=True,
        ).start()
        return {"status": "decompressing", "job_id": job_id}

    # .ttwa — open immediately
    _cleanup_temp_ttwt()
    from ttwtools.project import TTWAProject, SCHEMA_VERSION_LEGACY
    app_state.current_project_path = str(p)
    app_state.source_ttwt_path = None
    with TTWAProject.open(p) as proj:
        schema_v = proj.get_meta("schema_version", SCHEMA_VERSION_LEGACY)
    return {"status": "opened", "path": str(p), "schema_version": schema_v}


@router.get("/open-status/{job_id}")
def open_status(job_id: str):
    """Status de um job de abertura de .ttwt."""
    job = _open_jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job não encontrado.")
    return job


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
    """Retorna o caminho do projeto aberto e o caminho de exibição (original .ttwt ou .ttwa)."""
    display = app_state.source_ttwt_path or app_state.current_project_path
    return {"path": app_state.current_project_path, "display_path": display}


@router.get("/pending-open")
def pending_open():
    """Retorna e limpa um arquivo pendente de abertura (via Apple Event ou --open para .ttwt).

    O frontend consulta este endpoint na inicialização e no evento 'focus' da janela.
    Se retornar {"path": null}, não há nada pendente.
    """
    path = app_state.pending_open_path
    app_state.pending_open_path = None   # consume it
    return {"path": path}


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

            for entry in proj.list_tagged_entries(cname):
                fn = entry["filename"]
                tagger = entry["tagger_type"]
                items.append({
                    "category": "tagged",
                    "corpus": cname,
                    "tagger_type": tagger,
                    "filename": fn,
                    "path": f"tagged/{tagger}/{cname}/{fn}",
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
                f"_d{kfa['min_effect']}_{kfa['join_method']}_{kfa['tagger_type']}.csv"
            )
            items.append({
                "category": "kfa",
                "corpus1": kfa["corpus1_name"],
                "corpus2": kfa["corpus2_name"],
                "min_effect": kfa["min_effect"],
                "join_method": kfa["join_method"],
                "tagger_type": kfa["tagger_type"],
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
            rows = [{"filename": f, "content": proj.get_corpus_file(cname, f)}
                    for f in proj.list_corpus_files(cname)]           # funciona também no .ttwl
            for row in rows:
                if row["content"] is None:
                    continue
                path_key = f"corpora/{cname}/{row['filename']}"
                if selected is not None and path_key not in selected:
                    continue
                out = dest / "corpora" / cname
                out.mkdir(parents=True, exist_ok=True)
                (out / row["filename"]).write_text(row["content"], encoding="utf-8")
                counts["corpora"] += 1

            rows = proj._con.execute(
                "SELECT filename, tagger_type FROM tagged_files WHERE corpus_name = ?",
                (cname,),
            ).fetchall()
            for row in rows:
                path_key = f"tagged/{row['tagger_type']}/{cname}/{row['filename']}"
                if selected is not None and path_key not in selected:
                    continue
                content = proj.get_tagged_file(cname, row["filename"], tagger_type=row["tagger_type"])
                if content is None:
                    continue
                out = dest / "tagged" / row["tagger_type"] / cname
                out.mkdir(parents=True, exist_ok=True)
                (out / row["filename"]).write_text(content, encoding="utf-8")
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
                f"_d{kfa['min_effect']}_{kfa['join_method']}_{kfa['tagger_type']}.csv"
            )
            path_key = f"kfa/{csv_name}"
            if selected is not None and path_key not in selected:
                continue
            df = proj.load_kfa_result(
                kfa["corpus1_name"], kfa["corpus2_name"],
                min_effect=kfa["min_effect"], join_method=kfa["join_method"],
                tagger_type=kfa["tagger_type"],
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
# Save as
# ---------------------------------------------------------------------------

@router.post("/saveas")
def saveas_project(req: SaveAsRequest):
    """Inicia exportação do projeto atual para um novo arquivo (.ttwa ou .ttwt)."""
    _require_project()
    if req.format not in ("ttwt", "ttwa"):
        raise HTTPException(status_code=400, detail="Formato inválido. Use 'ttwt' ou 'ttwa'.")
    job_id = _jobs_registry.new("saveas")
    _saveas_jobs[job_id].update({
        "status": "running",
        "done": 0,
        "total": 0,
        "message": "Iniciando…",
        "result": None,
        "error": None,
    })
    threading.Thread(
        target=_run_saveas,
        args=(job_id, app_state.current_project_path, req.path, req.format),
        daemon=True,
    ).start()
    return {"job_id": job_id}


@router.get("/saveas-status/{job_id}")
def saveas_status(job_id: str):
    """Status de um job de save-as."""
    job = _saveas_jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job não encontrado.")
    return job


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _require_project():
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto. Use /api/project/open primeiro.")


def _cleanup_temp_ttwt() -> None:
    """Apaga o .ttwa temporário criado ao abrir um .ttwt, se houver."""
    if app_state.source_ttwt_path and app_state.current_project_path:
        try:
            Path(app_state.current_project_path).unlink(missing_ok=True)
        except Exception:
            pass
    app_state.source_ttwt_path = None


# ---------------------------------------------------------------------------
# Upgrade endpoints (v0.1 → v0.2)
# ---------------------------------------------------------------------------

@router.post("/upgrade")
def upgrade_project(req: UpgradeRequest):
    """Inicia a migração do projeto aberto para o formato v0.2 em background."""
    _require_project()
    job_id = _jobs_registry.new("upgrade")
    _upgrade_jobs[job_id].update({
        "status": "running",
        "done": 0,
        "total": 0,
        "message": "Iniciando migração…",
        "result": None,
        "error": None,
    })
    threading.Thread(
        target=_run_upgrade,
        args=(job_id, app_state.current_project_path, req.compress),
        daemon=True,
    ).start()
    return {"job_id": job_id}


@router.get("/upgrade/status/{job_id}")
def upgrade_status(job_id: str):
    """Retorna o status de um job de migração."""
    job = _upgrade_jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job não encontrado.")
    return job


def _run_upgrade(job_id: str, project_path: str, compress: bool) -> None:
    from ttwtools.project import TTWAProject

    def _progress(done: int, total: int, message: str):
        _upgrade_jobs[job_id].update({"done": done, "total": total, "message": message})

    try:
        with TTWAProject.open(project_path) as proj:
            result = proj.upgrade_to_v2(compress=compress, progress_cb=_progress)
        _upgrade_jobs[job_id].update({
            "status": "done",
            "done": result.get("rows_converted", 0),
            "total": result.get("rows_converted", 0),
            "message": "Migração concluída.",
            "result": result,
        })
    except Exception as exc:
        _upgrade_jobs[job_id].update({
            "status": "error",
            "error": str(exc),
            "message": str(exc),
        })


def _run_open_ttwt(job_id: str, source_ttwt: str) -> None:
    """Descomprime .ttwt para .ttwa temporário e define como projeto atual."""
    import os
    import tempfile
    from ttwtools.project import TTWAProject, SCHEMA_VERSION_LEGACY, decompress_from_ttwt

    def _progress(done: int, total: int):
        mb_done  = done  // (1024 * 1024)
        mb_total = total // (1024 * 1024)
        _open_jobs[job_id].update({
            "done": done, "total": total,
            "message": f"Descomprimindo… {mb_done} MB / {mb_total} MB",
        })

    try:
        fd, tmp_path = tempfile.mkstemp(suffix=".ttwa", prefix="ttwt_")
        os.close(fd)
        decompress_from_ttwt(source_ttwt, tmp_path, progress_cb=_progress)

        _cleanup_temp_ttwt()

        with TTWAProject.open(tmp_path) as proj:
            schema_v = proj.get_meta("schema_version", SCHEMA_VERSION_LEGACY)

        app_state.current_project_path = tmp_path
        app_state.source_ttwt_path = source_ttwt

        _open_jobs[job_id].update({
            "status": "done",
            "message": "Pronto!",
            "result": {
                "path": source_ttwt,
                "schema_version": schema_v,
                "ttwt_size": os.path.getsize(source_ttwt),
                "ttwa_size": os.path.getsize(tmp_path),
            },
        })
    except Exception as exc:
        _open_jobs[job_id].update({
            "status": "error",
            "error": str(exc),
            "message": str(exc),
        })


def _run_saveas(job_id: str, source: str, dest: str, fmt: str) -> None:
    """Copia/comprime o projeto para um novo arquivo."""
    import os
    from ttwtools.project import compress_to_ttwt

    def _progress(done: int, total: int):
        label = "Comprimindo" if fmt == "ttwt" else "Copiando"
        mb_done  = done  // (1024 * 1024)
        mb_total = total // (1024 * 1024)
        _saveas_jobs[job_id].update({
            "done": done, "total": total,
            "message": f"{label}… {mb_done} MB / {mb_total} MB",
        })

    try:
        Path(dest).parent.mkdir(parents=True, exist_ok=True)
        if fmt == "ttwt":
            compress_to_ttwt(source, dest, progress_cb=_progress)
        else:  # 'ttwa' — copy in chunks
            total = os.path.getsize(source)
            done = 0
            with open(source, "rb") as src, open(dest, "wb") as out:
                while True:
                    chunk = src.read(65536)
                    if not chunk:
                        break
                    out.write(chunk)
                    done += len(chunk)
                    _progress(done, total)

        _saveas_jobs[job_id].update({
            "status": "done",
            "message": "Salvo com sucesso.",
            "result": {"path": dest, "size": os.path.getsize(dest)},
        })
    except Exception as exc:
        _saveas_jobs[job_id].update({
            "status": "error",
            "error": str(exc),
            "message": str(exc),
        })
