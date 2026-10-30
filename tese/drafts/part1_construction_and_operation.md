# TTWtools: Introduction and Motivation

TTWtools was born out of the need to annotate and count tags in a corpus and to compare corpora using KFA. In the first year of my doctoral period, our research group was working on the functional analysis of features from a KFA of a corpus of Agrarian Sciences articles. For this work, we had a dataset containing the counts of all tagged features in each text of the corpus.

To analyze the use of those features in the texts, we had to search the dataset for the texts in which a feature had a high **d** value, record the filenames of those texts, find these texts in the corpus folder, and finally look for the features and select examples. This process took time, and I began to think about how to automate it. During this period, I was also looking for freely available taggers and learning how to use them and how to use Python to count the tags, calculate Cohen’s **d** values for the KFA, and plot the bar charts. At the time, I had just started learning Python, and these tasks were challenging.

After I was able to perform these tasks with Python and a few command-line tools, I realized that the process could be improved further. I wanted to put all the necessary steps for a KFA, from tagging to functional analysis, in one place. I also wanted it to be a graphical user interface (GUI) tool so that other researchers and students with limited programming skills could use it. That was when I started developing TTWtools with the assistance of a more experienced programmer. The first version did exactly that: it integrated a set of taggers and KFA functions into a single interface. The taggers already included BiberPlus with spaCy, MFTE with Stanza, and spaCy and Stanza as standalone taggers.

Once the first version was ready and working, its limits became clear. It solved the manual KFA workflow, but it was still a KFA tool. It always started from a pair of corpora, worked only in English, and its main analysis depended on Biber’s taxonomy. It had no ready corpora, no search, and no KWIC. The project files were large, and the annotation was a block that did not tell me which tagger, model, or configuration had produced a number. These limits shaped the next design.

We then started thinking about other improvements. We decided to make the tool bilingual and to make it possible to incorporate taggers for other languages. We also began introducing other traditional corpus linguistics analyses, such as frequency lists, KWIC, and collocations. The idea of including a learning module came from the need to understand the statistics of KFA and other metrics. The learning module was used in the classes reported in Chapter 4.

There are still several improvements to make and ideas to explore in TTWtools. One is a more robust version of KFA. Another is the development of the Writing module, a corpus-based tool to help Brazilian learners improve their writing in English and to help teachers assess student writing. An experimental Writing area already exists, but the fuller module will require further research in statistics and is planned for the coming years. The catalog mechanism for reference corpora also exists, but there is no public catalog of reference corpora yet, and large reference corpora at the scale of the BNC or Hansard are not supported as full corpora. Reference frequency lists provide a partial path for keywords and bands, but they still depend on preparing and distributing the list.

This experience illustrates a broader problem. Corpus linguistics and descriptive linguistics depend on tools. A concordance, a frequency list, a measure of dispersion, or a comparison between corpora is not only a calculation. It is a way of making a linguistic question operational. The choice of tool affects which questions can be asked, which data can be inspected, and how results can be reported. A tool that hides its assumptions or its annotation decisions can produce numbers that look precise but cannot be interpreted. Command-line tools and programming libraries offered control and reproducibility, but they required programming skills. Graphical interfaces offered accessibility, but they often limited the analyses or hid the annotation layer. When I started, the available options required a choice between these two paths. I wanted a local application that offered the accessibility of an interface without giving up the methodological control of a scriptable tool.

Annotation raised a second problem. A corpus can be annotated by different tools, and these tools do not tokenize or tag in the same way. One tool may split contractions, another may keep them; one may use a universal tag set, another may use a language-specific inventory. If the tool treats annotation as a single invisible layer, the user cannot tell which decisions produced a count. TTWtools treats each annotation as a separate layer, with its tool, version, model, and configuration. Layers can coexist over the same text, and each analysis records the layer it used. This design supports comparison and reanalysis and prevents the corpus from being retagged without need.

Exploration and comparison raised a third problem. Research and teaching often begin with a word, a phrase, or a pattern in context. They continue with frequency, dispersion, and collocation. They may end with a comparison between corpora, between groups, or between a single text and a reference. Many tools support one part of this path but not the others. TTWtools connects the parts. A query can be inspected in KWIC, counted, placed in its dispersion, compared with a reference, and opened in the Reader. The same project holds the texts, the layers, and the results.

Reproducibility and privacy raised a fourth problem. Corpora used in teaching and research often contain student essays, interviews, classroom transcripts, or other material that cannot be sent to an external service. Local processing is therefore not only a technical preference. It is a condition for using the tool with sensitive data. A result should also be more than a screenshot. It should be possible to know which corpus, which layer, which parameters, and which version produced it. TTWtools stores analyses with their parameters and the layers they used. It also provides a Copy as code action that produces the equivalent command line and Python snippet. This does not make every analysis reproducible in an absolute sense, because models and libraries change. It does make the path from a result to its conditions visible.

