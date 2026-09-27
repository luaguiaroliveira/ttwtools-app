# TTWtools

*[Versão em português: LEIAME.md](LEIAME.md)*

A corpus analysis application for linguistics teaching and research: gather texts in a **project**, **tag** them (spaCy, Stanza, BiberPlus, MFTE), **explore** (search, KWIC, frequency, collocates, dispersion, reader) and **compare** (keywords, frequency bands, Biber's KFA and a lab for N groups). Everything runs on your computer; no text leaves the machine.

Everything the application does can also be done from the command line and in Python with the [`ttwtools`](https://github.com/luaguiaroliveira/ttwtools) package, and every analysis has a **"Copy as code"** button with the equivalent command.

> **Version 0.4 (testing).** This is the new line, redesigned from the KFA-focused version. Changes in [`CHANGELOG.md`](CHANGELOG.md).

## Contents

1. [Install](#install)
2. [First analysis](#first-analysis)
3. [What each screen does](#what-each-screen-does)
4. [Projects and files](#projects-and-files)
5. [Corpus and model catalog](#corpus-and-model-catalog)
6. [Languages](#languages)
7. [Command line and Python](#command-line-and-python)
8. [Input and output formats](#input-and-output-formats)
9. [Running from source](#running-from-source)
10. [Licence, citation and contributing](#licence-citation-and-contributing)

## Install

Download the package for your system from the [releases](https://github.com/luaguiaroliveira/ttwtools-app/releases) page (and check `SHA256SUMS.txt` if you wish).

| System | File | How to open |
|---|---|---|
| macOS 12 or later, Apple Silicon | `TTWtools-<version>-macos-arm64.dmg` | drag TTWtools to Applications |
| macOS 12 or later, Intel | `TTWtools-<version>-macos-x86_64.dmg` | same |
| Windows 10/11 (64-bit) | `TTWtools-<version>-windows-x86_64.zip` | unzip and run `TTWtools\TTWtools.exe` |
| Linux (x86_64) | `TTWtools-<version>-linux-x86_64.tar.gz` | extract and run `TTWtools/TTWtools` |

- **macOS:** the application is not signed yet. The first time, right-click TTWtools → **Open** → **Open**.
- **Windows:** SmartScreen may warn about an unsigned executable: **More info** → **Run anyway**.
- **Intel Macs:** the available `torch` is older (2.2.2). Stanza and MFTE work, but if a tagger cannot run the screen shows why; spaCy and BiberPlus do not depend on it.

The package ships spaCy's `en_core_web_sm`. Other models (larger English ones, Portuguese) are downloaded by the application itself, in **Modules**.

## First analysis

1. **Create a project.** In **Corpora**, type a path ending in `.ttwa` (e.g. `~/Documents/class.ttwa`) and click **Create new**. A project is a single file holding texts, annotations and results.
2. **Add a corpus.** **Add corpus** → choose a folder of `.txt` files (or paste a text). Metadata can come from file names (e.g. `student_B1_2024.txt` → fields `student`, `level`, `year`) or from a CSV. Under **File format**, CoNLL-U, `word/TAG` (Brown, LOB), TEI/BNC XML and GrAF (OANC/MASC) are also accepted.
3. **See the overview.** Click the corpus and **Compute**: number of texts and words, lexical richness (TTR, STTR, MATTR), most frequent words. This works before tagging.
4. **Tag.** In **Tag**, choose the tagger and a shortcut (**Fast**, **Recommended**, **Most accurate**) or open **Customize**. Nothing is tagged twice: documents that already have an equivalent layer are reused.
5. **Explore.** In **Explore**, search words, lemmas (`lemma=run`), classes (`pos=NOUN`) and phrases (`black cat`); see KWIC, frequency, collocates and dispersion.
6. **Compare.** In **Compare**, run keywords against another corpus, a group of the same corpus or a catalog list, and KFA between two corpora or groups.

On any screen: the **?** next to a metric explains what it measures; **Explain this screen** shows what each part is for; **Learn** has guided tours and the glossary.

## What each screen does

- **Corpora:** open project (save as, split into `.ttwl`, export texts), corpus library, overview, tagging, layers (export as CoNLL-U, VRT, CSV) and **Catalog**.
- **Explore:** Search (totals per document or group), KWIC (sorting, context, export), Frequency (form, lemma, word+class, class, n-grams; hide function words), Collocates (LL, MI, T-score), Dispersion (Gries's DP, Range, per-text plot) and Reader (text with tags, printing).
- **Compare:**
  - **Keywords:** LL, log ratio, %DIFF, log-odds; Bonferroni or FDR correction; dispersion filter; warnings when corpora are not comparable (different tagger, small size).
  - **KFA:** Cohen's d per feature (Biber & Egbert's `kfa` and the size-weighted `kfa2`), with a chart gallery (diverging bars, means, radar, heatmap, PCA, t-SNE, MDS, optional UMAP).
  - **Frequency bands:** how much of the text is among a reference's 1,000, 2,000… most frequent words.
  - **Lab** *(experimental)*: N groups — one against all, pairwise, Kruskal-Wallis, profile space, dendrogram and "my text against references".
- **Learn:** help topics, tours and the interactive Cohen's d figure.

Every table and chart has **Export** (CSV, TXT, SVG, PNG) and **Copy as code**.

## Projects and files

| Extension | What it is |
|---|---|
| `.ttwa` | full project: texts, metadata, annotation layers and saved analyses (SQLite) |
| `.ttwl` | light project: annotations and analyses, with the texts in a folder next to it (good for large or versioned corpora) |
| `.ttwt` | compressed `.ttwa` for sending or archiving; opens directly in the application |

- A **layer** is the output of a tagger (with version, model and options) on a document. A corpus can have several layers (spaCy and BiberPlus, say), and analyses record which one they used.
- Projects from the previous version (schema 0.2) are converted on opening, with a backup copy.
- On macOS, double-clicking a `.ttwa`, `.ttwl` or `.ttwt` opens the application with the project.

## Corpus and model catalog

In **Modules**:

- **Ready-made corpora** (already tagged, with a record card: language, variety, period, genres, size, licence, source). Each redistributable corpus also has a small package with just its **frequency lists**, which is enough to use it as a reference for keywords and frequency bands (`catalog:<id>`). Corpora whose licence does not allow redistribution appear as a **recipe** (the command to prepare your own copy).
- spaCy **models** (English and Portuguese) to download on demand.

Everything goes to the **user data folder** (shown at the bottom of the panel): `~/Library/Application Support/TTWtools` on macOS, `%LOCALAPPDATA%\TTWtools` on Windows, `~/.local/share/TTWtools` on Linux. The `TTWTOOLS_DATA_DIR` variable changes it.

> The public catalog address has not been decided yet; for now, enter the address of a `catalogo.json` (URL or file) in the panel. The scripts that build the packages are in [`tools/corpora/`](tools/corpora/README.md).

## Languages

- **Interface:** Portuguese and English (⚙ at the top).
- **Corpora:** English (all taggers) and Portuguese (spaCy `pt_core_news_*` and Stanza with the bosque, cintil, gsd, petrogold, porttinari and dantestocks treebanks). The application detects the corpus language and suggests the right model; function words follow the corpus language. BiberPlus and MFTE are English only.

## Command line and Python

The `ttwtools` package comes with the application source (`libs/ttwtools`) and can be installed on its own (its repository is still private; with access, or from the submodule):

```bash
pip install -e libs/ttwtools          # or: pip install "git+https://github.com/luaguiaroliveira/ttwtools.git"
ttwtools --help
```

Examples (the same ones **Copy as code** produces):

```bash
ttwtools import class.ttwa texts/ --name essays --fields student,level,year
ttwtools tag class.ttwa --corpus essays --tagger spacy --preset recomendado
ttwtools describe class.ttwa --corpus essays --layer spacy
ttwtools kwic class.ttwa "lemma=make" --corpus essays --context 6
ttwtools keywords class.ttwa --corpus essays --reference catalog:brown --unit lemma
ttwtools compare class.ttwa --corpus essays --layer biberplus --where level=B1 --where2 level=C1
ttwtools compare class.ttwa --corpus essays --layer spacy --group-by level --method one_vs_rest
ttwtools catalog download-model pt_core_news_sm
ttwtools help cohens_d
```

In Python:

```python
import ttwtools

with ttwtools.open_project("class.ttwa") as proj:
    ttwtools.tag_corpus(proj, "essays", "spacy", preset="recomendado")
    kw = ttwtools.keywords(proj, "essays", "catalog:brown", unit="lemma")
    print(kw["rows"][:10])
```

Quick guide and reference for every function: [`libs/ttwtools/docs/`](libs/ttwtools/docs/README.md).

## Input and output formats

| Format | Import | Export |
|---|---|---|
| Text (`.txt`, folder, CSV with a text column) | yes | texts next to the project |
| CoNLL-U (Universal Dependencies) | yes, with the layer | yes |
| `word/TAG` (Brown, LOB from NLTK) | yes, with the layer | — |
| TEI P5 and BNC XML | yes; with `<w>`, becomes a layer | — |
| GrAF standoff (OANC, MASC) | yes, with the layer (PTB and UPOS) | — |
| VRT (CWB, Sketch Engine, CQPweb) | — | yes |
| Token table (CSV, JSONL, Parquet) | — | yes |
| Reference frequency list (`.tsv` with record card) | yes (as reference) | yes (`ttwtools reference-list`) |

## Running from source

Requires [git-lfs](https://git-lfs.com/) (`git lfs install`), Conda and Node.js 22.

```bash
git clone --recurse-submodules https://github.com/luaguiaroliveira/ttwtools-app.git
cd ttwtools-app
conda env create -f environment.yml -n ttw314 && conda activate ttw314
pip install --no-deps -e libs/ttwtools -e .
(cd frontend-vue && npm ci && npm run build)
python -m app --mode desktop   # or --mode web and open http://127.0.0.1:8765
```

On an Intel Mac with macOS 12, use Python 3.11 and `torch==2.2.2` (see [`CONTRIBUTING.md`](CONTRIBUTING.md)). Tests, package builds and releases: [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`RELEASING.md`](RELEASING.md).

## Licence, citation and contributing

- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md). The design is in [`novodesenho/novomodelo.md`](novodesenho/novomodelo.md) and progress in [`novodesenho/plano_implementacao.md`](novodesenho/plano_implementacao.md) (in Portuguese).
- Catalog corpora have their own licences, recorded in each record card; respect them when publishing results.
