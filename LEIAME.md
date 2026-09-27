# TTWtools

*[English version: README.md](README.md)*

Aplicativo de análise de corpus para ensino e pesquisa em linguística: você reúne textos num **projeto**, **etiqueta** (spaCy, Stanza, BiberPlus, MFTE), **explora** (busca, KWIC, frequência, colocados, dispersão, leitor) e **compara** (palavras-chave, faixas de frequência, KFA de Biber e um laboratório de N grupos). Tudo roda no seu computador; nenhum texto sai da máquina.

Tudo o que o aplicativo faz também pode ser feito pela linha de comando e em Python com o pacote [`ttwtools`](https://github.com/luaguiaroliveira/ttwtools), e cada análise tem um botão **"Copiar como código"** com o comando equivalente.

> **Versão 0.4 (em teste).** Esta é a linha nova, redesenhada a partir da versão focada em KFA. Mudanças em [`CHANGELOG.md`](CHANGELOG.md). Durante a transição, o aplicativo empacotado ainda abre a interface antiga por padrão; a interface nova, descrita aqui, é a de `frontend-vue/` (veja [Rodar a partir do código](#rodar-a-partir-do-código)).

## Sumário

1. [Instalar](#instalar)
2. [Primeira análise](#primeira-análise)
3. [O que há em cada tela](#o-que-há-em-cada-tela)
4. [Projetos e arquivos](#projetos-e-arquivos)
5. [Catálogo de corpora e modelos](#catálogo-de-corpora-e-modelos)
6. [Idiomas](#idiomas)
7. [Linha de comando e Python](#linha-de-comando-e-python)
8. [Formatos de entrada e saída](#formatos-de-entrada-e-saída)
9. [Rodar a partir do código](#rodar-a-partir-do-código)
10. [Licença, citação e contribuição](#licença-citação-e-contribuição)

## Instalar

Baixe o pacote do seu sistema na página de [releases](https://github.com/luaguiaroliveira/ttwtools-app/releases) e confira o `SHA256SUMS.txt` se quiser.

| Sistema | Arquivo | Como abrir |
|---|---|---|
| macOS 12 ou mais novo, Apple Silicon | `TTWtools-<versão>-macos-arm64.dmg` | arraste o TTWtools para Aplicativos |
| macOS 12 ou mais novo, Intel | `TTWtools-<versão>-macos-x86_64.dmg` | idem |
| Windows 10/11 (64 bits) | `TTWtools-<versão>-windows-x86_64.zip` | descompacte e rode `TTWtools\TTWtools.exe` |
| Linux (x86_64) | `TTWtools-<versão>-linux-x86_64.tar.gz` | descompacte e rode `TTWtools/TTWtools` |

- **macOS:** o aplicativo ainda não é assinado. Na primeira vez, clique com o botão direito no TTWtools → **Abrir** → **Abrir**.
- **Windows:** o SmartScreen pode avisar sobre um executável não assinado: **Mais informações** → **Executar assim mesmo**.
- **macOS Intel:** o `torch` disponível é mais antigo (2.2.2). O Stanza e o MFTE funcionam, mas, se algum tagger não puder rodar, a tela mostra o motivo; spaCy e BiberPlus não dependem disso.

O pacote já traz o modelo `en_core_web_sm` do spaCy. Outros modelos (inglês maiores, português) são baixados pelo próprio aplicativo, em **Corpora → Catálogo → Modelos**.

## Primeira análise

1. **Crie um projeto.** Em **Corpora**, digite um caminho terminado em `.ttwa` (ex.: `~/Documentos/aula.ttwa`) e clique em **Criar novo**. O projeto é um arquivo só, que guarda textos, anotações e resultados.
2. **Adicione um corpus.** **Adicionar corpus** → escolha a pasta de arquivos `.txt` (ou cole um texto). Metadados podem vir do nome dos arquivos (ex.: `aluno_B1_2024.txt` → campos `aluno`, `nível`, `ano`) ou de um CSV. Em **Formato dos arquivos**, também se aceitam CoNLL-U, `palavra/TAG` (Brown, LOB), TEI/BNC XML e GrAF (OANC/MASC).
3. **Veja a visão geral.** Clique no corpus e em **Calcular**: número de textos e palavras, riqueza lexical (TTR, STTR, MATTR), palavras mais frequentes. Isso já funciona sem etiquetar.
4. **Etiquete.** Em **Etiquetar**, escolha o tagger e um atalho (**Rápido**, **Recomendado**, **Mais preciso**) ou abra **Personalizar**. Nada é etiquetado duas vezes: documentos que já têm uma camada equivalente são reaproveitados.
5. **Explore.** Em **Explorar**, busque palavras, lemas (`lemma=run`), classes (`pos=NOUN`) e frases (`black cat`), veja o KWIC, a frequência, os colocados e a dispersão.
6. **Compare.** Em **Comparar**, rode palavras-chave contra outro corpus, contra um grupo do mesmo corpus ou contra uma lista do catálogo, e a KFA entre dois corpora ou grupos.

Em qualquer tela: o **?** ao lado de uma métrica explica o que ela mede; **Explicar esta tela** mostra para que serve cada parte; em **Aprender** há tours guiados e o glossário.

## O que há em cada tela

- **Corpora:** projeto aberto (salvar como, separar em `.ttwl`, exportar textos), biblioteca de corpora, visão geral, etiquetagem, camadas (exportar em CoNLL-U, VRT, CSV) e **Catálogo**.
- **Explorar:** Busca (total por documento ou grupo), KWIC (ordenação, contexto, exportar), Frequência (forma, lema, palavra+classe, classe, n-gramas; ocultar palavras funcionais), Colocados (LL, MI, T-score), Dispersão (DP de Gries, Range, gráfico por texto) e Leitor (texto com as etiquetas, impressão).
- **Comparar:**
  - **Palavras-chave:** LL, log ratio, %DIFF, log-odds; correção de Bonferroni ou FDR; filtro de dispersão; avisos quando os corpora não são comparáveis (tagger diferente, tamanho pequeno).
  - **KFA:** d de Cohen por traço (métricas `kfa` de Biber & Egbert e `kfa2` ponderada), com galeria de gráficos (barras divergentes, médias, radar, mapa de calor, PCA, t-SNE, MDS, UMAP opcional).
  - **Faixas de frequência:** quanto do texto está entre as 1.000, 2.000… palavras mais frequentes de uma referência.
  - **Laboratório** *(experimental)*: N grupos — um contra todos, par a par, Kruskal-Wallis, espaço de perfis, dendrograma e "meu texto contra referências".
- **Aprender:** tópicos de ajuda, tours e a figura interativa do d de Cohen.

Toda tabela e gráfico tem **Exportar** (CSV, TXT, SVG, PNG) e **Copiar como código**.

## Projetos e arquivos

| Extensão | O que é |
|---|---|
| `.ttwa` | projeto completo: textos, metadados, camadas de anotação e análises salvas (SQLite) |
| `.ttwl` | projeto leve: anotações e análises, com os textos numa pasta ao lado (bom para corpora grandes ou versionados) |
| `.ttwt` | `.ttwa` comprimido para enviar ou arquivar; abre direto no aplicativo |

- Uma **camada** é o resultado de um tagger (com versão, modelo e opções) sobre um documento. Um corpus pode ter várias camadas (spaCy e BiberPlus, por exemplo), e as análises dizem qual usaram.
- Projetos da versão anterior (esquema 0.2) são convertidos ao abrir, com cópia de segurança.
- No macOS, dar duplo clique num `.ttwa`, `.ttwl` ou `.ttwt` abre o aplicativo com o projeto.

## Catálogo de corpora e modelos

Em **Corpora → Catálogo**:

- **Corpora prontos** (já etiquetados, com ficha: idioma, variedade, período, gêneros, tamanho, licença, fonte). Cada corpus redistribuível tem também um pacote só com as **listas de frequência**, pequeno, que basta para usá-lo como referência em palavras-chave e faixas de frequência (`catalog:<id>`). Corpora cuja licença não permite redistribuir aparecem como **receita** (o comando para preparar a sua cópia).
- **Modelos** do spaCy (inglês e português) para baixar sob demanda.

Tudo vai para a **pasta de dados do usuário** (mostrada no fim do painel): `~/Library/Application Support/TTWtools` no macOS, `%LOCALAPPDATA%\TTWtools` no Windows, `~/.local/share/TTWtools` no Linux. A variável `TTWTOOLS_DATA_DIR` muda esse lugar.

> O endereço público do catálogo ainda não foi definido; por enquanto, informe o endereço de um `catalogo.json` (URL ou arquivo) no próprio painel. Os scripts que montam os pacotes estão em [`tools/corpora/`](tools/corpora/README.md).

## Idiomas

- **Interface:** português e inglês (⚙ no canto superior).
- **Corpora:** inglês (todos os taggers) e português (spaCy `pt_core_news_*` e Stanza com os treebanks bosque, cintil, gsd, petrogold, porttinari e dantestocks). O aplicativo detecta o idioma do corpus e já sugere o modelo certo; as palavras funcionais seguem o idioma do corpus. BiberPlus e MFTE são só para inglês.

## Linha de comando e Python

O pacote `ttwtools` vem junto com o código do aplicativo (`libs/ttwtools`) e pode ser instalado sozinho (o repositório dele ainda é privado; com acesso, ou a partir do submódulo):

```bash
pip install -e libs/ttwtools          # ou: pip install "git+https://github.com/luaguiaroliveira/ttwtools.git"
ttwtools --help
```

Exemplos (os mesmos que o botão **Copiar como código** gera):

```bash
ttwtools import aula.ttwa textos/ --name redacoes --fields aluno,nivel,ano
ttwtools tag aula.ttwa --corpus redacoes --tagger spacy --preset recomendado
ttwtools describe aula.ttwa --corpus redacoes --layer spacy
ttwtools kwic aula.ttwa "lemma=make" --corpus redacoes --context 6
ttwtools keywords aula.ttwa --corpus redacoes --reference catalog:brown --unit lemma
ttwtools compare aula.ttwa --corpus redacoes --layer biberplus --where nivel=B1 --where2 nivel=C1
ttwtools compare aula.ttwa --corpus redacoes --layer spacy --group-by nivel --method one_vs_rest
ttwtools catalog download-model pt_core_news_sm
ttwtools help cohens_d
```

Em Python:

```python
import ttwtools

with ttwtools.open_project("aula.ttwa") as proj:
    ttwtools.tag_corpus(proj, "redacoes", "spacy", preset="recomendado")
    kw = ttwtools.keywords(proj, "redacoes", "catalog:brown", unit="lemma")
    print(kw["rows"][:10])
```

Guia rápido e referência de todas as funções: [`libs/ttwtools/docs/`](libs/ttwtools/docs/README.md).

## Formatos de entrada e saída

| Formato | Importar | Exportar |
|---|---|---|
| Texto (`.txt`, pasta, CSV com coluna de texto) | sim | textos ao lado do projeto |
| CoNLL-U (Universal Dependencies) | sim, com a camada | sim |
| `palavra/TAG` (Brown, LOB do NLTK) | sim, com a camada | — |
| TEI P5 e BNC XML | sim; com `<w>`, vira camada | — |
| GrAF standoff (OANC, MASC) | sim, com a camada (PTB e UPOS) | — |
| VRT (CWB, Sketch Engine, CQPweb) | — | sim |
| Tabela de tokens (CSV, JSONL, Parquet) | — | sim |
| Lista de frequência de referência (`.tsv` com ficha) | sim (referência) | sim (`ttwtools reference-list`) |

## Rodar a partir do código

Requer [git-lfs](https://git-lfs.com/) (`git lfs install`), Conda e Node.js 22.

```bash
git clone --recurse-submodules https://github.com/luaguiaroliveira/ttwtools-app.git
cd ttwtools-app
conda env create -f environment.yml -n ttw314 && conda activate ttw314
pip install --no-deps -e libs/ttwtools -e .
(cd frontend-vue && npm ci && npm run build)
python -m app --mode desktop   # ou --mode web e abra http://127.0.0.1:8765
```

No Mac Intel com macOS 12, use Python 3.11 e `torch==2.2.2` (veja [`CONTRIBUTING.md`](CONTRIBUTING.md)). Testes, build dos pacotes e releases: [`CONTRIBUTING.md`](CONTRIBUTING.md) e [`RELEASING.md`](RELEASING.md).

## Licença, citação e contribuição

- Contribuições: [`CONTRIBUTING.md`](CONTRIBUTING.md). O desenho do projeto está em [`novodesenho/novomodelo.md`](novodesenho/novomodelo.md) e o andamento em [`novodesenho/plano_implementacao.md`](novodesenho/plano_implementacao.md).
- Os corpora do catálogo têm licenças próprias, registradas na ficha de cada um; respeite-as ao publicar resultados.
