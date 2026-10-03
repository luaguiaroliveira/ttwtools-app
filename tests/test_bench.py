"""Marcas de tempo do benchmark das cascas (app/bench.py) e o resumo de tools/bench/shell_bench.py."""

import importlib.util
import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.server import build_app

ROOT = Path(__file__).resolve().parent.parent


def test_sem_variavel_nao_marca(monkeypatch, tmp_path):
    monkeypatch.delenv("TTW_BENCH_FILE", raising=False)
    TestClient(build_app()).get("/", headers={"user-agent": "Mozilla/5.0"})
    assert not list(tmp_path.iterdir())


def test_marcas_so_de_navegador(monkeypatch, tmp_path):
    marks = tmp_path / "marks.json"
    monkeypatch.setenv("TTW_BENCH_FILE", str(marks))
    client = TestClient(build_app())
    client.get("/api/health", headers={"user-agent": "python-urllib/3"})
    client.get("/api/project/pending-open", headers={"user-agent": "python-urllib/3"})
    assert set(json.loads(marks.read_text())["marks"]) == {"build"}      # o monitor do benchmark não conta
    client.get("/api/project/pending-open", headers={"user-agent": "Mozilla/5.0 AppleWebKit"})
    data = json.loads(marks.read_text())
    assert set(data["marks"]) == {"build", "ui_boot"} and data["user_agent"].startswith("Mozilla")
    first = data["marks"]["ui_boot"]
    client.get("/api/project/pending-open", headers={"user-agent": "Mozilla/5.0"})
    assert json.loads(marks.read_text())["marks"]["ui_boot"] == first    # só a primeira vez


def test_resumo_do_harness():
    spec = importlib.util.spec_from_file_location("shell_bench", ROOT / "tools" / "bench" / "shell_bench.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    out = mod.summarize([{"a": 1.0, "b": None}, {"a": 3.0, "b": None}, {"a": 2.0, "b": None}])
    assert out == {"a": {"median": 2.0, "min": 1.0, "max": 3.0}}
