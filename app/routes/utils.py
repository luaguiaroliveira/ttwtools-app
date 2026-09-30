"""
utils.py — Utilitários do sistema: diálogos nativos de abrir, salvar e escolher pasta.

Na janela do aplicativo (modo desktop) os diálogos são os do pywebview, que
funcionam nos três sistemas, inclusive no pacote. No modo web (navegador), a
reserva é o AppleScript no macOS e o tkinter nos demais.
"""
from __future__ import annotations

import platform
import subprocess
import sys
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

PROJECT_EXTS = ("ttwa", "ttwl", "ttwal", "ttwc", "ttwcl", "ttwt")


def _window():
    """Janela do pywebview, se o aplicativo estiver no modo desktop."""
    webview = sys.modules.get("webview")
    return webview.windows[0] if webview and getattr(webview, "windows", None) else None


def _webview_dialog(kind: str, directory: str = "", save_filename: str = "", exts: tuple = ()) -> str | None:
    """Diálogo do pywebview. None = sem janela (usar a reserva); "" = cancelado."""
    win = _window()
    if win is None:
        return None
    import webview
    dialog = {"open": webview.FileDialog.OPEN, "save": webview.FileDialog.SAVE,
              "folder": webview.FileDialog.FOLDER}[kind]
    types = (f"TTWtools ({';'.join('*.' + e for e in exts)})", "Todos (*.*)") if exts else ()
    result = win.create_file_dialog(dialog, directory=directory, save_filename=save_filename, file_types=types)
    if not result:
        return ""
    return result if isinstance(result, str) else result[0]


def _osascript(script: str) -> str:
    result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=300)
    return result.stdout.strip().rstrip("/") if result.returncode == 0 else ""


def _tk(call: str) -> str:
    script = ("import tkinter as tk; from tkinter import filedialog; "
              "root = tk.Tk(); root.withdraw(); root.wm_attributes('-topmost', True); "
              f"p = filedialog.{call}; print(p or '')")
    result = subprocess.run([sys.executable, "-c", script], capture_output=True, text=True, timeout=300)
    return result.stdout.strip()


def _where(default_location: str) -> str:
    return f' default location POSIX file "{default_location}"' if default_location else ""


def _answer(fn):
    try:
        path = fn()
        if path:
            return {"path": path}
        return JSONResponse(status_code=204, content={"path": ""})
    except Exception as exc:  # noqa: BLE001
        return JSONResponse(status_code=500, content={"detail": str(exc)})


@router.get("/pick-folder")
def pick_folder(default_location: str = ""):
    """Abre o seletor de pasta nativo do sistema e retorna o caminho escolhido."""
    def pick():
        path = _webview_dialog("folder", default_location)
        if path is not None:
            return path
        if platform.system() == "Darwin":
            return _osascript(f'POSIX path of (choose folder with prompt "Selecione a pasta:"{_where(default_location)})')
        init = f"initialdir={default_location!r}" if default_location else ""
        return _tk(f"askdirectory({init})")
    return _answer(pick)


FILE_KINDS = {"project": PROJECT_EXTS, "csv": ("csv", "tsv", "txt")}


@router.get("/pick-file")
def pick_file(default_location: str = "", kind: str = "project"):
    """Abre o seletor de arquivo nativo e retorna o caminho. kind: project (.ttwa/.ttwl/.ttwt) ou csv."""
    exts = FILE_KINDS.get(kind, PROJECT_EXTS)

    def pick():
        path = _webview_dialog("open", default_location, exts=exts)
        if path is not None:
            return path
        if platform.system() == "Darwin":
            types = ", ".join(f'"{e}"' for e in exts)
            return _osascript('POSIX path of (choose file with prompt "Selecione o arquivo:" '
                              f'of type {{{types}, "public.data"}}{_where(default_location)})')
        init = f", initialdir={default_location!r}" if default_location else ""
        pattern = " ".join("*." + e for e in exts)
        return _tk(f"askopenfilename(filetypes=[('TTWtools', {pattern!r}), ('Todos', '*')]{init})")
    return _answer(pick)


@router.get("/pick-save")
def pick_save(suggested: str = "projeto.ttwa", default_location: str = ""):
    """Diálogo nativo de salvar: devolve o caminho escolhido, com a extensão do nome sugerido se faltar."""
    ext = Path(suggested).suffix or ".ttwa"

    def pick():
        others = tuple(e for e in PROJECT_EXTS if e != ext.lstrip("."))
        path = _webview_dialog("save", default_location, save_filename=suggested, exts=(ext.lstrip("."), *others))
        if path is None:
            if platform.system() == "Darwin":
                path = _osascript(f'POSIX path of (choose file name with prompt "Salvar como:" '
                                  f'default name "{suggested}"{_where(default_location)})')
            else:
                init = f", initialdir={default_location!r}" if default_location else ""
                path = _tk(f"asksaveasfilename(initialfile={suggested!r}, defaultextension={ext!r}{init})")
        if path and Path(path).suffix.lower() not in {"." + e for e in PROJECT_EXTS}:
            path += ext
        return path
    return _answer(pick)


@router.post("/open-url")
def open_url(body: dict):
    """Abre um link do projeto no navegador do sistema (só endereços do GitHub do TTWtools)."""
    import webbrowser
    url = str(body.get("url", ""))
    if not url.startswith("https://github.com/luaguiaroliveira/"):
        return JSONResponse({"detail": "endereço não permitido"}, status_code=400)
    webbrowser.open(url)
    return {"ok": True}


@router.post("/quit")
def quit_app():
    """Encerra o servidor e o processo."""
    import os
    import threading

    def _shutdown():
        import time
        time.sleep(0.3)  # allow response to be sent
        try:
            from app import state as app_state
            app_state.drop_working_copy()        # os._exit não passa pelo atexit: apaga a cópia de trabalho antes
        except Exception:  # noqa: BLE001
            pass
        os._exit(0)

    threading.Thread(target=_shutdown, daemon=True).start()
    return {"status": "shutting_down"}
