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

# Arquivo a ser aberto via frontend (com barra de progresso se .ttwt).
# Definido pelo Apple Event handler ou pelo argumento --open para .ttwt.
# O frontend lê e limpa este valor via GET /api/project/pending-open.
pending_open_path: Optional[str] = None