The tool is designed for corpus linguistics and descriptive linguistics, especially for students, and it is also meant to be accessible to teachers who want to produce data-driven learning (DDL) materials. For corpus linguistics, it offers exploration and comparison with explicit annotation layers. For descriptive linguistics, it offers close reading of texts with tags, concordances, and contextual examples. The same interface serves teaching, where the Learn area explains concepts, metrics, and screens, and research, where the project file and the command line support documentation and reanalysis.

TTWtools is a local application. It runs on the user’s computer, keeps the texts and results in a project file, and does not send the corpus to a remote service during analysis. It integrates existing language-processing tools, including spaCy, Stanza, BiberPlus, and MFTE. It does not replace these tools or treat their output as a definitive analysis. The quality of annotation depends on the model, the language, the genre, and the configuration. The interface and the help material state this, and each layer records the conditions under which it was produced.

The description refers to application version 0.8.3 and package version 0.3.1. Part I describes how the tool is built and how it works: the project as a database, the annotation layers, the storage formats, the search index, the execution model, and the use of AI agents in development. Part II describes the functions from the user’s point of view: projects and corpora, tagging, exploration, comparison, Writing, help, resources, and automation.

The contribution of the chapter is twofold. It documents a tool that connects exploration, comparison, and reproducibility in a local environment. It also describes the design decisions behind that tool, so that results produced with it can be read with an understanding of their conditions. The next part describes the construction and operation of TTWtools, beginning with the scope of the description and the principles that organize the project.

---

# Part I: How TTWtools Is Built and How It Works

## 1. Scope and Purpose

This part describes how TTWtools is built and how it works. It does not aim to teach programming. It aims to explain, for readers who know corpus analysis but not necessarily software development, what the tool stores, what it calculates, and what it assumes about language data. The design documents of the project are used as a source for intentions and justifications, but the object of description is what exists in the code and in the tests.

TTWtools is a local corpus analysis application. “Local” means that the program, the texts, the annotations, and the results remain on the user’s computer. No text is sent to an external service, and no account on a website is required. The application supports four groups of operations: organizing texts in a project, annotating them with language-processing tools, exploring them through searches and concordances, and comparing them with other corpora or with reference corpora. The same logic that serves the graphical interface is also available in a Python library and in a command-line interface. This equivalence is a design decision, not a technical detail. It allows an analysis made with clicks to be reproduced, documented, and automated.

For a committee in linguistics, the relevant question is not which programming language the tool uses. The relevant question is what the tool stores, what it calculates, and what it assumes about the data. This text addresses those questions. Technical terms are explained when they first appear, and analogies are used only when they clarify an idea.

## 2. Design Principles

Five design decisions shape the tool.

The first is **local processing and privacy**. The application does not need an internet connection to analyze a corpus that is already installed. Annotation models are downloaded on demand, by explicit choice, and stored in the user’s data folder. No text is sent to a remote server during analysis. This decision has technical consequences, such as loading models locally and checking disk space before writing, and ethical consequences, especially when the corpus contains student essays, interviews, or other sensitive material.

The second is **one interface, without user profiles**. There are no “student” and “researcher” modes. All users see the same screen, with frequent operations in the foreground and specialized options in collapsible panels that anyone can open. This choice keeps advanced resources available to all users and maintains a single learning path.

The third is **parity across the interface, the library, and the command line**. The analysis logic lives in a software package, `ttwtools`. The interface only collects parameters and presents results. A server route does not contain analysis rules; it calls the corresponding package function. As a result, a keyword count, a KFA, or a dispersion analysis has one implementation, used by all three paths. The “Copy as code” button translates an analysis made on screen into a command-line command and an equivalent Python snippet. This makes the analysis auditable and repeatable.

The fourth is **no repeated annotation**. If a text has already been annotated by a tool with the same configuration, TTWtools reuses the annotation instead of repeating the work. If two documents have exactly the same text, the annotation of one can be copied to the other. This principle saves time. More importantly, it prevents the corpus from accumulating incompatible versions of the same annotation without the user’s knowledge.

The fifth is **portability and file longevity**. A project should open on another computer, be archived, be sent to a colleague, or be reopened years later. For this reason, the file format uses only standard-library resources and does not depend on exotic packages. The application also maintains read compatibility with earlier versions. The format is documented and verifiable; it is not a proprietary secret.

## 3. Overall Architecture

The architecture has four layers, as shown in Figure 1. At the surface is the **graphical interface**, written with Vue 3, a library for building interfaces. It contains the menus, forms, tables, charts, and the annotated-text reader. Below it is the **local server**, written in Python with the FastAPI framework, a library that organizes communication between programs. The server receives requests from the interface, coordinates long tasks, and returns structured results. Below the server is the **analysis package** `ttwtools`, which contains the functions that read texts, query annotations, calculate statistics, and generate chart data. At the deepest level is the **project file**, an SQLite database that stores texts, metadata, annotation layers, and results.

