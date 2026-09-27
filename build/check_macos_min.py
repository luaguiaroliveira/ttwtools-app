#!/usr/bin/env python3
"""
check_macos_min.py — Falha se algum binário Mach-O exigir macOS mais novo que o mínimo.

Uso:
    python build/check_macos_min.py <pasta ou .app> [--min 12.0]

Percorre todos os arquivos, reconhece Mach-O pelos bytes iniciais e lê o
mínimo de cada um com `otool -arch all -l` (LC_BUILD_VERSION `minos` ou
LC_VERSION_MIN_MACOSX `version`). Imprime os culpados e sai com código 1.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from collections import Counter
from pathlib import Path

_MACHO_MAGIC = {
    b"\xfe\xed\xfa\xce", b"\xce\xfa\xed\xfe",  # 32 bits
    b"\xfe\xed\xfa\xcf", b"\xcf\xfa\xed\xfe",  # 64 bits
    b"\xca\xfe\xba\xbe", b"\xbe\xba\xfe\xca",  # universal (fat)
}


def _version_tuple(v: str) -> tuple[int, ...]:
    return tuple(int(x) for x in v.split("."))


def is_macho(path: Path) -> bool:
    try:
        with path.open("rb") as fh:
            return fh.read(4) in _MACHO_MAGIC
    except OSError:
        return False


def macos_min(path: Path) -> str | None:
    """Maior mínimo de macOS entre as arquiteturas do arquivo (None se não declarar)."""
    out = subprocess.run(["otool", "-arch", "all", "-l", str(path)],
                         capture_output=True, text=True).stdout
    found: list[str] = []
    lines = out.splitlines()
    for i, line in enumerate(lines):
        cmd = line.strip()
        if cmd in ("cmd LC_BUILD_VERSION", "cmd LC_VERSION_MIN_MACOSX"):
            key = "minos" if cmd.endswith("BUILD_VERSION") else "version"
            for nxt in lines[i + 1:i + 6]:
                parts = nxt.split()
                if parts and parts[0] == key:
                    found.append(parts[1])
                    break
    if not found:
        return None
    return max(found, key=_version_tuple)


def scan(root: Path) -> list[tuple[str | None, Path]]:
    files = [root] if root.is_file() else [p for p in root.rglob("*") if p.is_file() and not p.is_symlink()]
    return [(macos_min(p), p) for p in files if is_macho(p)]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("path", type=Path)
    parser.add_argument("--min", default="12.0", help="mínimo de macOS aceito (padrão: 12.0)")
    args = parser.parse_args()

    if sys.platform != "darwin":
        print("check_macos_min: só roda no macOS (usa otool).")
        return 0

    results = scan(args.path)
    limit = _version_tuple(args.min)
    bad = [(v, p) for v, p in results if v and _version_tuple(v) > limit]

    counts = Counter(v or "?" for v, _ in results)
    summary = ", ".join(f"{v}: {n}" for v, n in sorted(counts.items(), key=lambda kv: _version_tuple(kv[0]) if kv[0] != "?" else (0,)))
    print(f"check_macos_min: {len(results)} arquivos Mach-O em {args.path} ({summary})")
    if bad:
        print(f"FALHOU: {len(bad)} arquivo(s) exigem macOS acima de {args.min}:")
        for v, p in sorted(bad, key=lambda vp: str(vp[1])):
            print(f"  {v}  {p.relative_to(args.path) if args.path.is_dir() else p}")
        return 1
    print(f"OK: nenhum binário exige macOS acima de {args.min}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
