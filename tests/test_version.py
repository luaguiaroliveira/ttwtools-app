import subprocess
import sys
import tomllib
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app._version import __version__, semver
from app.server import build_app

ROOT = Path(__file__).resolve().parent.parent


def _pyproject_version() -> str:
    return tomllib.loads((ROOT / "pyproject.toml").read_text())["project"]["version"]


def test_version_matches_pyproject():
    assert __version__ == _pyproject_version()


def test_api_version():
    client = TestClient(build_app())
    data = client.get("/api/version").json()
    assert data["app"] == _pyproject_version()
    assert data["app_semver"] == semver(data["app"])
    assert "ttwtools" in data and "commit" in data
    assert client.get("/openapi.json").json()["info"]["version"] == data["app"]


def test_cli_version():
    out = subprocess.run(
        [sys.executable, "-m", "app", "--version"],
        cwd=ROOT, capture_output=True, text=True, timeout=60,
    )
    assert out.returncode == 0
    assert _pyproject_version() in out.stdout


@pytest.mark.parametrize("pep440, expected", [
    ("0.4.0", "0.4.0"),
    ("0.4.0a1", "0.4.0-alpha.1"),
    ("0.4.0b2", "0.4.0-beta.2"),
    ("0.4.0rc1", "0.4.0-rc.1"),
    ("0.4.0.dev0", "0.4.0-dev.0"),
])
def test_semver(pep440, expected):
    assert semver(pep440) == expected
