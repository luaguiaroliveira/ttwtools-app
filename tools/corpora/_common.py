"""
_common.py — Peças comuns dos scripts de preparo de corpora do catálogo (passo 4.3).

Cada script (brown.py, lob.py, ud.py, masc.py, demo.py) baixa ou lê a fonte, monta
um projeto `.ttwa` etiquetado e chama `finish()`, que grava em `--out`:

    <id>-<versão>.zip          pacote (só se a licença foi conferida e permite redistribuir)
    <id>-<versão>.entry.json   entrada do catálogo (pacote ou receita)
    <id>-lista-<versão>.zip    só as listas de frequência (referência sem baixar o corpus)

`build_catalog.py` junta as entradas em `catalogo.json`.

Regra de licença (plano 4.1): nada vira pacote sem `--license-verified AAAA-MM-DD`
(data em que a pessoa conferiu a licença NA FONTE) e `--redistributable`. Sem isso,
a entrada sai como receita (`kind: "recipe"`): o catálogo mostra o corpus e o
comando de preparo, sem arquivo para baixar.
"""

from __future__ import annotations

import argparse
import json
import urllib.request
from pathlib import Path

import ttwtools
from ttwtools import corpus_catalog as cc

CACHE = Path(__file__).resolve().parent / ".cache"


def parser(description: str) -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(description=description)
    ap.add_argument("--out", default="dist-corpora", help="pasta de saída (pacotes e entradas)")
    ap.add_argument("--license-verified", metavar="AAAA-MM-DD",
                    help="data em que a licença foi conferida na fonte (sem ela, só receita)")
    ap.add_argument("--redistributable", action="store_true",
                    help="a licença conferida permite redistribuir o texto")
    ap.add_argument("--tagger", default="spacy", help="tagger da camada extra (spacy, stanza, none)")
    ap.add_argument("--model", default="en_core_web_sm", help="modelo do tagger")
    ap.add_argument("--limit", type=int, default=0, help="só os N primeiros documentos (teste)")
    return ap


def download(url: str, name: str) -> Path:
    """Baixa para tools/corpora/.cache (uma vez)."""
    CACHE.mkdir(exist_ok=True)
    target = CACHE / name
    if not target.exists():
        print(f"baixando {url}")
        tmp = target.with_suffix(target.suffix + ".part")
        with urllib.request.urlopen(url, timeout=120) as src, tmp.open("wb") as dst:
            for chunk in iter(lambda: src.read(1 << 16), b""):
                dst.write(chunk)
        tmp.rename(target)
    return target


def new_project(args, ficha: dict) -> Path:
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"{ficha['id']}-{ficha['version']}.ttwa"
    if path.exists():
        path.unlink()
    ttwtools.create_project(path, name=ficha["name"], description=ficha.get("description", "")).close()
    return path


def tag(project, corpus: str, args) -> None:
    if args.tagger == "none":
        return
    opts = {"model": args.model} if args.tagger in ("spacy",) else None
    last = [0]

    def progress(done, total, name):
        if done - last[0] >= 50 or done == total:
            last[0] = done
            print(f"  {args.tagger}: {done}/{total}")
    ttwtools.tag_corpus(project, corpus, args.tagger, options=opts, progress=progress)


def finish(args, project_path: Path, ficha: dict, recipe: str) -> dict:
    """Grava o pacote (ou a receita) e a entrada do catálogo."""
    with ttwtools.open_project(project_path) as p:     # visão geral já calculada (sem camada e por camada)
        for info in ttwtools.list_corpora(p):
            for layer in [None] + sorted({lay["tool"] for lay in info["layers"]}):
                ttwtools.describe(p, info["name"], layer=layer)
    ficha = dict(ficha)
    ficha["recipe"] = recipe
    lic = dict(ficha["license"])
    lic["verified_on"] = args.license_verified
    lic["redistributable"] = bool(args.redistributable and args.license_verified)
    ficha["license"] = lic
    out = Path(args.out)
    if lic["redistributable"]:
        entry = cc.make_package(project_path, out, ficha)
        ref = cc.make_reference_package(project_path, out, ficha)      # só as listas (passo 4.4)
        (out / f"{ref['id']}-{ref['version']}.entry.json").write_text(
            json.dumps(ref, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"ok: lista de referência {ref['url']} ({ref['size'] // 1024} KB)")
    else:
        with ttwtools.open_project(project_path) as p:
            info = next(c for c in ttwtools.list_corpora(p))
            words = ttwtools.keyness.corpus_freqs(p, info["name"], "form").words
        ficha["size"] = {"documents": info["documents"], "words": words}
        entry = {"id": ficha["id"], "version": ficha["version"], "kind": "recipe", "ficha": ficha}
        print("licença não conferida ou sem redistribuição: entrada como RECEITA (sem pacote)")
    errors = cc.validate_catalog({"format": cc.CATALOG_FORMAT, "packages": [entry]})
    if errors:
        raise SystemExit("entrada inválida: " + "; ".join(errors))
    path = out / f"{ficha['id']}-{ficha['version']}.entry.json"
    path.write_text(json.dumps(entry, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"ok: {path}" + (f" + {entry['url']} ({entry['size'] // 1024} KB)" if entry["kind"] == "package" else ""))
    return entry
