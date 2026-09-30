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
    """Apaga cópias de trabalho e pastas de exportação abandonadas: as de processo que já morreu (marca
    `owner.pid`) e, sem marca (versões antigas), as com mais de `max_age_hours`. As de processos vivos
    ficam: podem ser de outra janela do aplicativo aberta."""
    from ttwtools.project import purge_orphan_workdirs
    return purge_orphan_workdirs(max_age_hours=max_age_hours)


def new_workdir(name: str) -> str:
    """Pasta temporária (com o processo dono marcado) para uma cópia de trabalho; devolve o caminho do banco dentro dela."""
    from ttwtools.project import make_workdir
    return str(make_workdir("ttw_work_") / name)


def install_exit_cleanup() -> None:
    """SIGTERM passa a encerrar normalmente (rodando o atexit que apaga a cópia de trabalho): sem isso, matar o
    processo deixava uma cópia do projeto (vários GB) na pasta temporária."""
    import signal
    import sys
    try:
        signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))      # SIGTERM não roda o atexit por padrão
    except (ValueError, OSError):                                   # fora da thread principal
        pass


# Arquivo a ser aberto via frontend (com barra de progresso se .ttwt).
# Definido pelo Apple Event handler ou pelo argumento --open para .ttwt.
# O frontend lê e limpa este valor via GET /api/project/pending-open.
pending_open_path: Optional[str] = None
