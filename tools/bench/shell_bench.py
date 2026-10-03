#!/usr/bin/env python
"""
shell_bench.py — benchmark da casca do aplicativo (pywebview hoje, Tauri amanhã).

Mede o que a casca muda, com o mesmo servidor e a mesma interface por baixo:
  startup  tempo até o servidor responder, até o navegador embutido pedir a página e até a
           interface Vue montar (marcas do servidor, ver app/bench.py), em N repetições
  memory   memória (RSS) e número de processos da árvore do aplicativo, ao montar e 10 s depois
  open     abrir um arquivo pelo argumento de linha de comando (como a associação de arquivos faz)
  visual   captura de tela da janela (macOS) de algumas telas, para comparar a aparência
  size     tamanho do pacote em disco (--bundle)

Casca (--shell): pywebview (python -m app --mode desktop), web (só o servidor, sem janela: é a
linha de base; casca = diferença para ela) ou cmd (qualquer comando, ex. o Tauri). O comando
recebe as variáveis TTW_PORT (porta livre escolhida aqui), TTW_BENCH_FILE (marcas),
TTWTOOLS_HOME/TTWTOOLS_CACHE_DIR/TTWTOOLS_DATA_DIR (pasta temporária: não suja a do usuário) e
TTW_START_HASH (tela inicial, só no `visual`); {port} e {open} valem dentro de --cmd.

Uso:
  python tools/bench/shell_bench.py run --shell pywebview --label pywebview
  python tools/bench/shell_bench.py run --shell cmd --cmd "path/TTWtools.app/Contents/MacOS/ttwtools --port {port}" --label tauri
  python tools/bench/shell_bench.py compare resultados/a.json resultados/b.json

Só biblioteca padrão; com `psutil` (opcional) mede também a CPU em repouso e funciona no Windows.
"""
from __future__ import annotations

import argparse
import json
import os
import platform
import shlex
import shutil
import signal
import socket
import statistics
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

try:
    import psutil  # type: ignore
except ImportError:  # pragma: no cover
    psutil = None

ROOT = Path(__file__).resolve().parents[2]
RESULTS = Path(__file__).resolve().parent / "resultados"
SAMPLE = ROOT / "libs" / "ttwtools" / "tests" / "data" / "v2_small.ttwa"
# telas capturadas no `visual` (rotas por hash, ver frontend-vue/src/router.js); nenhuma exige projeto
SCREENS = {"arquivo": "/arquivo", "inicio": "/inicio", "etiquetagem": "/etiquetagem",
           "explorar": "/explorar", "comparar": "/comparar", "modulos": "/modulos", "aprender": "/aprender"}
TIMEOUT = 120.0


# --------------------------------------------------------------------------- processos

def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def tree_pids(root_pid: int) -> list[int]:
    if psutil:
        try:
            parent = psutil.Process(root_pid)
            return [root_pid] + [c.pid for c in parent.children(recursive=True)]
        except psutil.Error:
            return []
    if os.name == "nt":
        raise SystemExit("No Windows instale psutil (pip install psutil).")
    out = subprocess.run(["ps", "-axo", "pid=,ppid="], capture_output=True, text=True).stdout
    kids: dict[int, list[int]] = {}
    for line in out.splitlines():
        pid, ppid = map(int, line.split())
        kids.setdefault(ppid, []).append(pid)
    found, todo = [], [root_pid]
    while todo:
        pid = todo.pop()
        found.append(pid)
        todo += kids.get(pid, [])
    return found


def webkit_pids() -> set[int]:
    """macOS: o WKWebView roda em processos auxiliares (com.apple.WebKit.*) que o launchd cria, fora da
    árvore do aplicativo. Guardamos os que já existiam antes da execução para contar só os novos."""
    if platform.system() != "Darwin":
        return set()
    out = subprocess.run(["ps", "-axo", "pid=,comm="], capture_output=True, text=True).stdout
    return {int(line.split(None, 1)[0]) for line in out.splitlines() if "com.apple.WebKit." in line}


