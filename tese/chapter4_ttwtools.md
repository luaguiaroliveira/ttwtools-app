# 4 TTWtools

## 4.1 TTWtools: Introduction and Motivation

TTWtools was born out of the need to annotate and count tags in a corpus and to compare corpora using KFA. In the first year of my doctoral period, our research group was working on the functional analysis of features from a KFA of a corpus of Agrarian Sciences articles. For this work, we had a dataset containing the counts of all tagged features in each text of the corpus.

To analyze the use of those features in the texts, we had to search the dataset for the texts in which a feature had a high **d** value, record the filenames of those texts, find these texts in the corpus folder, and finally look for the features and select examples. This process took time, and I began to think about how to automate it. During this period, I was also looking for freely available taggers and learning how to use them and how to use Python to count the tags, calculate Cohen’s **d** values for the KFA, and plot the bar charts. At the time, I had just started learning Python, and these tasks were challenging.

After I was able to perform these tasks with Python and a few command-line tools, I realized that the process could be improved further. I wanted to put all the necessary steps for a KFA, from tagging to functional analysis, in one place. I also wanted it to be a graphical user interface (GUI) tool so that other researchers and students with limited programming skills could use it. That was when I started developing TTWtools with the assistance of a more experienced programmer. The first version did exactly that: it integrated a set of taggers and KFA functions into a single interface. The taggers already included BiberPlus with spaCy, MFTE with Stanza, and spaCy and Stanza as standalone taggers.

Once the first version was ready and working, its limits became clear. It solved the manual KFA workflow, but it was still a KFA tool. It always started from a pair of corpora, worked only in English, and its main analysis depended on Biber’s taxonomy. It had no ready corpora, no search, and no KWIC. The project files were large, and the annotation was a block that did not tell me which tagger, model, or configuration had produced a number. These limits shaped the next design.

We then started thinking about other improvements. We decided to make the tool bilingual and to make it possible to incorporate taggers for other languages. We also began introducing other traditional corpus linguistics analyses, such as frequency lists, KWIC, and collocations. The idea of including a learning module came from the need to understand the statistics of KFA and other metrics. The learning module was used in the classes reported in Chapter 7.

There are still several improvements to make and ideas to explore in TTWtools. One is a more robust version of KFA. Another is the development of the Writing module, a corpus-based tool to help Brazilian learners improve their writing in English and to help teachers assess student writing. An experimental Writing area already exists, but the fuller module will require further research in statistics and is planned for the coming years. The catalog mechanism for reference corpora also exists, but there is no public catalog of reference corpora yet, and large reference corpora at the scale of the BNC or Hansard are not supported as full corpora. Reference frequency lists provide a partial path for keywords and bands, but they still depend on preparing and distributing the list.

This experience illustrates a broader problem. Corpus linguistics and descriptive linguistics depend on tools. A concordance, a frequency list, a measure of dispersion, or a comparison between corpora is not only a calculation. It is a way of making a linguistic question operational. The choice of tool affects which questions can be asked, which data can be inspected, and how results can be reported. A tool that hides its assumptions or its annotation decisions can produce numbers that look precise but cannot be interpreted. Command-line tools and programming libraries offered control and reproducibility, but they required programming skills. Graphical interfaces offered accessibility, but they often limited the analyses or hid the annotation layer. When I started, the available options required a choice between these two paths. I wanted a local application that offered the accessibility of an interface without giving up the methodological control of a scriptable tool.

Annotation raised a second problem. A corpus can be annotated by different tools, and these tools do not tokenize or tag in the same way. One tool may split contractions, another may keep them; one may use a universal tag set, another may use a language-specific inventory. If the tool treats annotation as a single invisible layer, the user cannot tell which decisions produced a count. TTWtools treats each annotation as a separate layer, with its tool, version, model, and configuration. Layers can coexist over the same text, and each analysis records the layer it used. This design supports comparison and reanalysis and prevents the corpus from being retagged without need.

Exploration and comparison raised a third problem. Research and teaching often begin with a word, a phrase, or a pattern in context. They continue with frequency, dispersion, and collocation. They may end with a comparison between corpora, between groups, or between a single text and a reference. Many tools support one part of this path but not the others. TTWtools connects the parts. A query can be inspected in KWIC, counted, placed in its dispersion, compared with a reference, and opened in the Reader. The same project holds the texts, the layers, and the results.

Reproducibility and privacy raised a fourth problem. Corpora used in teaching and research often contain student essays, interviews, classroom transcripts, or other material that cannot be sent to an external service. Local processing is therefore not only a technical preference. It is a condition for using the tool with sensitive data. A result should also be more than a screenshot. It should be possible to know which corpus, which layer, which parameters, and which version produced it. TTWtools stores analyses with their parameters and the layers they used. It also provides a Copy as code action that produces the equivalent command line and Python snippet. This does not make every analysis reproducible in an absolute sense, because models and libraries change. It does make the path from a result to its conditions visible.

The tool is designed for corpus linguistics and descriptive linguistics, especially for students, and it is also meant to be accessible to teachers who want to produce data-driven learning (DDL) materials. For corpus linguistics, it offers exploration and comparison with explicit annotation layers. For descriptive linguistics, it offers close reading of texts with tags, concordances, and contextual examples. The same interface serves teaching, where the Learn area explains concepts, metrics, and screens, and research, where the project file and the command line support documentation and reanalysis.

TTWtools is a local application. It runs on the user’s computer, keeps the texts and results in a project file, and does not send the corpus to a remote service during analysis. It integrates existing language-processing tools, including spaCy, Stanza, BiberPlus, and MFTE. It does not replace these tools or treat their output as a definitive analysis. The quality of annotation depends on the model, the language, the genre, and the configuration. The interface and the help material state this, and each layer records the conditions under which it was produced.

The description refers to application version 0.8.3 and package version 0.3.1. Section 4.2 describes how the tool is built and how it works: the project as a database, the annotation layers, the storage formats, the search index, the execution model, and the use of AI agents in development. Section 4.3 describes the functions from the user’s point of view: projects and corpora, tagging, exploration, comparison, Writing, help, resources, and automation.

The contribution of the chapter is twofold. It documents a tool that connects exploration, comparison, and reproducibility in a local environment. It also describes the design decisions behind that tool, so that results produced with it can be read with an understanding of their conditions. The chapter begins this description with the scope of the work and the principles that organize the project.


## 4.2 How TTWtools Is Built and How It Works

### 4.2.1 Scope and Purpose

This section describes how TTWtools is built and how it works. It aims to explain what the tool stores, what it calculates, and what it assumes about language data. The design documents of the project are used as a source for intentions and justifications, but the object of description is what exists in the code and in the tests.

TTWtools is a local corpus analysis application. “Local” means that the program, the texts, the annotations, and the results remain on the user’s computer. No text is sent to an external service, and no account on a website is required. The application supports four groups of operations: organizing texts in a project, annotating them with language-processing tools, exploring them through searches and concordances, and comparing them with other corpora or with reference corpora. The same logic that serves the graphical interface is also available in a Python library and in a command-line interface. This equivalence is a design decision, not a technical detail. It allows an analysis made with clicks to be reproduced, documented, and automated.

For a committee in linguistics, the relevant question is not which programming language the tool uses. The relevant question is what the tool stores, what it calculates, and what it assumes about the data. This text addresses those questions. Technical terms are explained when they first appear, and analogies are used only when they clarify an idea.

### 4.2.2 Design Principles

Five design decisions shape the tool.

The first is **local processing and privacy**. The application does not need an internet connection to analyze a corpus that is already installed. Annotation models are downloaded on demand, by explicit choice, and stored in the user’s data folder. No text is sent to a remote server during analysis. This decision has technical consequences, such as loading models locally and checking disk space before writing, and ethical consequences, especially when the corpus contains student essays, interviews, or other sensitive material.

The second is **one interface, without user profiles**. There are no “student” and “researcher” modes. All users see the same screen, with frequent operations in the foreground and specialized options in collapsible panels that anyone can open. This choice keeps advanced resources available to all users and maintains a single learning path.

The third is **parity across the interface, the library, and the command line**. The analysis logic lives in a software package, `ttwtools`. The interface only collects parameters and presents results. A server route does not contain analysis rules; it calls the corresponding package function. As a result, a keyword count, a KFA, or a dispersion analysis has one implementation, used by all three paths. The “Copy as code” button translates an analysis made on screen into a command-line command and an equivalent Python snippet. This makes the analysis auditable and repeatable.

The fourth is **no repeated annotation**. If a text has already been annotated by a tool with the same configuration, TTWtools reuses the annotation instead of repeating the work. If two documents have exactly the same text, the annotation of one can be copied to the other. This principle saves time. More importantly, it prevents the corpus from accumulating incompatible versions of the same annotation without the user’s knowledge.