The separation between interface and server is not only organizational. It allows the same analysis core to be used in a native desktop window, in a browser pointed at the local server, or, without any interface, on the command line and in research scripts. The application can run in desktop mode, with its own window, or in local web mode. In both cases, the server and the package are the same.

The local server needs an explanation for readers outside computing. A “server” here is not a remote machine. It is a program that runs on the same computer and waits for requests from the interface. When the user clicks “Search,” the interface sends a request to that program, which calls the appropriate package function and returns the response. The advantage is that the interface does not need to know how the search is implemented; it only needs to send a request and display the result. The disadvantage is that the application must start and stop this program together with the window. This is why the project includes management of communication ports, leftover processes, and response time.

The `ttwtools` package is the analytical core. It is organized into modules, separate parts of the program with distinct responsibilities: text and metadata import; simple tokenization; definition and storage of annotation layers; connectors for taggers; queries (search, concordance, frequency, collocates, and dispersion); keywords; feature tables and KFA; descriptive statistics; visualization data; corpus catalog; input and output formats; help; and generation of equivalent code. This division supports maintenance and makes explicit where each calculation takes place.

The help system is part of the architecture. Explanatory texts about concepts, metrics, and screens are stored as plain-text files with light formatting (Markdown) by language, with a title, a summary, and links to related topics. The same content feeds the explanation tooltips, the guided tours, the Learn screen, and the `ttwtools help` command. Explanation is therefore treated as data, separate from the interface code, rather than as an appendix added after development.

Figure 1 also shows the flow of an analysis. The interface sends parameters. The server validates them and calls the function. The function opens the project, reads the appropriate layer, calculates, and returns a structured result. The interface presents the result and allows the user to export it. The same flow, without the interface, is what the command line executes.

## 4. The Project as a Database

### 4.1 Why SQLite

The core of TTWtools is the project file. Internally, it is an SQLite database. For readers outside programming, the closest analogy is a spreadsheet workbook: a single file that contains several related tables. Each table has columns and rows; each row is a record; each record stores information in fields. SQLite is a database system that keeps an entire database in one file and does not require a separate database server. It is mature, widely used, and open source.

Three reasons support this choice. The first is **integrity**. The database can relate documents, layers, and tokens through identifiers, and it prevents a layer from existing without a document or a token from pointing to a missing layer. The second is **query efficiency**. With indexes, the database finds all occurrences of a word or tag in millions of tokens without reading the entire file. The third is **safety**. Opening an SQLite database does not execute embedded code, unlike some data formats that can carry malicious instructions. The application does not “run” a project; it reads and writes data.

The `.ttwa` file is therefore an SQLite database. In practice, the application usually saves it compressed, that is, reduced by a compression algorithm that does not lose information, similar to the one used in a `.zip` file, so that it occupies less space. When opening the file, the application decompresses the database into a temporary working copy, makes changes in that copy, and writes the compressed file back when saving. The `.ttwa` extension indicates the project type, not the compression level. The `.ttwt` format, used for sending and archiving, applies a stronger compression algorithm; its logical content is the same.

### 4.2 Tables and What They Store

Table 1 summarizes the main tables in the current schema. A schema is the plan of the database: it defines which tables exist, which columns each table has, and how the tables relate.

**Table 1: Main tables in a `.ttwa` project**

| Table | What it stores | Why it matters |
|---|---|---|
| `project_meta` | Key-value pairs with project metadata: schema version, project type, save options | Tells the application how to interpret the file and maintain compatibility |
| `corpus_files` | Original texts of each corpus, in projects that embed the text | Preserves the primary source needed by the reader and by concordance context |
| `documents` | One record per document: corpus, filename, text fingerprint, character count, relative path in light projects | Anchors the identity of each text |
| `document_meta` | Metadata per document as key-value pairs | Allows grouping, filtering, and comparison by level, author, year, genre, and similar variables |
| `layers` | One annotation layer per document, with tool, version, model, configuration, and token count | Records what was done, with which tool, and under which conditions |
| `tokens` | Tokens of each layer, with text position, form, lemma, part of speech, and tags | Supports search, concordance, frequency, and collocates |
| `layer_blobs` | Layers packed in a columnar format when the file is saved without search tables | Reduces file size and allows the token table to be rebuilt when needed |
| `lexicon_parts` | Per-corpus lexicon used by the `TCL2` columnar format | Avoids repeating words and lemmas millions of times |
| `analyses` | Saved analysis results, with type, parameters, layers used, and result | Allows reuse of calculations and documents what was done |
| `tagged_files`, `feature_tables`, `kfa_results` | Tables from the earlier schema, kept for compatibility | Allow projects from earlier versions to be opened and migrated |