def tree_rss_mb(root_pid: int, ignore_webkit: set[int] | None = None) -> tuple[float, int]:
    """Soma do RSS (MB) e número de processos da árvore. RSS conta páginas compartilhadas em cada
    processo; serve para comparar cascas entre si, não como consumo absoluto."""
    pids = tree_pids(root_pid)
    if ignore_webkit is not None:                      # macOS: soma os auxiliares do WebKit criados desde a partida
        pids += sorted(webkit_pids() - ignore_webkit - set(pids))
    if psutil:
        total = 0
        for pid in pids:
            try:
                total += psutil.Process(pid).memory_info().rss
            except psutil.Error:
                pass
        return total / 1e6, len(pids)
    out = subprocess.run(["ps", "-o", "rss=", "-p", ",".join(map(str, pids))], capture_output=True, text=True).stdout
    return sum(int(x) for x in out.split()) / 1024, len(pids)


def tree_cpu_s(root_pid: int, ignore_webkit: set[int] | None = None) -> float | None:
    if not psutil:
        return None
    total = 0.0
    pids = tree_pids(root_pid)
    if ignore_webkit is not None:
        pids += sorted(webkit_pids() - ignore_webkit - set(pids))
    for pid in pids:
        try:
            t = psutil.Process(pid).cpu_times()
            total += t.user + t.system
        except psutil.Error:
            pass
    return total


def kill_tree(proc: subprocess.Popen) -> None:
    pids = tree_pids(proc.pid)
    try:
        if os.name == "nt":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
        else:
            os.killpg(proc.pid, signal.SIGTERM)
    except (ProcessLookupError, PermissionError):
        pass
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        for pid in pids:
            try:
                os.kill(pid, signal.SIGKILL)
            except OSError:
                pass
    time.sleep(0.5)


# --------------------------------------------------------------------------- execução