The fifth is **portability and file longevity**. A project should open on another computer, be archived, be sent to a colleague, or be reopened years later. For this reason, the file format uses only standard-library resources and does not depend on exotic packages. The application also maintains read compatibility with earlier versions. The format is documented and verifiable; it is not a proprietary secret.

### 4.2.3 Overall Architecture

The architecture has four layers, as shown in Figure 4.1. At the surface is the **graphical interface**, written with Vue 3, a library for building interfaces. It contains the menus, forms, tables, charts, and the annotated-text reader. Below it is the **local server**, written in Python with the FastAPI framework, a library that organizes communication between programs. The server receives requests from the interface, coordinates long tasks, and returns structured results. Below the server is the **analysis package** `ttwtools`, which contains the functions that read texts, query annotations, calculate statistics, and generate chart data. At the deepest level is the **project file**, an SQLite database that stores texts, metadata, annotation layers, and results.

The separation between interface and server is not only organizational. It allows the same analysis core to be used in a native desktop window, in a browser pointed at the local server, or, without any interface, on the command line and in research scripts. The application can run in desktop mode, with its own window, or in local web mode. In both cases, the server and the package are the same.

The local server needs an explanation for readers outside computing. A “server” here is not a remote machine. It is a program that runs on the same computer and waits for requests from the interface. When the user clicks “Search,” the interface sends a request to that program, which calls the appropriate package function and returns the response. The advantage is that the interface does not need to know how the search is implemented; it only needs to send a request and display the result. The disadvantage is that the application must start and stop this program together with the window. This is why the project includes management of communication ports, leftover processes, and response time.

The `ttwtools` package is the analytical core. It is organized into modules, separate parts of the program with distinct responsibilities: text and metadata import; simple tokenization; definition and storage of annotation layers; connectors for taggers; queries (search, concordance, frequency, collocates, and dispersion); keywords; feature tables and KFA; descriptive statistics; visualization data; corpus catalog; input and output formats; help; and generation of equivalent code. This division supports maintenance and makes explicit where each calculation takes place.

The help system is part of the architecture. Explanatory texts about concepts, metrics, and screens are stored as plain-text files with light formatting (Markdown) by language, with a title, a summary, and links to related topics. The same content feeds the explanation tooltips, the guided tours, the Learn screen, and the `ttwtools help` command. Explanation is therefore treated as data, separate from the interface code, rather than as an appendix added after development.

Figure 4.1 also shows the flow of an analysis. The interface sends parameters. The server validates them and calls the function. The function opens the project, reads the appropriate layer, calculates, and returns a structured result. The interface presents the result and allows the user to export it. The same flow, without the interface, is what the command line executes.

### 4.2.4 The Project as a Database

#### 4.2.4.1 Why SQLite

The core of TTWtools is the project file. Internally, it is an SQLite database. For readers outside programming, the closest analogy is a spreadsheet workbook: a single file that contains several related tables. Each table has columns and rows; each row is a record; each record stores information in fields. SQLite is a database system that keeps an entire database in one file and does not require a separate database server. It is mature, widely used, and open source.

Three reasons support this choice. The first is **integrity**. The database can relate documents, layers, and tokens through identifiers, and it prevents a layer from existing without a document or a token from pointing to a missing layer. The second is **query efficiency**. With indexes, the database finds all occurrences of a word or tag in millions of tokens without reading the entire file. The third is **safety**. Opening an SQLite database does not execute embedded code, unlike some data formats that can carry malicious instructions. The application does not “run” a project; it reads and writes data.

The `.ttwa` file is therefore an SQLite database. In practice, the application usually saves it compressed, that is, reduced by a compression algorithm that does not lose information, similar to the one used in a `.zip` file, so that it occupies less space. When opening the file, the application decompresses the database into a temporary working copy, makes changes in that copy, and writes the compressed file back when saving. The `.ttwa` extension indicates the project type, not the compression level. The `.ttwt` format, used for sending and archiving, applies a stronger compression algorithm; its logical content is the same.

#### 4.2.4.2 Tables and What They Store

Table 4.1 summarizes the main tables in the current schema. A schema is the plan of the database: it defines which tables exist, which columns each table has, and how the tables relate.

**Table 4.1: Main tables in a `.ttwa` project**

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

Table 4.1 reflects a design decision that shapes the tool. The project does not store “the annotated corpus” as a single block. It stores **documents**, **layers**, and **tokens** as separate, related entities. This separation allows the same text to have a spaCy layer and a BiberPlus layer, or an old layer and a new layer, without duplicating the text or mixing the analyses.

#### 4.2.4.3 Documents, Metadata, and Fingerprints

Each document has a record in the `documents` table. The record includes the filename, the corpus, the character count, and a **fingerprint** of the content: a value calculated by a hash function, in this case SHA-256. The idea is simple. The program reads the text and produces a short code that depends on every character. If one comma changes, the code changes. If the text is identical, the code is identical. This allows the application to compare texts without comparing the full content and to know whether a document has changed since the last annotation.

The hash has two uses. First, it verifies whether the text of a light project still matches the file in the adjacent folder. If the file has changed, the application warns that the annotation may be misaligned. Second, it allows layer reuse across documents with identical content. If two files have the same hash, the layer of one can be copied to the other because the annotation refers to the same text.

Metadata is stored in the `document_meta` table as key-value pairs. It can come from the filename, when the name follows a pattern such as `student_B1_2024.txt`, or from a separate CSV file with a column that identifies each filename. Metadata allows queries such as “compare B1 texts with C1 texts” or “show only essays from 2024.” Without metadata, group comparison would depend on the user separating files into different folders.

#### 4.2.4.4 Layers, Tokens, and No Repeated Annotation

An **annotation layer** is the result of a tool applied to a text. If the text is “The students wrote,” one layer may say that “The” is a determiner, “students” is a noun, and “wrote” is a verb. Another layer, produced by a different tool, may segment the words slightly differently or assign tags from another set. Layers do not replace the text. They refer to it.

TTWtools uses a **standoff** representation, in which annotations are stored separately from the text and linked to it by positions. Each token has a start position and an end position in characters. The rule is that the text segment between those positions must be exactly the annotated word. This rule allows the annotation to be highlighted in the original text, allows the context of a concordance to be recovered, and allows different layers to coexist over the same text.

A layer’s identity is defined by a set of attributes: the document, the tool, the tool version, the model, and a **configuration hash**. The configuration hash is calculated only from options that change the result, such as the chosen model or the decision to extract lemmas. Options that affect only speed, such as batch size or the number of processes, are excluded. Changing the number of processes does not invalidate a layer; changing the model does.

Before annotating a document, the application looks for a layer that satisfies the request. “Satisfy” means the same tool, the same version, the same model, the same result-changing options, and equal or more components. A layer that contains part of speech and lemma satisfies a request for part of speech only; the reverse is not true. If a suitable layer exists, the work is reused. If not, the document is annotated and the layer is saved at the end. If the process is interrupted, documents that were already completed remain completed.

This design has a methodological consequence. A corpus can accumulate layers produced at different times, and each analysis records which layer it used. There is no single invisible “official annotation.” There are identifiable layers with a tool, a version, and a configuration. This is what allows results to be compared and analyses to be repeated in a controlled way.

#### 4.2.4.5 Saved Analyses and Reproducibility

The `analyses` table stores analysis results. Each record has a type (for example, KFA, frequency, or collocates), a name, the parameters used, the layers consulted, the result, and the date. Storing parameters and layers makes it possible to know **how** a result was obtained, not only **what** the result was.

The application reuses a saved analysis while texts, layers, and parameters remain unchanged. If something changes, the result is recalculated. This policy avoids two extremes: recalculating everything on every screen, which would make the tool slow, and presenting an old result as if it were current, which would be misleading.

Reproducibility has two levels. The first is **registration**: the project stores the layer configuration and the analysis parameters. The second is **reexecution**: the “Copy as code” button shows the equivalent command-line command and Python snippet. This allows an analysis made in the interface to be repeated outside it, documented in an article, or incorporated into a script. Reproducibility is not absolute. It depends on model and library versions, which can change. The project therefore records versions and maintains a change history.

#### 4.2.4.6 The Columnar Format and the Lexicon

Storing tokens as a list of rows, each with a word, lemma, part of speech, and tags, is simple but takes a large amount of space because the same words and lemmas repeat millions of times. TTWtools uses its own columnar format, called **TCL** (*TTWtools Columnar Layer*). The name is a project acronym; it has no relation to the Tcl programming language.

