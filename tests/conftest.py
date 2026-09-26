import shutil
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import state as app_state
from app.server import build_app

ROOT = Path(__file__).resolve().parent.parent
V2_FIXTURE = ROOT / "libs" / "ttwtools" / "tests" / "data" / "v2_small.ttwa"
CORPORA = ROOT / "libs" / "ttwtools" / "examples" / "test_corpora"


@pytest.fixture
def client():
    app_state.current_project_path = None
    yield TestClient(build_app())
    app_state.current_project_path = None


@pytest.fixture
def v2_project(tmp_path):
    dest = tmp_path / "v2.ttwa"
    shutil.copy(V2_FIXTURE, dest)
    return dest


def wait_job(client, job_id, timeout=120):
    deadline = time.time() + timeout
    while time.time() < deadline:
        job = client.get(f"/api/jobs/{job_id}").json()
        if job["status"] not in ("queued", "running"):
            return job
        time.sleep(0.05)
    raise TimeoutError(job_id)