class Run:
    """Uma execução da casca com pasta de dados temporária; use como gerenciador de contexto."""

    def __init__(self, args, open_file: Path | None = None, start_hash: str = "", autostart: bool = True):
        self.args, self.open_file, self.start_hash, self.autostart = args, open_file, start_hash, autostart
        self.webkit_before = webkit_pids()
        self.port = free_port()
        self.tmp = Path(tempfile.mkdtemp(prefix="ttw-bench-"))
        self.marks_file = self.tmp / "marks.json"
        self.proc: subprocess.Popen | None = None
        self.t0 = 0.0

    def command(self) -> list[str]:
        a = self.args
        extra = ["--open", str(self.open_file)] if self.open_file else []
        if a.shell == "cmd":
            line = a.cmd.replace("{port}", str(self.port)).replace("{open}", str(self.open_file or ""))
            cmd = shlex.split(line)
            if self.open_file and "{open}" not in a.cmd:
                cmd += extra
            return cmd
        mode = "web" if a.shell == "web" else "desktop"
        return [a.python, "-m", "app", "--mode", mode, "--port", str(self.port), *extra]

    def __enter__(self):
        if not self.autostart:
            return self
        return self.start()

    def start(self):
        env = dict(os.environ, TTW_PORT=str(self.port), TTW_BENCH_FILE=str(self.marks_file),
                   TTWTOOLS_HOME=str(self.tmp / "home"), TTWTOOLS_CACHE_DIR=str(self.tmp / "cache"),
                   TTWTOOLS_DATA_DIR=str(self.tmp / "data"), PYTHONUNBUFFERED="1")
        if self.start_hash:
            env["TTW_START_HASH"] = self.start_hash
        self.t0 = time.time()
        kw = {"creationflags": 0x00000200} if os.name == "nt" else {"start_new_session": True}
        self.proc = subprocess.Popen(self.command(), cwd=ROOT, env=env, stdout=subprocess.DEVNULL,
                                     stderr=subprocess.DEVNULL, **kw)
        return self

    def __exit__(self, *exc):
        if self.proc:
            kill_tree(self.proc)
        shutil.rmtree(self.tmp, ignore_errors=True)

    def url(self, path: str) -> str:
        return f"http://127.0.0.1:{self.port}{path}"

    def health(self) -> dict | None:
        try:
            with urllib.request.urlopen(self.url("/api/health"), timeout=2) as resp:
                return json.load(resp)
        except OSError:
            return None
        except ValueError:
            return None

    def marks(self) -> dict:
        try:
            return json.loads(self.marks_file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {}

    def wait(self, predicate, timeout: float = TIMEOUT, step: float = 0.05):
        """Espera predicate() ficar verdadeiro; devolve (instante, valor) ou (None, None)."""
        end = time.time() + timeout
        while time.time() < end:
            if self.proc.poll() is not None:
                return None, None
            value = predicate()
            if value:
                return time.time(), value
            time.sleep(step)
        return None, None


def _round(x, n=3):
    return None if x is None else round(x, n)


# --------------------------------------------------------------------------- cenários

def scenario_startup(args) -> dict:
    """Tempos de partida e memória, em args.repeat repetições; o RSS é lido ao montar e 10 s depois."""
    runs = []
    for i in range(args.repeat):
        with Run(args) as r:
            t_health, _ = r.wait(r.health)
            has_window = args.shell != "web"
            t_boot = None
            if has_window:
                t_boot, _ = r.wait(lambda: "ui_boot" in r.marks().get("marks", {}))
            m = r.marks()
            marks = m.get("marks", {})
            wk = r.webkit_before if has_window else None
            rss_boot, procs = tree_rss_mb(r.proc.pid, wk) if r.proc.poll() is None else (None, 0)
            cpu0, t_a = tree_cpu_s(r.proc.pid, wk), time.time()
            time.sleep(args.idle)
            rss_idle, procs_idle = tree_rss_mb(r.proc.pid, wk) if r.proc.poll() is None else (None, 0)
            cpu1, t_b = tree_cpu_s(r.proc.pid, wk), time.time()
            run = {
                "server_ready_s": _round(t_health - r.t0 if t_health else None),
                "html_s": _round(marks["html"] - r.t0 if "html" in marks else None),
                "js_s": _round(marks["js"] - r.t0 if "js" in marks else None),
                "ui_boot_s": _round(marks["ui_boot"] - r.t0 if "ui_boot" in marks else None),
                "rss_boot_mb": _round(rss_boot, 1), "rss_idle_mb": _round(rss_idle, 1),
                "processes": procs_idle or procs,
                "cpu_idle_pct": _round(100 * (cpu1 - cpu0) / (t_b - t_a), 2) if cpu0 is not None and cpu1 is not None else None,
                "user_agent": m.get("user_agent"),
            }
            if has_window and t_boot is None:
                run["erro"] = "a interface não montou (ui_boot ausente) ou o processo terminou"
            runs.append(run)
        print(f"  [{i + 1}/{args.repeat}] " + json.dumps({k: v for k, v in run.items() if k != "user_agent"}), flush=True)
    return {"runs": runs, "summary": summarize(runs)}


def summarize(runs: list[dict]) -> dict:
    out = {}
    for key in runs[0] if runs else []:
        values = [r[key] for r in runs if isinstance(r.get(key), (int, float))]
        if values:
            out[key] = {"median": _round(statistics.median(values), 3), "min": min(values), "max": max(values)}
    return out


def scenario_open(args) -> dict:
    """Abre o arquivo de exemplo pelo argumento de linha de comando; vale se o projeto ficar aberto."""
    if not SAMPLE.is_file():
        return {"skipped": f"arquivo de exemplo ausente: {SAMPLE}"}
    with Run(args, autostart=False) as r:
        copy = r.tmp / SAMPLE.name                         # abrir altera o arquivo: nunca o original do repositório
        shutil.copy(SAMPLE, copy)
        r.open_file = copy
        r.start()
        t, health = r.wait(lambda: (h := r.health()) and h.get("project") and h)
        return {"ok": bool(t), "open_s": _round(t - r.t0 if t else None),
                "project": (health or {}).get("project")}


def _window_id(pid_tree: list[int]) -> int | None:
    """Id da janela principal (macOS, via Quartz do pyobjc) do aplicativo, para screencapture -l."""
    try:
        import Quartz  # type: ignore
    except ImportError:
        return None
    best = None
    for w in Quartz.CGWindowListCopyWindowInfo(Quartz.kCGWindowListOptionOnScreenOnly, Quartz.kCGNullWindowID):
        if w.get("kCGWindowOwnerPID") in pid_tree and w.get("kCGWindowLayer") == 0:
            b = w["kCGWindowBounds"]
            if best is None or b["Width"] * b["Height"] > best[0]:
                best = (b["Width"] * b["Height"], w["kCGWindowNumber"])
    return best[1] if best else None


def scenario_visual(args, out_dir: Path) -> dict:
    """Uma captura por tela (macOS). Compare com `compare-visual` entre duas cascas."""
    if platform.system() != "Darwin":
        return {"skipped": "captura de tela só no macOS por enquanto"}
    shots = {}
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, route in SCREENS.items():
        with Run(args, start_hash=route) as r:
            t, _ = r.wait(lambda: "ui_boot" in r.marks().get("marks", {}))
            if not t:
                shots[name] = {"erro": "a interface não montou"}
                continue
            time.sleep(args.settle)                         # transições e fontes terminam
            wid = _window_id(tree_pids(r.proc.pid))
            if wid is None:
                shots[name] = {"erro": "janela não encontrada (instale pyobjc-framework-Quartz ou use outra casca)"}
                continue
            png = out_dir / f"{args.label}-{name}.png"
            subprocess.run(["screencapture", "-x", "-o", f"-l{wid}", str(png)], check=False, capture_output=True)
            if not png.is_file():
                shots[name] = {"erro": "screencapture falhou: dê permissão de Gravação de Tela ao terminal (Ajustes > Privacidade e Segurança)"}
                print(f"  visual {name}: {shots[name]}", flush=True)
                continue
            shots[name] = {"png": str(png.relative_to(RESULTS.parent)) if png.is_relative_to(RESULTS.parent) else str(png)}
        print(f"  visual {name}: {shots[name]}", flush=True)
    return shots


def dir_size_mb(path: Path) -> float:
    if path.is_file():
        return path.stat().st_size / 1e6
    return sum(f.stat().st_size for f in path.rglob("*") if f.is_file() and not f.is_symlink()) / 1e6


# --------------------------------------------------------------------------- comandos

def cmd_run(args) -> int:
    scenarios = [s.strip() for s in args.scenarios.split(",") if s.strip()]
    result = {"label": args.label, "shell": args.shell, "cmd": args.cmd, "date": time.strftime("%Y-%m-%d %H:%M:%S"),
              "machine": {"system": platform.system(), "release": platform.release(), "machine": platform.machine(),
                          "python": platform.python_version(), "psutil": bool(psutil)},
              "scenarios": {}}
    if shutil.which("git"):
        sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
        result["commit"] = sha
    for name in scenarios:
        print(f"== {name}", flush=True)
        if name == "startup":
            result["scenarios"]["startup"] = scenario_startup(args)
        elif name == "open":
            result["scenarios"]["open"] = scenario_open(args)
        elif name == "visual":
            result["scenarios"]["visual"] = scenario_visual(args, RESULTS / "visual")
        elif name == "size":
            result["scenarios"]["size"] = ({"bundle_mb": _round(dir_size_mb(Path(args.bundle)), 1), "bundle": args.bundle}
                                           if args.bundle else {"skipped": "passe --bundle CAMINHO"})
        else:
            raise SystemExit(f"cenário desconhecido: {name}")
    RESULTS.mkdir(parents=True, exist_ok=True)
    out = Path(args.out) if args.out else RESULTS / f"{args.label}-{platform.system().lower()}-{platform.machine()}.json"
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"gravado: {out}")
    return 0


