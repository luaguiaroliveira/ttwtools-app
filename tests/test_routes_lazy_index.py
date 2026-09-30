"""Arquivo salvo sem tabelas de busca (TCL2): abrir e usar as telas não monta o índice de busca."""

import shutil

import ttwtools
from ttwtools import storage
from ttwtools.project import save_project_as

from .conftest import V2_FIXTURE, wait_job


def test_open_and_screens_do_not_build_the_index(client, tmp_path, monkeypatch):
    monkeypatch.setenv("TTWTOOLS_CACHE_DIR", str(tmp_path / "cache"))
    full = tmp_path / "full.ttwa"
    shutil.copy(V2_FIXTURE, full)
    with ttwtools.open_project(full) as p:
        p._con.commit()
        lean = save_project_as(p.path, tmp_path / "lean.ttwa", search_tables=False, compress=False)
        corpus = p.list_corpus_names()[0]
        other = p.list_corpus_names()[1]
        filename = p.list_documents()[0]["filename"]
        tool = p.list_layers(corpus)[0]["tool"]
    assert client.post("/api/project/open", json={"path": str(lean)}).json()["status"] == "opened"
    built = lambda: list(storage.cache_dir().glob("idx-*"))
    gets = [("/api/corpora", {}), (f"/api/corpora/{corpus}/layers", {}), (f"/api/corpora/{corpus}/text/{filename}", {"layer": tool}),
            (f"/api/corpora/{corpus}/tag-counts", {"layer": tool, "field": "upos"}),
            ("/api/explore/search", {"corpus": corpus, "query": "the"}), ("/api/explore/kwic", {"corpus": corpus, "query": "the"}),
            ("/api/explore/frequency", {"corpus": corpus, "unit": "lemma"}),
            ("/api/explore/collocates", {"corpus": corpus, "node": "the"}),
            ("/api/explore/dispersion", {"corpus": corpus, "query": "the"}),
            ("/api/compare/feature", {"corpus": corpus, "layer": tool, "name": "NN"})]
    for url, params in gets:
        assert client.get(url, params=params).status_code == 200, url
        assert not built(), url
    for path, body in (("/api/compare/keywords", {"corpus": corpus, "reference": other, "unit": "lemma"}),
                       ("/api/compare/bands", {"corpus": corpus, "reference": other}),
                       ("/api/compare/kfa", {"corpus1": corpus, "corpus2": other, "layer": tool})):
        job = wait_job(client, client.post(path + "?async=1", json=body).json()["job_id"])
        assert job["status"] == "done", (path, job.get("error"))
        assert not built(), path
