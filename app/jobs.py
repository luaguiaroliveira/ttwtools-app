"""
jobs.py — Tarefas em segundo plano do servidor (um registro só para todas).

    job_id = jobs.start("tagging", minha_funcao, arg1, arg2)
    # dentro de minha_funcao(job, arg1, arg2):
    #     job.progress(3, 10, "documento 3")   # levanta JobCancelled se pediram cancelar
    #     return resultado                     # vai para job["result"]

Cada tarefa é um dicionário em JOBS: id, kind, status (queued, running, done,
error, cancelled), done/total/message, result, error, created_at, finished_at.
As rotas antigas (/api/tagging/status, /api/project/...-status)
leem o mesmo dicionário, então continuam iguais; /api/jobs lista e cancela todas.
"""

from __future__ import annotations

import threading
import time
import traceback
import uuid
from typing import Any, Callable

JOBS: dict[str, dict[str, Any]] = {}
_LOCK = threading.Lock()
MAX_FINISHED = 200


class JobCancelled(Exception):
    """Levantada por Job.progress quando a tarefa foi cancelada."""


class Job:
    def __init__(self, job_id: str):
        self.id = job_id

    @property
    def data(self) -> dict:
        return JOBS[self.id]

    def update(self, **fields) -> None:
        JOBS[self.id].update(fields)

    def progress(self, done: int | None = None, total: int | None = None, message: str | None = None) -> None:
        fields = {k: v for k, v in (("done", done), ("total", total), ("message", message)) if v is not None}
        JOBS[self.id].update(fields)
        if JOBS[self.id].get("cancel_requested"):
            raise JobCancelled()

    @property
    def cancelled(self) -> bool:
        return bool(JOBS[self.id].get("cancel_requested"))


def new(kind: str, **fields) -> str:
    """Registra uma tarefa (para rotas que controlam a própria thread)."""
    job_id = str(uuid.uuid4())
    with _LOCK:
        _prune()
        JOBS[job_id] = {"id": job_id, "kind": kind, "status": "queued", "created_at": time.time(), **fields}
    return job_id


def error_fields(exc: BaseException) -> dict:
    """`error_code` e `error_params` quando o erro tem código estável (ex.: InsufficientDiskSpace):
    a tela traduz por eles em vez de mostrar o texto em português."""
    code = getattr(exc, "code", None)
    return {"error_code": code, "error_params": getattr(exc, "params", {})} if isinstance(code, str) else {}


def start(kind: str, fn: Callable[..., Any], *args, **fields) -> str:
    """Cria a tarefa e roda `fn(job, *args)` numa thread daemon."""
    job_id = new(kind, **fields)

    def run():
        job = Job(job_id)
        job.update(status="running", started_at=time.time())
        try:
            result = fn(job, *args)
            job.update(status="done", result=result)
        except JobCancelled:
            job.update(status="cancelled")
        except Exception as exc:  # noqa: BLE001 — erro vira estado da tarefa
            job.update(status="error", error=f"{type(exc).__name__}: {exc}", traceback=traceback.format_exc(),
                       **error_fields(exc))
        finally:
            job.update(finished_at=time.time())

    threading.Thread(target=run, daemon=True, name=f"job-{kind}-{job_id[:8]}").start()
    return job_id


def get(job_id: str) -> dict | None:
    job = JOBS.get(job_id)
    return {k: v for k, v in job.items() if k != "traceback"} if job else None


def list_jobs(kind: str | None = None, active_only: bool = False) -> list[dict]:
    out = [get(j) for j, d in list(JOBS.items()) if (kind is None or d.get("kind") == kind)]
    if active_only:
        out = [j for j in out if j["status"] in ("queued", "running")]
    return sorted(out, key=lambda j: j.get("created_at", 0), reverse=True)


def is_busy(kind: str) -> bool:
    return any(d.get("kind") == kind and d.get("status") in ("queued", "running") for d in JOBS.values())


def cancel(job_id: str) -> bool:
    """Pede o cancelamento; a tarefa para na próxima chamada de progress()."""
    job = JOBS.get(job_id)
    if not job or job.get("status") not in ("queued", "running"):
        return False
    job["cancel_requested"] = True
    return True


def _prune() -> None:
    finished = [j for j, d in JOBS.items() if d.get("status") in ("done", "error", "cancelled")]
    for j in sorted(finished, key=lambda j: JOBS[j].get("created_at", 0))[:-MAX_FINISHED or None]:
        JOBS.pop(j, None)