Table 1 reflects a design decision that shapes the tool. The project does not store “the annotated corpus” as a single block. It stores **documents**, **layers**, and **tokens** as separate, related entities. This separation allows the same text to have a spaCy layer and a BiberPlus layer, or an old layer and a new layer, without duplicating the text or mixing the analyses.

### 4.3 Documents, Metadata, and Fingerprints

Each document has a record in the `documents` table. The record includes the filename, the corpus, the character count, and a **fingerprint** of the content: a value calculated by a hash function, in this case SHA-256. The idea is simple. The program reads the text and produces a short code that depends on every character. If one comma changes, the code changes. If the text is identical, the code is identical. This allows the application to compare texts without comparing the full content and to know whether a document has changed since the last annotation.

The hash has two uses. First, it verifies whether the text of a light project still matches the file in the adjacent folder. If the file has changed, the application warns that the annotation may be misaligned. Second, it allows layer reuse across documents with identical content. If two files have the same hash, the layer of one can be copied to the other because the annotation refers to the same text.

Metadata is stored in the `document_meta` table as key-value pairs. It can come from the filename, when the name follows a pattern such as `student_B1_2024.txt`, or from a separate CSV file with a column that identifies each filename. Metadata allows queries such as “compare B1 texts with C1 texts” or “show only essays from 2024.” Without metadata, group comparison would depend on the user separating files into different folders.

### 4.4 Layers, Tokens, and No Repeated Annotation

An **annotation layer** is the result of a tool applied to a text. If the text is “The students wrote,” one layer may say that “The” is a determiner, “students” is a noun, and “wrote” is a verb. Another layer, produced by a different tool, may segment the words slightly differently or assign tags from another set. Layers do not replace the text. They refer to it.

TTWtools uses a **standoff** representation, in which annotations are stored separately from the text and linked to it by positions. Each token has a start position and an end position in characters. The rule is that the text segment between those positions must be exactly the annotated word. This rule allows the annotation to be highlighted in the original text, allows the context of a concordance to be recovered, and allows different layers to coexist over the same text.

A layer’s identity is defined by a set of attributes: the document, the tool, the tool version, the model, and a **configuration hash**. The configuration hash is calculated only from options that change the result, such as the chosen model or the decision to extract lemmas. Options that affect only speed, such as batch size or the number of processes, are excluded. Changing the number of processes does not invalidate a layer; changing the model does.

Before annotating a document, the application looks for a layer that satisfies the request. “Satisfy” means the same tool, the same version, the same model, the same result-changing options, and equal or more components. A layer that contains part of speech and lemma satisfies a request for part of speech only; the reverse is not true. If a suitable layer exists, the work is reused. If not, the document is annotated and the layer is saved at the end. If the process is interrupted, documents that were already completed remain completed.

This design has a methodological consequence. A corpus can accumulate layers produced at different times, and each analysis records which layer it used. There is no single invisible “official annotation.” There are identifiable layers with a tool, a version, and a configuration. This is what allows results to be compared and analyses to be repeated in a controlled way.

### 4.5 Saved Analyses and Reproducibility

The `analyses` table stores analysis results. Each record has a type (for example, KFA, frequency, or collocates), a name, the parameters used, the layers consulted, the result, and the date. Storing parameters and layers makes it possible to know **how** a result was obtained, not only **what** the result was.

The application reuses a saved analysis while texts, layers, and parameters remain unchanged. If something changes, the result is recalculated. This policy avoids two extremes: recalculating everything on every screen, which would make the tool slow, and presenting an old result as if it were current, which would be misleading.

Reproducibility has two levels. The first is **registration**: the project stores the layer configuration and the analysis parameters. The second is **reexecution**: the “Copy as code” button shows the equivalent command-line command and Python snippet. This allows an analysis made in the interface to be repeated outside it, documented in an article, or incorporated into a script. Reproducibility is not absolute. It depends on model and library versions, which can change. The project therefore records versions and maintains a change history.

### 4.6 The Columnar Format and the Lexicon

Storing tokens as a list of rows, each with a word, lemma, part of speech, and tags, is simple but takes a large amount of space because the same words and lemmas repeat millions of times. TTWtools uses its own columnar format, called **TCL** (*TTWtools Columnar Layer*). The name is a project acronym; it has no relation to the Tcl programming language.

The columnar format separates **vocabulary** from **sequence**. Instead of storing the word “student” in every occurrence, the program creates a corpus lexicon in which “student” receives an identification number. The layer then stores sequences of numbers rather than sequences of words. The same applies to lemmas, parts of speech, and tags. Text positions are also stored economically, as differences between consecutive positions. Finally, the data is compressed.