METRICS = [("server_ready_s", "servidor pronto (s)"), ("html_s", "página pedida (s)"), ("js_s", "script pedido (s)"),
           ("ui_boot_s", "interface montada (s)"), ("rss_boot_mb", "RSS ao montar (MB)"),
           ("rss_idle_mb", "RSS em repouso (MB)"), ("processes", "processos"), ("cpu_idle_pct", "CPU em repouso (%)")]


def cmd_compare(args) -> int:
    a, b = (json.loads(Path(p).read_text(encoding="utf-8")) for p in (args.a, args.b))
    sa, sb = (x["scenarios"].get("startup", {}).get("summary", {}) for x in (a, b))
    print(f"| métrica (mediana) | {a['label']} | {b['label']} | variação |")
    print("|---|---:|---:|---:|")
    for key, label in METRICS:
        va, vb = sa.get(key, {}).get("median"), sb.get(key, {}).get("median")
        delta = f"{(vb - va) / va * 100:+.0f}%" if va and vb is not None else "—"
        print(f"| {label} | {va if va is not None else '—'} | {vb if vb is not None else '—'} | {delta} |")
    for x in (a, b):
        size = x["scenarios"].get("size", {}).get("bundle_mb")
        if size is not None:
            print(f"\npacote {x['label']}: {size} MB")
    for x in (a, b):
        op = x["scenarios"].get("open", {})
        if op:
            print(f"abrir arquivo ({x['label']}): {'ok em ' + str(op.get('open_s')) + ' s' if op.get('ok') else op.get('skipped', 'FALHOU')}")
    return 0


