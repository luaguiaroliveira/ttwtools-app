"""Sem espaço livre: a rota responde 507 com código e valores; tarefas trazem error_code."""

import shutil
import tempfile
from collections import namedtuple
from pathlib import Path

import ttwtools
from ttwtools.project import save_project_as

from .conftest import CORPORA, wait_job

Usage = namedtuple("Usage", "total used free")


def _residue() -> set:
    return {p.name for p in Path(tempfile.gettempdir()).glob("ttw_*")}


def _full(monkeypatch):
    monkeypatch.setattr(shutil, "disk_usage", lambda _p: Usage(10**9, 10**9 - 1000, 1000))


def test_export_and_saveas_refused(client, tmp_path, monkeypatch):
    path = tmp_path / "p.ttwa"
    ttwtools.create_project(path).close()
    client.post("/api/project/open", json={"path": str(path)})
    client.post("/api/corpora/import", json={"corpus_name": "a", "source": {"kind": "folder", "path": str(CORPORA / "CorIFAessaysNE_5")}})
    residue = _residue()
    _full(monkeypatch)

    dest = tmp_path / "fora"
    r = client.post("/api/project/export", json={"dest_folder": str(dest)})
    d = r.json()["detail"]
    assert r.status_code == 507 and d["code"] == "insufficient_disk_space" and d["what"] == "export" and not dest.exists()

    out = tmp_path / "novo" / "x.ttwa"
    job = wait_job(client, client.post("/api/project/saveas", json={"path": str(out)}).json()["job_id"])
    assert job["status"] == "error" and job["error_code"] == "insufficient_disk_space"
    assert job["error_params"]["what"] == "save_as" and not out.parent.exists()
    assert _residue() == residue


def test_open_compressed_refused(client, tmp_path, monkeypatch):
    path = tmp_path / "p.ttwa"
    p = ttwtools.create_project(path)
    p._con.commit()
    packed = save_project_as(p.path, tmp_path / "p.ttwt")
    p.close()
    residue = _residue()
    _full(monkeypatch)
    r = client.post("/api/project/open", json={"path": str(packed)})
    job = wait_job(client, r.json()["job_id"])
    assert job["status"] == "error" and job["error_code"] == "insufficient_disk_space" and job["error_params"]["what"] == "open"
    assert _residue() == residue
