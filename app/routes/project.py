"""
routes/project.py — Gerenciamento de arquivos .ttwa (abrir, criar, resumo, exportar).
"""

from __future__ import annotations

import os
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
    compress: bool = True       # salvar compactado (padrão): trabalha numa cópia; False = banco direto


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
    format: str | None = None   # (antigo) 'ttwt' | 'ttwa'; hoje vale a extensão de `path`
    switch: bool = True         # passar a trabalhar no arquivo gravado (como "Salvar como" dos aplicativos)
    compress: bool | None = None       # None = opção lembrada no arquivo (padrão: compactado)
    search_tables: bool | None = None  # None = opção lembrada (padrão: com tabelas de busca)
    corpus: str | None = None   # .ttwc/.ttwcl: o corpus a gravar (um só)
    corpora: list[str] | None = None   # .ttwal/.ttwl/.ttwa: seleção de corpora a exportar (vazio em .ttwal = todos)


class SaveOptionsRequest(BaseModel):
    compress: bool | None = None
    search_tables: bool | None = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/create")
def create_project(req: CreateProjectRequest):
    """Cria um projeto novo. Compactado (padrão): o arquivo é gravado já compactado e o
    trabalho segue numa cópia (Salvar grava nele); compress=False: banco direto."""
    from ttwtools.project import TTWAProject, save_project_as
    dest = Path(req.path).expanduser().resolve()
    if dest.exists() and not req.overwrite:
        raise HTTPException(status_code=409, detail=f"O arquivo '{dest}' já existe.")
    try:
        if not req.compress:
            TTWAProject.create(dest, name=req.name, description=req.description, overwrite=req.overwrite).close()
            app_state.set_plain(str(dest))
        else:
            work = app_state.new_workdir(dest.name)
            TTWAProject.create(work, name=req.name or dest.stem, description=req.description).close()
            save_project_as(work, dest, compress=True)
            app_state.set_working_copy(work, str(dest))
    except FileExistsError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"status": "created", "path": str(dest), "compressed": req.compress}


class RecentRequest(BaseModel):
    path: Optional[str] = None      # vazio = esvazia a lista


@router.get("/recent")
def recent_files():
    """Arquivos abertos recentemente (mais novo primeiro)."""
    from ttwtools import recent
    return {"files": recent.listing()}


@router.post("/recent/remove")
def recent_remove(req: RecentRequest):
    from ttwtools import recent
    recent.remove(req.path) if req.path else recent.clear()
    return {"files": recent.listing()}


