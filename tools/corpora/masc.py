"""
masc.py — MASC ou OANC (American National Corpus) a partir do standoff GrAF.

Baixe e descompacte a distribuição GrAF em https://anc.org (MASC 3.0.0 ou OANC
GrAF) e aponte `--source` para a pasta. Cada documento vira texto + camada `graf`
(forma, lema, PTB e UPOS; tokens de `-penn` no MASC ou `-hepple` no OANC),
com os metadados do cabeçalho `.anc` (título, domínio...) e a subpasta (gênero).
As posições dos tokens são conferidas contra o texto; divergências são relatadas.

    python tools/corpora/masc.py --source ~/Downloads/MASC-3.0.0 --out dist-corpora
    python tools/corpora/masc.py --source ~/Downloads/OANC-GrAF --id oanc --out dist-corpora

Licença: a CONFERIR na página do ANC para a parte usada (o MASC declara uso livre;
alguns textos do OANC têm condições próprias). Sem --license-verified, só receita.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common  # noqa: E402

import ttwtools  # noqa: E402
from ttwtools.formats import import_graf  # noqa: E402

FICHAS = {
    "masc": {"id": "masc", "name": "MASC (Manually Annotated Sub-Corpus)", "version": "3.0.0.1", "lang": "en",
             "variety": "en-US", "period": "1990–2011", "genres": ["written", "spoken", "blog", "fiction", "news"],
             "description": "Subcorpus de 500 mil palavras do ANC, com anotação conferida manualmente.",
             "source": {"url": "https://anc.org/data/masc/", "citation":
                        "Ide, N. et al. (2010). MASC: the Manually Annotated Sub-Corpus of American English. LREC."},
             "license": {"name": "a conferir (página do MASC)", "reference_list": "a conferir"}},
    "oanc": {"id": "oanc", "name": "Open American National Corpus", "version": "1.0.1.1", "lang": "en",
             "variety": "en-US", "period": "1990–", "genres": ["written", "spoken"],
             "description": "Parte aberta do American National Corpus (cerca de 15 milhões de palavras).",
             "source": {"url": "https://anc.org/data/oanc/", "citation": "Ide, N. & Suderman, K. The Open American National Corpus."},
             "license": {"name": "a conferir (página do OANC)", "reference_list": "a conferir"}},
}


def main(argv=None):
    ap = _common.parser(__doc__.splitlines()[1])
    ap.set_defaults(tagger="none")
    ap.add_argument("--source", required=True, help="pasta da distribuição GrAF descompactada")
    ap.add_argument("--id", choices=sorted(FICHAS), default="masc")
    args = ap.parse_args(argv)
    ficha = FICHAS[args.id]
    path = _common.new_project(args, ficha)
    with ttwtools.open_project(path) as p:
        r = import_graf(p, args.source, args.id)
        print(f"{r['imported']} documentos, {r['tokens']} tokens; posições divergentes: {r['offset_mismatches']};"
              f" sem tokens/texto: {len(r['skipped'])}")
        _common.tag(p, args.id, args)
    _common.finish(args, path, ficha, f"python tools/corpora/masc.py --source <pasta GrAF> --id {args.id}")


if __name__ == "__main__":
    main()