The columnar format separates **vocabulary** from **sequence**. Instead of storing the word “student” in every occurrence, the program creates a corpus lexicon in which “student” receives an identification number. The layer then stores sequences of numbers rather than sequences of words. The same applies to lemmas, parts of speech, and tags. Text positions are also stored economically, as differences between consecutive positions. Finally, the data is compressed.

An analogy is a numbered dictionary. Instead of writing the full word on every page, the text writes the number of the dictionary entry. The stored data becomes smaller, and queries can operate on numbers, which are faster to compare than character strings. The current version of the format, `TCL2`, uses whole-number identifiers and a lexicon shared by the corpus. The application can read earlier versions so that older projects remain accessible.

The columnar format has practical effects: smaller files, faster opening, and faster queries on large corpora. The cost is internal complexity. The lexicon must be maintained, identifiers must remain stable, and the rows must be reconstructed when a tool needs them. The format is therefore tested with real projects and with comparisons between the columnar path and the traditional path.

#### 4.2.4.7 The Search Index and Fast Opening

For a word search to be fast, the database needs an **index**, an auxiliary structure that works like the index of a book. Instead of scanning every page, the program consults an ordered list that points to the occurrences. In TTWtools, the `tokens` table has indexes for form, lemma, part of speech, and document. These indexes take space, but they prevent a search over millions of tokens from becoming a full scan.

The application offers two paths. If the project was saved with search tables, the query uses the indexes directly. If it was saved without those tables, to be smaller, the application can build an index in a **cache** folder, a reserve of derived results that can be deleted and rebuilt. The index is attached to the project at query time, as if it were a temporary part of the database. The index can also be built **lazily**: the project opens quickly, and the index is built only when the first query that needs it is executed. Opening is no longer a long wait; the first search may take a few extra seconds.

The cache has a size limit and is cleaned according to how recently it was used. This prevents the application from occupying disk space indefinitely. For the user, the consequence is that the first search in a large project may be slower than later searches, but the cost is not repeated on every opening.

### 4.2.5 Corpora, Documents, and Metadata

A **corpus** in TTWtools is a set of documents grouped under a name inside the project. A project can contain several corpora, such as “essays,” “articles,” and “reference,” and each analysis chooses which corpus to use. This organization allows different corpora to be compared without mixing their texts.

Import accepts a folder of `.txt` files, a single file, a CSV file (a text file with comma-separated values) with a text column, or text pasted into the interface. Metadata can come from filenames or from a separate CSV file. The application shows a preview of how filenames will be interpreted before importing, which reduces metadata coding errors. A name such as `student_B1_2024.txt`, for example, can be read as three fields: student, level, and year.

In addition to plain text, TTWtools imports annotated formats: CoNLL-U, the column format of Universal Dependencies; the `word/TAG` format used by corpora such as Brown and LOB; TEI P5 and BNC XML, standards for encoding digital texts; and GrAF, a standoff format used by corpora such as OANC and MASC. In these cases, the existing annotation is converted into a layer and the text is preserved. This allows annotated corpora to be analyzed without retagging every text.

Simple tokenization, performed without a tagger, splits the text into units using regular expressions, which are patterns of characters. It is used in statistics that do not depend on part of speech and is explicitly an **estimate**. A tagger may split contractions, punctuation, and compound words differently. The application states this in the interface. When a layer is selected, the statistics use that layer’s tokenization, and the numbers may change slightly. This transparency prevents estimates from being treated as definitive measurements.

Metadata supports filters and groups. A metadata filter selects documents, and a metadata grouping creates the groups to be compared. This mechanism allows KFA to compare “B1” with “C1” inside the same corpus, or the Lab to compare several proficiency levels at once.

### 4.2.6 Tagging and Layers

#### 4.2.6.1 What Tagging Means

Tagging, in TTWtools, means assigning to each token of a text one or more linguistic descriptions: part of speech, lemma, a tag from the tool’s tag set, and, in some cases, morphological information. In this chapter, “feature” refers to the linguistic variables used in Biber-style analysis and in KFA.

Tagging depends on tokenization. Different tools tokenize differently. Some split “don’t” into “do” and “n’t,” while others keep the contracted form. Some treat punctuation as a token, while others do not. For this reason, layers align with the text by character position rather than by token number. This decision allows layers that tokenize differently to be compared without losing the reference to the original text.

#### 4.2.6.2 Taggers

TTWtools integrates four families of taggers, summarized in Table 4.2. All produce the same output format, so later analyses do not need to know which tool generated a layer.

**Table 4.2: Integrated taggers**

| Tagger | Nature | What it produces | Languages | Notes |
|---|---|---|---|---|
| spaCy | Trained statistical and neural models | Tokenization, part of speech, lemma, morphology | English and Portuguese | Models of different sizes, downloaded on demand |
| Stanza | Trained neural models aligned with Universal Dependencies | Tokenization, part of speech, lemma, morphology | English and Portuguese | Also used as a tokenizer by other tools |
| BiberPlus | Rules and regular expressions, with optional spaCy support | About 67 Biber features | English | Does not depend on neural training for Biber tags |
| MFTE | Tagger based on Stanza and torch (a machine-learning library) | Extended set of features, with an extended version | English | Optional and heavier dependency; separate license |

The distinction between trained models and rules matters for interpretation. spaCy and Stanza are machine-learning systems. Their decisions come from statistical patterns learned from annotated data. They can make systematic errors, and their quality depends on the model, the domain, and the language. BiberPlus applies explicit rules to identify a set of features associated with Biber’s tradition. It is more predictable, but it depends on how the rules were formulated. MFTE expands the set of features and relies on Stanza and torch. None of these tools is neutral. Each carries a conception of token, part of speech, and feature.

The application offers configuration presets: **Fast**, **Recommended**, and **Most accurate**. The presets fill in the tagger options. The **Customize** panel exposes the options with explanations and indicates which options change the result and which affect only performance. The **tag set** of each tagger can be consulted with definitions and examples, and the same content feeds the help system and the reader. The goal is for users to know what a tag means before interpreting a count.

#### 4.2.6.3 Reuse and Cache

Layer reuse was described in Section 4.2.4.4. Its effect on the workflow deserves attention. The tagging screen allows the user to build a list of steps to run, for example basic statistics, a spaCy layer, and a BiberPlus layer, and then run everything at once. The application calculates only what is missing. If the list is interrupted, completed work remains; when the user resumes, the application does not repeat what already exists.

This design matters for large corpora and slow machines. It also makes work incremental. A user can start with a light layer, explore the corpus, and later add a more expensive layer only for the analysis that requires it. The tool does not require a complete annotation before any exploration.

### 4.2.7 Import, Export, and Interoperability

TTWtools is not a closed system. It imports formats used by other communities and exports results so that they can be analyzed, archived, or published. Table 4.3 summarizes the main formats.

**Table 4.3: Input and output formats**

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

### 4.2.8 Catalog, Models, and User Data

The application can work with personal corpora and with reference corpora distributed by the project. The **catalog** is a list of available packages described in a `catalogo.json` file. JSON is a structured text format that is readable by people and by programs. Each package has a **description sheet** with language, variety, period, genres, size, license, source, available layers, and hashes. The catalog is not an uncontrolled text repository. The sheet is validated, and the license is part of the distribution decision.

A package can contain the annotated project, only the frequency lists, or both. For corpora whose license does not allow redistribution of the texts, the catalog offers a **recipe**: the procedure for users to prepare their own copy from the original source. This distinction matters for research ethics and for the publication of results.

spaCy and Stanza models are downloaded on demand and stored in the user’s data folder. On macOS, this folder is `~/Library/Application Support/TTWtools`; on Windows, `%LOCALAPPDATA%\TTWtools`; on Linux, `~/.local/share/TTWtools`. An environment variable can change the location. The models have their own licenses, and the application shows the description sheet and the size before download. MFTE is distributed under the GNU General Public License (GPL) and is an optional dependency with separate legal treatment in distribution. This separation is a technical and legal decision, not only a matter of convenience.

The data folder also stores the cache, settings, and installed packages. The application provides a disk-usage screen with options to clear the cache and abandoned work folders. This addresses a practical problem: analysis of large corpora can generate temporary copies and indexes that occupy a large amount of space.

### 4.2.9 Execution, Performance, and Compatibility

An analysis can take seconds or minutes, depending on corpus size and tagger. TTWtools treats long operations as **tasks**, not as stalled requests. The interface shows progress by stage and allows cancellation. The local server runs the task in the background and reports progress; when the task finishes, the result is displayed. This design prevents the window from appearing frozen and allows the user to continue navigating while the calculation runs.

