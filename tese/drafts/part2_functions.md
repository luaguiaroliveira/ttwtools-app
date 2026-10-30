# Part II: Functions of TTWtools

## 1. Scope and Organization

This part describes the functions of TTWtools from the user’s point of view. It explains what each function does, which inputs it accepts, what it returns, which method it applies, and which limits the user should keep in mind. The description refers to application version 0.8.3 and package version 0.3.1. The term “function” here means a user-facing operation, not a single function in the source code. Some operations combine several package functions and several interface actions.

The application is organized into eight areas: File, Tagging, Explore, Reader, Compare, Writing, Learn, and Resources. The same operations are available through the graphical interface, the command line, the Python package, and a local REST API. Part I explained why this parity exists. Part II describes what the parity makes available.

Two areas are marked experimental: the Lab, for comparisons of several groups, and Writing, for the comparison of a single text with a reference corpus. Their results are descriptive or exploratory, and their interfaces state this. The remaining functions are part of the stable workflow.

The description follows the order of a typical project: create and fill a project, tag the corpus, explore it, compare corpora or groups, analyze a single text, consult the help, install resources, and automate the analysis. The final section presents a matrix that maps each area to the interface, the command line, the Python API, and the local route.

## 2. Projects and Corpora

### 2.1 Creating and Opening Projects

A project is the unit that holds corpora, metadata, annotation layers, and saved analyses. The user creates a project by choosing a path with the `.ttwa` extension. The application writes a new SQLite database, compresses it by default, and continues working on a temporary copy. The original file is updated when the user saves. The user can also create an uncompressed project, which opens without decompression and is larger on disk.

The application opens `.ttwa`, `.ttwl`, `.ttwt`, `.ttwc`, `.ttwcl`, and `.ttwal` files. A `.ttwl` project stores the texts in a folder next to the project file and keeps only the relative paths and content hashes inside the database. A `.ttwt` file is a compressed archive used for sending or archiving. The recent-files list stores the last projects opened by the application and by the command line.

When an older project is opened, the application migrates it to the current schema. The migration adds the tables introduced in version 0.3 and reports how many documents, layers, and tokens were converted. Projects that use the old TSV format are detected, and the application warns that those files were not indexed. The migration does not delete the original data. It writes the new structures and records the schema version.

The File area also provides maintenance operations:

**Table 4: Project maintenance operations**

| Operation | What it does | Command |
|---|---|---|
| Save | Writes the current working copy to the project file | `ttwtools save-as` writes a copy; the interface saves in place |
| Save as | Writes the project to another path and can switch to the new file | `ttwtools save-as` |
| Compact | Removes legacy tagged copies that are proven identical to existing layers | `ttwtools compact` |
| Build index | Builds the search index for a project saved without search tables | `ttwtools index build` |
| Cache status | Shows or clears the index cache and abandoned work folders | `ttwtools cache` |
| Recent files | Lists, removes, or clears recently opened projects | `ttwtools recent` |

The save options control two properties. The first is compression. A compressed project occupies less space and opens through a decompression step. An uncompressed project opens directly and is larger. The second is whether the file contains the search tables. A file with search tables answers queries without building an index. A file without search tables is smaller and uses an index in the cache when needed. The application remembers these options in the project.

The project type is inferred from the extension:

**Table 5: Project file types**

| Extension | Content | Typical use |
|---|---|---|
| `.ttwa` | Texts, layers, and analyses inside one file | Personal project, archive, exchange |
| `.ttwl` | Layers and analyses inside; texts in a folder next to the file | Large corpora, version control |
| `.ttwt` | Compressed archive of a project | Sending or archiving |
| `.ttwc` | One corpus with texts inside | Sharing a single corpus |
| `.ttwcl` | One corpus with texts outside | Large single corpus |
| `.ttwal` | A selection of corpora with texts outside | Exporting part of a project |

The application converts between the two main project types. “Detach corpus” turns a `.ttwa` into a `.ttwl` plus a folder of texts. “Embed corpus” turns a `.ttwl` into a `.ttwa` and brings the texts inside. The conversion checks the hashes of the texts. If a text is missing or has changed, the application reports the problem and does not silently attach a different text to existing layers. “Relink corpus” points a `.ttwl` to another folder after checking the hashes. “Export texts” writes the corpus to a folder next to the project.

### 2.2 Importing Texts and Metadata

A corpus can be imported from a folder of `.txt` files, a single text file, a CSV file with a text column, or text pasted into the interface. The application accepts a corpus name and, optionally, a metadata schema derived from the filenames. A filename such as `student_B1_2024.txt` can be read with the delimiter `_` and the fields `student`, `level`, and `year`. The interface shows a preview of the parsed names before the import, so the user can correct the delimiter or the field list.

Metadata can also come from a CSV file with one row per document and a column that identifies the filename. The metadata keys become available for filters and groupings in all analyses. Examples are proficiency level, genre, year, author, school, and task. The application reports the number of imported documents and the metadata keys it found.

In addition to plain text, the application imports annotated formats:

**Table 6: Import formats for annotated corpora**

| Format | What is imported | Result |
|---|---|---|
| CoNLL-U | Sentences with tokens, lemmas, UPOS, XPOS, morphology, and dependencies | Documents plus a layer from the source annotation |
| `word/TAG` (Brown, LOB) | Token and tag pairs | Documents plus a layer from the source tag set |
| TEI P5 and BNC XML | Text and, when `<w>` elements are present, word-level annotation | Documents plus a layer when annotation exists |
| GrAF (OANC, MASC) | Standoff annotation with token and tag references | Documents plus a layer with the available tags |

Imported annotated corpora are not retagged. The source annotation becomes a layer, and the text is preserved. This allows a corpus such as Brown, LOB, OANC, or MASC to be explored with the same tools as a personal corpus.

