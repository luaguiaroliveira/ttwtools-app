"""
state.py — Estado global em memória do processo do servidor.

Mantém apenas referências leves: caminho do arquivo .ttwa aberto e
cache do TTWAProject. Nenhum dado de corpus é mantido em memória.
"""

from __future__ import annotations

from typing import Optional

# Caminho do arquivo .ttwa atualmente aberto (None = nenhum)
current_project_path: Optional[str] = None

# Caminho original do .ttwt que originou o projeto atual.
# Quando definido, current_project_path aponta para um .ttwa temporário
# que deve ser apagado ao fechar/trocar de projeto.
source_ttwt_path: Optional[str] = None

# Marca (tamanho e data do banco e do WAL) da cópia de trabalho na última gravação,
# para saber se há alterações ainda não salvas no arquivo compactado.
saved_marker: Optional[tuple] = None


def _marker(path: str) -> tuple:
    from pathlib import Path
    out = []
    for f in (Path(path), Path(path + "-wal")):
        try:
            st = f.stat()
            # WAL vazio (criado só por abrir o banco) não é alteração
            out.append((st.st_size, st.st_mtime_ns) if st.st_size else None)
        except OSError:
            out.append(None)
    return tuple(out)


def drop_working_copy() -> None:
    """Apaga a cópia de trabalho atual (se houver) e esquece o arquivo de origem."""
    global source_ttwt_path, saved_marker
    import shutil
    from pathlib import Path
    if source_ttwt_path and current_project_path:
        from ttwtools.project import register_working_copy
        register_working_copy(current_project_path, None)
        work = Path(current_project_path)
        if work.parent.name.startswith("ttw_work_"):
            shutil.rmtree(work.parent, ignore_errors=True)
        else:
            for f in (work, Path(str(work) + "-wal"), Path(str(work) + "-shm")):
                f.unlink(missing_ok=True)
    source_ttwt_path = None
    saved_marker = None


def set_working_copy(work: str, source: str) -> None:
    """Passa a trabalhar em `work`, cópia de trabalho do arquivo compactado `source`."""
    global current_project_path, source_ttwt_path, saved_marker
    from ttwtools.project import register_working_copy
    if current_project_path != work:
        drop_working_copy()
    register_working_copy(work, source)
    current_project_path, source_ttwt_path = work, source
    saved_marker = _marker(work)


def set_plain(path: str) -> None:
    """Passa a trabalhar direto no banco `path` (sem compressão: salva sozinho)."""
    global current_project_path
    drop_working_copy()
    current_project_path = path


def mark_saved() -> None:
    global saved_marker
    if current_project_path:
        saved_marker = _marker(current_project_path)


def unsaved() -> bool:
    """Cópia de trabalho com alterações ainda não gravadas no arquivo de origem."""
    return bool(source_ttwt_path and current_project_path and _marker(current_project_path) != saved_marker)


def purge_stale_workdirs(max_age_hours: float = 24) -> int:
    """Apaga cópias de trabalho abandonadas (processo encerrado à força) mais velhas que o limite.
    As recentes ficam: podem ser de outra janela do aplicativo aberta."""
    import shutil
    import tempfile
    import time
    from pathlib import Path
    n = 0
    for d in Path(tempfile.gettempdir()).glob("ttw_work_*"):
        try:
            if time.time() - d.stat().st_mtime > max_age_hours * 3600:
                shutil.rmtree(d, ignore_errors=True)
                n += 1
        except OSError:
            pass
    return n


def new_workdir(name: str) -> str:
    """Pasta temporária para uma cópia de trabalho; devolve o caminho do banco dentro dela."""
    import tempfile
    from pathlib import Path
    return str(Path(tempfile.mkdtemp(prefix="ttw_work_")) / name)


# Arquivo a ser aberto via frontend (com barra de progresso se .ttwt).
# Definido pelo Apple Event handler ou pelo argumento --open para .ttwt.
# O frontend lê e limpa este valor via GET /api/project/pending-open.
pending_open_path: Optional[str] = None