Before writing, the application checks free disk space. If there is not enough space, the operation is refused before a partial file is created. The check includes a safety margin and a message that states the reason. The application also uses temporary work folders with an owner, the process identifier, so that abandoned folders can be cleaned later. These measures came from real problems. In one development session, temporary copies reached tens of gigabytes.

Compatibility is a project requirement, not a detail. The application must run on macOS 12 (Intel and Apple Silicon), Windows, and Linux. This imposes constraints: different versions of Python and its numerical libraries on older machines; care with web features that Safari 17.6 does not support; and testing on different systems. The file format avoids dependencies outside the standard library. The result is a tool that remains usable over time, at the cost of more maintenance work.

The project maintains several levels of testing. There are tests for the analysis package, tests for the server routes, tests for the interface, and end-to-end tests that simulate real use in a browser. A continuous integration service runs the tests on every change on macOS, Windows, and Linux. No test suite proves that the tool is correct in all cases, but it reduces the chance of regressions and documents expected behavior.

### 4.2.10 AI Agents and AI Resources in the Project

#### 4.2.10.1 Two Distinct Roles

Two uses of artificial intelligence in this project must be distinguished because they play different roles.

The first is **AI in the product**. TTWtools uses language-processing models, spaCy, Stanza, and MFTE, to tokenize, tag, and lemmatize. These models are machine-learning systems trained on large sets of annotated texts. They are “AI” in the broad sense of the field, but they are not generative models of the kind that produce text in response to a question. The application does not call a generative language service during analysis, does not send texts to the cloud, and does not use user texts to train anything. BiberPlus is based on explicit rules. The choice of which models to use, and transparency about what each one does, is part of the methodological design of the tool.

The second is **AI in the development process**. The application was built with the support of programming agents based on language models. The project’s code repository, the versioned folder that stores the source code, has permanent instructions naming Claude, Gemini, Codex, and DeepSeek as compatible agents. The recorded development path shows sessions with Claude and handoffs between sessions. These agents are not authors of the project and do not make scientific decisions. They act as assistants for implementation, documentation, review, and testing, under the author’s direction and validation.

This distinction matters for the committee. The tool is not “an AI that analyzes texts.” It is a corpus analysis tool that uses language-processing models and was developed with the help of agents. The linguistic object and the method of analysis remain human choices.

#### 4.2.10.2 The Working Contract with Agents

The use of agents was not improvised. The repository contains a permanent instruction file, `AGENTS.md`, which works as an operational contract for any agent working on the project. The file defines what to read before starting, how to work (one work area and one step at a time), how to record progress, how to run tests, and which rules must never be violated.

Some rules are technical and reflect risks identified in practice. Never stage every changed file at once with `git add -A`, because the repository contains large corpus projects that change when opened; add files by name. Never list an agent as an author or co-author of commits. Do not rewrite published history. Do not delete files that the agent did not create. Do not rebuild the package without a request. Check disk space before opening a real project. Work on copies. Run only the tests related to the change. These rules are not bureaucracy. Each one responds to an incident or a concrete risk.

The contract also defines **parity** across the interface, the package, and the command line, and the project’s **vocabulary**. For example, the Portuguese interface uses “atributo” rather than “traço” for Biber features. Language is treated as part of the method. A linguistics tool cannot use terms carelessly.

In addition to `AGENTS.md`, there is a technical diary, `memoria_para_IA.md`, written for agents in future sessions. It records what changed, why, which pitfalls were found, and what not to repeat. It is a form of operational memory that complements version control: the history records what changed; the diary records why it changed and what was learned. For research, the diary is also a record of the construction process, including errors and corrections.

#### 4.2.10.3 The Development Cycle

The cycle has six stages. First, the author defines the work area and the step. Decisions about scope, method, and architecture are recorded as the author’s decisions. Second, the agent reads the instructions, the plan, and the relevant files, and proposes or implements the change. Third, the change is tested at the appropriate level: package, server, interface, or end-to-end. Fourth, the author reviews the result and the visible behavior. Fifth, the step is recorded in a short version-control entry (a commit) in Portuguese with the prefix `[passo]`. Sixth, the plan and the diary are updated for the next session.

The cycle has two methodological features. The first is **granularity**. Small steps reduce the risk that a broad change breaks unrelated parts and make review easier. The second is **traceability**. Each step leaves a record in the history, and decisions are kept in dedicated documents. The result is not uncontrolled “AI-generated code.” It is a human-directed process with agent support and systematic verification.

There is also a reason to use **multiple agents**. Different models have different styles and strengths. The ability to switch agents reduces dependence on one provider and allows approaches to be compared. The counterpart is the need for a common contract, `AGENTS.md`, so that the work does not become inconsistent. The project also limits the amount of text given to the agent: it reads large files selectively, instructs agents not to open huge directories, and uses an exclusion file for the Repomix context packager, which assembles the code into a single file for agent consultation. These techniques are less visible in the product, but they were necessary to make work with language models viable in a large repository.

#### 4.2.10.4 Other Uses of AI

In addition to programming agents, there is an auxiliary use of AI in verification. In at least one testing session, audio reports from the author about using the application on an older machine were transcribed with the Whisper model, through the `faster-whisper` implementation. The transcript fed the usability problem log and guided corrections. This use is peripheral to the product, but it is part of the formative evaluation process.

At the current stage, there is no generative AI inside the application to produce explanations, rewrite texts, or generate analyses. Help texts are written and reviewed; they are not generated at run time. This choice preserves predictability and prevents the tool from depending on an external service to function.

#### 4.2.10.5 Limits, Risks, and Transparency

The use of agents brought gains in speed and test coverage, but it also brought risks that must be stated. The first is **confabulation**: an agent can propose a solution that looks correct but is not. Testing and human review are therefore mandatory. The second is **dependency drift**: models and libraries change, and code that worked may stop working. Versions are therefore pinned and compatibility is tested. The third is **style inconsistency**: different agents may write in different ways. The contract and project standards reduce this risk but do not eliminate it. The fourth is **test optimization**: an agent may make a test pass without solving the real problem. Human review and end-to-end tests help detect this.

Transparency is part of research ethics. This chapter states the use of agents, identifies the documents that record the process, and does not attribute scientific authorship to agents. Decisions about method, scope, interpretation, and final writing belong to the author. User texts are not sent to AI services, and the application does not depend on a network connection to analyze a corpus. This combination (agents in development, no generative AI at run time, and local processing) is the position adopted by the project.

### 4.2.11 Summary

The construction of TTWtools can be summarized in one idea: separate **source**, **annotation**, and **result**, and keep each of these layers identifiable, reusable, and auditable. The original text stays in the project. Annotations stay in layers with tool, version, model, and configuration. Results stay in analyses with parameters and references to the layers used. This separation allows tools to be compared, analyses to be repeated, errors to be corrected without losing the corpus, and projects to be moved to another machine.

The implementation combines a project file in SQLite, a columnar format for tokens, a search index in a cache, and a set of analysis functions in the `ttwtools` package. The interface, the local server, and the command line are layers over this core. The parity principle ensures that an analysis made with clicks can be reproduced in code. The no-rework principle ensures that the corpus is not reannotated without need. Disk-space checks, working copies, and compatibility with older systems protect the work from loss.

AI agents participated in implementation, documentation, and testing under an explicit contract and with human verification. They do not replace linguistic decisions or the interpretation of results. The AI in the product is the language-processing models, spaCy, Stanza, MFTE, and the BiberPlus rules, not a remote generative service.

Section 4.3 describes the functions that this architecture supports. These include organizing and importing corpora; tagging and managing layers; exploring through search, concordance, frequency, collocates, and dispersion; comparing through keywords, KFA, frequency bands, and the Lab; analyzing a single text in the Writing tool; learning through help topics and tours; installing corpora and models; and automating all of these operations through the command line and the Python library.

## 4.3 Functions of TTWtools

### 4.3.1 Scope and Organization

This section describes the functions of TTWtools from the user’s point of view. It explains what each function does, which inputs it accepts, what it returns, which method it applies, and which limits the user should keep in mind. The term “function” here means a user-facing operation, not a single function in the source code. Some operations combine several package functions and several interface actions.

The application is organized into eight areas: File, Tagging, Explore, Reader, Compare, Writing, Learn, and Resources. The same operations are available through the graphical interface, the command line, the Python package, and a local REST API. Section 4.2 explained why this parity exists. This section describes what the parity makes available.

Two areas are marked experimental: the Lab, for comparisons of several groups, and Writing, for the comparison of a single text with a reference corpus. Their results are descriptive or exploratory, and their interfaces state this. The remaining functions are part of the stable workflow.