@router.post("/open")
def open_project(req: OpenProjectRequest):
    """Abre um arquivo .ttwa (direto) ou .ttwt (inicia descompressão em background)."""
    p = Path(req.path).expanduser().resolve()
    if not p.exists():
        raise HTTPException(status_code=404, detail=f"Arquivo não encontrado: {p}")
    from ttwtools import recent as _recent
    _recent.add(p)

    from ttwtools.project import TTWAProject, SCHEMA_VERSION_LEGACY, compression_of, needs_migration
    if compression_of(p):
        # compactado (o padrão ao salvar): descompacta numa cópia de trabalho, com progresso
        import time as _time
        job_id = _jobs_registry.new("open_compressed", status="running", started_at=_time.time(), stage="decompress",
                                    done=0, total=0, message="", result=None, error=None)
        threading.Thread(target=_run_open_compressed, args=(job_id, str(p)), daemon=True).start()
        return {"status": "decompressing", "job_id": job_id}

    # banco direto de esquema antigo: a migração pode levar minutos → tarefa com progresso.
    # O projeto só vira o "atual" no fim, para outras chamadas não migrarem em paralelo.
    if needs_migration(p):
        import time as _time
        job_id = _jobs_registry.new("open_migrate", status="running", started_at=_time.time(), done=0, total=0,
                                    stage="migrate", message="", result=None, error=None)
        threading.Thread(target=_run_open_migrate, args=(job_id, str(p)), daemon=True).start()
        return {"status": "migrating", "job_id": job_id}

    with TTWAProject.open(p) as proj:
        schema_v = proj.get_meta("schema_version", SCHEMA_VERSION_LEGACY)
    app_state.set_plain(str(p))
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
        dest = Path(req.dest_folder).expanduser().resolve()
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
    """Salvar como: grava o projeto atual em outro arquivo, compactado por padrão, e (switch)
    passa a trabalhar nele. `.ttwc`/`.ttwcl` gravam só o corpus `corpus` e `.ttwal` uma seleção
    (`corpora`; sem ela, todos), em versão leve: são exportações e não trocam de projeto.
    Tarefa; acompanhe em /api/jobs/{id}."""
    _require_project()
    from ttwtools.project import SINGLE_CORPUS_EXTENSIONS, PROJECT_EXTENSIONS, TTWAL_EXTENSION
    dest = Path(req.path).expanduser().resolve()
    if dest.suffix.lower() not in PROJECT_EXTENSIONS:
        dest = dest.with_suffix("." + (req.format or "ttwa"))
    single = dest.suffix.lower() in SINGLE_CORPUS_EXTENSIONS
    package = dest.suffix.lower() == TTWAL_EXTENSION or bool(req.corpora)   # seleção de corpora: exportação, não troca de projeto
    export = single or package
    source = app_state.current_project_path
    corpus = req.corpus
    corpora = req.corpora
    if single and not corpus:
        import ttwtools
        with ttwtools.open_project(source) as proj:
            names = proj.list_corpus_names()
        if len(names) != 1:
            raise HTTPException(status_code=422, detail="Escolha o corpus a gravar (.ttwc/.ttwcl guardam um só).")
        corpus = names[0]

    import ttwtools
    with ttwtools.open_project(source) as proj:
        opts = proj.save_options() if export else proj.set_save_options(req.compress, req.search_tables)
    compress = opts["compress"] if req.compress is None else req.compress
    tables = opts["search_tables"] if req.search_tables is None else req.search_tables
    if export and req.search_tables is None:
        tables = None            # exportações: o padrão do formato (.ttwc com tabelas; .ttwcl e .ttwal leves, sem elas)

    def work(job, source=source, dest=dest, switch=req.switch, compress=compress, tables=tables, corpus=corpus, corpora=corpora):
        from ttwtools.project import save_corpora_as, save_corpus_as, save_project_as, decompress_project_file
        job.update(stage="save")
        prog = lambda d, t: job.progress(d, t, "")  # noqa: E731
        stage = lambda d, t, m: job.update(stage=m if m in ("pack", "copy") else "save", done=d, total=t)  # noqa: E731
        if single:
            with ttwtools.open_project(source) as proj:
                save_corpus_as(proj, corpus, dest, progress_cb=prog, compress=compress, search_tables=tables, progress=stage)
            return {"path": str(dest), "size": dest.stat().st_size, "switched": False, "corpus": corpus}
        if package:
            with ttwtools.open_project(source) as proj:
                names = corpora or proj.list_corpus_names()
                save_corpora_as(proj, names, dest, progress_cb=prog, compress=compress, search_tables=tables, progress=stage)
            return {"path": str(dest), "size": dest.stat().st_size, "switched": False, "corpora": names}
        save_project_as(source, dest, progress_cb=prog, compress=compress, search_tables=tables, progress=stage)
        if switch:
            if compress or not tables:
                # passa a trabalhar numa cópia do arquivo novo (a cópia atual já tem as tabelas de busca)
                import shutil as _sh
                from ttwtools.project import checkpoint
                work_path = app_state.new_workdir(dest.name)
                checkpoint(source)
                _sh.copyfile(source, work_path)
                app_state.set_working_copy(work_path, str(dest))
            else:
                app_state.set_plain(str(dest))
        return {"path": str(dest), "size": dest.stat().st_size, "switched": switch}

    return {"job_id": _jobs_registry.start("saveas", work)}


@router.get("/save-options")
def get_save_options():
    """Como o arquivo aberto é gravado: {"compress", "search_tables"}."""
    _require_project()
    import ttwtools
    with ttwtools.open_project(app_state.current_project_path) as proj:
        return proj.save_options()


@router.post("/save-options")
def set_save_options(req: SaveOptionsRequest):
    """Muda (e lembra no arquivo) como ele é gravado; vale para Salvar, Salvar como e Salvar corpus."""
    _require_project()
    import ttwtools
    with ttwtools.open_project(app_state.current_project_path) as proj:
        opts = proj.set_save_options(req.compress, req.search_tables)
    if not app_state.source_ttwt_path and (not opts["search_tables"] or opts["compress"]):
        # banco direto que passará a ser gravado compactado/sem tabelas: precisa de Salvar
        opts["needs_save_as"] = True
    return opts


@router.get("/unsaved")
def project_unsaved():
    """Leve (sem abrir o banco): há alterações não salvas no arquivo compactado?"""
    return {"compressed": bool(app_state.source_ttwt_path), "unsaved": app_state.unsaved()}


