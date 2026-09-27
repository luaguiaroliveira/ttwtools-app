"""routes/jobs.py — Consulta e cancelamento de tarefas em segundo plano (app/jobs.py)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app import jobs

router = APIRouter()


@router.get("")
def list_jobs(kind: str | None = None, active: bool = False):
    return {"jobs": jobs.list_jobs(kind, active_only=active)}


@router.get("/{job_id}")
def get_job(job_id: str):
    job = jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")
    return job


@router.post("/demo")
def demo_job(steps: int = 20, delay: float = 0.25):
    """Tarefa de exemplo (espera `steps` × `delay` s) para testar progresso e cancelamento."""
    import time

    def work(job, steps=min(steps, 1000), delay=min(delay, 5.0)):
        for i in range(steps):
            job.progress(i, steps, f"passo {i + 1}")
            time.sleep(delay)
        job.progress(steps, steps, "fim")
        return {"steps": steps}

    return {"job_id": jobs.start("demo", work)}


@router.post("/{job_id}/cancel")
def cancel_job(job_id: str):
    if not jobs.cancel(job_id):
        raise HTTPException(status_code=409, detail="Tarefa inexistente ou já terminada.")
    return {"status": "cancel_requested"}