An analogy is a numbered dictionary. Instead of writing the full word on every page, the text writes the number of the dictionary entry. The stored data becomes smaller, and queries can operate on numbers, which are faster to compare than character strings. The current version of the format, `TCL2`, uses whole-number identifiers and a lexicon shared by the corpus. The application can read earlier versions so that older projects remain accessible.

The columnar format has practical effects: smaller files, faster opening, and faster queries on large corpora. The cost is internal complexity. The lexicon must be maintained, identifiers must remain stable, and the rows must be reconstructed when a tool needs them. The format is therefore tested with real projects and with comparisons between the columnar path and the traditional path.

### 4.7 The Search Index and Fast Opening

For a word search to be fast, the database needs an **index**, an auxiliary structure that works like the index of a book. Instead of scanning every page, the program consults an ordered list that points to the occurrences. In TTWtools, the `tokens` table has indexes for form, lemma, part of speech, and document. These indexes take space, but they prevent a search over millions of tokens from becoming a full scan.

The application offers two paths. If the project was saved with search tables, the query uses the indexes directly. If it was saved without those tables, to be smaller, the application can build an index in a **cache** folder, a reserve of derived results that can be deleted and rebuilt. The index is attached to the project at query time, as if it were a temporary part of the database. The index can also be built **lazily**: the project opens quickly, and the index is built only when the first query that needs it is executed. Opening is no longer a long wait; the first search may take a few extra seconds.

The cache has a size limit and is cleaned according to how recently it was used. This prevents the application from occupying disk space indefinitely. For the user, the consequence is that the first search in a large project may be slower than later searches, but the cost is not repeated on every opening.

## 5. Corpora, Documents, and Metadata

A **corpus** in TTWtools is a set of documents grouped under a name inside the project. A project can contain several corpora, such as “essays,” “articles,” and “reference,” and each analysis chooses which corpus to use. This organization allows different corpora to be compared without mixing their texts.

Import accepts a folder of `.txt` files, a single file, a CSV file (a text file with comma-separated values) with a text column, or text pasted into the interface. Metadata can come from filenames or from a separate CSV file. The application shows a preview of how filenames will be interpreted before importing, which reduces metadata coding errors. A name such as `student_B1_2024.txt`, for example, can be read as three fields: student, level, and year.

In addition to plain text, TTWtools imports annotated formats: CoNLL-U, the column format of Universal Dependencies; the `word/TAG` format used by corpora such as Brown and LOB; TEI P5 and BNC XML, standards for encoding digital texts; and GrAF, a standoff format used by corpora such as OANC and MASC. In these cases, the existing annotation is converted into a layer and the text is preserved. This allows annotated corpora to be analyzed without retagging every text.

Simple tokenization, performed without a tagger, splits the text into units using regular expressions, which are patterns of characters. It is used in statistics that do not depend on part of speech and is explicitly an **estimate**. A tagger may split contractions, punctuation, and compound words differently. The application states this in the interface. When a layer is selected, the statistics use that layer’s tokenization, and the numbers may change slightly. This transparency prevents estimates from being treated as definitive measurements.

Metadata supports filters and groups. A metadata filter selects documents, and a metadata grouping creates the groups to be compared. This mechanism allows KFA to compare “B1” with “C1” inside the same corpus, or the Lab to compare several proficiency levels at once.

## 6. Tagging and Layers

### 6.1 What Tagging Means

Tagging, in TTWtools, means assigning to each token of a text one or more linguistic descriptions: part of speech, lemma, a tag from the tool’s tag set, and, in some cases, morphological information. In this chapter, “feature” refers to the linguistic variables used in Biber-style analysis and in KFA.

Tagging depends on tokenization. Different tools tokenize differently. Some split “don’t” into “do” and “n’t,” while others keep the contracted form. Some treat punctuation as a token, while others do not. For this reason, layers align with the text by character position rather than by token number. This decision allows layers that tokenize differently to be compared without losing the reference to the original text.

### 6.2 Taggers

TTWtools integrates four families of taggers, summarized in Table 2. All produce the same output format, so later analyses do not need to know which tool generated a layer.

**Table 2: Integrated taggers**

| Tagger | Nature | What it produces | Languages | Notes |
|---|---|---|---|---|
| spaCy | Trained statistical and neural models | Tokenization, part of speech, lemma, morphology | English and Portuguese | Models of different sizes, downloaded on demand |
| Stanza | Trained neural models aligned with Universal Dependencies | Tokenization, part of speech, lemma, morphology | English and Portuguese | Also used as a tokenizer by other tools |
| BiberPlus | Rules and regular expressions, with optional spaCy support | About 67 Biber features | English | Does not depend on neural training for Biber tags |
| MFTE | Tagger based on Stanza and torch (a machine-learning library) | Extended set of features, with an extended version | English | Optional and heavier dependency; separate license |