The description follows the order of a typical project: create and fill a project, tag the corpus, explore it, compare corpora or groups, analyze a single text, consult the help, install resources, and automate the analysis. The final section presents a matrix that maps each area to the interface, the command line, the Python API, and the local route.

### 4.3.2 Projects and Corpora

#### 4.3.2.1 Creating and Opening Projects

A project is the unit that holds corpora, metadata, annotation layers, and saved analyses. The user creates a project by choosing a path with the `.ttwa` extension. The application writes a new SQLite database, compresses it by default, and continues working on a temporary copy. The original file is updated when the user saves. The user can also create an uncompressed project, which opens without decompression and is larger on disk.

The application opens `.ttwa`, `.ttwl`, `.ttwt`, `.ttwc`, `.ttwcl`, and `.ttwal` files. A `.ttwl` project stores the texts in a folder next to the project file and keeps only the relative paths and content hashes inside the database. A `.ttwt` file is a compressed archive used for sending or archiving. The recent-files list stores the last projects opened by the application and by the command line.

When an older project is opened, the application migrates it to the current schema. The migration adds the tables introduced in version 0.3 and reports how many documents, layers, and tokens were converted. Projects that use the old TSV format are detected, and the application warns that those files were not indexed. The migration does not delete the original data. It writes the new structures and records the schema version.

The File area also provides maintenance operations:

**Table 4.4: Project maintenance operations**

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

**Table 4.5: Project file types**

| Extension | Content | Typical use |
|---|---|---|
| `.ttwa` | Texts, layers, and analyses inside one file | Personal project, archive, exchange |
| `.ttwl` | Layers and analyses inside; texts in a folder next to the file | Large corpora, version control |
| `.ttwt` | Compressed archive of a project | Sending or archiving |
| `.ttwc` | One corpus with texts inside | Sharing a single corpus |
| `.ttwcl` | One corpus with texts outside | Large single corpus |
| `.ttwal` | A selection of corpora with texts outside | Exporting part of a project |

The application converts between the two main project types. “Detach corpus” turns a `.ttwa` into a `.ttwl` plus a folder of texts. “Embed corpus” turns a `.ttwl` into a `.ttwa` and brings the texts inside. The conversion checks the hashes of the texts. If a text is missing or has changed, the application reports the problem and does not silently attach a different text to existing layers. “Relink corpus” points a `.ttwl` to another folder after checking the hashes. “Export texts” writes the corpus to a folder next to the project.

#### 4.3.2.2 Importing Texts and Metadata

A corpus can be imported from a folder of `.txt` files, a single text file, a CSV file with a text column, or text pasted into the interface. The application accepts a corpus name and, optionally, a metadata schema derived from the filenames. A filename such as `student_B1_2024.txt` can be read with the delimiter `_` and the fields `student`, `level`, and `year`. The interface shows a preview of the parsed names before the import, so the user can correct the delimiter or the field list.

Metadata can also come from a CSV file with one row per document and a column that identifies the filename. The metadata keys become available for filters and groupings in all analyses. Examples are proficiency level, genre, year, author, school, and task. The application reports the number of imported documents and the metadata keys it found.

In addition to plain text, the application imports annotated formats:

**Table 4.6: Import formats for annotated corpora**

| Format | What is imported | Result |
|---|---|---|
| CoNLL-U | Sentences with tokens, lemmas, UPOS, XPOS, morphology, and dependencies | Documents plus a layer from the source annotation |
| `word/TAG` (Brown, LOB) | Token and tag pairs | Documents plus a layer from the source tag set |
| TEI P5 and BNC XML | Text and, when `<w>` elements are present, word-level annotation | Documents plus a layer when annotation exists |
| GrAF (OANC, MASC) | Standoff annotation with token and tag references | Documents plus a layer with the available tags |

Imported annotated corpora are not retagged. The source annotation becomes a layer, and the text is preserved. This allows a corpus such as Brown, LOB, OANC, or MASC to be explored with the same tools as a personal corpus.

The import functions are available in the interface and in the package. The command line uses `ttwtools import`; the interface uses the import wizard; the Python API uses `ttwtools.import_corpus` and the functions in `ttwtools.formats`. The `ttwtools names` command shows how filenames would be parsed without importing anything.

#### 4.3.2.3 Corpus Overview

The corpus overview describes the corpus before and after tagging. The first level uses only the text and a simple tokenizer. It reports the number of documents, word tokens, types, and hapax legomena; the type/token ratio (TTR); the corrected TTR of Carroll (CTTR); the standardized TTR (STTR) over blocks of a chosen size; the moving-average TTR (MATTR) over a chosen window; the mean word length; the number of sentences; the mean sentence length; the distribution of document sizes (minimum, median, maximum, mean, and standard deviation); the most frequent words; and the first part of the Zipf curve.

Because this level does not use a tagger, the numbers are estimates. A tagger may split contractions, punctuation, and compounds differently. The interface states this. The user can hide function words from the list of frequent words, choose the stopword language, set the block size for STTR, set the window for MATTR, and choose how many items to show.

The second level uses a layer. It reports the distribution of UPOS, XPOS, and tagger tags; lexical density, defined as the proportion of content words among the words of the layer; sentence length according to the tagger segmentation; the most frequent lemmas by part of speech; and, for the main tags, the mean and standard deviation per 1,000 words across documents. The last measure shows how homogeneous the corpus is: a high standard deviation means that the tag is unevenly distributed across texts.

The overview is stored in the analyses table and reused while the texts, layers, and parameters do not change. The interface presents the results as numbers, tables, and charts. The command line uses `ttwtools describe`; the Python API uses `ttwtools.describe`. The same function accepts a metadata filter, so the user can describe a subgroup rather than the whole corpus.

#### 4.3.2.4 The Pipeline

The pipeline is a list of operations to run on a corpus. It can contain basic statistics and one or more tagging layers, each with its options. The list is stored in the project, so the user can leave and return later. When the user runs the pipeline, the application executes the tagging steps in order and the statistics at the end. It calculates only what is missing. Layers that already satisfy a step are reused, and documents with identical texts can receive a copy of an existing layer.

The interface shows progress by step and by document. If the run is interrupted, completed documents remain completed. The user can add, remove, or clear steps. The command line uses `ttwtools pipeline`; the Python API uses the functions in `ttwtools.pipeline`.

The pipeline is useful in large corpora and on slow machines. It turns a set of separate operations into one planned run, and it makes the order of operations explicit. It also records what the user intended to do, which helps when the project is reopened months later.

### 4.3.3 Tagging and Layers

#### 4.3.3.1 Choosing a Tagger

TTWtools integrates four taggers. They differ in what they produce, which languages they support, and which dependencies they require.

**Table 4.7: Integrated taggers**

| Tagger | What it produces | Languages | Dependencies | Notes |
|---|---|---|---|---|
| spaCy | Tokenization, UPOS, Penn Treebank tag, lemma, morphology | English and Portuguese | spaCy and a model | Models of different sizes, downloaded on demand |
| Stanza | Tokenization, UPOS, XPOS, lemma, morphology | English and Portuguese | Stanza and torch | Also used as the tokenizer for MFTE |
| BiberPlus | About 67 Biber features | English | biberplus and spaCy | Rule-based features; the current app path uses a spaCy-based pipeline |
| MFTE | A standard and an extended set of features | English | Stanza, torch, and MFTE | The extended set is larger and slower |

spaCy and Stanza are trained models. Their decisions come from statistical patterns learned from annotated data. BiberPlus applies explicit rules to identify features from the Biber tradition. MFTE uses Stanza for tokenization and a separate tagger for the feature set. The application does not treat these tools as equivalent. Each layer records the tool, the version, the model, and the configuration, and each analysis records which layer it used.

The application can detect the language of a corpus from its layers or from its function words and suggest a model. The user can change the model. BiberPlus and MFTE are limited to English. spaCy and Stanza have English and Portuguese models.

Each tagger has a tag set. The interface shows the tag set with definitions and examples. The same definitions appear in the Reader and in the Learn area. The tag set can be searched and grouped. The purpose is to let the user interpret a tag before interpreting a count.

#### 4.3.3.2 Presets and Options

The application offers three presets: Fast, Recommended, and Most accurate. A preset fills the options of the tagger. The user can then open the Customize panel and change individual options. The panel groups the options into model and language, what to extract, performance, and advanced settings.

The options are marked as result-changing or performance-only. A result-changing option enters the layer identity and invalidates reuse when it changes. A performance-only option does not. Examples of result-changing options are the model, the active components, the Stanza package, the decision to extract lemmas, and the BiberPlus function-word setting. Examples of performance-only options are batch size, the number of processes, and the device.