The import functions are available in the interface and in the package. The command line uses `ttwtools import`; the interface uses the import wizard; the Python API uses `ttwtools.import_corpus` and the functions in `ttwtools.formats`. The `ttwtools names` command shows how filenames would be parsed without importing anything.

### 2.3 Corpus Overview

The corpus overview describes the corpus before and after tagging. The first level uses only the text and a simple tokenizer. It reports the number of documents, word tokens, types, and hapax legomena; the type/token ratio (TTR); the corrected TTR of Carroll (CTTR); the standardized TTR (STTR) over blocks of a chosen size; the moving-average TTR (MATTR) over a chosen window; the mean word length; the number of sentences; the mean sentence length; the distribution of document sizes (minimum, median, maximum, mean, and standard deviation); the most frequent words; and the first part of the Zipf curve.

Because this level does not use a tagger, the numbers are estimates. A tagger may split contractions, punctuation, and compounds differently. The interface states this. The user can hide function words from the list of frequent words, choose the stopword language, set the block size for STTR, set the window for MATTR, and choose how many items to show.

The second level uses a layer. It reports the distribution of UPOS, XPOS, and tagger tags; lexical density, defined as the proportion of content words among the words of the layer; sentence length according to the tagger segmentation; the most frequent lemmas by part of speech; and, for the main tags, the mean and standard deviation per 1,000 words across documents. The last measure shows how homogeneous the corpus is: a high standard deviation means that the tag is unevenly distributed across texts.

The overview is stored in the analyses table and reused while the texts, layers, and parameters do not change. The interface presents the results as numbers, tables, and charts. The command line uses `ttwtools describe`; the Python API uses `ttwtools.describe`. The same function accepts a metadata filter, so the user can describe a subgroup rather than the whole corpus.

### 2.4 The Pipeline

The pipeline is a list of operations to run on a corpus. It can contain basic statistics and one or more tagging layers, each with its options. The list is stored in the project, so the user can leave and return later. When the user runs the pipeline, the application executes the tagging steps in order and the statistics at the end. It calculates only what is missing. Layers that already satisfy a step are reused, and documents with identical texts can receive a copy of an existing layer.

The interface shows progress by step and by document. If the run is interrupted, completed documents remain completed. The user can add, remove, or clear steps. The command line uses `ttwtools pipeline`; the Python API uses the functions in `ttwtools.pipeline`.

The pipeline is useful in large corpora and on slow machines. It turns a set of separate operations into one planned run, and it makes the order of operations explicit. It also records what the user intended to do, which helps when the project is reopened months later.

## 3. Tagging and Layers

### 3.1 Choosing a Tagger

TTWtools integrates four taggers. They differ in what they produce, which languages they support, and which dependencies they require.

**Table 7: Integrated taggers**

| Tagger | What it produces | Languages | Dependencies | Notes |
|---|---|---|---|---|
| spaCy | Tokenization, UPOS, Penn Treebank tag, lemma, morphology | English and Portuguese | spaCy and a model | Models of different sizes, downloaded on demand |
| Stanza | Tokenization, UPOS, XPOS, lemma, morphology | English and Portuguese | Stanza and torch | Also used as the tokenizer for MFTE |
| BiberPlus | About 67 Biber features | English | biberplus and spaCy | Rule-based features; the current app path uses a spaCy-based pipeline |
| MFTE | A standard and an extended set of features | English | Stanza, torch, and MFTE | The extended set is larger and slower |

spaCy and Stanza are trained models. Their decisions come from statistical patterns learned from annotated data. BiberPlus applies explicit rules to identify features from the Biber tradition. MFTE uses Stanza for tokenization and a separate tagger for the feature set. The application does not treat these tools as equivalent. Each layer records the tool, the version, the model, and the configuration, and each analysis records which layer it used.

The application can detect the language of a corpus from its layers or from its function words and suggest a model. The user can change the model. BiberPlus and MFTE are limited to English. spaCy and Stanza have English and Portuguese models.

Each tagger has a tag set. The interface shows the tag set with definitions and examples. The same definitions appear in the Reader and in the Learn area. The tag set can be searched and grouped. The purpose is to let the user interpret a tag before interpreting a count.

### 3.2 Presets and Options

The application offers three presets: Fast, Recommended, and Most accurate. A preset fills the options of the tagger. The user can then open the Customize panel and change individual options. The panel groups the options into model and language, what to extract, performance, and advanced settings.

The options are marked as result-changing or performance-only. A result-changing option enters the layer identity and invalidates reuse when it changes. A performance-only option does not. Examples of result-changing options are the model, the active components, the Stanza package, the decision to extract lemmas, and the BiberPlus function-word setting. Examples of performance-only options are batch size, the number of processes, and the device.

The option panel also checks availability. If a spaCy model is not installed, the panel offers to download it and shows its size. If a Stanza package is missing, the panel shows the command or the download action. If torch is not available on the machine, Stanza and MFTE are marked as unavailable with a reason. The application does not start a tagging run that cannot finish because of a missing dependency.

The tagger options and tag sets are available outside the interface. The command line uses `ttwtools tagger-options` and `ttwtools tagset`; the Python API uses `ttwtools.taggers`. The options descriptor is the same one used by the interface, so the explanation and the default values do not diverge.

### 3.3 Running Tagging and Managing Layers

Before tagging, the application can plan the run. The plan reports how many documents already have a sufficient layer, how many can copy a layer from a document with the same text, how many will be processed, and how many have no text available. A sufficient layer has the same tool, version, model, result-changing options, and equal or more components than the request. A layer with part of speech and lemma satisfies a request for part of speech only.

The tagging function processes only the documents that need work. It saves each document as it finishes. If the process is interrupted, the completed documents are kept. A new run reuses them and continues with the rest. The function returns the number of tagged, reused, and cloned documents, the number of missing texts, and the identifiers of the resulting layers.

The interface lists the layers of a corpus. For each layer, it shows the tool, version, model, configuration, number of tokens, and date. The user can export a layer to CoNLL-U, VRT, CSV, JSONL, or Parquet. The user can also count the occurrences of each tag in the corpus, which is useful for the Reader and for checking the tag distribution.