def cmd_compare_visual(args) -> int:
    """Diferença por pixel entre as capturas de duas execuções (Pillow). Escreve imagens de diferença."""
    from PIL import Image, ImageChops
    a, b = (json.loads(Path(p).read_text(encoding="utf-8"))["scenarios"].get("visual", {}) for p in (args.a, args.b))
    out = RESULTS / "visual"
    print("| tela | diferença | observação |\n|---|---:|---|")
    for name in SCREENS:
        pa, pb = (RESULTS.parent / x[name]["png"] if name in x and "png" in x[name] else None for x in (a, b))
        if not (pa and pb and pa.is_file() and pb.is_file()):
            print(f"| {name} | — | captura ausente |")
            continue
        ia, ib = Image.open(pa).convert("RGB"), Image.open(pb).convert("RGB")
        note = ""
        if ia.size != ib.size:
            note = f"tamanhos diferentes {ia.size} × {ib.size}; comparado na região comum"
            w, h = min(ia.width, ib.width), min(ia.height, ib.height)
            ia, ib = ia.crop((0, 0, w, h)), ib.crop((0, 0, w, h))
        diff = ImageChops.difference(ia, ib).convert("L").point(lambda v: 255 if v > args.tolerance else 0)
        pct = 100 * sum(1 for v in diff.getdata() if v) / (diff.width * diff.height)
        diff.save(out / f"diff-{name}.png")
        print(f"| {name} | {pct:.2f}% dos pixels | {note} |")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="command", required=True)
    r = sub.add_parser("run", help="roda os cenários e grava um JSON")
    r.add_argument("--shell", choices=["pywebview", "web", "cmd"], default="pywebview")
    r.add_argument("--cmd", default="", help="comando da casca (--shell cmd); aceita {port} e {open}")
    r.add_argument("--label", default=None, help="nome do resultado (padrão: a casca)")
    r.add_argument("--scenarios", default="startup,open", help="startup,open,visual,size")
    r.add_argument("--repeat", type=int, default=3)
    r.add_argument("--idle", type=float, default=10.0, help="segundos de repouso antes de reler memória e CPU")
    r.add_argument("--settle", type=float, default=2.0, help="segundos de espera antes de cada captura de tela")
    r.add_argument("--python", default=sys.executable)
    r.add_argument("--bundle", default="", help="pasta ou arquivo do pacote, para o cenário size")
    r.add_argument("--out", default="")
    r.set_defaults(func=cmd_run)
    c = sub.add_parser("compare", help="tabela em Markdown entre dois resultados")
    c.add_argument("a"), c.add_argument("b")
    c.set_defaults(func=cmd_compare)
    v = sub.add_parser("compare-visual", help="diferença por pixel entre as capturas de dois resultados")
    v.add_argument("a"), v.add_argument("b")
    v.add_argument("--tolerance", type=int, default=16, help="diferença de brilho (0–255) abaixo da qual o pixel conta como igual")
    v.set_defaults(func=cmd_compare_visual)
    args = p.parse_args()
    if getattr(args, "label", 1) is None:
        args.label = args.shell
    if args.command == "run" and args.shell == "cmd" and not args.cmd:
        p.error("--shell cmd exige --cmd")
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
