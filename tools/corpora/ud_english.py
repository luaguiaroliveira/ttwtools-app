"""
ud_english.py — Universal Dependencies English Web Treebank (UD_English-EWT).

Inglês da web (blogs, grupos de notícias, e-mails, respostas, avaliações), com
anotação manual UD (lema, UPOS, XPOS/PTB, traços, dependências), importada como
camada `conllu`. Um documento por `# newdoc`; metadados `genre` (prefixo do id)
e `split` (train/dev/test). Por padrão não acrescenta camada de tagger (`--tagger none`).

    python tools/corpora/ud_english.py --out dist-corpora
    python tools/corpora/ud_english.py --out dist-corpora --license-verified AAAA-MM-DD --redistributable

Licença: CC BY-SA 4.0 (LICENSE.txt do repositório UD_English-EWT). Conferir a
versão da release usada; a lista de frequências derivada herda o BY-SA.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common  # noqa: E402

import ttwtools  # noqa: E402
from ttwtools.corpus import apply_metadata  # noqa: E402
from ttwtools.formats import import_conllu  # noqa: E402

TAG = "r2.18"
URL = "https://raw.githubusercontent.com/UniversalDependencies/UD_English-EWT/{tag}/en_ewt-ud-{split}.conllu"
FICHA = {
    "id": "ud-english-ewt", "name": "UD English EWT", "version": TAG.lstrip("r") + ".1", "lang": "en",
    "variety": "en-US", "period": "2000s", "genres": ["weblog", "newsgroup", "email", "answers", "reviews"],
    "description": "English Web Treebank com anotação manual Universal Dependencies.",
    "source": {"url": "https://github.com/UniversalDependencies/UD_English-EWT", "citation":
               "Silveira, N. et al. (2014). A Gold Standard Dependency Corpus for English. LREC."},
    "license": {"name": "CC BY-SA 4.0", "url": "https://creativecommons.org/licenses/by-sa/4.0/",
                "reference_list": "CC BY-SA 4.0"},
}


def main(argv=None):
    ap = _common.parser(__doc__.splitlines()[1])
    ap.set_defaults(tagger="none")
    ap.add_argument("--tag", default=TAG, help="tag da release UD (ex.: r2.18)")
    args = ap.parse_args(argv)
    ficha = dict(FICHA, version=args.tag.lstrip("r") + ".1")
    path = _common.new_project(args, ficha)
    meta = {}
    with ttwtools.open_project(path) as p:
        for split in ("train", "dev", "test"):
            f = _common.download(URL.format(tag=args.tag, split=split), f"en_ewt-{args.tag}-{split}.conllu")
            res = import_conllu(p, f, "ud-english-ewt")
            meta |= {name: {"split": split, "genre": name.split("-", 1)[0]} for name in res["files"]}
        if args.limit:
            print("--limit não se aplica a este corpus (importa as três partes)")
        apply_metadata(p, "ud-english-ewt", meta)
        print(f"{len(p.list_documents('ud-english-ewt'))} documentos importados")
        _common.tag(p, "ud-english-ewt", args)
    _common.finish(args, path, ficha, "python tools/corpora/ud_english.py")


if __name__ == "__main__":
    main()
