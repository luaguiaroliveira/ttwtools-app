"""
_version.py — Versão única do ttwtools-app.

A fonte da verdade é o campo `version` do `pyproject.toml` (formato PEP 440,
ex.: `0.4.0.dev0`, `0.4.0a1`). A tag de release usa SemVer (`v0.4.0-alpha.1`);
`semver()` faz a conversão. Ordem de leitura:

1. `app/_build_info.py`, gerado pelo build (no binário congelado não há
   `pyproject.toml` e os metadados do pacote podem faltar);
2. `pyproject.toml` ao lado do pacote (execução a partir do código-fonte;
   evita o número desatualizado de uma instalação editável antiga);
3. `importlib.metadata` (pacote instalado normalmente).
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent

try:  # gerado por build/build.py; ausente no código-fonte
    from app import _build_info  # type: ignore[attr-defined]
except ImportError:
    _build_info = None


def _from_pyproject() -> str | None:
    pyproject = _ROOT / "pyproject.toml"
    if not pyproject.is_file():
        return None
    try:
        import tomllib
        return tomllib.loads(pyproject.read_text(encoding="utf-8"))["project"]["version"]
    except Exception:
        return None


def _from_metadata(dist: str) -> str | None:
    try:
        from importlib.metadata import version
        return version(dist)
    except Exception:
        return None


def _app_version() -> str:
    if _build_info is not None:
        return _build_info.VERSION
    return _from_pyproject() or _from_metadata("ttwtools-app") or "0+unknown"


def _commit() -> str | None:
    if _build_info is not None:
        return getattr(_build_info, "COMMIT", None)
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=_ROOT, capture_output=True, text=True, timeout=2,
        )
        if out.returncode != 0:
            return None
        return out.stdout.strip() or None
    except Exception:
        return None


def semver(pep440: str) -> str:
    """Converte a versão PEP 440 do pyproject na forma SemVer usada nas tags.

    `0.4.0a1` → `0.4.0-alpha.1`, `0.4.0b2` → `0.4.0-beta.2`,
    `0.4.0rc1` → `0.4.0-rc.1`, `0.4.0.dev0` → `0.4.0-dev.0`, `0.4.0` → `0.4.0`.
    """
    m = re.fullmatch(r"(\d+\.\d+\.\d+)(?:(a|b|rc)(\d+))?(?:\.dev(\d+))?", pep440)
    if not m:
        return pep440
    base, pre, pre_n, dev_n = m.groups()
    if pre:
        base += "-" + {"a": "alpha", "b": "beta", "rc": "rc"}[pre] + "." + pre_n
    if dev_n is not None:
        base += (".dev." if pre else "-dev.") + dev_n
    return base


__version__ = _app_version()


def version_info() -> dict:
    """Versões do app e do pacote `ttwtools`, e o commit do build."""
    ttwtools_version = _from_metadata("ttwtools")
    return {
        "app": __version__,
        "app_semver": semver(__version__),
        "ttwtools": ttwtools_version,
        "commit": _commit(),
    }
