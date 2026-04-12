"""
utils.py — Utilitários do sistema: seletor de pasta nativo, etc.
"""
from __future__ import annotations

import platform
import subprocess
import sys

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


def _pick_folder_macos() -> str:
    """Usa AppleScript para abrir o seletor de pasta nativo do macOS em primeiro plano."""
    script = 'POSIX path of (choose folder with prompt "Selecione a pasta:")'
    result = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        return ""
    # osascript retorna caminho com trailing slash — remove
    return result.stdout.strip().rstrip("/")


def _pick_folder_generic() -> str:
    """Fallback: tkinter para Linux/Windows."""
    script = (
        "import tkinter as tk; from tkinter import filedialog; "
        "root = tk.Tk(); root.withdraw(); root.wm_attributes('-topmost', True); "
        "p = filedialog.askdirectory(); print(p)"
    )
    result = subprocess.run(
        [sys.executable, "-c", script],
        capture_output=True,
        text=True,
        timeout=120,
    )
    return result.stdout.strip()


@router.get("/pick-folder")
def pick_folder():
    """Abre o seletor de pasta nativo do sistema e retorna o caminho escolhido."""
    try:
        if platform.system() == "Darwin":
            path = _pick_folder_macos()
        else:
            path = _pick_folder_generic()

        if path:
            return {"path": path}
        return JSONResponse(status_code=204, content={"path": ""})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"detail": str(exc)})