The option panel also checks availability. If a spaCy model is not installed, the panel offers to download it and shows its size. If a Stanza package is missing, the panel shows the command or the download action. If torch is not available on the machine, Stanza and MFTE are marked as unavailable with a reason. The application does not start a tagging run that cannot finish because of a missing dependency.

The tagger options and tag sets are available outside the interface. The command line uses `ttwtools tagger-options` and `ttwtools tagset`; the Python API uses `ttwtools.taggers`. The options descriptor is the same one used by the interface, so the explanation and the default values do not diverge.

#### 4.3.3.3 Running Tagging and Managing Layers

Before tagging, the application can plan the run. The plan reports how many documents already have a sufficient layer, how many can copy a layer from a document with the same text, how many will be processed, and how many have no text available. A sufficient layer has the same tool, version, model, result-changing options, and equal or more components than the request. A layer with part of speech and lemma satisfies a request for part of speech only.

The tagging function processes only the documents that need work. It saves each document as it finishes. If the process is interrupted, the completed documents are kept. A new run reuses them and continues with the rest. The function returns the number of tagged, reused, and cloned documents, the number of missing texts, and the identifiers of the resulting layers.

The interface lists the layers of a corpus. For each layer, it shows the tool, version, model, configuration, number of tokens, and date. The user can export a layer to CoNLL-U, VRT, CSV, JSONL, or Parquet. The user can also count the occurrences of each tag in the corpus, which is useful for the Reader and for checking the tag distribution.

The no-rework rule applies here. Changing the number of processes does not create a new layer. Changing the model, the components, or a result-changing option does. The layer list makes this visible: it shows the configuration that produced each layer, so the user can compare layers and decide which one to use in an analysis.

### 4.3.4 Exploring a Corpus

#### 4.3.4.1 Query Language

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

#### 4.3.4.2 Search

The Search tool counts the occurrences of a query. It reports the total number of hits, the number of documents with at least one hit, the count per document, and, when the user chooses a metadata key, the count per group. The result includes a bar chart; the underlying rows can be exported, and the equivalent command or Python code can be copied.

Search is the simplest way to check whether a form, lemma, tag, or phrase occurs in the corpus and how it is distributed. It does not show the context of each occurrence. For context, the user opens KWIC. For dispersion, the user opens the Dispersion tool. The three tools share the same query language, so a query can be moved from one to another without rewriting it.

#### 4.3.4.3 KWIC

KWIC shows each occurrence of the query with a chosen number of tokens to the left and to the right. Each line includes the left context, the match, the right context, the part of speech of the match, the filename, and the character position. The user can show the full sentence, change the context size, sort by position in the text, by the word on the left, or by the word on the right, and move through pages of results.

A click on a KWIC line opens the Reader at the matching position. The Reader shows the document with the layer’s tags, so the user can inspect the full context and the annotation. KWIC results can be exported and copied as code. The function returns the total number of matches, the current page, the sort order, and the lines.

KWIC is the central exploration tool for descriptive work. It connects a count to its occurrences and to the surrounding text. It also makes it possible to check whether a pattern found by a statistical measure corresponds to a recurring construction or to a few isolated cases.

#### 4.3.4.4 Frequency

The Frequency tool lists the most frequent items in the corpus. The user chooses the unit: form, lemma, word plus class, class, or n-gram. For n-grams, the user chooses the length. The user also chooses whether to count by corpus, by document, or by a metadata group, how many items to show, whether to hide function words, and whether to count only words.

Each row reports the item, the absolute frequency, and the frequency per 1,000 words. The result can be shown as a bar chart or a table and can be exported. The function returns the unit, the grouping, the size of each group, and the rows.

The choice of unit has consequences. Form counts distinguish `run` and `running`. Lemma counts group them under the same lemma, but only if the layer has lemmas. Word plus class separates homographs, such as `run` as a verb and `run` as a noun. Class counts summarize the distribution of parts of speech. N-grams count sequences of forms but do not identify constructions in the sense of pattern grammar.

The tool warns when the chosen unit requires a field that the layer does not have. For example, a BiberPlus layer does not contain lemmas, so a lemma frequency on that layer would be empty. The interface asks the user to choose another layer or another unit.

#### 4.3.4.5 Collocates

The Collocates tool finds the words that occur near a node. The node is a query in the same syntax as the other tools. The user chooses a window to the left and to the right, the unit, the minimum frequency, the measure used for sorting, and the number of rows.

The result reports, for each collocate, the observed frequency, the frequency of the collocate in the corpus, the expected frequency, mutual information (MI), the T-score, the log-likelihood, the side where it appears more often, and the number of different forms of the node that occur with it. The user can sort by log-likelihood, MI, T-score, or frequency.

The measures answer different questions. Frequency shows how often the collocate occurs near the node. MI shows how strongly the two items are associated, but it is unstable for rare items. The T-score favors frequent collocates. Log-likelihood compares the observed and expected frequencies in a 2×2 table and is the measure used in several corpus tools. The tool does not choose one measure as correct. It presents the measures side by side.

A click on a row opens examples of the collocate in context. Each example shows the node and the collocate, and a click opens the Reader at that position. The examples are paginated. The function returns the node frequency, the corpus size, the window, the unit, and the rows.

The interpretation depends on the window and the minimum frequency. A wide window includes syntactic and semantic relations that are not direct. A low minimum frequency includes rare pairs with unstable measures. The interface shows the window and the minimum frequency so the user can report them.

#### 4.3.4.6 Dispersion

The Dispersion tool shows where a query occurs in each document. It reports the dispersion measures of Gries: DP, Range, and normalized DP. DP is half the sum of the absolute differences between the observed proportion of occurrences in each document and the expected proportion based on document size. A value near zero means a uniform distribution. A value near one means a concentrated distribution. Range is the number of documents in which the query occurs. Normalized DP divides DP by one minus the smallest expected proportion.

For each document, the result includes the number of tokens, the frequency of the query, the expected frequency, the observed frequency, and the absolute deviation between observed and expected. The interface can show the result as a heatmap of position bands, as a barcode, as a table of observed and expected values, or as a report of DP and Range per query. The heatmap divides each text into bands and shows the density of occurrences. The barcode shows each occurrence as a tick between the start and the end of the text.

The tool accepts several queries at once. Each query can have its own color. This is useful for comparing the dispersion of several tags or forms in the same corpus. The result can be exported, and a click on a text opens the Reader with the query highlighted.

The dispersion measures are descriptive. They do not test whether a distribution is statistically surprising. They help the user see whether a frequency is spread across the corpus or concentrated in a few texts. This distinction matters for keywords and for the interpretation of frequency lists.

#### 4.3.4.7 Reader

The Reader shows a document with its annotation. The user chooses the corpus, the document, and the layer. The text is displayed with tags, and the side panel lists the tags of the layer with their counts and colors. The user can select one or more tags to mark them in the text, choose a markup style, and change the color. The markup styles include highlight, underline, circle, box, strike-through, and crossed-off.

The Reader also provides a search field for fragments, wildcards, and regular expressions, previous and next match navigation, a match counter, copy of the whole text or of the selection, print, zoom, font size, and text justification. The history buttons move back and forward between documents. The legend shows the tags and allows the user to highlight them by clicking. A tooltip shows the definition of a tag from the tag set used by the layer.

If the document has no layer, the Reader shows the text without tags. If the project is a `.ttwl` and the corpus folder is missing, the Reader reports that the text is unavailable. The Reader is linked from KWIC, collocate examples, dispersion charts, keyword results, and KFA charts, so the user can move from a result to the text and back.

### 4.3.5 Comparing Corpora and Groups

#### 4.3.5.1 The Comparison Bar

The Compare area has a comparison bar that defines the two sides used by its tools. Side 1 is the active corpus. Side 2 can be another corpus in the project or a second group of the same corpus. The user chooses the group by metadata. The bar also defines the color of each side and, for KFA, the metric.

The comparison bar applies to Keywords, KFA, Frequency bands, Lab, and Dispersion. The layer used by an analysis follows the layer chosen at the top of the screen. If the layer changes after a result was computed, the interface warns that the result refers to the previous layer and offers to recompute. If the chosen unit requires a field that the layer does not have, the interface warns before the run.

The two sides can differ in size. The analyses report the number of texts and words on each side. Some methods, such as wKFA, account for unequal group sizes. Others, such as the simple difference of means, do not. The interface states which method is in use.

#### 4.3.5.2 Keywords

Keywords compares a target corpus or group with a reference. The reference can be another corpus in the project, a group of the same corpus, a frequency list in `.tsv` format, or a list installed from the catalog. The target is defined by the active corpus and, optionally, by a metadata filter.

