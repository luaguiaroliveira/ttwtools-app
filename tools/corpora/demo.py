"""
demo.py — Corpus de demonstração pequeno, com metadados, para os tours e o ensino.

Três obras de ficção em domínio público (Projeto Gutenberg), divididas em capítulos
ou contos (um documento cada), com metadados `author`, `work`, `year`, `variety`
(en-GB/en-US) e `chapter`. Os primeiros N capítulos de cada obra (`--per-work`).
O cabeçalho e o rodapé do Projeto Gutenberg são retirados (a marca "Project
Gutenberg" não pode acompanhar textos redistribuídos fora da licença deles).

    python tools/corpora/demo.py --out dist-corpora
    python tools/corpora/demo.py --out dist-corpora --license-verified AAAA-MM-DD --redistributable

Licença: obras em domínio público nos EUA (autores mortos há mais de 100 anos,
publicadas antes de 1900). Conferir a situação nos países de uso.
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _common  # noqa: E402

import ttwtools  # noqa: E402
from ttwtools.corpus import apply_metadata  # noqa: E402

WORKS = [
    {"id": 11, "slug": "alice", "author": "Lewis Carroll", "work": "Alice's Adventures in Wonderland",
     "year": "1865", "variety": "en-GB", "heading": r"^CHAPTER [IVXL]+\.$"},
    {"id": 74, "slug": "tom-sawyer", "author": "Mark Twain", "work": "The Adventures of Tom Sawyer",
     "year": "1876", "variety": "en-US", "heading": r"^CHAPTER [IVXL]+$"},
    {"id": 1661, "slug": "sherlock", "author": "Arthur Conan Doyle", "work": "The Adventures of Sherlock Holmes",
     "year": "1892", "variety": "en-GB", "heading": r"^[IVX]+\. [A-Z][A-Z '-]+$"},
]
URL = "https://www.gutenberg.org/cache/epub/{id}/pg{id}.txt"
FICHA = {
    "id": "demo-ficcao", "name": "Demonstração: ficção do século XIX", "version": "1", "lang": "en",
    "variety": "en-GB, en-US", "period": "1865–1892", "genres": ["fiction"],
    "description": "Capítulos de Alice (Carroll), Tom Sawyer (Twain) e Sherlock Holmes (Doyle), para tours e aulas.",
    "source": {"url": "https://www.gutenberg.org/", "citation": "Textos do Projeto Gutenberg (ebooks 11, 74, 1661)."},
    "license": {"name": "Domínio público (EUA); textos sem o cabeçalho/licença do Projeto Gutenberg",
                "reference_list": "domínio público"},
}


def body(text: str) -> str:
    start = re.search(r"^\*\*\* START OF THE PROJECT GUTENBERG EBOOK.*$", text, re.M)
    end = re.search(r"^\*\*\* END OF THE PROJECT GUTENBERG EBOOK.*$", text, re.M)
    return text[start.end() if start else 0:end.start() if end else len(text)]


def chapters(text: str, heading: str) -> list[tuple[str, str]]:
    """[(título, texto)] dos trechos entre títulos; descarta o sumário (trechos curtos)."""
    marks = list(re.finditer(heading, text, re.M))
    out = []
    for i, m in enumerate(marks):
        chunk = text[m.end():marks[i + 1].start() if i + 1 < len(marks) else len(text)].strip()
        if len(chunk) > 2000:
            chunk = re.sub(r"_([^_]{1,200})_", r"\1", chunk)          # itálico do Gutenberg (_palavra_)
            out.append((m.group(0).strip(), re.sub(r"\n{3,}", "\n\n", chunk)))
    return out


def main(argv=None):
    ap = _common.parser(__doc__.splitlines()[1])
    ap.add_argument("--per-work", type=int, default=6, help="capítulos por obra")
    args = ap.parse_args(argv)
    path = _common.new_project(args, FICHA)
    meta = {}
    with ttwtools.open_project(path) as p:
        for w in WORKS:
            text = body(_common.download(URL.format(id=w["id"]), f"pg{w['id']}.txt").read_text(encoding="utf-8"))
            for n, (title, chunk) in enumerate(chapters(text, w["heading"])[:args.per_work], 1):
                fname = f"{w['slug']}_{n:02d}.txt"
                p.add_corpus_text("demo", fname, chunk)
                meta[fname] = {k: w[k] for k in ("author", "work", "year", "variety")} | {"chapter": title}
        apply_metadata(p, "demo", meta)
        print(f"{len(meta)} documentos importados")
        _common.tag(p, "demo", args)
    _common.finish(args, path, FICHA, "python tools/corpora/demo.py")


if __name__ == "__main__":
    main()
