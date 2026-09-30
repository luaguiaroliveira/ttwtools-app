"""Comparar como tarefa (?async=1): mesmo resultado da rota síncrona, com andamento; KFA reaproveitada."""

import shutil
import warnings
from pathlib import Path

import ttwtools

from .conftest import wait_job

V2 = Path(__file__).resolve().parent.parent / "libs" / "ttwtools" / "tests" / "data" / "v2_small.ttwa"
A, B = "CorIFAessaysNE_5", "essays_bawe_somentetexto_5"
BODY = {"corpus1": A, "corpus2": B, "layer": "spacy"}


def _open(client, tmp_path):
    path = tmp_path / "p.ttwa"
    shutil.copy(V2, path)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        r = client.post("/api/project/open", json={"path": str(path)})
        wait_job(client, r.json()["job_id"])
    return path


def _n_kfa(path):
    with ttwtools.open_project(path) as p:
        return len(p.list_analyses("kfa"))


def test_kfa_async_matches_sync_and_reports_progress(client, tmp_path):
    path = _open(client, tmp_path)
    sync = client.post("/api/compare/kfa", json=BODY).json()
    started = client.post("/api/compare/kfa?async=1", json={**BODY, "metric": "kfa2"}).json()     # outro pedido: não é cache
    job = wait_job(client, started["job_id"])
    assert job["status"] == "done" and job["kind"] == "kfa" and job["total"] == 10 and job["done"] == 10
    assert job["stage"] == "kfa_calc" and job["result"]["metric"] == "kfa2" and job["result"]["rows"]
    again = wait_job(client, client.post("/api/compare/kfa?async=1", json=BODY).json()["job_id"])["result"]
    assert again["rows"] == sync["rows"] and again["cached"] is True and "cached" not in sync


def test_kfa_repeated_request_reuses_saved_result_until_layers_change(client, tmp_path):
    path = _open(client, tmp_path)
    first = client.post("/api/compare/kfa", json=BODY).json()
    second = client.post("/api/compare/kfa", json=BODY).json()
    assert "cached" not in first and second["cached"] is True and second["rows"] == first["rows"]
    assert _n_kfa(path) == 1                                   # não acumula repetições
    # uma camada nova num dos corpora (mesmo documento, outra configuração) muda as camadas escolhidas
    with ttwtools.open_project(path) as p:
        doc = p.list_documents(A)[0]
        tok = [{"word": "zzz", "lemma": "zzz", "upos": "X", "start_char": 0, "end_char": 3}]
        p.save_layer(doc["id"], "spacy", "9", "novo-modelo", {"x": 1}, tok)
        p._con.commit()
    third = client.post("/api/compare/kfa", json=BODY).json()
    assert "cached" not in third and _n_kfa(path) == 1         # recalculou e substituiu o antigo


def test_async_errors_become_job_errors_and_other_routes_accept_async(client, tmp_path):
    _open(client, tmp_path)
    bad = wait_job(client, client.post("/api/compare/kfa?async=1", json={**BODY, "layer": "nao_existe"}).json()["job_id"])
    assert bad["status"] == "error" and "ValueError" in bad["error"]
    for path, body in (("/api/compare/keywords", {"corpus": A, "reference": B, "min_freq": 3}),
                       ("/api/compare/bands", {"corpus": A, "reference": B, "bands": [100, 500]})):
        direct = client.post(path, json=body)
        job = wait_job(client, client.post(path + "?async=1", json=body).json()["job_id"])
        assert (direct.status_code == 200) == (job["status"] == "done"), (path, direct.text[:200], job.get("error"))
    sides = [{"corpus": A}, {"corpus": B}]
    v = wait_job(client, client.post("/api/compare/viz/heatmap?async=1", json={"sides": sides, "layer": "spacy"}).json()["job_id"])
    assert v["status"] == "done" and v["result"]["rows"]