The distinction between trained models and rules matters for interpretation. spaCy and Stanza are machine-learning systems. Their decisions come from statistical patterns learned from annotated data. They can make systematic errors, and their quality depends on the model, the domain, and the language. BiberPlus applies explicit rules to identify a set of features associated with Biber’s tradition. It is more predictable, but it depends on how the rules were formulated. MFTE expands the set of features and relies on Stanza and torch. None of these tools is neutral. Each carries a conception of token, part of speech, and feature.

The application offers configuration presets: **Fast**, **Recommended**, and **Most accurate**. The presets fill in the tagger options. The **Customize** panel exposes the options with explanations and indicates which options change the result and which affect only performance. The **tag set** of each tagger can be consulted with definitions and examples, and the same content feeds the help system and the reader. The goal is for users to know what a tag means before interpreting a count.

### 6.3 Reuse and Cache

Layer reuse was described in section 4.4. Its effect on the workflow deserves attention. The tagging screen allows the user to build a list of steps to run, for example basic statistics, a spaCy layer, and a BiberPlus layer, and then run everything at once. The application calculates only what is missing. If the list is interrupted, completed work remains; when the user resumes, the application does not repeat what already exists.

This design matters for large corpora and slow machines. It also makes work incremental. A user can start with a light layer, explore the corpus, and later add a more expensive layer only for the analysis that requires it. The tool does not require a complete annotation before any exploration.

## 7. Import, Export, and Interoperability

TTWtools is not a closed system. It imports formats used by other communities and exports results so that they can be analyzed, archived, or published. Table 3 summarizes the main formats.

**Table 3: Input and output formats**

| Format | Input | Output | Typical use |
|---|---|---|---|
| Plain text (`.txt`, folder, CSV) | Yes | Texts next to the project | Personal corpora, essays, interviews |
| CoNLL-U | Yes, with layer | Yes | Universal Dependencies, exchange with other tools |
| `word/TAG` (Brown, LOB) | Yes, with layer | No | Historical annotated corpora |
| TEI P5 and BNC XML | Yes, with a layer when `<w>` is present | No | Reference corpora and scholarly editions |
| GrAF (OANC, MASC) | Yes, with layer | No | Standoff corpora |
| VRT (CWB, Sketch Engine, CQPweb) | No | Yes | Analysis in established corpus tools |
| Token table (CSV, JSONL, Parquet) | No | Yes | External statistical analysis, archiving |
| Reference frequency list (`.tsv`) | Yes, as a reference | Yes | Keywords and frequency bands without distributing the full corpus |

Exporting a layer to CoNLL-U or VRT moves the annotated corpus to other tools. Exporting to CSV, JSONL (one JSON record per line), or Parquet (a compressed table format used in data analysis) allows token-level analysis with other programs. The reference frequency list is a light format. Instead of distributing the full corpus, it distributes a frequency table with a descriptive record. This matters when the corpus license does not allow redistribution of the texts but does allow distribution of derived statistics.

The project format uses only standard-library resources. This restriction is deliberate. It reduces the risk that a project becomes unreadable when an external library disappears or changes its format. Interoperability with external formats is handled by import and export routes, not by the core of the project file.

## 8. Catalog, Models, and User Data

The application can work with personal corpora and with reference corpora distributed by the project. The **catalog** is a list of available packages described in a `catalogo.json` file. JSON is a structured text format that is readable by people and by programs. Each package has a **description sheet** with language, variety, period, genres, size, license, source, available layers, and hashes. The catalog is not an uncontrolled text repository. The sheet is validated, and the license is part of the distribution decision.

A package can contain the annotated project, only the frequency lists, or both. For corpora whose license does not allow redistribution of the texts, the catalog offers a **recipe**: the procedure for users to prepare their own copy from the original source. This distinction matters for research ethics and for the publication of results.

spaCy and Stanza models are downloaded on demand and stored in the user’s data folder. On macOS, this folder is `~/Library/Application Support/TTWtools`; on Windows, `%LOCALAPPDATA%\TTWtools`; on Linux, `~/.local/share/TTWtools`. An environment variable can change the location. The models have their own licenses, and the application shows the description sheet and the size before download. MFTE is distributed under the GNU General Public License (GPL) and is an optional dependency with separate legal treatment in distribution. This separation is a technical and legal decision, not only a matter of convenience.

The data folder also stores the cache, settings, and installed packages. The application provides a disk-usage screen with options to clear the cache and abandoned work folders. This addresses a practical problem: analysis of large corpora can generate temporary copies and indexes that occupy a large amount of space.

## 9. Execution, Performance, and Compatibility

