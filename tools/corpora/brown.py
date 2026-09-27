"""
brown.py — Brown Corpus (inglês americano escrito, 1961; 500 amostras de ~2.000 palavras).

Fonte: a distribuição do NLTK (nltk_data, `corpora/brown.zip`), com as etiquetas
originais do Brown, importadas como camada `nltk_tagged` (tagset "brown"), e uma
camada extra do tagger escolhido (spaCy por padrão: lema, UPOS, PTB).
Metadados por documento: `category` (cats.txt) e `section` (letra A–R).

    python tools/corpora/brown.py --out dist-corpora
    python tools/corpora/brown.py --out dist-corpora --license-verified 2026-10-01 --redistributable

Licença: o README do brown.zip diz "Distributed with the permission of the copyright
holder, redistribution permitted." Confira e passe --license-verified para gerar o pacote.
"""

import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common  # noqa: E402

import ttwtools  # noqa: E402
from ttwtools.corpus import apply_metadata  # noqa: E402
from ttwtools.formats import import_nltk_tagged  # noqa: E402

URL = "https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/brown.zip"
FICHA = {
    "id": "brown", "name": "Brown Corpus", "version": "1961-nltk.1", "lang": "en", "variety": "en-US",
    "period": "1961", "genres": ["press", "general prose", "learned", "fiction"],
    "description": "Brown University Standard Corpus of Present-Day American English (Francis & Kučera).",
    "source": {"url": "https://www.nltk.org/nltk_data/", "citation":
               "Francis, W. N. & Kučera, H. (1964/1979). Brown Corpus Manual. Brown University."},
    "license": {"name": "Uso e redistribuição permitidos pelo detentor dos direitos (README do nltk_data: "
                        "'Distributed with the permission of the copyright holder, redistribution permitted.')",
                "reference_list": "idem (lista derivada)"},
}


def main(argv=None):
    args = _common.parser(__doc__.splitlines()[1]).parse_args(argv)
    zpath = _common.download(URL, "brown.zip")
    src = _common.CACHE / "brown"
    if not src.is_dir():
        zipfile.ZipFile(zpath).extractall(_common.CACHE)
    cats = dict(line.split(None, 1) for line in (src / "cats.txt").read_text().splitlines() if line.strip())
    files = sorted(src.glob("c[a-r][0-9][0-9]"))
    if args.limit:
        files = files[:args.limit]
    path = _common.new_project(args, FICHA)
    with ttwtools.open_project(path) as p:
        for f in files:
            import_nltk_tagged(p, f, "brown", tagset="brown")
        apply_metadata(p, "brown", {f.name: {"category": cats.get(f.name, "").strip(), "section": f.name[1].upper()}
                                    for f in files})
        print(f"{len(files)} documentos importados")
        _common.tag(p, "brown", args)
    _common.finish(args, path, FICHA, "python tools/corpora/brown.py")


if __name__ == "__main__":
    main()
