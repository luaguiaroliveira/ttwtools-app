# Plano — menu "Escrita" (experimental)

Comparar **um texto individual** (aluno, n=1) com um **corpus de referência** maior e
mostrar o que distingue o texto, com honestidade estatística. Este documento é o plano; o
andamento fica no fim.

## 1. O que estamos comparando (e o que a saída afirma)

- O texto é **uma unidade**, não uma amostra de unidades independentes. A saída é
  **descritiva/exploratória** ("este texto se distancia do padrão do corpus nestas
  palavras/traços"), nunca prova de diferença populacional.
- A tela precisa dizer isso em texto claro e repeti-lo nos resultados ("texto único;
  comparar com o corpus, não inferir sobre uma população").

## 2. Métodos

- **Log-likelihood (Dunning 1993)** como teste; já implementado em `keyness.py`
  (`log_likelihood`).
- **Correção para múltiplos testes:** Bonferroni ou **FDR/Benjamini-Hochberg**; já
  implementado (`_adjust`). Padrão na Escrita: **fdr**.
- **Effect size sempre junto:** **log ratio** (Hardie 2014), **%DIFF** (Gabrielatos &
  Marchi 2012), **log-odds** com z. Já implementados.
- **Dispersão na referência:** filtrar/sinalizar palavras raras-mas-concentradas em poucos
  textos. A referência já traz `docs` (em quantos textos cada item aparece) → usar
  `range_reference` e `range_reference_pct`.
- **Sem tratamento de contagens como independentes:** avisar que palavras dentro de um
  texto são autocorrelacionadas (Kilgarriff 2001); o LL sofre menos, mas não é imune.
- **Bootstrapping (fase 2):** quando a referência tem vários textos, reamostrar textos para
  estimar a variabilidade da frequência esperada e dar um intervalo (percentil) por palavra.

## 3. Cuidados com 1 × N

- **Normalização por tamanho** (por 1.000/milhão) sempre.
- **Tamanho mínimo**: abaixo de um limite (para um texto único, ~200 palavras) marcar
  "exploratório"; abaixo de ~50, recusar com aviso claro.
- **Badges de confiabilidade** automáticos por resultado: texto curto; palavra concentrada
  em poucos textos da referência; palavra rara no texto.
- **Dispersão ao lado do ranking**: coluna "aparece em N% dos textos da referência".

## 4. Camada didática

- Mostrar **significância (LL/p) e magnitude (log ratio/%DIFF)** lado a lado, com glossário.
- **Visualização**: barra de log ratio (ou LL) + coluna de dispersão.
- **Glossário e referências**: Dunning (1993); Kilgarriff (2001); Gabrielatos & Marchi
  (2012); Hardie (2014) — no `Aprender` e num painel da tela.

## 5. Stack

- LL/effect sizes: fórmulas diretas (sem libs pesadas).
- FDR: já implementado no pacote (não precisamos de `statsmodels`).
- Bootstrap: `numpy`.
- Leitura de arquivos: **txt/md** direto; **docx/odt** com `zipfile` + `xml.etree` (stdlib,
  sem dependência nova); **pdf** com `pypdf` **se instalado** (opcional), senão aviso claro.
- Dispersão: sobre a matriz texto×palavra que a referência já expõe (`docs`).

## 6. Entregáveis

1. **Pacote** (`ttwtools/writing.py`): `extract_text`, `text_freqs`, `analyze_text`
   (reusa `keyness`), badges/limitações; CLI `ttwtools writing`.
2. **Rota** `/api/writing/analyze` (JSON com o texto em base64 — sem `python-multipart`).
3. **Tela Vue** `Escrita` (experimental), no menu: colar texto **ou** subir arquivo;
   escolher referência (corpus do projeto ou lista do catálogo); opções em painel recolhido
   (unidade, medida, correção, mínimo); resultados com p, p corrigido, log ratio, %DIFF,
   dispersão e badges; painel "Como interpretar" com as limitações e referências.
4. **i18n** pt/en.
5. **Testes** (pacote + rota + e2e simples).

## 7. Fases

- **Fase 1 (este passo):** pacote + CLI + testes (form/ngram; txt/md/docx/odt; pdf opcional)
  com dispersão e badges. Rota + tela mínima funcional.
- **Fase 2:** bootstrap na referência, filtro por dispersão, mais unidades (lemma/pos com
  tagger), exportação e "copiar como código".
- **Fase 3:** tours/exemplos para sala de aula; listas de referência do catálogo
  pré-instaladas.

## Andamento

- 2026-09-28: plano criado.
- 2026-09-28 (Fase 1 entregue): pacote `writing.py` (`extract_text` para txt/md/docx/odt e pdf
  opcional via `pypdf`; `text_freqs`; `analyze_text`/`analyze_file` reusando `keyness`, com
  FDR/effect sizes, dispersão na referência e badges de confiabilidade); extração de
  `keyword_rows` em `keyness.py` para reuso; CLI `ttwtools writing`; rota
  `POST /api/writing/analyze` (arquivo em base64, sem `multipart`); tela **Escrita**
  (editor/upload, referência do projeto ou do catálogo, opções recolhidas, tabela com LL,
  p corrigido, log ratio, %DIFF, dispersão e badges, painel "Como interpretar" com as
  referências); i18n pt/en; testes do pacote (8) e e2e/a11y incluindo `/escrita`.
- **Fase 2 (próximo):** bootstrap por texto da referência (intervalo de frequência
  esperada), filtro por dispersão, unidades lemma/pos (com tagger), exportar e "copiar como
  código".
- **Fase 3:** tours/exemplos de sala de aula; listas de referência do catálogo prontas.