The user chooses the unit: form, lemma, part of speech, word plus class, or n-gram. The user also chooses the measure used for ordering, the minimum frequency in the target, the minimum number of target texts in which an item appears, the correction for multiple comparisons, and the number of items to show. The significance level is 0.05 by default, and the function accepts another value. The analysis can return items that are more frequent in the target and items that are less frequent.

The measures are:

**Table 4.8: Measures used in keyword analysis**

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

#### 4.3.5.3 Key Feature Analysis

Key Feature Analysis (KFA) compares two corpora or two groups by their linguistic features. The features are the tags, UPOS, or XPOS of a layer. The function first builds a table with one row per document and one column per feature, with counts per 1,000 words. It then calculates Cohen’s d for each feature between the two sides.

The metric can be KFA or wKFA. KFA uses the pooled standard deviation of Biber and Egbert, defined as the square root of the mean of the two variances. wKFA uses the classic pooled standard deviation, weighted by the number of texts on each side. The second is preferable when the sides differ in size. The result reports the effect size, the means and standard deviations of each side, the raw counts, and the number of texts on each side.

The user chooses the minimum absolute d. This filter applies to the result already computed; changing it does not recalculate the counts. The result can be shown as a table and as a gallery of charts. The table has one row per feature and columns for the feature, effect size, mean and count on each side, and the per-1,000 values. The user can sort by feature, effect size, or count. A click on a feature opens the list of texts in which it occurs, ordered by frequency, and a click on a text opens the Reader.

The chart gallery includes diverging bars, a scatter of means, bubbles that combine difference and d, per-text strips, violin plots, histograms, heatmaps, parallel coordinates, radar charts, and dimension reductions. The reductions are PCA in two or three dimensions, t-SNE, MDS, and UMAP when the optional package is installed. The charts can be exported. Charts that represent individual texts can open the Reader.

KFA requires at least two documents on each side. With fewer documents, the variance is not estimable and the function refuses the analysis. The effect size is descriptive: it shows how far the sides are, in standard deviation units, on each feature. It does not by itself establish statistical significance, and the application does not present it as a test.

#### 4.3.5.4 Frequency Bands

Frequency bands describe how much of the target text is made of the most frequent words of a reference. The user chooses a reference, a unit (form, lemma, or word plus class), and the band limits. The default bands are the first 1,000, 2,000, 3,000, 5,000, and 10,000 words of the reference, plus an off-list band for items outside the list.

For each band, the result reports the number of tokens, the number of types, the percentage of tokens, the percentage of types, and examples. The sum of the bands covers the target corpus. The measure follows the lexical frequency profile of Laufer and Nation.

The reference can be a frequency list, a corpus in the project, or a list from the catalog. When the reference is a corpus, the function can filter its documents by metadata. The target can also be filtered by metadata. The unit must be available in the layer, and the reference list must contain the same unit.

The interpretation depends on the reference and on the tokenization. A general reference shows how much of the text uses common vocabulary. A reference from the same genre shows finer differences. If the target and the reference were lemmatized by different tools, the lemma comparison may be unreliable. The interface reports the reference size and the unit so the user can describe the comparison.

#### 4.3.5.5 Lab

The Lab compares two or more groups. It is marked experimental. A group can be a corpus or a subset of a corpus defined by metadata. The analysis uses the same document by feature table as KFA, with counts per 1,000 words.

The methods are:

**Table 4.9: Methods in the Lab**

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

#### 4.3.5.6 Dispersion Comparison

The dispersion comparison applies the dispersion measures to the two sides of the comparison bar. It produces two panels, one for each side. Each panel shows a heatmap of position bands, one row per text, and the ticks of the query. The user can sort the texts by name, frequency, or contributed DP, which is the absolute deviation between observed and expected occurrences.

A click on a text opens the Reader at the query position. The query box accepts the same syntax as the other tools, including tags with colors. The background of the panel uses the color of the side, and the ticks use the color of the tag or of the side. The result can be exported.

The comparison is descriptive. It shows whether a query is more concentrated in one side and in which texts. It does not test the difference between the two dispersion values. The user should report the DP, the Range, and the number of documents for each side.

### 4.3.6 Writing

The Writing area compares one text with a reference corpus. It is marked experimental. The text is one unit, not a random sample of independent units. The results are descriptive and exploratory. The interface states this in a note on how to read the results.

#### 4.3.6.1 Single Text against a Reference

The user pastes a text or uploads a file. The application accepts `.txt`, `.md`, `.docx`, and `.odt` through the standard library. PDF is accepted when the optional `pypdf` package is installed. The reference can be a corpus in the project, a `.tsv` frequency list, or a list from the catalog. A `rest:` reference is not accepted because the target is already a single text.

The Words tab performs a keyword analysis of the text against the reference. It uses forms by default. The function also accepts lemmas, classes, word plus class, and n-grams, as well as other measures and corrections. The default measure is log ratio, and the default correction is the false discovery rate. The result reports the same measures as the Keywords tool, plus the dispersion of each item in the reference and a z-score that compares the text’s rate with the distribution of rates across the reference documents.

The result includes reliability flags: single text, short text, very short text, rare in the text, concentrated in few reference texts, and not significant after correction. These flags are not errors. They tell the reader how much confidence to place in each row. A word that occurs once in the text and once in the reference can have a large log ratio and no statistical support. A word that occurs in only one reference text can be an outlier rather than a corpus pattern.

The result can be explored through a table, a diverging bar chart, examples in the text and in the reference and, when the reference is a project corpus, a link to KWIC in the reference. The chart shows the log ratio; the table also reports the distance from the reference pattern (z). A click on an item opens examples with the classes colored.

The interpretation rules are stated in the interface. The text is one unit, so the analysis does not generalize to a population. Short texts have unstable frequencies. Words within one text are not independent, so the adjusted p-value should be read together with the effect size and the dispersion. The tool is intended for description and for data-driven learning, not for inference about a population.

#### 4.3.6.2 Constructions

The Constructions tab compares the patterns of the text with the patterns of a reference corpus. A pattern is an n-gram of UPOS or XPOS, such as determiner, adjective, noun, or verb plus preposition. The unit is the pattern, not the word. The approach follows the operational side of pattern grammar.

The user chooses the field and the pattern length. The analysis uses log ratio and the false discovery rate by default, and the function accepts other measures and corrections. The reference must be a corpus in the project tagged with spaCy. A frequency list is not accepted because it stores words, not patterns. The text is tagged on the fly with the same spaCy model used by the reference, so the classes are comparable.

Each pattern receives the same measures as keywords: log-likelihood, adjusted p, log ratio, and dispersion in the reference. It also receives a z-score that compares the pattern’s rate in the text with the mean rate across the reference documents. The result includes reliability flags for rare patterns, concentrated reference patterns, and non-significant patterns. The output is a table with the pattern, direction, frequencies, measures, dispersion, and z-score.

The function refuses a reference tagged with a tool other than spaCy, because the class inventories would not be comparable. It also warns when the text is short. The result is descriptive. A pattern that is more frequent in the text can reflect a genre, a task, or a stylistic choice. It does not by itself show that the writer controls the construction.

#### 4.3.6.3 Collocates

The collocate profile compares the collocates of a node in the text with the collocates of the same node in the reference. The user chooses the node and the window. The unit is the form. The result reports, for each collocate, the frequency in the text, the frequency in the reference, the frequency per 1,000 words on each side, log-likelihood, log ratio, MI, and the side of the window where it appears in the reference. It also marks collocates that occur only in the text and collocates that are typical of the reference.

The comparison shows combinability choices. A word can have the same frequency in the text and in the reference but combine with different words. The collocate profile makes this difference visible. The result is a table of collocates with frequencies and association measures.

The measure is descriptive. The text is one unit, and the reference is a collection of texts. The user should look at the frequency and the effect size together, and should check the occurrences in the text or in the reference before drawing conclusions.

#### 4.3.6.4 Examples

The examples function returns occurrences of a word or a pattern in the text and, when the reference is a corpus, in the reference. Each occurrence is shown token by token, with the class of each token and the tokens that belong to the match. The interface colors the classes, so the user can see the pattern in context.

The function is used by the Words and Constructions tabs. It links the result table to the text and to the corpus. When the reference is a frequency list, only examples from the text are available, because the list does not contain texts. When the reference is a project corpus, the `See in corpus` action opens KWIC in the reference for a selected item, which supports data-driven learning.

#### 4.3.6.5 Lexical Profile

The lexical profile reports descriptive measures of vocabulary and sentences: the number of words, the number of types, the type/token ratio, the Guiraud index, the Measure of Textual Lexical Diversity (MTLD), the number of sentences, the mean sentence length, and the percentage of words with seven or more letters.

