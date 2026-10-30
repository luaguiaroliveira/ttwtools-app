# Chapter 4: Notes for Revision

## Notes for Section 4.2

1. **Version and figures.** The text refers to application 0.8.3 and package 0.3.1. Confirm whether the chapter should freeze this version or describe the final version at the time of the defense. Performance and file-size figures were deliberately left out. If they are included, check the values in `novodesenho/armazenamento.md` and `novodesenho/macintel.md` and state the reference machine.
2. **Agent use.** The text names Claude, Gemini, Codex, and DeepSeek because they are named in `AGENTS.md`. The recorded path documents sessions with Claude and handoffs between sessions, but it does not distribute tasks by model. If the thesis needs more detail, the author should record which agents worked on which fronts and during which period.
3. **Whisper.** Audio transcription with `faster-whisper` is recorded in `novodesenho/memoria_para_IA.md`. Confirm whether this episode belongs in the chapter or only in the acknowledgments or method notes.
4. **Repomix.** The text mentions the context packager because the repository contains `.repomixignore` and the instructions refer to `repomix-output.xml`. If the use was not relevant, the mention can be removed.
5. **Citations.** Chapter 4 mentions Biber, Universal Dependencies, and research traditions but does not yet include full bibliographic references. These should be added in revision, especially in Section 4.3 where the metrics are presented.
6. **Figures.** Figures 4.1 to 4.4 still need to be produced: layered architecture, project data model, layer-reuse flow, and columnar storage.
7. **Catalog and reference corpora.** The introduction states that there is no public catalog of reference corpora and that large reference corpora are future work. Confirm this before the defense, since it is a limitation of the version described.
8. **Chapter 7.** The introduction says the classes are reported in Chapter 7. Confirm that this is the undergraduate class; if the cited class is another, update the number.

## Notes for Section 4.3

1. **Version and interface labels.** The text uses the English labels of version 0.8.3. Confirm the labels again before the final version, especially the names of the Writing tabs, the Lab methods, and the chart types.
2. **Screenshots.** Section 4.3 will need screenshots or diagrams of the main screens: overview, query box, KWIC, dispersion, keywords, KFA gallery, Writing, Learn, and Resources. The text refers to the screens but does not include images.
3. **Citations.** The methods mentioned in this section need full references: Biber and Egbert for KFA, Gries for dispersion, Rayson and Garside for log-likelihood, Hardie for log ratio, Gabrielatos and Marchi for %DIFF, Dunning for log-likelihood in keyness, Laufer and Nation for frequency bands, McCarthy and Jarvis for MTLD, Guiraud for the Guiraud index, Hunston and Francis for pattern grammar, and Kilgarriff for the single-text caution.
4. **Experimental status.** Confirm whether the Lab and Writing should still be described as experimental in the final version. If they become stable, the wording and the warnings must change.
5. **Exact defaults.** The text states the main defaults, such as Bonferroni for keywords and FDR for Writing. Confirm the defaults in the version described and add a table if the thesis needs a complete parameter reference.
6. **Style.** The chapter avoids em dashes. Check the final formatting if the text is moved to Word or LaTeX.
7. **Numbers.** The text avoids performance and size numbers. If the thesis includes a performance section, add the measured values and state the machine, the corpus, and the layer.
8. **Duplicate tagger table.** Table 4.7 repeats Table 4.2 in a shorter, user-facing form. Consider keeping only one table or making Table 4.7 a cross-reference.
