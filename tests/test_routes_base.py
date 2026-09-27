"""Rotas do passo 2.1: tarefas, saúde, projeto v2/.ttwl nas rotas antigas, fonte de corpus."""

import time
import warnings

from app import jobs

from .conftest import CORPORA, wait_job


def test_health(client):
    r = client.get("/api/health").json()
    assert r["status"] == "ok" and r["project"] is None


def test_jobs_lifecycle_and_cancel(client):
    def work(job, n):
        for i in range(n):
            job.progress(i, n, f"passo {i}")
            time.sleep(0.02)
        return {"feito": n}

    ok = jobs.start("teste", work, 3)
    assert wait_job(client, ok)["result"] == {"feito": 3}
    slow = jobs.start("teste", work, 500)
    time.sleep(0.05)
    assert client.post(f"/api/jobs/{slow}/cancel").json() == {"status": "cancel_requested"}
    assert wait_job(client, slow)["status"] == "cancelled"
    assert client.post(f"/api/jobs/{slow}/cancel").status_code == 409
    boom = jobs.start("teste", lambda job: 1 / 0)
    job = wait_job(client, boom)
    assert job["status"] == "error" and "ZeroDivisionError" in job["error"] and "traceback" not in job
    kinds = {j["kind"] for j in client.get("/api/jobs").json()["jobs"]}
    assert "teste" in kinds
    assert client.get("/api/jobs/nao-existe").status_code == 404


def test_migrated_v2_project(client, v2_project):
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        r = client.post("/api/project/open", json={"path": str(v2_project)})
    assert r.status_code == 200 and str(r.json()["schema_version"]) == "0.3"
    assert client.get("/api/corpus/list").json()["corpora"] == ["CorIFAessaysNE_5", "essays_bawe_somentetexto_5"]
    assert client.get("/api/project/summary").status_code == 200


def test_ttwl_project_in_old_routes(client, v2_project, tmp_path):
    import ttwtools
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        with ttwtools.open_project(v2_project) as full:
            full.detach_corpus(tmp_path / "leve.ttwl").close()
    assert client.post("/api/project/open", json={"path": str(tmp_path / "leve.ttwl")}).status_code == 200
    files = client.get("/api/corpus/CorIFAessaysNE_5/files").json()["files"]
    assert len(files) == 5
    text = client.get(f"/api/corpus/CorIFAessaysNE_5/file/{files[0]}")
    assert text.status_code == 200


def test_import_from_source(client, tmp_path):
    import ttwtools
    path = tmp_path / "novo.ttwa"
    ttwtools.create_project(path).close()
    assert client.post("/api/project/open", json={"path": str(path)}).status_code == 200
    r = client.post("/api/corpora/import", json={
        "corpus_name": "bawe", "source": {"kind": "folder", "path": str(CORPORA / "essays_bawe_somentetexto_5")},
        "filename_fields": ["area", "resto"]})
    assert r.status_code == 200 and r.json()["imported"] == 5 and r.json()["metadata_applied"] == 5
    r = client.post("/api/corpora/import", json={"corpus_name": "colado", "source": {"kind": "text", "text": "Olá."}})
    assert r.json()["files"] == ["texto_colado.txt"]
    assert client.post("/api/corpora/import", json={"corpus_name": "x", "source": {"kind": "catalog",
                                                                                      "catalog_id": "brown"}}).status_code == 422
    assert client.post("/api/corpora/import", json={"corpus_name": "x", "source": {"kind": "folder",
                                                                                      "path": "/nao/existe"}}).status_code == 422
    assert client.post("/api/corpora/import", json={"corpus_name": "x", "source": {"kind": "text"}}).status_code == 422


def test_import_requires_project(client):
    r = client.post("/api/corpora/import", json={"corpus_name": "x", "source": {"kind": "text", "text": "a"}})
    assert r.status_code == 400


def test_import_route_graf_and_tei_formats(client, tmp_path):
    """Passo 5.2: o assistente importa TEI e GrAF pela mesma rota (format)."""
    import ttwtools
    proj = tmp_path / "f.ttwa"
    ttwtools.create_project(proj).close()
    client.post("/api/project/open", json={"path": str(proj)})
    (tmp_path / "tei").mkdir()
    (tmp_path / "tei" / "a.xml").write_text(
        '<TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader/><text><body><p><w lemma="dog" pos="NOUN">Dogs</w> '
        '<w lemma="bark" pos="VERB">bark</w><pc>.</pc></p></body></text></TEI>')
    r = client.post("/api/corpora/import", json={"corpus_name": "t", "source": {"kind": "folder", "path": str(tmp_path / "tei"),
                                                                                "format": "tei"}})
    assert r.status_code == 200 and r.json()["with_layer"] == 1
    bad = client.post("/api/corpora/import", json={"corpus_name": "g", "source": {"kind": "folder", "path": str(tmp_path / "tei"),
                                                                                  "format": "graf"}})
    assert bad.status_code == 422