The no-rework rule applies here. Changing the number of processes does not create a new layer. Changing the model, the components, or a result-changing option does. The layer list makes this visible: it shows the configuration that produced each layer, so the user can compare layers and decide which one to use in an analysis.

## 4. Exploring a Corpus

### 4.1 Query Language

All exploration tools use the same query language. A query is a sequence of tokens separated by spaces. Each token can be a form, a lemma, a part of speech, a tag, or a regular expression.

The main forms are:

- `house`: form, case-insensitive.
- `hous*` and `hous?`: wildcards on the form.
- `/^run(s|ning)$/`: regular expression on the form, case-insensitive.
- `lemma=run`: lemma.
- `pos=NOUN`: UPOS or XPOS.
- `upos=NOUN` and `xpos=NN`: a specific tag inventory.
- `tag=PASS`: tagger tag, for BiberPlus and MFTE.
- `word=run`: form.
- `lemma=run&pos=VERB`: conditions on the same token, with `&` meaning “and”.
- `tag=PASS|NN`: alternatives on the same field, with `|` meaning “or”.
- `black cat`: phrase of two tokens.

The interface includes a tag picker that lists the tags of the active layer with their corpus counts. Clicking a tag adds it to the query, and the query remains editable. The query is evaluated on a layer. If the user does not choose a layer, each document uses its most recent layer. If a document has no layer, the application creates a simple layer with forms and positions, so that search, frequency, and KWIC work before tagging. If the query needs a field that the layer does not have, such as a lemma or a part of speech, the application selects the most recent layer that has that field and warns when the result may be empty.

The query can be restricted by metadata. A filter such as `level=B1` limits the documents. The same filter is used by the overview, the exploration tools, and the comparisons.

### 4.2 Search

The Search tool counts the occurrences of a query. It reports the total number of hits, the number of documents with at least one hit, the count per document, and, when the user chooses a metadata key, the count per group. The result includes a bar chart; the underlying rows can be exported, and the equivalent command or Python code can be copied.

Search is the simplest way to check whether a form, lemma, tag, or phrase occurs in the corpus and how it is distributed. It does not show the context of each occurrence. For context, the user opens KWIC. For dispersion, the user opens the Dispersion tool. The three tools share the same query language, so a query can be moved from one to another without rewriting it.

### 4.3 KWIC

KWIC shows each occurrence of the query with a chosen number of tokens to the left and to the right. Each line includes the left context, the match, the right context, the part of speech of the match, the filename, and the character position. The user can show the full sentence, change the context size, sort by position in the text, by the word on the left, or by the word on the right, and move through pages of results.

A click on a KWIC line opens the Reader at the matching position. The Reader shows the document with the layer’s tags, so the user can inspect the full context and the annotation. KWIC results can be exported and copied as code. The function returns the total number of matches, the current page, the sort order, and the lines.

KWIC is the central exploration tool for descriptive work. It connects a count to its occurrences and to the surrounding text. It also makes it possible to check whether a pattern found by a statistical measure corresponds to a recurring construction or to a few isolated cases.

### 4.4 Frequency

The Frequency tool lists the most frequent items in the corpus. The user chooses the unit: form, lemma, word plus class, class, or n-gram. For n-grams, the user chooses the length. The user also chooses whether to count by corpus, by document, or by a metadata group, how many items to show, whether to hide function words, and whether to count only words.

Each row reports the item, the absolute frequency, and the frequency per 1,000 words. The result can be shown as a bar chart or a table and can be exported. The function returns the unit, the grouping, the size of each group, and the rows.

The choice of unit has consequences. Form counts distinguish `run` and `running`. Lemma counts group them under the same lemma, but only if the layer has lemmas. Word plus class separates homographs, such as `run` as a verb and `run` as a noun. Class counts summarize the distribution of parts of speech. N-grams count sequences of forms but do not identify constructions in the sense of pattern grammar.

The tool warns when the chosen unit requires a field that the layer does not have. For example, a BiberPlus layer does not contain lemmas, so a lemma frequency on that layer would be empty. The interface asks the user to choose another layer or another unit.

### 4.5 Collocates

The Collocates tool finds the words that occur near a node. The node is a query in the same syntax as the other tools. The user chooses a window to the left and to the right, the unit, the minimum frequency, the measure used for sorting, and the number of rows.

The result reports, for each collocate, the observed frequency, the frequency of the collocate in the corpus, the expected frequency, mutual information (MI), the T-score, the log-likelihood, the side where it appears more often, and the number of different forms of the node that occur with it. The user can sort by log-likelihood, MI, T-score, or frequency.

The measures answer different questions. Frequency shows how often the collocate occurs near the node. MI shows how strongly the two items are associated, but it is unstable for rare items. The T-score favors frequent collocates. Log-likelihood compares the observed and expected frequencies in a 2×2 table and is the measure used in several corpus tools. The tool does not choose one measure as correct. It presents the measures side by side.

A click on a row opens examples of the collocate in context. Each example shows the node and the collocate, and a click opens the Reader at that position. The examples are paginated. The function returns the node frequency, the corpus size, the window, the unit, and the rows.

The interpretation depends on the window and the minimum frequency. A wide window includes syntactic and semantic relations that are not direct. A low minimum frequency includes rare pairs with unstable measures. The interface shows the window and the minimum frequency so the user can report them.

### 4.6 Dispersion

The Dispersion tool shows where a query occurs in each document. It reports the dispersion measures of Gries: DP, Range, and normalized DP. DP is half the sum of the absolute differences between the observed proportion of occurrences in each document and the expected proportion based on document size. A value near zero means a uniform distribution. A value near one means a concentrated distribution. Range is the number of documents in which the query occurs. Normalized DP divides DP by one minus the smallest expected proportion.

