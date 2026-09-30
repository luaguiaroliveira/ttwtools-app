"""Compatibilidade pelo aplicativo: cada formato de arquivo, antigo ou novo, abre e responde às buscas."""

import shutil
import warnings
from pathlib import Path

import pytest

import ttwtools
from ttwtools.project import compress_project_file, compress_to_ttwt, save_corpora_as, save_corpus_as, save_project_as

from .conftest import wait_job

V2 = Path(__file__).resolve().parent.parent / "libs" / "ttwtools" / "tests" / "data" / "v2_small.ttwa"
C = "CorIFAessaysNE_5"


def _old(tmp_path, name):
    p = tmp_path / name
    shutil.copy(V2, p)
    return p


def _open(client, path):
    """Abre pela rota e espera a tarefa (migração, descompressão, índice) se houver."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        r = client.post("/api/project/open", json={"path": str(path)})
        assert r.status_code == 200, r.text
        if "job_id" in r.json():
            job = wait_job(client, r.json()["job_id"])
            assert job["status"] == "done", job
    return r.json()["status"]


def _answers(client, corpus=C):
    assert corpus in client.get("/api/corpus/list").json()["corpora"]
    s = client.get("/api/explore/search", params={"corpus": corpus, "query": "the"}).json()
    k = client.get("/api/explore/kwic", params={"corpus": corpus, "query": "the", "limit": 3}).json()
    assert s["total"] > 50 and k["total"] == s["total"] and len(k["lines"]) == 3
    assert client.get("/api/explore/frequency", params={"corpus": corpus, "top": 5}).json()["rows"]
    return s["total"]


def _new_files(tmp_path):
    """Arquivos no formato atual, gerados a partir do antigo."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        full = ttwtools.open_project(_old(tmp_path, "base.ttwa"))
    full._con.commit()
    out = {
        "atual compactado, com tabelas": save_project_as(full.path, tmp_path / "n1.ttwa", search_tables=True),
        "atual direto, com tabelas": save_project_as(full.path, tmp_path / "n2.ttwa", compress=False, search_tables=True),
        "atual sem tabelas (índice em cache)": save_project_as(full.path, tmp_path / "n3.ttwa", search_tables=False),
        ".ttwc": save_corpus_as(full, C, tmp_path / "n4.ttwc"),
        ".ttwcl": save_corpus_as(full, C, tmp_path / "n5.ttwcl"),
        ".ttwal": save_corpora_as(full, [C], tmp_path / "n6.ttwal"),
    }
    full.close()
    return out


def test_old_formats_open_and_answer(client, tmp_path):
    """Esquema 0.2 nos três invólucros que já existiram: banco direto, gzip e .ttwt (xz)."""
    plain = _old(tmp_path, "a.ttwa")
    gz = tmp_path / "b.ttwa"
    compress_project_file(_old(tmp_path, "b_src.ttwa"), gz)
    xz = tmp_path / "c.ttwt"
    compress_to_ttwt(_old(tmp_path, "c_src.ttwa"), xz)
    totals = []
    for path in (plain, gz, xz):
        _open(client, path)
        totals.append(_answers(client))
    assert len(set(totals)) == 1                       # as três abrem o mesmo conteúdo
    assert ttwtools.project.compression_of(gz) == "gzip" and ttwtools.project.compression_of(xz) == "xz"


def test_new_formats_open_and_answer_the_same(client, tmp_path):
    base = _open(client, _old(tmp_path, "ref.ttwa"))
    ref = _answers(client)
    for label, path in _new_files(tmp_path).items():
        _open(client, path)
        assert _answers(client) == ref, label


def test_opening_old_direct_file_keeps_data(client, tmp_path):
    """Abrir um .ttwa antigo não perde nada: a cópia migrada mantém textos, etiquetados e tabelas."""
    p = _old(tmp_path, "keep.ttwa")
    _open(client, p)
    with ttwtools.open_project(p) as q:
        assert len(q.list_corpus_files(C)) == 5
        assert q._con.execute("SELECT COUNT(*) FROM tagged_files").fetchone()[0] == 30
        assert q.load_feature_table(C, "norm1000", tagger_type="biberplus") is not None
