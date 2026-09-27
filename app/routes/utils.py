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


def _pick_folder_macos(default_location: str = "") -> str:
    """Usa AppleScript para abrir o seletor de pasta nativo do macOS em primeiro plano."""
    if default_location:
        script = f'POSIX path of (choose folder with prompt "Selecione a pasta:" default location POSIX file "{default_location}")'
    else:
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


def _pick_folder_generic(default_location: str = "") -> str:
    """Fallback: tkinter para Linux/Windows."""
    init_dir = f", initialdir='{default_location}'" if default_location else ""
    script = (
        "import tkinter as tk; from tkinter import filedialog; "
        "root = tk.Tk(); root.withdraw(); root.wm_attributes('-topmost', True); "
        f"p = filedialog.askdirectory({init_dir.lstrip(', ')}); print(p)"
    )
    result = subprocess.run(
        [sys.executable, "-c", script],
        capture_output=True,
        text=True,
        timeout=120,
    )
    return result.stdout.strip()


@router.get("/pick-folder")
def pick_folder(default_location: str = ""):
    """Abre o seletor de pasta nativo do sistema e retorna o caminho escolhido."""
    try:
        if platform.system() == "Darwin":
            path = _pick_folder_macos(default_location)
        else:
            path = _pick_folder_generic(default_location)

        if path:
            return {"path": path}
        return JSONResponse(status_code=204, content={"path": ""})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"detail": str(exc)})


@router.get("/pick-file")
def pick_file(default_location: str = ""):
    """Abre o seletor de arquivo nativo do sistema e retorna o caminho escolhido."""
    try:
        if platform.system() == "Darwin":
            loc_clause = (
                f' default location POSIX file "{default_location}"'
                if default_location else ""
            )
            script = (
                'POSIX path of (choose file '
                'with prompt "Selecione um arquivo .ttwa, .ttwl ou .ttwt:" '
                f'of type {{"ttwa", "ttwl", "ttwt", "public.data"}}{loc_clause})'
            )
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True, text=True, timeout=120,
            )
            path = result.stdout.strip().rstrip("/") if result.returncode == 0 else ""
        else:
            init_dir = f", initialdir='{default_location}'" if default_location else ""
            script = (
                "import tkinter as tk; from tkinter import filedialog; "
                "root = tk.Tk(); root.withdraw(); root.wm_attributes('-topmost', True); "
                f"p = filedialog.askopenfilename(filetypes=[('TTWA/TTWL/TTWT','*.ttwa *.ttwl *.ttwt'),('Todos','*')]{init_dir}); print(p)"
            )
            result = subprocess.run(
                [sys.executable, "-c", script],
                capture_output=True, text=True, timeout=120,
            )
            path = result.stdout.strip()

        if path:
            return {"path": path}
        return JSONResponse(status_code=204, content={"path": ""})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"detail": str(exc)})


@router.post("/quit")
def quit_app():
    """Encerra o servidor e o processo."""
    import os
    import threading

    def _shutdown():
        import time
        time.sleep(0.3)  # allow response to be sent
        os._exit(0)

    threading.Thread(target=_shutdown, daemon=True).start()
    return {"status": "shutting_down"}
