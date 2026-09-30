"""POST /api/project/compact: simulação e remoção como tarefa, sem deixar lixo temporário."""

import shutil
import tempfile
import warnings
from pathlib import Path

from .conftest import wait_job

V2 = Path(__file__).resolve().parent.parent / "libs" / "ttwtools" / "tests" / "data" / "v2_small.ttwa"


def _residue() -> set:
    return {p.name for p in Path(tempfile.gettempdir()).glob("ttw_*")}


def test_compact_route(client, tmp_path):
    import ttwtools
    path = tmp_path / "v2.ttwa"
    shutil.copy(V2, path)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        ttwtools.open_project(path).close()          # migra para o esquema atual
    assert client.post("/api/project/open", json={"path": str(path)}).status_code == 200
    residue = _residue()
    size = path.stat().st_size

    job = wait_job(client, client.post("/api/project/compact", json={}).json()["job_id"])   # simulação por padrão
    assert job["status"] == "done" and job["result"]["dry_run"] and job["result"]["n_removed"] == 30
    assert path.stat().st_size == size

    job = wait_job(client, client.post("/api/project/compact", json={"dry_run": False}).json()["job_id"])
    r = job["result"]
    assert job["status"] == "done" and r["n_removed"] == 30 and r["size_after"] < r["size_before"] and r["kept_reasons"] == {}
    with ttwtools.open_project(path) as p:
        assert p._con.execute("SELECT COUNT(*) FROM tagged_files").fetchone()[0] == 0
    assert _residue() == residue

