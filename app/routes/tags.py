"""
tags.py — Serve as definições dos tags Biber a partir do arquivo tags_biber.json.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


def _tags_file() -> Path:
    """
    Localiza tags_biber.json em ordem de preferência:
    0. Bundle PyInstaller: sys._MEIPASS/ttwtools/tags_biber.json
    1. libs/ttwtools/ttwtools/ (submodule, relativo ao arquivo server.py)
    2. Pacote ttwtools instalado no ambiente (modo editável ou normal)
    """
    # 0. PyInstaller bundle
    if hasattr(sys, "_MEIPASS"):
        p = Path(sys._MEIPASS) / "ttwtools" / "tags_biber.json"
        if p.exists():
            return p

    # 1. Submodule bundled with the app (most reliable for distribution)
    app_root = Path(__file__).parent.parent.parent   # ttwtools-app/
    bundled = app_root / "libs" / "ttwtools" / "ttwtools" / "tags_biber.json"
    if bundled.exists():
        return bundled

    # 2. Installed package via pip
    spec = importlib.util.find_spec("ttwtools")
    if spec and spec.submodule_search_locations:
        base = Path(spec.submodule_search_locations[0])
        for p in [base / "ttwtools" / "tags_biber.json", base / "tags_biber.json"]:
            if p.exists():
                return p

    raise FileNotFoundError("tags_biber.json not found")


@router.get("")
def get_tags():
    """Retorna lista de {tag, definition} para todos os tags Biber."""
    try:
        data = json.loads(_tags_file().read_text(encoding="utf-8"))
        return data
    except FileNotFoundError as exc:
        return JSONResponse(status_code=404, content={"detail": str(exc)})
