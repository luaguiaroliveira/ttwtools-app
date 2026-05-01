# POS Tagging with spaCy (English) from a Folder of `.txt` Files (Python)

This guide shows how to run **part-of-speech (POS) tagging** with **spaCy** over a simple corpus made of plain text files (`.txt`) stored in a directory.

You will get two tag layers per token:

- **Universal POS (UPOS)** via `token.pos_` (coarse-grained, e.g. `NOUN`, `VERB`)
- **Penn Treebank tag** via `token.tag_` (fine-grained, e.g. `NN`, `VBD`)

---

## 1) Install spaCy and an English pipeline

Pick one English model (small/medium/large or transformer). For quick experiments, `en_core_web_sm` is enough:

```bash
python -m pip install -U spacy
python -m spacy download en_core_web_sm
```

Then in Python:

```python
import spacy
nlp = spacy.load("en_core_web_sm")
```

---

## 2) Folder layout (example)

Assume your corpus is:

```
corpus/
  doc1.txt
  doc2.txt
  news_001.txt
  ...
```

Each file contains raw text.

---

## 3) Basic: Tag a single text

```python
import spacy

nlp = spacy.load("en_core_web_sm")
text = "Apple is looking at buying U.K. startup for $1 billion."

doc = nlp(text)
for token in doc:
    print(token.text, token.pos_, token.tag_)
```

Example output columns:

- `token.text`: surface form
- `token.pos_`: UPOS (universal POS)
- `token.tag_`: Penn Treebank tag

---

## 4) Process all `.txt` files in a folder

### 4.1 Read files and run spaCy efficiently with `nlp.pipe`

`nlp.pipe` is much faster than calling `nlp(text)` in a loop.

```python
from pathlib import Path
import spacy

CORPUS_DIR = Path("corpus")
nlp = spacy.load("en_core_web_sm")

# Collect file paths
paths = sorted(CORPUS_DIR.glob("*.txt"))

def iter_texts(paths):
    for p in paths:
        yield p.read_text(encoding="utf-8", errors="replace")

# Process texts as a stream
for path, doc in zip(paths, nlp.pipe(iter_texts(paths), batch_size=32)):
    print(f"\n=== {path.name} ===")
    for token in doc:
        # skip whitespace tokens if desired
        if token.is_space:
            continue
        print(token.text, token.pos_, token.tag_)
```

Notes:
- `errors="replace"` makes decoding robust for messy corpora.
- Adjust `batch_size` for throughput.

---

## 5) Export results to CSV (one token per row)

A common corpus-friendly format is “long form”: one row per token, including document name and token attributes.

```python
from pathlib import Path
import csv
import spacy

CORPUS_DIR = Path("corpus")
OUT_CSV = Path("pos_tags.csv")

nlp = spacy.load("en_core_web_sm")
paths = sorted(CORPUS_DIR.glob("*.txt"))

def iter_texts(paths):
    for p in paths:
        yield p.read_text(encoding="utf-8", errors="replace")

with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "doc_id",
        "token_i",
        "text",
        "lemma",
        "upos",
        "ptb_tag",
        "is_alpha",
        "is_stop"
    ])

    for path, doc in zip(paths, nlp.pipe(iter_texts(paths), batch_size=32)):
        for token in doc:
            if token.is_space:
                continue
            writer.writerow([
                path.name,
                token.i,
                token.text,
                token.lemma_,
                token.pos_,   # Universal POS tag
                token.tag_,   # Penn Treebank tag
                token.is_alpha,
                token.is_stop
            ])

print(f"Wrote: {OUT_CSV}")
```

---

## 6) Count POS frequencies across the entire corpus

### 6.1 UPOS counts

```python
from pathlib import Path
from collections import Counter
import spacy

CORPUS_DIR = Path("corpus")
nlp = spacy.load("en_core_web_sm")

paths = sorted(CORPUS_DIR.glob("*.txt"))

def iter_texts(paths):
    for p in paths:
        yield p.read_text(encoding="utf-8", errors="replace")

upos_counts = Counter()

for doc in nlp.pipe(iter_texts(paths), batch_size=32):
    for token in doc:
        if token.is_space:
            continue
        upos_counts[token.pos_] += 1

print("Top UPOS tags:")
for tag, n in upos_counts.most_common(20):
    print(f"{tag:6s} {n}")
```

### 6.2 Fine-grained PTB counts

```python
ptb_counts = Counter()

for doc in nlp.pipe(iter_texts(paths), batch_size=32):
    for token in doc:
        if token.is_space:
            continue
        ptb_counts[token.tag_] += 1

print("Top PTB tags:")
for tag, n in ptb_counts.most_common(30):
    print(f"{tag:6s} {n}")
```

---

## 7) Practical tips for corpus processing

- **Disable components you don’t need** for speed. POS tagging requires the tagger. Many models also include a parser and NER by default.
  - If you only need POS + lemmatization, you can often disable `ner` (and sometimes `parser`) to speed things up.
- **Use `nlp.pipe`** for batch processing.
- **Consider sentence boundaries**: `doc.sents` is available if the pipeline includes a parser or a sentencizer.

Example: disable NER to speed up:

```python
import spacy
nlp = spacy.load("en_core_web_sm", disable=["ner"])
```

---

## 8) What you can do with POS tags in a corpus

- Build frequency profiles (e.g., verb-heavy vs noun-heavy documents)
- Extract patterns like adjective+noun phrases
- Filter tokens by POS (e.g., keep only `NOUN`/`PROPN` for keywording)
- Compare corpora or subsets (e.g., by folder, date, author)

Example: keep only nouns and proper nouns:

```python
keep = {"NOUN", "PROPN"}
keywords = [t.lemma_.lower() for t in doc if t.pos_ in keep and t.is_alpha]
```

---

## 9) Quick reference: `pos_` vs `tag_`

- `token.pos_` → **UPOS** (universal, small set)
- `token.tag_` → **Penn Treebank** (fine-grained, English-specific)

In most English spaCy pipelines:
- Use **UPOS** for cross-lingual / simpler analytics
- Use **PTB tags** for English-specific syntactic detail