For each document, the result includes the number of tokens, the frequency of the query, the expected frequency, the observed frequency, and the absolute deviation between observed and expected. The interface can show the result as a heatmap of position bands, as a barcode, as a table of observed and expected values, or as a report of DP and Range per query. The heatmap divides each text into bands and shows the density of occurrences. The barcode shows each occurrence as a tick between the start and the end of the text.

The tool accepts several queries at once. Each query can have its own color. This is useful for comparing the dispersion of several tags or forms in the same corpus. The result can be exported, and a click on a text opens the Reader with the query highlighted.

The dispersion measures are descriptive. They do not test whether a distribution is statistically surprising. They help the user see whether a frequency is spread across the corpus or concentrated in a few texts. This distinction matters for keywords and for the interpretation of frequency lists.

### 4.7 Reader

The Reader shows a document with its annotation. The user chooses the corpus, the document, and the layer. The text is displayed with tags, and the side panel lists the tags of the layer with their counts and colors. The user can select one or more tags to mark them in the text, choose a markup style, and change the color. The markup styles include highlight, underline, circle, box, strike-through, and crossed-off.

The Reader also provides a search field for fragments, wildcards, and regular expressions, previous and next match navigation, a match counter, copy of the whole text or of the selection, print, zoom, font size, and text justification. The history buttons move back and forward between documents. The legend shows the tags and allows the user to highlight them by clicking. A tooltip shows the definition of a tag from the tag set used by the layer.

If the document has no layer, the Reader shows the text without tags. If the project is a `.ttwl` and the corpus folder is missing, the Reader reports that the text is unavailable. The Reader is linked from KWIC, collocate examples, dispersion charts, keyword results, and KFA charts, so the user can move from a result to the text and back.

## 5. Comparing Corpora and Groups

### 5.1 The Comparison Bar

The Compare area has a comparison bar that defines the two sides used by its tools. Side 1 is the active corpus. Side 2 can be another corpus in the project or a second group of the same corpus. The user chooses the group by metadata. The bar also defines the color of each side and, for KFA, the metric.

The comparison bar applies to Keywords, KFA, Frequency bands, Lab, and Dispersion. The layer used by an analysis follows the layer chosen at the top of the screen. If the layer changes after a result was computed, the interface warns that the result refers to the previous layer and offers to recompute. If the chosen unit requires a field that the layer does not have, the interface warns before the run.

The two sides can differ in size. The analyses report the number of texts and words on each side. Some methods, such as wKFA, account for unequal group sizes. Others, such as the simple difference of means, do not. The interface states which method is in use.

### 5.2 Keywords

Keywords compares a target corpus or group with a reference. The reference can be another corpus in the project, a group of the same corpus, a frequency list in `.tsv` format, or a list installed from the catalog. The target is defined by the active corpus and, optionally, by a metadata filter.

The user chooses the unit: form, lemma, part of speech, word plus class, or n-gram. The user also chooses the measure used for ordering, the minimum frequency in the target, the minimum number of target texts in which an item appears, the correction for multiple comparisons, and the number of items to show. The significance level is 0.05 by default, and the function accepts another value. The analysis can return items that are more frequent in the target and items that are less frequent.

The measures are:

**Table 8: Measures used in keyword analysis**

| Measure | What it expresses |
|---|---|
| Log-likelihood (LL) | Evidence that the difference is not due to chance |
| Log ratio | Size of the difference in relative frequency, on a log2 scale |
| %DIFF | Percentage difference between the two relative frequencies |
| Log-odds | Log of the odds ratio, with a small correction for zero cells |

The p-value of LL comes from a chi-square distribution with one degree of freedom. The correction can be Bonferroni, false discovery rate (Benjamini-Hochberg), or none. The result reports the raw p-value and the adjusted p-value, so the user can see the effect of the correction.

The result includes, for each item, the frequency and the frequency per 1,000 words on each side, the number of texts in which it appears, LL, p, adjusted p, log ratio, %DIFF, log-odds, z, direction, and significance. The table can be exported. A click on a row opens KWIC for that item.

The function also returns warnings about comparability. It warns when the target and the reference have different languages, when the unit depends on a tagger and the tools differ, when the tools have different versions, when the target or the reference is small, when the lemma field is missing, and when the target and the reference are the same data. These warnings do not block the analysis, but they qualify the result.

The interpretation requires both evidence and size. LL and adjusted p indicate whether a difference is unlikely under the null model. Log ratio and %DIFF indicate how large the difference is. A high LL with a small log ratio can be a frequent item with a small relative difference. A high log ratio with a low frequency can be an item that occurs once or twice and should be checked in KWIC. The dispersion filter reduces this risk by requiring the item to appear in a minimum number of target texts.

### 5.3 Key Feature Analysis

Key Feature Analysis (KFA) compares two corpora or two groups by their linguistic features. The features are the tags, UPOS, or XPOS of a layer. The function first builds a table with one row per document and one column per feature, with counts per 1,000 words. It then calculates Cohen’s d for each feature between the two sides.

The metric can be KFA or wKFA. KFA uses the pooled standard deviation of Biber and Egbert, defined as the square root of the mean of the two variances. wKFA uses the classic pooled standard deviation, weighted by the number of texts on each side. The second is preferable when the sides differ in size. The result reports the effect size, the means and standard deviations of each side, the raw counts, and the number of texts on each side.

The user chooses the minimum absolute d. This filter applies to the result already computed; changing it does not recalculate the counts. The result can be shown as a table and as a gallery of charts. The table has one row per feature and columns for the feature, effect size, mean and count on each side, and the per-1,000 values. The user can sort by feature, effect size, or count. A click on a feature opens the list of texts in which it occurs, ordered by frequency, and a click on a text opens the Reader.

The chart gallery includes diverging bars, a scatter of means, bubbles that combine difference and d, per-text strips, violin plots, histograms, heatmaps, parallel coordinates, radar charts, and dimension reductions. The reductions are PCA in two or three dimensions, t-SNE, MDS, and UMAP when the optional package is installed. The charts can be exported. Charts that represent individual texts can open the Reader.

