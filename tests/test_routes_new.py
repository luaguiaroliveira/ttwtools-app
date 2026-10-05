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


def test_compare_dispersion(client, opened):
    r = client.post("/api/compare/dispersion", json={"corpus": "bawe", "reference": "corifa", "query": "the"}).json()
    assert r["target"]["corpus"] == "bawe" and r["reference"]["corpus"] == "corifa"
    assert r["target"]["range"] > 0 and 0 <= r["target"]["dp"] <= 1 and r["reference"]["range"] > 0
    d = client.get("/api/explore/dispersion", params={"corpus": "bawe", "query": "the"}).json()
    assert r["target"]["per_document"] == d["per_document"]      # mesmo cálculo do dispersion de um lado
    # dois grupos do mesmo corpus (metadado `resto` derivado do nome do arquivo)
    docs = client.get("/api/corpora/bawe/documents", params={"limit": 5}).json()["rows"]
    g1, g2 = docs[0]["resto"], docs[1]["resto"]
    g = client.post("/api/compare/dispersion", json={"corpus": "bawe", "query": "the",
                                                     "where": {"resto": [g1]}, "reference_where": {"resto": [g2]}}).json()
    assert {x["filename"] for x in g["target"]["per_document"]} == {docs[0]["filename"]}
    assert {x["filename"] for x in g["reference"]["per_document"]} == {docs[1]["filename"]}


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


def test_corpora_library_routes(client, opened, tmp_path):
    info = client.get("/api/project/info").json()
    assert info["open"] and info["kind"] == "ttwa"
    lib = {c["name"]: c for c in client.get("/api/corpora").json()["corpora"]}
    assert lib["bawe"]["documents"] == 5 and lib["bawe"]["metadata_keys"] == ["area", "resto"]
    docs = client.get("/api/corpora/bawe/documents", params={"limit": 2, "offset": 1}).json()
    assert docs["total"] == 5 and len(docs["rows"]) == 2 and "area" in docs["rows"][0]
    client.get("/api/explore/search", params={"corpus": "bawe", "query": "the"})      # cria camada simple
    assert client.get("/api/corpora/bawe/layers").json()["layers"][0]["tool"] == "simple"
    light = client.post("/api/project/convert", json={"to": "ttwl", "dest": str(tmp_path / "leve.ttwl")}).json()
    assert light["kind"] == "ttwl" and client.get("/api/project/info").json()["kind"] == "ttwl"
    assert client.get("/api/project/info").json()["corpus_status"]["ok"] == 10
    folder = client.post("/api/project/export-corpus", json={"folder": str(tmp_path / "copia")}).json()["folder"]
    assert (tmp_path / "copia" / "bawe").is_dir() and folder.endswith("copia")
    back = client.post("/api/project/convert", json={"to": "ttwa", "dest": str(tmp_path / "volta.ttwa")})
    assert back.status_code == 200 and client.get("/api/project/info").json()["kind"] == "ttwa"


def test_tagging_plan_and_availability(client, opened):
    opts = client.get("/api/taggers/spacy/options").json()
    assert "en_core_web_sm" in opts["availability"]["model"]
    plan = client.post("/api/tagging/plan", json={"corpus": "bawe", "tagger": "simple"}).json()
    assert (plan["documents"], plan["to_tag"], plan["reusable"]) == (5, 5, 0)
    assert client.post("/api/tagging/plan", json={"corpus": "bawe", "tagger": "spacy",
                                                  "options": {"model": "x"}}).status_code == 422


def test_corpus_text_route(client, opened):
    client.get("/api/explore/search", params={"corpus": "bawe", "query": "the"})
    name = client.get("/api/corpora/bawe/documents").json()["rows"][0]["filename"]
    d = client.get(f"/api/corpora/bawe/text/{name}").json()
    assert d["text"] and d["tokens"] and d["layer"]["tool"] == "simple"
    assert client.get("/api/corpora/bawe/text/nao.txt").status_code == 404


