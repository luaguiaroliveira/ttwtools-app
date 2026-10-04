#!/usr/bin/env python3
"""
tauri_app.py — gera o pacote da casca Tauri (macOS, Windows, Linux) com o servidor do PyInstaller.

Uso (depois de `python build/build.py --shell tauri`, que cria dist/<alvo>/ttwtools-server):
    python build/tauri_app.py [--target macos-arm64] [--min 12.3] [--package]

Saída em dist/<alvo>/, no mesmo formato do build.py com pywebview:
    macOS:            TTWtools.app (Resources/server = servidor)
    Windows e Linux:  TTWtools/ com TTWtools[.exe] e server/ (servidor); o empacotamento acrescenta ícones e scripts
`--package` gera dist/release/TTWtools-<versão>-<so>-<arq>.{dmg,zip,tar.gz} (`build.package`); `--dmg` (macOS, uso
local) gera dist/release/TTWtools-tauri-<alvo>.dmg sem a numeração de release.

O Tauri copia `bundle.resources` desreferenciando os links simbólicos do PyInstaller (702 MB viram 1,0 GB);
por isso o servidor é copiado aqui, preservando os links (macOS: `ditto`; o .app é reassinado ad hoc e conferido por
`check_macos_min.py`). Precisa de `cargo tauri` (tauri-cli 2.11.5) no PATH.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import platform
import re
import shutil
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parent.parent


def run(cmd, **kw):
    print("$", " ".join(map(str, cmd)), flush=True)
    subprocess.run([str(c) for c in cmd], check=True, **kw)


def load_build():
    spec = importlib.util.spec_from_file_location("ttw_build", ROOT / "build" / "build.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main() -> int:
    b = load_build()
    system = {"darwin": "macos", "windows": "windows"}.get(platform.system().lower(), "linux")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--target", default=f"{system}-{b.norm_arch(platform.machine())}", help="padrão: este sistema")
    ap.add_argument("--min", default=None, help="mínimo de macOS aceito pelo check (padrão: 12.3 no arm64, 12.0 no Intel)")
    ap.add_argument("--package", action="store_true", help="gera o pacote de release em dist/release/")
    ap.add_argument("--dmg", action="store_true", help="macOS: gera dist/release/TTWtools-tauri-<alvo>.dmg (uso local)")
    args = ap.parse_args()
    os_name, _, arch = args.target.partition("-")
    server = ROOT / "dist" / args.target / "ttwtools-server"
    if not (server / ("ttwtools-server.exe" if os_name == "windows" else "ttwtools-server")).exists():
        print(f"falta {server}: rode `python build/build.py --shell tauri` antes", file=sys.stderr)
        return 1
    version = b.project_version()
    numeric = re.match(r"\d+\.\d+\.\d+", version).group(0)   # o Tauri e o Info.plist querem número puro
    tauri = ROOT / "src-tauri"
    dist_dir = ROOT / "dist" / args.target

    if os_name == "macos":
        cfg = {"version": numeric, "bundle": {"resources": {str(server): "server"}}}
        run(["cargo", "tauri", "build", "--bundles", "app", "--config", json.dumps(cfg)], cwd=tauri,
            env=dict(os.environ, MACOSX_DEPLOYMENT_TARGET="12.0"))
        built = tauri / "target" / "release" / "bundle" / "macos" / "TTWtools.app"
        dest = built / "Contents" / "Resources" / "server"
        shutil.rmtree(dest)
        run(["ditto", server, dest])
        run(["codesign", "--force", "--deep", "--sign", "-", built])
        run([sys.executable, ROOT / "build" / "check_macos_min.py", built, "--min", args.min or b.MACOS_MIN[arch]])
        run(["du", "-sh", built])
        final = dist_dir / "TTWtools.app"
        shutil.rmtree(final, ignore_errors=True)
        run(["ditto", built, final])
    else:
        # sem instalador: pasta portátil, com o servidor em server/ ao lado do executável (ver resolve_server em main.rs)
        cfg = {"version": numeric, "bundle": {"resources": None, "macOS": None}}
        run(["cargo", "tauri", "build", "--no-bundle", "--config", json.dumps(cfg)], cwd=tauri)
        suffix = ".exe" if os_name == "windows" else ""
        folder = dist_dir / "TTWtools"
        shutil.rmtree(folder, ignore_errors=True)
        folder.mkdir(parents=True)
        shutil.copy2(tauri / "target" / "release" / f"ttwtools-tauri{suffix}", folder / f"TTWtools{suffix}")
        shutil.copytree(server, folder / "server", symlinks=True)

    if args.dmg:
        if os_name != "macos":
            print("--dmg só no macOS", file=sys.stderr)
            return 1
        # não usa `--bundles dmg` do Tauri: ele empacotaria de novo o .app com os links desreferenciados
        staging = ROOT / "build" / "_dmg" / f"tauri-{args.target}"
        shutil.rmtree(staging, ignore_errors=True)
        staging.mkdir(parents=True)
        run(["ditto", dist_dir / "TTWtools.app", staging / "TTWtools.app"])
        (staging / "Applications").symlink_to("/Applications")
        out = ROOT / "dist" / "release"
        out.mkdir(parents=True, exist_ok=True)
        pkg = out / f"TTWtools-tauri-{args.target}.dmg"
        pkg.unlink(missing_ok=True)
        run(["hdiutil", "create", "-volname", "TTWtools (Tauri)", "-srcfolder", staging, "-ov", "-format", "UDZO", pkg])
        shutil.rmtree(staging, ignore_errors=True)
        print(f"Pacote: {pkg} ({pkg.stat().st_size / 2**20:.0f} MB)")
    if args.package:
        pkg = b.package(SimpleNamespace(os=os_name, arch=arch, name=args.target), dist_dir, version)
        print(f"Pacote: {pkg} ({pkg.stat().st_size / 2**20:.0f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