KFA requires at least two documents on each side. With fewer documents, the variance is not estimable and the function refuses the analysis. The effect size is descriptive: it shows how far the sides are, in standard deviation units, on each feature. It does not by itself establish statistical significance, and the application does not present it as a test.

### 5.4 Frequency Bands

Frequency bands describe how much of the target text is made of the most frequent words of a reference. The user chooses a reference, a unit (form, lemma, or word plus class), and the band limits. The default bands are the first 1,000, 2,000, 3,000, 5,000, and 10,000 words of the reference, plus an off-list band for items outside the list.

For each band, the result reports the number of tokens, the number of types, the percentage of tokens, the percentage of types, and examples. The sum of the bands covers the target corpus. The measure follows the lexical frequency profile of Laufer and Nation.

The reference can be a frequency list, a corpus in the project, or a list from the catalog. When the reference is a corpus, the function can filter its documents by metadata. The target can also be filtered by metadata. The unit must be available in the layer, and the reference list must contain the same unit.

The interpretation depends on the reference and on the tokenization. A general reference shows how much of the text uses common vocabulary. A reference from the same genre shows finer differences. If the target and the reference were lemmatized by different tools, the lemma comparison may be unreliable. The interface reports the reference size and the unit so the user can describe the comparison.

### 5.5 Lab

The Lab compares two or more groups. It is marked experimental. A group can be a corpus or a subset of a corpus defined by metadata. The analysis uses the same document by feature table as KFA, with counts per 1,000 words.

The methods are:

**Table 9: Methods in the Lab**

| Method | What it does |
|---|---|
| One against all | Cohen’s d of each group against all other groups together, feature by feature |
| Pairwise | Cohen’s d for each pair of groups; an N by N distance matrix based on mean absolute d |
| Global test | Kruskal-Wallis per feature, with epsilon squared and adjusted p |
| Profile space | PCA of the texts, colored by group |
| Dendrogram | Hierarchical clustering of the groups’ mean profiles, with Ward linkage |
| Nearest | The first group against each of the others; the closest group and the features that separate them |

The result includes the effect sizes, the distance matrix, the test statistics, the epsilon squared, the adjusted p-values, the cluster structure, or the nearest group, depending on the method. The Lab warns when a group has fewer than five documents, because estimates become unstable. It also warns about multiple comparisons and unequal group sizes. The results are exploratory. The interface states this and does not present the Lab as a confirmatory test.

The command line uses `ttwtools compare --group-by` and `--group`; the Python API uses `ttwtools.experimental.compare_groups`. The module is explicitly marked as experimental, and its API may change between versions.

### 5.6 Dispersion Comparison

The dispersion comparison applies the dispersion measures to the two sides of the comparison bar. It produces two panels, one for each side. Each panel shows a heatmap of position bands, one row per text, and the ticks of the query. The user can sort the texts by name, frequency, or contributed DP, which is the absolute deviation between observed and expected occurrences.

A click on a text opens the Reader at the query position. The query box accepts the same syntax as the other tools, including tags with colors. The background of the panel uses the color of the side, and the ticks use the color of the tag or of the side. The result can be exported.

The comparison is descriptive. It shows whether a query is more concentrated in one side and in which texts. It does not test the difference between the two dispersion values. The user should report the DP, the Range, and the number of documents for each side.

## 6. Writing

The Writing area compares one text with a reference corpus. It is marked experimental. The text is one unit, not a random sample of independent units. The results are descriptive and exploratory. The interface states this in a note on how to read the results.

### 6.1 Single Text against a Reference

The user pastes a text or uploads a file. The application accepts `.txt`, `.md`, `.docx`, and `.odt` through the standard library. PDF is accepted when the optional `pypdf` package is installed. The reference can be a corpus in the project, a `.tsv` frequency list, or a list from the catalog. A `rest:` reference is not accepted because the target is already a single text.

The Words tab performs a keyword analysis of the text against the reference. It uses forms by default. The function also accepts lemmas, classes, word plus class, and n-grams, as well as other measures and corrections. The default measure is log ratio, and the default correction is the false discovery rate. The result reports the same measures as the Keywords tool, plus the dispersion of each item in the reference and a z-score that compares the text’s rate with the distribution of rates across the reference documents.

The result includes reliability flags: single text, short text, very short text, rare in the text, concentrated in few reference texts, and not significant after correction. These flags are not errors. They tell the reader how much confidence to place in each row. A word that occurs once in the text and once in the reference can have a large log ratio and no statistical support. A word that occurs in only one reference text can be an outlier rather than a corpus pattern.

The result can be explored through a table, a diverging bar chart, examples in the text and in the reference and, when the reference is a project corpus, a link to KWIC in the reference. The chart shows the log ratio; the table also reports the distance from the reference pattern (z). A click on an item opens examples with the classes colored.

The interpretation rules are stated in the interface. The text is one unit, so the analysis does not generalize to a population. Short texts have unstable frequencies. Words within one text are not independent, so the adjusted p-value should be read together with the effect size and the dispersion. The tool is intended for description and for data-driven learning, not for inference about a population.

### 6.2 Constructions

The Constructions tab compares the patterns of the text with the patterns of a reference corpus. A pattern is an n-gram of UPOS or XPOS, such as determiner, adjective, noun, or verb plus preposition. The unit is the pattern, not the word. The approach follows the operational side of pattern grammar.

The user chooses the field and the pattern length. The analysis uses log ratio and the false discovery rate by default, and the function accepts other measures and corrections. The reference must be a corpus in the project tagged with spaCy. A frequency list is not accepted because it stores words, not patterns. The text is tagged on the fly with the same spaCy model used by the reference, so the classes are comparable.