def test_kfa_routes(client, opened, spacy_model):
    for c in ("bawe", "corifa"):
        wait_job(client, client.post("/api/tagging/layers", json={"corpus": c, "tagger": "spacy", "preset": "rapido"}).json()["job_id"])
    r = client.post("/api/compare/kfa", json={"corpus1": "bawe", "corpus2": "corifa", "layer": "spacy", "feature": "upos"})
    assert r.status_code == 200 and r.json()["n1"] == 5 and r.json()["rows"][0]["Feature"]
    assert r.json()["rows"][0]["Count_Corpus1"] >= 0 and r.json()["rows"][0]["Count_Corpus2"] >= 0
    v = client.get("/api/compare/feature", params={"corpus": "bawe", "layer": "spacy", "name": "NOUN", "feature": "upos"}).json()
    assert len(v["values"]) == 5 and v["values"][0]["value"] > 0 and v["values"][0]["count"] > 0
    assert client.post("/api/compare/kfa", json={"corpus1": "bawe", "corpus2": "corifa", "layer": "mfte"}).status_code == 422


def test_corpus_export_route(client, opened, tmp_path):
    client.get("/api/explore/search", params={"corpus": "bawe", "query": "the"})
    r = client.post("/api/corpora/bawe/export", json={"format": "conllu"}).json()
    assert r["documents"] == 5 and r["content"].startswith("# newdoc id")
    dest = tmp_path / "b.vrt"
    r = client.post("/api/corpora/bawe/export", json={"format": "vrt", "dest": str(dest)}).json()
    assert r["out"] == str(dest) and dest.read_text().count("<text ") == 5
    assert "word" in client.post("/api/corpora/bawe/export", json={"format": "csv"}).json()["content"].splitlines()[0]


def test_viz_routes(client, opened, spacy_model):
    for c in ("bawe", "corifa"):
        wait_job(client, client.post("/api/tagging/layers", json={"corpus": c, "tagger": "spacy", "preset": "rapido"}).json()["job_id"])
    sides = [{"corpus": "bawe"}, {"corpus": "corifa"}]
    m = client.post("/api/compare/viz/matrix", json={"sides": sides, "layer": "spacy", "top": 4}).json()
    assert len(m["features"]) == 4 and len(m["rows"]) == 10
    assert client.post("/api/compare/viz/heatmap", json={"sides": sides, "layer": "spacy"}).json()["rows"]
    r = client.post("/api/compare/viz/reduction", json={"sides": sides, "layer": "spacy", "method": "pca3d"}).json()
    assert "z" in r["coords"][0]
    assert client.post("/api/compare/viz/reduction", json={"sides": sides, "layer": "spacy", "method": "x"}).status_code == 422


def test_catalog_routes(client, tmp_path, monkeypatch):
    import ttwtools
    from ttwtools import corpus_catalog as cc
    monkeypatch.setenv("TTWTOOLS_DATA_DIR", str(tmp_path / "dados"))
    proj = tmp_path / "d.ttwa"
    with ttwtools.create_project(proj) as p:
        p.add_corpus_text("d", "a.txt", "The cat sat. Dogs ran.")
        ttwtools.tag_corpus(p, "d", "simple")
    ficha = {"id": "d", "name": "D", "version": "1", "lang": "en", "source": {"url": "x"},
             "license": {"name": "CC0", "redistributable": True, "verified_on": "2026-09-26"}}
    cc.write_catalog([cc.make_package(proj, tmp_path / "pub", ficha)], tmp_path / "pub" / "catalogo.json")
    assert client.get("/api/catalog").json()["url"] is None
    client.post("/api/catalog/url", json={"url": str(tmp_path / "pub" / "catalogo.json")})
    view = client.get("/api/catalog").json()
    assert view["packages"][0]["id"] == "d" and view["error"] is None
    job = wait_job(client, client.post("/api/catalog/install", json={"id": "d"}).json()["job_id"])
    assert job["status"] == "done" and job["result"]["project"]
    assert client.get("/api/catalog").json()["installed"][0]["id"] == "d"
    refs = client.get("/api/references").json()["references"]
    assert {r["ref"] for r in refs} == {"catalog:d"}
    client.post("/api/project/open", json={"path": str(proj)})
    bands = client.post("/api/compare/bands", json={"corpus": "d", "reference": "catalog:d", "bands": [2, 4]}).json()
    assert [r["band"] for r in bands["rows"]] == ["1-2", "3-4", ">4", "off_list"]
    assert bands["rows"][-1]["tokens"] == 0
    code = client.post("/api/code", json={"analysis": "bands", "params": {"corpus": "d", "reference": "catalog:d"}}).json()
    assert "ttwtools bands" in code["cli"] and "--reference catalog:d" in code["cli"]
    assert client.post("/api/catalog/remove", json={"id": "d"}).json() == {"removed": 1}
    assert any(m["name"] == "en_core_web_sm" for m in client.get("/api/models").json()["spacy"])


