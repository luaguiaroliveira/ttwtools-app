#!/usr/bin/env python3
"""
tauri_app.py — gera o TTWtools.app da casca Tauri (macOS) com o servidor do PyInstaller.

Uso (depois de `python build/build.py --shell tauri`, que cria dist/<alvo>/ttwtools-server):
    python build/tauri_app.py [--target macos-arm64] [--min 12.3] [--dmg]

O Tauri copia `bundle.resources` desreferenciando os links simbólicos do PyInstaller (702 MB viram 1,0 GB);
aqui o `Resources/server` é refeito com `ditto` (preserva os links), o `.app` é reassinado (ad hoc) e
conferido por `check_macos_min.py`. Precisa de `cargo tauri` (tauri-cli 2.11.5) no PATH.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def run(cmd, **kw):
    print("$", " ".join(map(str, cmd)), flush=True)
    subprocess.run(cmd, check=True, **kw)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--target", default="macos-arm64")
    ap.add_argument("--min", default="12.3", help="mínimo de macOS aceito pelo check (12.3 no arm64, 12.0 no Intel)")
    ap.add_argument("--dmg", action="store_true", help="também gera dist/release/TTWtools-tauri-<alvo>.dmg")
    args = ap.parse_args()
    server = ROOT / "dist" / args.target / "ttwtools-server"
    if not (server / "ttwtools-server").exists():
        print(f"falta {server}: rode `python build/build.py --shell tauri` antes", file=sys.stderr)
        return 1
    tauri = ROOT / "src-tauri"
    run(["cargo", "tauri", "build", "--bundles", "app", "--config",
         f'{{"bundle":{{"resources":{{"{server}":"server"}}}}}}'], cwd=tauri)
    app = tauri / "target" / "release" / "bundle" / "macos" / "TTWtools.app"
    dest = app / "Contents" / "Resources" / "server"
    shutil.rmtree(dest)
    run(["ditto", server, dest])
    run(["codesign", "--force", "--deep", "--sign", "-", app])
    run([sys.executable, ROOT / "build" / "check_macos_min.py", app, "--min", args.min])
    run(["du", "-sh", app])
    if args.dmg:
        # não usa `--bundles dmg` do Tauri: ele empacotaria de novo o .app com os links desreferenciados
        staging = ROOT / "build" / "_dmg" / f"tauri-{args.target}"
        shutil.rmtree(staging, ignore_errors=True)
        staging.mkdir(parents=True)
        run(["ditto", app, staging / "TTWtools.app"])
        (staging / "Applications").symlink_to("/Applications")
        out = ROOT / "dist" / "release"
        out.mkdir(parents=True, exist_ok=True)
        dmg = out / f"TTWtools-tauri-{args.target}.dmg"
        dmg.unlink(missing_ok=True)
        run(["hdiutil", "create", "-volname", "TTWtools (Tauri)", "-srcfolder", staging,
             "-ov", "-format", "UDZO", dmg])
        shutil.rmtree(staging, ignore_errors=True)
        run(["du", "-sh", dmg])
    return 0


if __name__ == "__main__":
    sys.exit(main())