Each pattern receives the same measures as keywords: log-likelihood, adjusted p, log ratio, and dispersion in the reference. It also receives a z-score that compares the pattern’s rate in the text with the mean rate across the reference documents. The result includes reliability flags for rare patterns, concentrated reference patterns, and non-significant patterns. The output is a table with the pattern, direction, frequencies, measures, dispersion, and z-score.

The function refuses a reference tagged with a tool other than spaCy, because the class inventories would not be comparable. It also warns when the text is short. The result is descriptive. A pattern that is more frequent in the text can reflect a genre, a task, or a stylistic choice. It does not by itself show that the writer controls the construction.

### 6.3 Collocates

The collocate profile compares the collocates of a node in the text with the collocates of the same node in the reference. The user chooses the node and the window. The unit is the form. The result reports, for each collocate, the frequency in the text, the frequency in the reference, the frequency per 1,000 words on each side, log-likelihood, log ratio, MI, and the side of the window where it appears in the reference. It also marks collocates that occur only in the text and collocates that are typical of the reference.

The comparison shows combinability choices. A word can have the same frequency in the text and in the reference but combine with different words. The collocate profile makes this difference visible. The result is a table of collocates with frequencies and association measures.

The measure is descriptive. The text is one unit, and the reference is a collection of texts. The user should look at the frequency and the effect size together, and should check the occurrences in the text or in the reference before drawing conclusions.

### 6.4 Examples

The examples function returns occurrences of a word or a pattern in the text and, when the reference is a corpus, in the reference. Each occurrence is shown token by token, with the class of each token and the tokens that belong to the match. The interface colors the classes, so the user can see the pattern in context.

The function is used by the Words and Constructions tabs. It links the result table to the text and to the corpus. When the reference is a frequency list, only examples from the text are available, because the list does not contain texts. When the reference is a project corpus, the `See in corpus` action opens KWIC in the reference for a selected item, which supports data-driven learning.

### 6.5 Lexical Profile

The lexical profile reports descriptive measures of vocabulary and sentences: the number of words, the number of types, the type/token ratio, the Guiraud index, the Measure of Textual Lexical Diversity (MTLD), the number of sentences, the mean sentence length, and the percentage of words with seven or more letters.

The type/token ratio is sensitive to text length. The Guiraud index divides the number of types by the square root of the number of tokens, which reduces this sensitivity. MTLD computes the mean length of the segments in which the type/token ratio remains above a threshold, in both directions. The percentage of long words is a proxy for lexical sophistication, not a measure of readability.

The profile is descriptive. It does not compare the text with a norm, and it does not classify the text as simple or complex. The user can compare the values with the reference or with other texts, but the interpretation depends on the genre, the task, and the language.

## 7. Learning and Help

The Learn area contains explanations of concepts, methods, metrics, and screens. The topics are stored as Markdown files by language, with a title, a summary, a body, and related topics. The interface organizes them by area and allows search. The same content feeds the tooltips next to metrics, the `Explain this screen` action, the guided tours, and the `ttwtools help` command.

The topics explain, for example, Cohen’s d, standard deviation, dispersion, frequency bands, keyness, the Lab, and normalization per 1,000 words. The KFA topic includes an interactive widget for Cohen’s d. Formulas are rendered with KaTeX. Some topics include images and highlighted passages. The text is translated into Portuguese and English, with English as the fallback when a translation is missing.

The guided tours show a sequence of steps with a target element, a title, and a text. They are stored as JSON files and can be started from the Learn area. The tag set drawer shows the definitions and examples of the tags of each tagger. The Reader uses the same definitions in its tooltips.

The help content is validated by a command. `ttwtools help --check` reports missing titles, broken links, and other problems. This keeps the explanations aligned with the interface and prevents a topic from referring to a screen or a metric that no longer exists.

## 8. Resources

### 8.1 Catalog

The Resources area manages corpora and models. The catalog is a list of packages described in a JSON file. Each package has a description sheet with language, variety, period, genres, size, license, source, available layers, and hashes. The application validates the sheet and the catalog before installation. The public catalog address has not been defined yet. The user provides a catalog URL or a local `catalogo.json` file. Without a configured catalog, only installed packages and reference lists are available.

A package can contain the annotated project, the frequency lists, or both. A corpus whose license does not allow redistribution is offered as a recipe, which describes how the user can prepare a copy from the original source. A reference list is a small package with frequencies and document counts, sufficient for keywords and frequency bands. The application can install, remove, update, and validate packages, and it lists the installed packages and the available references.

The catalog is not a repository of texts without license control. The license is part of the package record, and the catalog validation checks it. The application shows the description sheet before installation, so the user can decide whether the corpus and the license fit the research question.

### 8.2 Models

The application downloads spaCy and Stanza models on demand. The models are stored in the user’s data folder: `~/Library/Application Support/TTWtools` on macOS, `%LOCALAPPDATA%\TTWtools` on Windows, and `~/.local/share/TTWtools` on Linux. The environment variable `TTWTOOLS_DATA_DIR` changes the location.

The Resources area lists the available models with language, size, source, license, and training data. It shows whether a model is installed and whether it can run on the current machine. The user can download a model from the interface or with `ttwtools catalog download-model`. Stanza models are downloaded with the Stanza downloader. MFTE is an optional dependency with the GNU General Public License, and the application treats its distribution separately.

### 8.3 Data and Disk

The application stores the index cache, temporary work folders, settings, and installed packages in the user’s data folder. The disk-usage screen shows the size of the cache, the work folders, and the free space. The user can clear the cache and the abandoned work folders. The application also removes stale work folders at startup and enforces a cache size limit.

These functions matter for large corpora. A project saved without search tables uses an index in the cache. The first query builds or attaches the index. Later queries reuse it. If the cache is cleared, the index is rebuilt when needed. The application warns before operations that need more disk space than is available.

## 9. Automation and Interoperability

### 9.1 Command Line