def test_lab_compare_route(client, tmp_path, spacy_model):
    import ttwtools
    proj = tmp_path / "lab.ttwa"
    texts = {"a": "The cat sat on the mat. The dog ran.", "b": "Quickly and quietly she walked home.",
             "c": "Run! Stop! Why? Wait here!"}
    with ttwtools.create_project(proj) as p:
        for g, text in texts.items():
            for i in range(3):
                p.add_corpus_text("c", f"{g}{i}.txt", " ".join([text] * (i + 2)))
        ttwtools.corpus.apply_metadata(p, "c", {f"{g}{i}.txt": {"g": g} for g in texts for i in range(3)})
        ttwtools.tag_corpus(p, "c", "spacy", options={"model": "en_core_web_sm"})
    client.post("/api/project/open", json={"path": str(proj)})
    r = client.post("/api/lab/compare", json={"corpus": "c", "group_by": "g", "layer": "spacy", "method": "pairwise"}).json()
    assert r["labels"] == ["a", "b", "c"] and {w["code"] for w in r["warnings"]} >= {"experimental", "small_group"}
    r = client.post("/api/lab/compare", json={"groups": [{"corpus": "c", "where": {"g": ["a"]}, "label": "a"},
                                                         {"corpus": "c", "where": {"g": ["b"]}, "label": "b"}],
                                              "layer": "spacy", "method": "nearest"}).json()
    assert r["target"] == "a" and r["group_specs"][0]["label"] == "a"
    bad = client.post("/api/lab/compare", json={"corpus": "c", "group_by": "g", "layer": "spacy", "feature": "tags"})
    assert bad.status_code == 422
    code = client.post("/api/code", json={"analysis": "lab", "params": {"corpus": "c", "group_by": "g", "layer": "spacy",
                                                                       "method": "anova", "groups": r["group_specs"]}}).json()
    assert "ttwtools compare" in code["cli"] and "--group-by g" in code["cli"] and "compare_groups" in code["python"]


def test_tagger_options_suggest_language(client, tmp_path):
    """Passo 5.3: corpus em português → o painel já sugere o modelo pt (e atalhos do mesmo tamanho)."""
    import ttwtools
    proj = tmp_path / "pt.ttwa"
    with ttwtools.create_project(proj) as p:
        p.add_corpus_text("pt", "a.txt", "Os meninos não foram à escola ontem, mas estudaram muito em casa.")
    client.post("/api/project/open", json={"path": str(proj)})
    d = client.get("/api/taggers/spacy/options", params={"corpus": "pt"}).json()
    assert d["corpus_lang"] == "pt" and d["suggested"]["model"].startswith("pt_core_news_")
    assert d["suggested_presets"]["preciso"]["model"] == "pt_core_news_lg"
    assert client.get("/api/taggers/stanza/options", params={"corpus": "pt"}).json()["suggested"] == {"lang": "pt"}


def test_lista_a_executar(client, tmp_path):
    import ttwtools
    path = tmp_path / "pl.ttwa"
    ttwtools.create_project(path).close()
    assert client.post("/api/project/open", json={"path": str(path)}).status_code == 200
    client.post("/api/corpora/import", json={"corpus_name": "c", "source": {"kind": "folder", "path": str(CORPORA / "CorIFAessaysNE_5")}})
    r = client.post("/api/corpora/c/pipeline", json={"kind": "tag", "tagger": "spacy", "preset": "rapido"}).json()
    assert r["steps"][0]["plan"]["to_tag"] == 5
    client.post("/api/corpora/c/pipeline", json={"kind": "stats"})
    assert client.post("/api/corpora/c/pipeline", json={"kind": "tag"}).status_code == 422
    assert len(client.get("/api/corpora/c/pipeline").json()["steps"]) == 2
    job = wait_job(client, client.post("/api/corpora/c/pipeline/run").json()["job_id"])
    assert job["status"] == "done" and [d["step"]["kind"] for d in job["result"]["done"]] == ["tag", "stats"]
    assert [s["status"] for s in job["steps"]] == ["done", "done"] and job["done"] == job["total"] == 1000
    assert client.get("/api/corpora/c/pipeline").json()["steps"] == []
    client.post("/api/corpora/c/pipeline", json={"kind": "stats"})
    assert client.delete("/api/corpora/c/pipeline/0").json()["steps"] == []
