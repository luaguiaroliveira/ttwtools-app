## 1) What “tagging” means in Stanza

In Stanza, “POS tagging” typically refers to predicting these **Universal Dependencies (UD)** token-level annotations:

- **UPOS** (`token.upos`): Universal Part-of-Speech tag (coarse POS)
- **XPOS** (`token.xpos`): Language/treebank-specific POS tag (fine POS)
- **FEATS** (`token.feats`): Morphological features (attribute-value pairs)

Stanza’s POS component (the `pos` processor) sets all three fields on the document when available:

- `doc.UPOS`
- `doc.XPOS`
- `doc.FEATS`

Reference (POS processor writes all three):
- `stanza/pipeline/pos_processor.py`  
  https://github.com/stanfordnlp/stanza/blob/516b07140fdfdafdebc813ed8f3253097da5efd3/stanza/pipeline/pos_processor.py

---

## 2) Main tagging outputs (what you can obtain)

### 2.1 UPOS (Universal POS tags)
**What it is:** a fixed universal tagset used across languages in UD.

**Typical examples:** `NOUN`, `VERB`, `ADJ`, `PROPN`, `PRON`, `ADV`, `ADP`, `DET`, `NUM`, `CCONJ`, `SCONJ`, `PUNCT`, etc.

**When to use:**
- You want a stable, comparable tagset across datasets.
- You want coarse POS categories suitable for downstream features.

**How to inspect known UPOS tags from a loaded model:**
- `POSProcessor.get_known_upos()`

---

### 2.2 XPOS (Treebank-specific POS tags)
**What it is:** a fine-grained tagset that can depend on the **dataset/treebank** (more detailed than UPOS).

**For English models**, XPOS often resembles Penn Treebank-style tags (e.g., `NN`, `NNS`, `VBZ`, `VBD`, `JJ`, `RB`, etc.), but this depends on which Stanza English package/model you load.

**Important:** XPOS can be implemented as a **composite** tag internally in Stanza (split into multiple sub-classifiers depending on separators used by a treebank). This is mostly an internal modeling detail, but it affects how “known XPOS tags” are represented when introspecting vocabularies.

**How to inspect XPOS tags from a loaded model:**
- `POSProcessor.get_known_xpos()`
- `POSProcessor.is_composite_xpos()`

---

### 2.3 FEATS (Morphological features)
**What it is:** UD morphological features, represented as a set of attribute-value pairs, typically serialized like:

- `Number=Sing`
- `Tense=Past|VerbForm=Fin`
- `Degree=Cmp`
- etc.

**When to use:**
- You need morphology (tense/number/person/case/degree…).
- You want richer linguistic features than POS alone.

**How to inspect which features/values the model knows:**
- `POSProcessor.get_known_feats()`

---

## 3) Tagging “modes” conceptually supported by the tagger

Internally, Stanza’s tagger logic distinguishes cases like:
- **AllTags**: UPOS + XPOS + FEATS
- **UPOS-only**
- **XPOS-only**

This depends on what is present/expected in data and what the model supports. For typical **pipeline inference** on raw English text, you should assume you can obtain **UPOS, XPOS, and FEATS** when using the standard English models.

---

## 4) Working with raw `.txt` corpora (folders of text files)

### 4.1 What you must run before tagging
For raw text, Stanza needs at least:
- `tokenize` (sentence splitting + tokenization)
- `pos` (UPOS/XPOS/FEATS tagging)

Common pipeline processor chain:
- `processors="tokenize,pos"`

You can also add:
- `lemma` (lemmatization)
- `depparse` (dependency parsing)
- `ner` (named entity recognition)

But **POS tagging itself** is provided by the `pos` processor, and it **requires tokenization**.

---

### 4.2 Recommended outputs to store per token (implementation guidance)
When processing `.txt` files, you will likely want to persist a token table per document, e.g.:

- document id (file path)
- sentence index
- token index
- token text
- start_char / end_char (if you need offsets)
- **upos**
- **xpos**
- **feats**