The command line exposes the same functions as the interface. It accepts a project path, a corpus name, a layer, metadata filters, and the parameters of each analysis. The output can be a table, JSON, or CSV.

**Table 10: Command-line commands**

| Command | Function |
|---|---|
| `import` | Import texts into a corpus |
| `save-as` | Save the project to another file |
| `compact` | Remove legacy tagged copies already present in layers |
| `index` | Show, build, or clear the search index cache |
| `cache` | Show or clear the cache and work folders |
| `pipeline` | Manage and run the list of steps of a corpus |
| `names` | Preview how filenames become metadata |
| `documents` | List documents and metadata |
| `tag` | Tag a corpus, reusing layers |
| `search` | Count occurrences of a query |
| `kwic` | Show a concordance |
| `freq` | Show a frequency list |
| `collocates` | Show collocates |
| `collocate-examples` | Show examples of a collocate |
| `dispersion` | Show dispersion measures |
| `dispersion-multi` | Show dispersion for several queries |
| `dispersion-compare` | Compare dispersion between two sides |
| `tag-counts` | Count tags in a corpus |
| `compare` | Run KFA or the Lab |
| `keywords` | Run a keyword analysis |
| `bands` | Run frequency bands |
| `reference-list` | Create a reference frequency list |
| `writing` | Compare a single text with a reference |
| `patterns` | Compare constructions of a text with a reference |
| `collocates-text` | Compare collocates of a text with a reference |
| `catalog` | Manage corpora and models |
| `recent` | List or clear recent projects |
| `help` | Show help topics |
| `describe` | Describe a corpus and a layer |
| `export` | Export a layer to CoNLL-U, VRT, CSV, JSONL, or Parquet |
| `tagger-options` | Show the options of a tagger |
| `tagset` | Show the tag set of a tagger |

The command line is designed for scripts and for reproducible analysis. A command can be copied from the interface with the `Copy as code` button, which also produces the equivalent Python snippet. The command line does not depend on the graphical interface, but it uses the same project files and the same package functions.

### 9.2 Python API

The Python package exposes the same operations as functions. The user opens or creates a project, calls the functions, and reads the returned dictionaries or DataFrames. The package imports heavy dependencies only when a function needs them, so `import ttwtools` is fast.

A typical script is:

```python
import ttwtools

with ttwtools.open_project("project.ttwa") as proj:
    ttwtools.tag_corpus(proj, "essays", "spacy", preset="recommended")
    result = ttwtools.keywords(proj, "essays", "catalog:brown", unit="lemma")
    print(result["rows"][:10])
```

The public functions are grouped by area: project and storage; corpus import and metadata; tagging and layers; descriptive statistics; search, KWIC, frequency, collocates, and dispersion; keywords and frequency bands; feature tables and KFA; visualization data; the Lab; Writing; help; catalog; and formats. The package reference documents each function, its parameters, and its return value.

### 9.3 Local REST API

The interface communicates with a local FastAPI server. The server exposes routes for project management, corpora, tagging, exploration, comparison, Writing, the Lab, help, catalog, code generation, and jobs. The routes validate parameters and call the package functions. They do not contain analysis rules.

Long operations are jobs. A job reports its state and progress and can be cancelled. This is used for tagging, opening large projects, saving, KFA, and other operations that can take more than a few seconds. The API is local. It is not a public web service, and the application does not require an account.

The routes are useful for integration with other tools, but the recommended path for scripts is the Python package or the command line. The route layer is an implementation detail of the interface, and its endpoints may change more often than the public Python functions.

### 9.4 Copy as Code

Most analyses in the interface have a `Copy as code` action. It produces a command line command and a Python snippet that reproduce the analysis with the same parameters. The code generator includes only the parameters the user set, so the command reflects the analysis rather than a generic example.

The generated code uses the public API and the same project file. It does not depend on the interface being open. This supports transparency: a reader of a thesis or an article can see the command that produced a table or a chart, and a collaborator can rerun it on the same data.

The generated code uses POSIX quoting on macOS and Linux. On Windows, the command line uses the quoting rules of the shell in use. The Python snippet is the same across systems.

### 9.5 Export

The application exports tables and charts in several formats. Tables can be exported as CSV or TXT. Charts can be exported as SVG or PNG. The export dialog shows the columns of the current view and lets the user choose the destination. The exported table corresponds to the view, so a filtered table exports the filtered rows.

Layers can be exported as CoNLL-U, VRT, CSV, JSONL, or Parquet. CoNLL-U and VRT are used by corpus tools and by Universal Dependencies workflows. CSV, JSONL, and Parquet are used for statistical analysis in other programs. A reference frequency list can be exported as a `.tsv` file with a description header. The corpus texts can be exported to a folder next to the project.

## 10. Cross-Cutting Features

### 10.1 Languages

The interface is available in Portuguese and English. The language of the interface is independent of the language of the corpus. A user can analyze an English corpus with a Portuguese interface or a Portuguese corpus with an English interface. The interface language controls menus, messages, help, tag definitions, and the labels of the charts.

The corpus language controls the tagger and the model. spaCy and Stanza support English and Portuguese. BiberPlus and MFTE support English. The application can detect the corpus language from the layers or from function words and suggest a model. The stopword lists are available for English and Portuguese.

The help content is translated into both languages, with English as the fallback when a translation is missing. The same applies to the tag definitions and the descriptions of the taggers. The application does not translate the corpus or the user’s texts.

### 10.2 Appearance and Accessibility

The interface offers several visual themes, fonts, corner styles, button styles, and icon styles. The user can choose a light, dark, or high-contrast theme, or one of the predefined themes. The fonts are bundled with the application, so the appearance does not depend on the fonts installed on the system. The contrast of each theme is tested.

The interface is designed for keyboard use and for screen readers. Interactive elements have labels, focus is visible, and the main analyses present a table alongside the chart. The application includes automated accessibility tests in its end-to-end suite. These tests do not prove full conformance with a standard, but they catch common problems such as missing labels, insufficient contrast, and focus traps.

