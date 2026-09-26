"""Rotas do passo 2.2: cada recurso do pacote tem rota; a rota só chama o pacote."""

import json
import shlex
import warnings

import pytest

from .conftest import CORPORA, wait_job


@pytest.fixture
def opened(client, tmp_path):
    import ttwtools
    path = tmp_path / "p.ttwa"
    ttwtools.create_project(path).close()
    client.post("/api/project/open", json={"path": str(path)})
    client.post("/api/corpora/import", json={"corpus_name": "bawe", "filename_fields": ["area", "resto"],
                                             "source": {"kind": "folder", "path": str(CORPORA / "essays_bawe_somentetexto_5")}})
    client.post("/api/corpora/import", json={"corpus_name": "corifa",
                                             "source": {"kind": "folder", "path": str(CORPORA / "CorIFAessaysNE_5")}})
    return path


def test_taggers(client):
    t = {x["id"]: x for x in client.get("/api/taggers?lang=en").json()["taggers"]}
    assert set(t) == {"spacy", "stanza", "mfte", "biberplus"} and isinstance(t["spacy"]["disponivel"], bool)
    opts = client.get("/api/taggers/spacy_upos/options?lang=pt").json()
    assert opts["tagger"] == "spacy" and opts["options"][0]["explicacao"].startswith("Modelo")
    assert len(client.get("/api/taggers/biberplus/tagset").json()["tags"]) == 95
    assert client.get("/api/taggers/nltk/options").status_code == 422


def test_tag_layers_job_and_overview(client, opened, spacy_model):
    r = client.post("/api/tagging/layers", json={"corpus": "bawe", "tagger": "spacy", "preset": "rapido"})
    job = wait_job(client, r.json()["job_id"])
    assert job["status"] == "done" and job["result"]["tagged"] == 5 and job["total"] == 5
    assert client.post("/api/tagging/layers", json={"corpus": "bawe", "tagger": "spacy",
                                                     "options": {"nada": 1}}).status_code == 422
    assert client.get("/api/corpora/bawe/overview?layer=spacy").status_code == 404
    job = wait_job(client, client.post("/api/corpora/bawe/overview", json={"layer": "spacy"}).json()["job_id"])
    assert job["status"] == "done" and job["result"]["text"]["documents"] == 5
    cached = client.get("/api/corpora/bawe/overview?layer=spacy").json()
    assert cached["cached"] is True and cached["layer"]["upos"]["NOUN"] > 0


def test_explore(client, opened):
    s = client.get("/api/explore/search", params={"corpus": "bawe", "query": "the", "group_by": "area"}).json()
    assert s["total"] > 100 and s["per_group"]
    k = client.get("/api/explore/kwic", params={"corpus": "bawe", "query": "the", "limit": 3, "offset": 2}).json()
    assert k["total"] == s["total"] and len(k["lines"]) == 3
    f = client.get("/api/explore/frequency", params={"corpus": "bawe", "top": 5, "hide_stopwords": True}).json()
    assert len(f["rows"]) == 5 and f["rows"][0]["item"] != "the"
    c = client.get("/api/explore/collocates", params={"corpus": "bawe", "node": "the", "min_freq": 3}).json()
    assert c["node_freq"] == s["total"] and c["rows"]
    d = client.get("/api/explore/dispersion", params={"corpus": "bawe", "query": "the"}).json()
    assert d["range"] == 5 and 0 <= d["dp"] <= 1
    w = client.get("/api/explore/search", params=[("corpus", "bawe"), ("query", "the"), ("where", "area=AH")]).json()
    assert 0 < w["total"] <= s["total"]
    assert client.get("/api/explore/search", params={"corpus": "bawe", "query": "nada=x"}).status_code == 422


def test_keywords_and_references(client, opened):
    r = client.post("/api/compare/keywords", json={"corpus": "corifa", "reference": "bawe", "min_freq": 3,
                                                    "lang": "en"}).json()
    assert r["rows"] and r["rows"][0]["direction"] == "+"
    assert any(w["code"] == "small_target" for w in r["warnings"])
    assert client.get("/api/references").json() == {"references": []}


def test_help_and_i18n(client):
    assert {t["id"] for t in client.get("/api/help?lang=pt").json()["topics"]} >= {"cohens_d", "kwic"}
    assert client.get("/api/help/cohens_d?lang=en").json()["title"] == "Cohen's d"
    assert client.get("/api/help/nada").status_code == 404
    assert client.get("/api/help/tours/primeiro_corpus?lang=pt").json()["steps"]
    assert client.get("/api/help?q=desvio&lang=pt").json()["topics"]
    msgs = client.get("/api/i18n/en").json()
    assert msgs["tagger.affects.yes"] == "changes the result"
    assert client.get("/api/i18n/fr").status_code == 422


def test_code_endpoint_matches_route(client, opened, capsys):
    params = {"corpus": "bawe", "query": "the", "context": 3, "limit": 4}
    code = client.post("/api/code", json={"analysis": "kwic", "params": params}).json()
    assert code["cli"].startswith("ttwtools kwic ") and "--context 3" in code["cli"]
    from ttwtools import cli
    assert cli.main(shlex.split(code["cli"])[1:] + ["--json"]) == 0
    via_cli = json.loads(capsys.readouterr().out)
    via_route = client.get("/api/explore/kwic", params=params).json()
    assert via_cli == via_route
    assert "ttwtools.kwic(proj, 'bawe', 'the'" in code["python"]
    assert client.post("/api/code", json={"analysis": "nada", "params": {}}).status_code == 422


def test_docs_page(client):
    assert client.get("/api/docs").status_code == 200
    paths = client.get("/openapi.json").json()["paths"]
    for p in ["/api/taggers", "/api/explore/kwic", "/api/compare/keywords", "/api/help/{topic}", "/api/code",
              "/api/jobs/{job_id}", "/api/corpora/{corpus}/overview", "/api/tagging/layers"]:
        assert p in paths, p
