"""
bench.py — marcas de tempo do servidor para o benchmark das cascas (tools/bench/shell_bench.py).

Só entra em ação com a variável de ambiente TTW_BENCH_FILE (caminho de um JSON). Registra, uma vez
cada, o instante (epoch, segundos) de: montagem do app ("build", antes de o servidor subir), primeiro HTML pedido por um
navegador ("html"), primeiro script da interface ("js") e primeira chamada de /api/project/pending-open
("ui_boot": a interface Vue montou e começou a falar com a API). Só conta quem se apresenta como
navegador (User-Agent "Mozilla"), então o monitoramento do próprio benchmark não polui as marcas.

Independe da casca (pywebview, Tauri, navegador): quem mede é o servidor, que é comum às duas.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

ENV_VAR = "TTW_BENCH_FILE"


def install(app) -> None:
    target = os.environ.get(ENV_VAR)
    if not target:
        return
    path = Path(target)
    state: dict = {"marks": {}, "user_agent": None}

    def mark(name: str, user_agent: str = "") -> None:
        if name in state["marks"]:
            return
        state["marks"][name] = time.time()
        if user_agent and not state["user_agent"]:
            state["user_agent"] = user_agent
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(state), encoding="utf-8")
        tmp.replace(path)                      # leitura nunca vê arquivo pela metade

    mark("build")                              # app montado (imports e rotas prontos); o servidor ainda vai subir

    @app.middleware("http")
    async def _bench_marks(request, call_next):
        agent = request.headers.get("user-agent", "")
        if agent.startswith("Mozilla"):
            url = request.url.path
            if url == "/":
                mark("html", agent)
            elif url.startswith("/assets/") and url.endswith(".js"):
                mark("js", agent)
            elif url == "/api/project/pending-open":
                mark("ui_boot", agent)
        return await call_next(request)
