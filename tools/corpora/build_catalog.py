"""
build_catalog.py — Junta as entradas `*.entry.json` de uma pasta em `catalogo.json`.

    python tools/corpora/build_catalog.py dist-corpora

Valida cada entrada (regra de licença) e recusa o catálogo se algo falhar.
Publicar: enviar `catalogo.json` e os `.zip` para o mesmo lugar (URLs relativas).
"""

import json
import sys
from pathlib import Path

from ttwtools import corpus_catalog as cc


def main(argv=None):
    folder = Path((argv or sys.argv[1:] or ["dist-corpora"])[0])
    entries = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(folder.glob("*.entry.json"))]
    catalog = cc.write_catalog(entries, folder / "catalogo.json")
    for e in catalog["packages"]:
        print(f"{e['kind']:8} {e['id']} {e['version']}" + (f"  {e['size'] // 1024} KB" if e["kind"] == "package" else ""))
    print(f"ok: {folder / 'catalogo.json'}")


if __name__ == "__main__":
    main()