An analysis can take seconds or minutes, depending on corpus size and tagger. TTWtools treats long operations as **tasks**, not as stalled requests. The interface shows progress by stage and allows cancellation. The local server runs the task in the background and reports progress; when the task finishes, the result is displayed. This design prevents the window from appearing frozen and allows the user to continue navigating while the calculation runs.

Before writing, the application checks free disk space. If there is not enough space, the operation is refused before a partial file is created. The check includes a safety margin and a message that states the reason. The application also uses temporary work folders with an owner, the process identifier, so that abandoned folders can be cleaned later. These measures came from real problems. In one development session, temporary copies reached tens of gigabytes.

Compatibility is a project requirement, not a detail. The application must run on macOS 12 (Intel and Apple Silicon), Windows, and Linux. This imposes constraints: different versions of Python and its numerical libraries on older machines; care with web features that Safari 17.6 does not support; and testing on different systems. The file format avoids dependencies outside the standard library. The result is a tool that remains usable over time, at the cost of more maintenance work.

The project maintains several levels of testing. There are tests for the analysis package, tests for the server routes, tests for the interface, and end-to-end tests that simulate real use in a browser. A continuous integration service runs the tests on every change on macOS, Windows, and Linux. No test suite proves that the tool is correct in all cases, but it reduces the chance of regressions and documents expected behavior.

## 10. AI Agents and AI Resources in the Project

### 10.1 Two Distinct Roles

Two uses of artificial intelligence in this project must be distinguished because they play different roles.

The first is **AI in the product**. TTWtools uses language-processing models, spaCy, Stanza, and MFTE, to tokenize, tag, and lemmatize. These models are machine-learning systems trained on large sets of annotated texts. They are “AI” in the broad sense of the field, but they are not generative models of the kind that produce text in response to a question. The application does not call a generative language service during analysis, does not send texts to the cloud, and does not use user texts to train anything. BiberPlus is based on explicit rules. The choice of which models to use, and transparency about what each one does, is part of the methodological design of the tool.

The second is **AI in the development process**. The application was built with the support of programming agents based on language models. The project’s code repository, the versioned folder that stores the source code, has permanent instructions naming Claude, Gemini, Codex, and DeepSeek as compatible agents. The recorded development path shows sessions with Claude and handoffs between sessions. These agents are not authors of the project and do not make scientific decisions. They act as assistants for implementation, documentation, review, and testing, under the author’s direction and validation.

This distinction matters for the committee. The tool is not “an AI that analyzes texts.” It is a corpus analysis tool that uses language-processing models and was developed with the help of agents. The linguistic object and the method of analysis remain human choices.

### 10.2 The Working Contract with Agents

The use of agents was not improvised. The repository contains a permanent instruction file, `AGENTS.md`, which works as an operational contract for any agent working on the project. The file defines what to read before starting, how to work (one work area and one step at a time), how to record progress, how to run tests, and which rules must never be violated.

Some rules are technical and reflect risks identified in practice. Never stage every changed file at once with `git add -A`, because the repository contains large corpus projects that change when opened; add files by name. Never list an agent as an author or co-author of commits. Do not rewrite published history. Do not delete files that the agent did not create. Do not rebuild the package without a request. Check disk space before opening a real project. Work on copies. Run only the tests related to the change. These rules are not bureaucracy. Each one responds to an incident or a concrete risk.

The contract also defines **parity** across the interface, the package, and the command line, and the project’s **vocabulary**. For example, the Portuguese interface uses “atributo” rather than “traço” for Biber features. Language is treated as part of the method. A linguistics tool cannot use terms carelessly.

In addition to `AGENTS.md`, there is a technical diary, `memoria_para_IA.md`, written for agents in future sessions. It records what changed, why, which pitfalls were found, and what not to repeat. It is a form of operational memory that complements version control: the history records what changed; the diary records why it changed and what was learned. For research, the diary is also a record of the construction process, including errors and corrections.

### 10.3 The Development Cycle

The cycle has six stages. First, the author defines the work area and the step. Decisions about scope, method, and architecture are recorded as the author’s decisions. Second, the agent reads the instructions, the plan, and the relevant files, and proposes or implements the change. Third, the change is tested at the appropriate level: package, server, interface, or end-to-end. Fourth, the author reviews the result and the visible behavior. Fifth, the step is recorded in a short version-control entry (a commit) in Portuguese with the prefix `[passo]`. Sixth, the plan and the diary are updated for the next session.

The cycle has two methodological features. The first is **granularity**. Small steps reduce the risk that a broad change breaks unrelated parts and make review easier. The second is **traceability**. Each step leaves a record in the history, and decisions are kept in dedicated documents. The result is not uncontrolled “AI-generated code.” It is a human-directed process with agent support and systematic verification.