@router.post("/save")
def save_project():
    """Salvar: arquivo compactado (o padrão) → grava a cópia de trabalho de volta nele (tarefa);
    banco direto (sem compressão) → as alterações já estão no arquivo (`autosaved`)."""
    _require_project()
    if not app_state.source_ttwt_path:
        return {"status": "autosaved", "path": app_state.current_project_path}
    source, dest = app_state.current_project_path, app_state.source_ttwt_path
    import ttwtools
    with ttwtools.open_project(source) as proj:
        opts = proj.save_options()

    def work(job, source=source, dest=dest, opts=opts):
        from ttwtools.project import save_project_as
        job.update(stage="save")
        save_project_as(source, dest, progress_cb=lambda d, t: job.progress(d, t, ""),
                        compress=opts["compress"], search_tables=opts["search_tables"],
                        progress=lambda d, t, m: job.update(stage="pack" if m == "pack" else "save", done=d, total=t))
        app_state.mark_saved()
        return {"path": dest, "size": Path(dest).stat().st_size, **opts}

    return {"status": "saving", "job_id": _jobs_registry.start("save", work)}


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
    """Apaga a cópia de trabalho atual (ver app.state.drop_working_copy)."""
    app_state.drop_working_copy()


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


def _migration_progress(job_id: str):
    """Progresso da migração v0.3 na tarefa: etapa (layers/indexes) e arquivos feitos/total."""
    def cb(done: int, total: int, stage: str):
        _open_jobs[job_id].update({"done": done, "total": total,
                                   "stage": stage if stage in ("indexes", "search", "decompress") else "migrate",
                                   "message": f"{done}/{total}"})
        if _open_jobs[job_id].get("cancel_requested"):      # a migração retoma de onde parou na próxima vez
            raise _jobs_registry.JobCancelled()
    return cb


def _run_open_migrate(job_id: str, path: str) -> None:
    """Abre um .ttwa de esquema antigo, migrando para v0.3 com progresso."""
    import warnings
    from ttwtools.project import TTWAProject, SCHEMA_VERSION_LEGACY
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            with TTWAProject.open(path, progress=_migration_progress(job_id)) as proj:
                schema_v = proj.get_meta("schema_version", SCHEMA_VERSION_LEGACY)
                report = getattr(proj, "migration_report", None)
        app_state.set_plain(path)
        _open_jobs[job_id].update({"status": "done", "stage": "done", "message": "",
                                   "result": {"path": path, "schema_version": schema_v, "migration": report}})
    except _jobs_registry.JobCancelled:
        _open_jobs[job_id].update({"status": "cancelled", "message": ""})
    except Exception as exc:  # noqa: BLE001
        _open_jobs[job_id].update({"status": "error", "error": str(exc), "message": str(exc)})


def _run_open_compressed(job_id: str, source: str) -> None:
    """Descompacta o projeto numa cópia de trabalho (migrando se for antigo) e o torna o atual."""
    import os
    import warnings
    from ttwtools.project import TTWAProject, SCHEMA_VERSION_LEGACY, decompress_project_file, register_working_copy

    def _progress(done: int, total: int):
        _open_jobs[job_id].update({"done": done, "total": total, "stage": "decompress",
                                   "message": f"{done // (1024 * 1024)} MB / {total // (1024 * 1024)} MB"})
        if _open_jobs[job_id].get("cancel_requested"):
            raise _jobs_registry.JobCancelled()

    work = app_state.new_workdir(Path(source).name)
    try:
        decompress_project_file(source, work, progress_cb=_progress)
        register_working_copy(work, source)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            with TTWAProject.open(work, progress=_migration_progress(job_id)) as proj:
                schema_v = proj.get_meta("schema_version", SCHEMA_VERSION_LEGACY)
        app_state.set_working_copy(work, source)
        _open_jobs[job_id].update({
            "status": "done", "stage": "done", "message": "",
            "result": {"path": source, "schema_version": schema_v,
                       "compressed_size": os.path.getsize(source), "size": os.path.getsize(work)},
        })
    except _jobs_registry.JobCancelled:
        register_working_copy(work, None)
        import shutil
        shutil.rmtree(Path(work).parent, ignore_errors=True)
        _open_jobs[job_id].update({"status": "cancelled", "message": ""})
    except Exception as exc:  # noqa: BLE001
        register_working_copy(work, None)
        import shutil
        shutil.rmtree(Path(work).parent, ignore_errors=True)      # a cópia parcial (GBs) não fica para trás
        _open_jobs[job_id].update({"status": "error", "error": str(exc), "message": str(exc)})