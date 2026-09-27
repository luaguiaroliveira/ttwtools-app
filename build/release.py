#!/usr/bin/env python3
"""
release.py — Lança uma versão do TTWtools (ver RELEASING.md).

    python build/release.py --version 0.4.0-alpha.1 --dry-run   # só mostra o que faria
    python build/release.py --version 0.4.0-alpha.1             # faz

Passos: confere árvore limpa, branch `main` (ou --allow-branch) e que o
submódulo libs/ttwtools aponta para um commit já publicado; grava a versão no
pyproject.toml (grafia PEP 440); move `[Unreleased]` do CHANGELOG para a seção
da versão (grafia SemVer) com a data e a versão do pacote ttwtools; confere com
build/release_notes.py; faz o commit `release: vX.Y.Z`, cria a tag anotada e
envia branch e tag. O CI (release.yml) gera os pacotes e a release em rascunho.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import subprocess
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUB = ROOT / "libs" / "ttwtools"
REPO_URL = "https://github.com/luaguiaroliveira/ttwtools-app"

_SEMVER = re.compile(r"^(\d+\.\d+\.\d+)(?:-(alpha|beta|rc)\.(\d+))?$")
_PEP440 = re.compile(r"^(\d+\.\d+\.\d+)(?:(a|b|rc)(\d+))?$")


def to_pep440(version: str) -> str:
    """0.4.0-alpha.1 → 0.4.0a1 (aceita também a grafia PEP 440)."""
    v = version.removeprefix("v")
    if _PEP440.match(v):
        return v
    m = _SEMVER.match(v)
    if not m:
        raise ValueError(f"versão inválida '{version}' (use X.Y.Z ou X.Y.Z-alpha|beta|rc.N)")
    base, pre, n = m.groups()
    return base + ({"alpha": "a", "beta": "b", "rc": "rc"}[pre] + n if pre else "")


def to_semver(pep440: str) -> str:
    m = _PEP440.match(pep440)
    if not m:
        raise ValueError(f"versão PEP 440 inválida '{pep440}'")
    base, pre, n = m.groups()
    names = {"a": "alpha", "b": "beta", "rc": "rc"}
    return f"{base}-{names[pre]}.{n}" if pre else base


def git(*args, cwd: Path = ROOT, check: bool = True) -> str:
    out = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True)
    if check and out.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)}: {out.stderr.strip()}")
    return out.stdout.strip()


def release_changelog(text: str, semver: str, date: str, extra_lines: list[str]) -> str:
    """Move o conteúdo de [Unreleased] para `## [semver] — date` e atualiza os links."""
    head = "## [Unreleased]"
    if head not in text:
        raise ValueError("CHANGELOG.md sem a seção [Unreleased]")
    start = text.index(head)
    body_start = text.index("\n", start) + 1
    nxt = re.search(r"^## \[", text[body_start:], flags=re.M)
    links = re.search(r"^\[[^\]]+\]: ", text[body_start:], flags=re.M)
    end_candidates = [body_start + m.start() for m in (nxt, links) if m]
    body_end = min(end_candidates) if end_candidates else len(text)
    body = text[body_start:body_end].strip("\n")
    if not body.strip():
        raise ValueError("[Unreleased] está vazio: nada para lançar")
    extra = "\n".join(extra_lines)
    section = f"{head}\n\n## [{semver}] — {date}\n\n{body}\n" + (f"\n{extra}\n" if extra else "") + "\n"
    out = text[:start] + section + text[body_end:]
    prev = re.search(r"^\[Unreleased\]: .*/compare/(v\S+?)\.\.\.HEAD$", out, flags=re.M)
    prev_tag = prev.group(1) if prev else None
    out = re.sub(r"^\[Unreleased\]: .*$", f"[Unreleased]: {REPO_URL}/compare/v{semver}...HEAD", out, flags=re.M)
    new_link = f"[{semver}]: {REPO_URL}/compare/{prev_tag}...v{semver}" if prev_tag else \
        f"[{semver}]: {REPO_URL}/releases/tag/v{semver}"
    out = re.sub(r"^(\[Unreleased\]: .*)$", lambda m: m.group(1) + "\n" + new_link, out, count=1, flags=re.M)
    return out


def submodule_info() -> dict:
    sha = git("rev-parse", "HEAD", cwd=SUB)
    git("fetch", "--quiet", "origin", cwd=SUB, check=False)
    published = bool(git("branch", "-r", "--contains", sha, cwd=SUB, check=False))
    tag = git("describe", "--tags", "--exact-match", sha, cwd=SUB, check=False)
    version = tomllib.loads((SUB / "pyproject.toml").read_text())["project"]["version"]
    return {"sha": sha[:7], "published": published, "tag": tag or None, "version": version}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--version", required=True, help="X.Y.Z ou X.Y.Z-alpha|beta|rc.N")
    ap.add_argument("--dry-run", action="store_true", help="só mostra o que faria, sem alterar nada")
    ap.add_argument("--allow-branch", action="store_true", help="permite lançar de outra branch que não a main")
    ap.add_argument("--no-push", action="store_true", help="faz commit e tag, sem enviar")
    args = ap.parse_args()

    pep = to_pep440(args.version)
    semver = to_semver(pep)
    tag = f"v{semver}"
    today = dt.date.today().isoformat()
    problems: list[str] = []
    plan: list[str] = []

    branch = git("rev-parse", "--abbrev-ref", "HEAD")
    dirty = git("status", "--porcelain")
    if dirty:
        problems.append("árvore de trabalho com alterações não commitadas")
    if branch != "main" and not args.allow_branch:
        problems.append(f"branch atual é '{branch}', não 'main' (use --allow-branch para um pré-lançamento de teste)")
    if git("tag", "--list", tag):
        problems.append(f"a tag {tag} já existe (nunca reescrever uma tag publicada: lance uma nova versão)")
    sub = submodule_info()
    if not sub["published"]:
        problems.append(f"submódulo libs/ttwtools em {sub['sha']}, commit ainda não enviado ao GitHub (faça push nele)")

    pyproject = ROOT / "pyproject.toml"
    old = tomllib.loads(pyproject.read_text())["project"]["version"]
    sub_line = f"- Pacote `ttwtools` {sub['version']} (commit `{sub['sha']}`" + (f", tag `{sub['tag']}`" if sub["tag"] else "") + ")."
    new_changelog = release_changelog((ROOT / "CHANGELOG.md").read_text(), semver, today, [sub_line])

    plan += [
        f"versão: {old} → {pep} (pyproject.toml) · tag {tag}",
        f"CHANGELOG.md: [Unreleased] → [{semver}] — {today}; + linha: {sub_line}",
        f"conferir: python build/release_notes.py {tag}",
        f"git commit -am 'release: {tag}'",
        f"git tag -a {tag} -m 'TTWtools {semver}'",
        "(sem push: --no-push)" if args.no_push else f"git push origin {branch} && git push origin {tag}  → CI gera pacotes e rascunho",
    ]
    print(f"== release {tag} (branch {branch}){' [dry-run]' if args.dry_run else ''}")
    for step in plan:
        print("   -", step)
    for p in problems:
        print("   ! PROBLEMA:", p)
    if args.dry_run:
        print("== nada foi alterado (dry-run)")
        return 1 if problems else 0
    if problems:
        print("== abortado: resolva os problemas acima")
        return 1

    text = pyproject.read_text()
    pyproject.write_text(re.sub(r'^version = ".*"$', f'version = "{pep}"', text, count=1, flags=re.M))
    (ROOT / "CHANGELOG.md").write_text(new_changelog)
    check = subprocess.run([sys.executable, str(ROOT / "build" / "release_notes.py"), tag], capture_output=True, text=True)
    if check.returncode != 0:
        git("checkout", "--", "pyproject.toml", "CHANGELOG.md")
        print(check.stderr)
        return 1
    git("commit", "-am", f"release: {tag}")
    git("tag", "-a", tag, "-m", f"TTWtools {semver}")
    if not args.no_push:
        git("push", "origin", branch)
        git("push", "origin", tag)
    print(f"== pronto: {tag}. Acompanhe o CI (Release) e confira o rascunho no GitHub.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
