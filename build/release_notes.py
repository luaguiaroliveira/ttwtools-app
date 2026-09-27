#!/usr/bin/env python3
"""
release_notes.py — Valida a tag de release e imprime as notas do CHANGELOG.

Uso:
    python build/release_notes.py v0.4.0-alpha.1 [--out notas.md]

Falha (código 1) se a tag não for `v` + a versão do pyproject.toml em grafia
SemVer (ver RELEASING.md) ou se o CHANGELOG.md não tiver a seção `## [<versão>]`.
"""

from __future__ import annotations

import argparse
import importlib.util
import re
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _semver():
    spec = importlib.util.spec_from_file_location("_ttw_version", ROOT / "app" / "_version.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.semver


def changelog_section(version: str) -> str | None:
    text = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
    m = re.search(rf"^## \[{re.escape(version)}\][^\n]*\n(.*?)(?=^## \[|^\[[^\]]+\]: |\Z)", text, flags=re.M | re.S)
    return m.group(1).strip() if m else None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("tag")
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()

    pep440 = tomllib.loads((ROOT / "pyproject.toml").read_text())["project"]["version"]
    version = _semver()(pep440)
    errors = []
    if args.tag != f"v{version}":
        errors.append(f"tag {args.tag} ≠ v{version} (pyproject.toml: {pep440})")
    notes = changelog_section(version)
    if not notes:
        errors.append(f"CHANGELOG.md sem a seção '## [{version}]'")
    if errors:
        for e in errors:
            print(f"ERRO: {e}", file=sys.stderr)
        return 1
    if args.out:
        args.out.write_text(notes + "\n", encoding="utf-8")
    else:
        print(notes)
    return 0


if __name__ == "__main__":
    sys.exit(main())