The type/token ratio is sensitive to text length. The Guiraud index divides the number of types by the square root of the number of tokens, which reduces this sensitivity. MTLD computes the mean length of the segments in which the type/token ratio remains above a threshold, in both directions. The percentage of long words is a proxy for lexical sophistication, not a measure of readability.

The profile is descriptive. It does not compare the text with a norm, and it does not classify the text as simple or complex. The user can compare the values with the reference or with other texts, but the interpretation depends on the genre, the task, and the language.

### 4.3.7 Learning and Help

The Learn area contains explanations of concepts, methods, metrics, and screens. The topics are stored as Markdown files by language, with a title, a summary, a body, and related topics. The interface organizes them by area and allows search. The same content feeds the tooltips next to metrics, the `Explain this screen` action, the guided tours, and the `ttwtools help` command.

The topics explain, for example, Cohen’s d, standard deviation, dispersion, frequency bands, keyness, the Lab, and normalization per 1,000 words. The KFA topic includes an interactive widget for Cohen’s d. Formulas are rendered with KaTeX. Some topics include images and highlighted passages. The text is translated into Portuguese and English, with English as the fallback when a translation is missing.

The guided tours show a sequence of steps with a target element, a title, and a text. They are stored as JSON files and can be started from the Learn area. The tag set drawer shows the definitions and examples of the tags of each tagger. The Reader uses the same definitions in its tooltips.

The help content is validated by a command. `ttwtools help --check` reports missing titles, broken links, and other problems. This keeps the explanations aligned with the interface and prevents a topic from referring to a screen or a metric that no longer exists.

### 4.3.8 Resources

#### 4.3.8.1 Catalog

The Resources area manages corpora and models. The catalog is a list of packages described in a JSON file. Each package has a description sheet with language, variety, period, genres, size, license, source, available layers, and hashes. The application validates the sheet and the catalog before installation. The public catalog address has not been defined yet. The user provides a catalog URL or a local `catalogo.json` file. Without a configured catalog, only installed packages and reference lists are available.

A package can contain the annotated project, the frequency lists, or both. A corpus whose license does not allow redistribution is offered as a recipe, which describes how the user can prepare a copy from the original source. A reference list is a small package with frequencies and document counts, sufficient for keywords and frequency bands. The application can install, remove, update, and validate packages, and it lists the installed packages and the available references.

The catalog is not a repository of texts without license control. The license is part of the package record, and the catalog validation checks it. The application shows the description sheet before installation, so the user can decide whether the corpus and the license fit the research question.

#### 4.3.8.2 Models

The application downloads spaCy and Stanza models on demand. The models are stored in the user’s data folder: `~/Library/Application Support/TTWtools` on macOS, `%LOCALAPPDATA%\TTWtools` on Windows, and `~/.local/share/TTWtools` on Linux. The environment variable `TTWTOOLS_DATA_DIR` changes the location.

The Resources area lists the available models with language, size, source, license, and training data. It shows whether a model is installed and whether it can run on the current machine. The user can download a model from the interface or with `ttwtools catalog download-model`. Stanza models are downloaded with the Stanza downloader. MFTE is an optional dependency with the GNU General Public License, and the application treats its distribution separately.

#### 4.3.8.3 Data and Disk

The application stores the index cache, temporary work folders, settings, and installed packages in the user’s data folder. The disk-usage screen shows the size of the cache, the work folders, and the free space. The user can clear the cache and the abandoned work folders. The application also removes stale work folders at startup and enforces a cache size limit.

These functions matter for large corpora. A project saved without search tables uses an index in the cache. The first query builds or attaches the index. Later queries reuse it. If the cache is cleared, the index is rebuilt when needed. The application warns before operations that need more disk space than is available.

### 4.3.9 Automation and Interoperability

#### 4.3.9.1 Command Line

The command line exposes the same functions as the interface. It accepts a project path, a corpus name, a layer, metadata filters, and the parameters of each analysis. The output can be a table, JSON, or CSV.

**Table 4.10: Command-line commands**

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

#### 4.3.9.2 Python API

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

#### 4.3.9.3 Local REST API

The interface communicates with a local FastAPI server. The server exposes routes for project management, corpora, tagging, exploration, comparison, Writing, the Lab, help, catalog, code generation, and jobs. The routes validate parameters and call the package functions. They do not contain analysis rules.

Long operations are jobs. A job reports its state and progress and can be cancelled. This is used for tagging, opening large projects, saving, KFA, and other operations that can take more than a few seconds. The API is local. It is not a public web service, and the application does not require an account.

The routes are useful for integration with other tools, but the recommended path for scripts is the Python package or the command line. The route layer is an implementation detail of the interface, and its endpoints may change more often than the public Python functions.

#### 4.3.9.4 Copy as Code

Most analyses in the interface have a `Copy as code` action. It produces a command line command and a Python snippet that reproduce the analysis with the same parameters. The code generator includes only the parameters the user set, so the command reflects the analysis rather than a generic example.

The generated code uses the public API and the same project file. It does not depend on the interface being open. This supports transparency: a reader of a thesis or an article can see the command that produced a table or a chart, and a collaborator can rerun it on the same data.

The generated code uses POSIX quoting on macOS and Linux. On Windows, the command line uses the quoting rules of the shell in use. The Python snippet is the same across systems.

#### 4.3.9.5 Export

The application exports tables and charts in several formats. Tables can be exported as CSV or TXT. Charts can be exported as SVG or PNG. The export dialog shows the columns of the current view and lets the user choose the destination. The exported table corresponds to the view, so a filtered table exports the filtered rows.

Layers can be exported as CoNLL-U, VRT, CSV, JSONL, or Parquet. CoNLL-U and VRT are used by corpus tools and by Universal Dependencies workflows. CSV, JSONL, and Parquet are used for statistical analysis in other programs. A reference frequency list can be exported as a `.tsv` file with a description header. The corpus texts can be exported to a folder next to the project.

### 4.3.10 Cross-Cutting Features

#### 4.3.10.1 Languages

The interface is available in Portuguese and English. The language of the interface is independent of the language of the corpus. A user can analyze an English corpus with a Portuguese interface or a Portuguese corpus with an English interface. The interface language controls menus, messages, help, tag definitions, and the labels of the charts.

The corpus language controls the tagger and the model. spaCy and Stanza support English and Portuguese. BiberPlus and MFTE support English. The application can detect the corpus language from the layers or from function words and suggest a model. The stopword lists are available for English and Portuguese.

The help content is translated into both languages, with English as the fallback when a translation is missing. The same applies to the tag definitions and the descriptions of the taggers. The application does not translate the corpus or the user’s texts.

#### 4.3.10.2 Appearance and Accessibility

The interface offers several visual themes, fonts, corner styles, button styles, and icon styles. The user can choose a light, dark, or high-contrast theme, or one of the predefined themes. The fonts are bundled with the application, so the appearance does not depend on the fonts installed on the system. The contrast of each theme is tested.

The interface is designed for keyboard use and for screen readers. Interactive elements have labels, focus is visible, and the main analyses present a table alongside the chart. The application includes automated accessibility tests in its end-to-end suite. These tests do not prove full conformance with a standard, but they catch common problems such as missing labels, insufficient contrast, and focus traps.

The Reader and the main tables support keyboard navigation. The split panes can be resized with the keyboard. The charts that represent texts can be opened in the Reader, where the same information is available as text. The interface links charts to the table or to the Reader when exact values matter.

#### 4.3.10.3 Performance and Privacy

The application runs on the local machine. It does not send texts to a remote service during analysis. Models and corpora are downloaded only when the user asks for them. The analysis itself works offline once the resources are installed.

Long operations run as tasks with progress and cancellation. The application checks free disk space before writing, uses temporary work folders with an owner, and removes abandoned folders. The search index can be built lazily or stored in the cache. The first query in a large project may take longer, but the cost is not repeated on every opening.

The application reports its version and the version of the package. It records the layers used by each analysis and the parameters of the analysis. This information supports reproducibility and helps the user understand why a result changed after a new layer was added.

### 4.3.11 Function Matrix and Summary

The table below maps the main areas to the interface, the command line, the Python API, and the local route. The names of the routes are simplified; the exact paths are in the server documentation.

**Table 4.11: Function matrix**

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

Section 4.2 described the architecture that supports these functions. This section described what the user can do with them. Together, the two sections show how the design decisions become operations: the project stores the source, the layers, and the results; the functions read the layers and calculate; the interface, the command line, and the Python package present the same results; and the help explains what the results mean.
