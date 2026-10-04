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
    # esquema antigo: abre numa tarefa (migração com progresso); só vira o projeto atual no fim
    assert r.status_code == 200 and r.json()["status"] == "migrating"
    job = wait_job(client, r.json()["job_id"])
    assert job["status"] == "done" and str(job["result"]["schema_version"]) == "0.3"
    assert job["stage"] == "done" and job["total"] > 0
    # de novo: já migrado, abre na hora
    assert client.post("/api/project/open", json={"path": str(v2_project)}).json()["status"] == "opened"
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


def test_til_ao_criar_e_abrir(client, tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    r = client.post("/api/project/create", json={"path": "~/proj.ttwa"})
    assert r.status_code == 200 and r.json()["path"] == str((tmp_path / "proj.ttwa").resolve())
    assert client.post("/api/project/open", json={"path": "~/proj.ttwa"}).status_code == 200


def test_criar_por_cima_so_com_overwrite(client, tmp_path):
    p = str(tmp_path / "x.ttwa")
    assert client.post("/api/project/create", json={"path": p}).status_code == 200
    assert client.post("/api/project/create", json={"path": p}).status_code == 409
    assert client.post("/api/project/create", json={"path": p, "overwrite": True}).status_code == 200


def test_salvar_e_salvar_como_com_ttwt(client, tmp_path):
    import ttwtools
    from ttwtools.project import compress_to_ttwt
    base = tmp_path / "base.ttwa"
    ttwtools.create_project(base).close()
    ttwt = tmp_path / "p.ttwt"
    compress_to_ttwt(base, ttwt)
    r = client.post("/api/project/open", json={"path": str(ttwt)}).json()
    assert wait_job(client, r["job_id"])["status"] == "done"
    info = client.get("/api/project/info").json()
    assert info["source_ttwt"] == str(ttwt.resolve()) or info["source_ttwt"] == str(ttwt)
    client.post("/api/corpora/import", json={"corpus_name": "novo", "source": {"kind": "text", "text": "Olá."}})
    # Salvar grava a cópia de trabalho de volta no .ttwt
    s = client.post("/api/project/save").json()
    assert s["status"] == "saving" and wait_job(client, s["job_id"])["status"] == "done"
    from ttwtools.project import decompress_from_ttwt
    decompress_from_ttwt(ttwt, tmp_path / "check.ttwa")
    with ttwtools.open_project(tmp_path / "check.ttwa") as c:
        assert "novo" in c.list_corpus_names()
    # Salvar como .ttwa (compactado, o padrão): passa a trabalhar no arquivo novo
    from ttwtools.project import compression_of
    dest = tmp_path / "copia.ttwa"
    j = client.post("/api/project/saveas", json={"path": str(dest)}).json()
    assert wait_job(client, j["job_id"])["result"]["switched"]
    info = client.get("/api/project/info").json()
    assert info["display_path"] == str(dest.resolve()) and info["compressed"] and not info["unsaved"]
    assert compression_of(dest) == "gzip"
    client.post("/api/corpora/import", json={"corpus_name": "mais", "source": {"kind": "text", "text": "Outro."}})
    assert client.get("/api/project/info").json()["unsaved"]
    s = client.post("/api/project/save").json()
    assert wait_job(client, s["job_id"])["status"] == "done" and not client.get("/api/project/info").json()["unsaved"]
    # opção avançada: sem compressão → banco direto, que salva sozinho
    raw = tmp_path / "direto.ttwa"
    j = client.post("/api/project/saveas", json={"path": str(raw), "compress": False}).json()
    wait_job(client, j["job_id"])
    assert compression_of(raw) is None and client.post("/api/project/save").json()["status"] == "autosaved"
    # um corpus só: .ttwc, sem trocar de projeto
    one = tmp_path / "so_mais.ttwc"
    j = client.post("/api/project/saveas", json={"path": str(one), "corpus": "mais"}).json()
    assert wait_job(client, j["job_id"])["result"]["corpus"] == "mais"
    with ttwtools.open_project(one) as c:
        assert c.list_corpus_names() == ["mais"] and c.single_corpus
    assert client.get("/api/project/info").json()["path"] == str(raw.resolve())
    # pacote leve com uma seleção de corpora: .ttwal, também sem trocar de projeto
    pack = tmp_path / "pacote.ttwal"
    j = client.post("/api/project/saveas", json={"path": str(pack), "corpora": ["mais", "novo"]}).json()
    assert sorted(wait_job(client, j["job_id"])["result"]["corpora"]) == ["mais", "novo"]
    with ttwtools.open_project(pack) as c:
        assert c.is_light and not c.single_corpus and set(c.list_corpus_names()) == {"mais", "novo"}
    everything = tmp_path / "tudo.ttwal"                 # .ttwal sem seleção = todos os corpora
    j = client.post("/api/project/saveas", json={"path": str(everything)}).json()
    assert wait_job(client, j["job_id"])["result"]["switched"] is False
    assert client.get("/api/project/info").json()["path"] == str(raw.resolve())


def test_pending_open_post(client, v2_project, tmp_path):
    """A casca Tauri entrega o arquivo aberto pelo sistema; a interface o lê e limpa."""
    assert client.post("/api/project/pending-open", json={"path": str(tmp_path / "nao_existe.ttwa")}).status_code == 400
    assert client.post("/api/project/pending-open", json={"path": str(tmp_path / "x.txt")}).status_code == 400
    assert client.post("/api/project/pending-open", json={"path": str(v2_project)}).status_code == 200
    assert client.get("/api/project/pending-open").json() == {"path": str(v2_project.resolve())}
    assert client.get("/api/project/pending-open").json() == {"path": None}