The Reader and the main tables support keyboard navigation. The split panes can be resized with the keyboard. The charts that represent texts can be opened in the Reader, where the same information is available as text. The interface links charts to the table or to the Reader when exact values matter.

### 10.3 Performance and Privacy

The application runs on the local machine. It does not send texts to a remote service during analysis. Models and corpora are downloaded only when the user asks for them. The analysis itself works offline once the resources are installed.

Long operations run as tasks with progress and cancellation. The application checks free disk space before writing, uses temporary work folders with an owner, and removes abandoned folders. The search index can be built lazily or stored in the cache. The first query in a large project may take longer, but the cost is not repeated on every opening.

The application reports its version and the version of the package. It records the layers used by each analysis and the parameters of the analysis. This information supports reproducibility and helps the user understand why a result changed after a new layer was added.

## 11. Function Matrix and Summary

The table below maps the main areas to the interface, the command line, the Python API, and the local route. The names of the routes are simplified; the exact paths are in the server documentation.

**Table 11: Function matrix**

| Area | Interface | Command line | Python API | Local route |
|---|---|---|---|---|
| Project | File | `save-as`, `compact`, `index`, `cache`, `recent` | `open_project`, `save_project_as`, `compact_project` | `/api/project`, `/api/jobs` |
| Import | Import wizard | `import`, `names`, `documents` | `import_corpus`, `formats` | `/api/sources`, `/api/corpora` |
| Overview | Corpus overview | `describe` | `describe` | `/api/corpora/{corpus}/overview` |
| Pipeline | Tagging | `pipeline` | `pipeline` | `/api/corpora/{corpus}/pipeline` |
| Tagging | Tagging | `tag`, `tagger-options`, `tagset` | `tag_corpus`, `plan_tagging` | `/api/tagging`, `/api/taggers` |
| Search | Explore | `search` | `search` | `/api/explore/search` |
| KWIC | Explore | `kwic` | `kwic` | `/api/explore/kwic` |
| Frequency | Explore | `freq` | `frequency` | `/api/explore/frequency` |
| Collocates | Explore | `collocates`, `collocate-examples` | `collocates`, `collocate_examples` | `/api/explore/collocates` |
| Dispersion | Explore | `dispersion`, `dispersion-multi` | `dispersion`, `dispersion_multi` | `/api/explore/dispersion` |
| Reader | Reader | `documents`, `tag-counts` | `read_document`, `tag_counts` | `/api/corpora/{corpus}/text/{filename}` |
| Keywords | Compare | `keywords` | `keywords` | `/api/compare/keywords` |
| KFA | Compare | `compare` | `kfa_layers` | `/api/compare/kfa` |
| Bands | Compare | `bands` | `frequency_bands` | `/api/compare/bands` |
| Lab | Compare | `compare --group-by` | `experimental.compare_groups` | `/api/lab/compare` |
| Dispersion comparison | Compare | `dispersion-compare` | `dispersion_compare` | `/api/compare/dispersion` |
| Writing | Writing | `writing`, `patterns`, `collocates-text` | `analyze_text`, `analyze_patterns`, `collocate_profile` | `/api/writing` |
| Examples | Writing | `writing` | `writing_examples` | `/api/writing/examples` |
| Help | Learn | `help` | `help` | `/api/help` |
| Catalog | Resources | `catalog` | `corpus_catalog` | `/api/catalog` |
| Models | Resources | `catalog download-model` | `models` | `/api/models` |
| Layers export | Tagging | `export` | `formats` | `/api/corpora/{corpus}/export` |
| Code | Copy as code | `--json`, `--csv` | Public functions | `/api/code` |

Most analyses accept a corpus, an optional layer, an optional metadata filter, and the parameters of the method. Analyses that use layers record the layers and the parameters; the Writing results record the reference and the settings. Most tables and charts can be exported, and analyses with a command-line equivalent offer Copy as code.

The functions also share a common limit. The measures describe the corpora; they do not turn a corpus into a random sample of a population. Keywords, KFA, frequency bands, dispersion, and the Writing tools report differences, effect sizes, and dispersion. The interface states this where it matters, and the help topics explain the assumptions and the cautions.

Part I described the architecture that supports these functions. Part II described what the user can do with them. Together, the two parts show how the design decisions become operations: the project stores the source, the layers, and the results; the functions read the layers and calculate; the interface, the command line, and the Python package present the same results; and the help explains what the results mean.

---

## Notes for Revision (not part of the chapter)

1. **Version and interface labels.** The text uses the English labels of version 0.8.3. Confirm the labels again before the final version, especially the names of the Writing tabs, the Lab methods, and the chart types.
2. **Screenshots.** Part II will need screenshots or diagrams of the main screens: overview, query box, KWIC, dispersion, keywords, KFA gallery, Writing, Learn, and Resources. The text refers to the screens but does not include images.
3. **Citations.** The methods mentioned in this part need full references: Biber and Egbert for KFA, Gries for dispersion, Rayson and Garside for log-likelihood, Hardie for log ratio, Gabrielatos and Marchi for %DIFF, Dunning for log-likelihood in keyness, Laufer and Nation for frequency bands, McCarthy and Jarvis for MTLD, Guiraud for the Guiraud index, Hunston and Francis for pattern grammar, and Kilgarriff for the single-text caution.
4. **Experimental status.** Confirm whether the Lab and Writing should still be described as experimental in the final version. If they become stable, the wording and the warnings must change.
5. **Exact defaults.** The text states the main defaults, such as Bonferroni for keywords and FDR for Writing. Confirm the defaults in the version described and add a table if the thesis needs a complete parameter reference.
6. **Style.** Both parts avoid em dashes. Check the final formatting if the text is moved to Word or LaTeX.
7. **Numbers.** The text avoids performance and size numbers. If the thesis includes a performance section, add the measured values and state the machine, the corpus, and the layer.
