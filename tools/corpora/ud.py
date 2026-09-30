"""
ud.py — Treebanks do Universal Dependencies como corpus (anotação manual UD).

    python tools/corpora/ud.py --treebank en-ewt     --out dist-corpora   # UD English EWT
    python tools/corpora/ud.py --treebank pt-bosque  --out dist-corpora   # UD Portuguese Bosque

Importa train/dev/test da tag de release (`--tag`) como camada `conllu` (lema,
UPOS, XPOS, atributos, dependências). Um documento por `# newdoc`; metadados `split`
e os do treebank (EWT: `genre` pelo prefixo do id; Bosque: `source` e `variety`,
CF = Folha de S.Paulo/pt-BR, CP = Público/pt-PT). Por padrão não acrescenta
camada de tagger (`--tagger none`).

Licença: CC BY-SA 4.0 nos dois (LICENSE.txt de cada repositório). A lista de
frequências derivada herda o BY-SA.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common  # noqa: E402

import ttwtools  # noqa: E402
from ttwtools.corpus import apply_metadata  # noqa: E402
from ttwtools.formats import import_conllu  # noqa: E402

TAG = "r2.18"
URL = "https://raw.githubusercontent.com/UniversalDependencies/{repo}/{tag}/{prefix}-ud-{split}.conllu"
BOSQUE_SOURCE = {"CF": ("CETENFolha (Folha de S.Paulo)", "pt-BR"), "CP": ("CETEMPúblico (Público)", "pt-PT")}
TREEBANKS = {
    "en-ewt": {
        "repo": "UD_English-EWT", "prefix": "en_ewt",
        "meta": lambda name: {"genre": name.split("-", 1)[0]},
        "ficha": {"id": "ud-english-ewt", "name": "UD English EWT", "lang": "en", "variety": "en-US", "period": "2000s",
                  "genres": ["weblog", "newsgroup", "email", "answers", "reviews"],
                  "description": "English Web Treebank com anotação manual Universal Dependencies.",
                  "source": {"url": "https://github.com/UniversalDependencies/UD_English-EWT", "citation":
                             "Silveira, N. et al. (2014). A Gold Standard Dependency Corpus for English. LREC."}},
    },
    "pt-bosque": {
        "repo": "UD_Portuguese-Bosque", "prefix": "pt_bosque",
        "meta": lambda name: dict(zip(("source", "variety"), BOSQUE_SOURCE.get(name[:2], ("", "")))),
        "ficha": {"id": "ud-portuguese-bosque", "name": "UD Portuguese Bosque", "lang": "pt", "variety": "pt-BR, pt-PT",
                  "period": "1990s", "genres": ["news"],
                  "description": "Bosque (Floresta Sintá(c)tica): jornais brasileiros e portugueses, anotação manual UD.",
                  "source": {"url": "https://github.com/UniversalDependencies/UD_Portuguese-Bosque", "citation":
                             "Rademaker, A. et al. (2017). Universal Dependencies for Portuguese. DepLing."}},
    },
}


def main(argv=None):
    ap = _common.parser(__doc__.splitlines()[1])
    ap.set_defaults(tagger="none")
    ap.add_argument("--treebank", choices=sorted(TREEBANKS), default="en-ewt")
    ap.add_argument("--tag", default=TAG, help="tag da release UD (ex.: r2.18)")
    args = ap.parse_args(argv)
    tb = TREEBANKS[args.treebank]
    ficha = dict(tb["ficha"], version=args.tag.lstrip("r") + ".1",
                 license={"name": "CC BY-SA 4.0", "url": "https://creativecommons.org/licenses/by-sa/4.0/",
                          "reference_list": "CC BY-SA 4.0"})
    corpus = ficha["id"]
    path = _common.new_project(args, ficha)
    meta = {}
    with ttwtools.open_project(path) as p:
        for split in ("train", "dev", "test"):
            url = URL.format(repo=tb["repo"], tag=args.tag, prefix=tb["prefix"], split=split)
            f = _common.download(url, f"{tb['prefix']}-{args.tag}-{split}.conllu")
            res = import_conllu(p, f, corpus)
            meta |= {name: {"split": split, **tb["meta"](name)} for name in res["files"]}
        apply_metadata(p, corpus, {k: {m: v for m, v in d.items() if v} for k, d in meta.items()})
        print(f"{len(p.list_documents(corpus))} documentos importados")
        _common.tag(p, corpus, args)
    _common.finish(args, path, ficha, f"python tools/corpora/ud.py --treebank {args.treebank}")


if __name__ == "__main__":
    main()
