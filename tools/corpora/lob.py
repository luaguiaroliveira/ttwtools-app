"""
lob.py — Lancaster-Oslo/Bergen Corpus (inglês britânico escrito, 1961), só como RECEITA.

O LOB é distribuído pelo ICAME sob licença de uso que não permite redistribuir o
texto: o catálogo mostra a ficha e este comando; quem tem a sua cópia prepara o
corpus localmente. Espera a versão etiquetada horizontal (uma frase por linha,
`palavra_TAG` ou `palavra/TAG`), um arquivo por texto.

    python tools/corpora/lob.py --source /caminho/LOB --out dist-corpora
    ttwtools-app: abra dist-corpora/lob-1961.1.ttwa

Sem `--source`, gera só a entrada de receita do catálogo.
"""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common  # noqa: E402

import ttwtools  # noqa: E402
from ttwtools import corpus_catalog as cc  # noqa: E402
from ttwtools.formats import import_nltk_tagged  # noqa: E402

FICHA = {
    "id": "lob", "name": "LOB Corpus", "version": "1961.1", "lang": "en", "variety": "en-GB", "period": "1961",
    "genres": ["press", "general prose", "learned", "fiction"],
    "description": "Lancaster-Oslo/Bergen Corpus, par britânico do Brown (mesmas 15 categorias).",
    "source": {"url": "https://www.icame.org/", "citation":
               "Johansson, S., Leech, G. & Goodluck, H. (1978). Manual of Information to accompany the LOB Corpus."},
    "license": {"name": "ICAME: uso acadêmico com licença; sem redistribuição"},
}
_UNDERSCORE = re.compile(r"(\S+)_(\S+)")


def main(argv=None):
    ap = _common.parser(__doc__.splitlines()[1])
    ap.add_argument("--source", help="pasta com os textos etiquetados do LOB (a sua cópia)")
    ap.add_argument("--sep", default="_", choices=["_", "/"], help="separador palavra/etiqueta")
    args = ap.parse_args(argv)
    args.redistributable = False  # nunca: a licença não permite
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    ficha = dict(FICHA, recipe="python tools/corpora/lob.py --source <sua cópia do LOB>")
    if not args.source:
        entry = {"id": ficha["id"], "version": ficha["version"], "kind": "recipe",
                 "ficha": ficha | {"license": ficha["license"] | {"redistributable": False,
                                                                  "verified_on": args.license_verified}}}
        assert not cc.validate_catalog({"format": cc.CATALOG_FORMAT, "packages": [entry]})
        (out / "lob-1961.1.entry.json").write_text(json.dumps(entry, ensure_ascii=False, indent=1), encoding="utf-8")
        print("entrada de receita gravada")
        return
    files = sorted(f for f in Path(args.source).iterdir() if f.is_file() and not f.name.startswith("."))
    if args.limit:
        files = files[:args.limit]
    conv = _common.CACHE / "lob"
    conv.mkdir(parents=True, exist_ok=True)
    path = _common.new_project(args, ficha)
    with ttwtools.open_project(path) as p:
        for f in files:
            text = f.read_text(encoding="utf-8", errors="replace")
            if args.sep == "_":
                text = _UNDERSCORE.sub(r"\1/\2", text)
            (conv / f.name).write_text(text, encoding="utf-8")
            import_nltk_tagged(p, conv / f.name, "lob", tagset="lob")
        print(f"{len(files)} documentos importados")
        _common.tag(p, "lob", args)
    _common.finish(args, path, ficha, ficha["recipe"])
    print(f"projeto local: {path} (não publicar)")


if __name__ == "__main__":
    main()
