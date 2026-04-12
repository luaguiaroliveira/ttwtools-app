"""
state.py — Estado global em memória do processo do servidor.

Mantém apenas referências leves: caminho do arquivo .ttwa aberto e
cache do TTWAProject. Nenhum dado de corpus é mantido em memória.
"""

from __future__ import annotations

from typing import Optional

# Caminho do arquivo .ttwa atualmente aberto (None = nenhum)
current_project_path: Optional[str] = None