There is also a reason to use **multiple agents**. Different models have different styles and strengths. The ability to switch agents reduces dependence on one provider and allows approaches to be compared. The counterpart is the need for a common contract, `AGENTS.md`, so that the work does not become inconsistent. The project also limits the amount of text given to the agent: it reads large files selectively, instructs agents not to open huge directories, and uses an exclusion file for the Repomix context packager, which assembles the code into a single file for agent consultation. These techniques are less visible in the product, but they were necessary to make work with language models viable in a large repository.

### 10.4 Other Uses of AI

In addition to programming agents, there is an auxiliary use of AI in verification. In at least one testing session, audio reports from the author about using the application on an older machine were transcribed with the Whisper model, through the `faster-whisper` implementation. The transcript fed the usability problem log and guided corrections. This use is peripheral to the product, but it is part of the formative evaluation process.

At the current stage, there is no generative AI inside the application to produce explanations, rewrite texts, or generate analyses. Help texts are written and reviewed; they are not generated at run time. This choice preserves predictability and prevents the tool from depending on an external service to function.

### 10.5 Limits, Risks, and Transparency

The use of agents brought gains in speed and test coverage, but it also brought risks that must be stated. The first is **confabulation**: an agent can propose a solution that looks correct but is not. Testing and human review are therefore mandatory. The second is **dependency drift**: models and libraries change, and code that worked may stop working. Versions are therefore pinned and compatibility is tested. The third is **style inconsistency**: different agents may write in different ways. The contract and project standards reduce this risk but do not eliminate it. The fourth is **test optimization**: an agent may make a test pass without solving the real problem. Human review and end-to-end tests help detect this.

Transparency is part of research ethics. This chapter states the use of agents, identifies the documents that record the process, and does not attribute scientific authorship to agents. Decisions about method, scope, interpretation, and final writing belong to the author. User texts are not sent to AI services, and the application does not depend on a network connection to analyze a corpus. This combination (agents in development, no generative AI at run time, and local processing) is the position adopted by the project.

## 11. Summary of Part I

The construction of TTWtools can be summarized in one idea: separate **source**, **annotation**, and **result**, and keep each of these layers identifiable, reusable, and auditable. The original text stays in the project. Annotations stay in layers with tool, version, model, and configuration. Results stay in analyses with parameters and references to the layers used. This separation allows tools to be compared, analyses to be repeated, errors to be corrected without losing the corpus, and projects to be moved to another machine.

The implementation combines a project file in SQLite, a columnar format for tokens, a search index in a cache, and a set of analysis functions in the `ttwtools` package. The interface, the local server, and the command line are layers over this core. The parity principle ensures that an analysis made with clicks can be reproduced in code. The no-rework principle ensures that the corpus is not reannotated without need. Disk-space checks, working copies, and compatibility with older systems protect the work from loss.

AI agents participated in implementation, documentation, and testing under an explicit contract and with human verification. They do not replace linguistic decisions or the interpretation of results. The AI in the product is the language-processing models, spaCy, Stanza, MFTE, and the BiberPlus rules, not a remote generative service.

Part II describes the functions that this architecture supports. These include organizing and importing corpora; tagging and managing layers; exploring through search, concordance, frequency, collocates, and dispersion; comparing through keywords, KFA, frequency bands, and the Lab; analyzing a single text in the Writing tool; learning through help topics and tours; installing corpora and models; and automating all of these operations through the command line and the Python library.

---

## Notes for Revision (not part of the chapter)

1. **Version and figures.** The text refers to application 0.8.3 and package 0.3.1. Confirm whether the chapter should freeze this version or describe the final version at the time of the defense. Performance and file-size figures were deliberately left out. If they are included, check the values in `novodesenho/armazenamento.md` and `novodesenho/macintel.md` and state the reference machine.
2. **Agent use.** The text names Claude, Gemini, Codex, and DeepSeek because they are named in `AGENTS.md`. The recorded path documents sessions with Claude and handoffs between sessions, but it does not distribute tasks by model. If the thesis needs more detail, the author should record which agents worked on which fronts and during which period.
3. **Whisper.** Audio transcription with `faster-whisper` is recorded in `novodesenho/memoria_para_IA.md`. Confirm whether this episode belongs in the chapter or only in the acknowledgments or method notes.
4. **Repomix.** The text mentions the context packager because the repository contains `.repomixignore` and the instructions refer to `repomix-output.xml`. If the use was not relevant, the mention can be removed.
5. **Citations.** Part I mentions Biber, Universal Dependencies, and research traditions but does not yet include full bibliographic references. These should be added in revision, especially in Part II where the metrics are presented.
6. **Figures.** Figures 1 to 4 still need to be produced: layered architecture, project data model, layer-reuse flow, and columnar storage.
7. **Catalog and reference corpora.** The introduction states that there is no public catalog of reference corpora and that large reference corpora are future work. Confirm this before the defense, since it is a limitation of the version described.