Optionally:
- lemma (if you also run `lemma`)
- head / deprel (if you run `depparse`)

---

## 5) What your app can expose as “tagging options” for English `.txt` corpora

Below is a practical way to present “options” to users and to structure implementation.

### Option A — “Coarse POS tagging (UPOS)”
**Produces:**
- `token.upos`

**Use cases:**
- Basic POS features, fast filtering, coarse syntactic categorization.

**Notes:**
- Stable tag inventory across UD languages.

---

### Option B — “Fine POS tagging (XPOS)”
**Produces:**
- `token.xpos`

**Use cases:**
- More fine-grained POS (treebank-specific).
- Potentially better for English-specific heuristics and rules.

**Notes:**
- The tagset is model/package-dependent.
- Some models may represent XPOS internally in composite form, but you will still get a final XPOS value per token for typical inference.

---

### Option C — “Morphological tagging (FEATS)”
**Produces:**
- `token.feats` (string or structured feature map depending on how you read it)

**Use cases:**
- Grammar features (tense, number, verb form, degree, etc.).

**Notes:**
- FEATS availability/quality varies by language and training data; for English, features exist but are typically less rich than for highly inflected languages.

---

### Option D — “Full UD tagging (UPOS + XPOS + FEATS)”
**Produces:**
- `token.upos`
- `token.xpos`
- `token.feats`

**Use cases:**
- You want everything the POS tagger provides.
- Good default for exporting a richly annotated corpus.

---

## 6) How to introspect available tags from the loaded English model (useful for UI/config)

Stanza exposes helper methods on the POS processor to list what the model “knows”:

- `get_known_upos()` → list of UPOS labels
- `get_known_xpos()` → list/dict of XPOS labels (may differ if composite)
- `get_known_feats()` → dict of feature-name -> possible values

Reference:
- https://github.com/stanfordnlp/stanza/blob/516b07140fdfdafdebc813ed8f3253097da5efd3/stanza/pipeline/pos_processor.py

Implementation suggestion:
- After creating the pipeline, access the POS processor instance and call these methods to populate:
  - a UI “tag inventory” view
  - validation rules
  - documentation/export metadata

---

## 7) Practical processing flow for folders of `.txt` files (high-level)

1. Enumerate `.txt` files in the corpus folder (optionally recursively).
2. For each file:
   1) read UTF-8 text  
   2) run Stanza pipeline (`tokenize,pos` at minimum)  
   3) extract per-token fields (text, upos, xpos, feats, sentence boundaries, offsets if needed)  
   4) write results to your desired format (JSONL, CSV, Parquet, CoNLL-U-like, etc.)
3. Optionally, keep a cache keyed by file hash + model version.

---

## 8) Notes and pitfalls (English + raw text)

- **Tokenizer matters:** tag quality depends on tokenization and sentence splitting. If your `.txt` contains unusual formatting (lists, tables, OCR artifacts), consider normalizing text beforehand.
- **Tagsets depend on model/package:** do not hardcode the full list of XPOS tags; use introspection (`get_known_xpos`) if you need to show them.
- **FEATS may be `_` or empty** for many tokens; that’s normal.

---

## 9) Canonical fields written by the POS processor (for confidence)

The POS processor sets the following fields on the document:
- `UPOS`
- `XPOS`
- `FEATS`

This happens here:
- https://github.com/stanfordnlp/stanza/blob/516b07140fdfdafdebc813ed8f3253097da5efd3/stanza/pipeline/pos_processor.py

---

## 10) “Done definition” for the feature in your app (suggested)

Your feature is complete when:
- It can process a folder of `.txt` files into an annotated representation.
- It can output at least:
  - token text
  - UPOS
  - XPOS
  - FEATS
- It provides configuration toggles (at least in code) for:
  - `UPOS only` vs `XPOS only` vs `FEATS only` vs `ALL`
- It can introspect the loaded model tag inventories for debugging/documentation.
