# Preparo dos corpora do catálogo

Scripts reproduzíveis que montam os pacotes do catálogo de corpora (plano, passos 4.3 e 4.4).
Rodam com o ambiente do projeto (`ttwtools` instalado, spaCy `en_core_web_sm`).

| Script | Corpus | Fonte | Licença (a conferir na fonte) | Saída |
|---|---|---|---|---|
| `demo.py` | Demonstração: 18 capítulos de Alice, Tom Sawyer e Sherlock Holmes (81 mil palavras) | Projeto Gutenberg | domínio público (EUA) | pacote + lista |
| `brown.py` | Brown Corpus (500 textos, 1 milhão de palavras), etiquetas originais + spaCy | `nltk_data` | README: *"Distributed with the permission of the copyright holder, redistribution permitted."* | pacote (~114 MB) + lista (~0,4 MB) |
| `ud.py --treebank en-ewt` | UD English EWT r2.18 (1.174 documentos, anotação manual) | GitHub UniversalDependencies | CC BY-SA 4.0 | pacote (~20 MB) + lista |
| `ud.py --treebank pt-bosque` | UD Portuguese Bosque r2.18 (jornais pt-BR e pt-PT, anotação manual) | GitHub UniversalDependencies | CC BY-SA 4.0 | pacote + lista |
| `masc.py` | MASC 3.0.0 ou OANC (`--id oanc`), do standoff GrAF | a sua cópia (anc.org) | a conferir | pacote + lista, ou receita |
| `lob.py` | LOB Corpus | a sua cópia (ICAME) | sem redistribuição | só receita |

```
python tools/corpora/demo.py        --out dist-corpora
python tools/corpora/brown.py       --out dist-corpora
python tools/corpora/ud.py --treebank en-ewt    --out dist-corpora
python tools/corpora/ud.py --treebank pt-bosque --out dist-corpora
python tools/corpora/lob.py         --out dist-corpora            # entrada de receita
python tools/corpora/build_catalog.py dist-corpora                # → dist-corpora/catalogo.json
```

**Regra de licença.** Sem `--license-verified AAAA-MM-DD --redistributable`, cada script gera
só a **receita** (o catálogo mostra a ficha e o comando, sem arquivo). Passe as duas opções
somente depois de conferir a licença na fonte; a data fica registrada na ficha.

Cada corpus redistribuível gera dois pacotes: o completo (`<id>-<versão>.zip`, com o projeto
`.ttwa` etiquetado) e o de listas (`<id>-lista-<versão>.zip`, só `referencia-form|lemma|pos.tsv`),
que basta para palavras-chave e faixas de frequência (`catalog:<id>` como referência).

**Publicar.** Enviar `catalogo.json` e os `.zip` para o mesmo endereço (as URLs no catálogo
são relativas) e informar esse endereço em Corpora → Catálogo ou em `settings.json` da pasta
de dados. O local definitivo ainda não foi escolhido (plano, decisão D6).

Downloads ficam em `tools/corpora/.cache/` (fora do git).
