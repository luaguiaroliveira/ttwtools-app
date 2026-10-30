# Memória para agente: Capítulo 4 da tese (TTWtools)

Última atualização: 2026-10-30.

## Estado atual

O Capítulo 4 está em `tese/chapter4_ttwtools.md` (cerca de 17.400 palavras), com esta estrutura:

- 4 TTWtools
  - 4.1 TTWtools: Introduction and Motivation
  - 4.2 How TTWtools Is Built and How It Works
    - 4.2.1 a 4.2.11
  - 4.3 Functions of TTWtools
    - 4.3.1 a 4.3.11

O `.docx` correspondente está em `tese/chapter4_ttwtools.docx` (Pandoc 3.9, 11 tabelas, sem as notas editoriais). As notas estão em `tese/chapter4_notes.md`.

Os arquivos antigos `part1_construction_and_operation.md` e `part2_functions.md` estão em `tese/drafts/` e não são a versão canônica. O rascunho em português `tese/parte1_construcao_e_funcionamento.pt.md` continua lá, mas está desatualizado.

## Decisões editoriais

- A narrativa de 4.1 é em primeira pessoa. Ela começa pelo problema concreto do doutorado: corpus de Ciências Agrárias, KFA, tabela de contagens, procura dos textos com **d** alto, registro dos nomes dos arquivos, localização dos textos na pasta do corpus, busca dos atributos e seleção de exemplos.
- A primeira versão já oferecia BiberPlus com spaCy, MFTE com Stanza, e spaCy e Stanza como etiquetadores independentes.
- Não usar MDA, AMD nem “análise multidimensional”. A ferramenta faz KFA, não MDA. A linha do BiberPlus diz “About 67 Biber features”.
- O catálogo de corpora de referência ainda não é público. Não afirmar que existem grandes corpora de referência. O texto diz que o mecanismo de catálogo existe, mas não há catálogo público, e que corpora na escala do BNC ou do Hansard ainda não são suportados como corpus completo. As listas de frequência são o caminho parcial.
- As aulas citadas na história estão no Capítulo 7, com a ressalva de que é a turma de graduação. A nota 8 de `chapter4_notes.md` pede confirmação.
- Tabelas numeradas por capítulo: 4.1 a 4.11. Figura 4.1. As referências internas foram atualizadas.
- Não usar “Part I” nem “Part II”. Usar “Section 4.2” e “Section 4.3”.
- Sem travessões (em dash ou en dash). O texto evita adjetivos em excesso.

## Pendências

1. Confirmar que as aulas citadas são as da turma de graduação do Capítulo 7.
2. Decidir se a Tabela 4.7 (etiquetadores, versão curta) continua separada da Tabela 4.2 (etiquetadores, versão técnica). A nota 8 de `chapter4_notes.md` registra a duplicação.
3. Inserir as citações bibliográficas completas: Biber e Egbert, Gries, Rayson e Garside, Hardie, Gabrielatos e Marchi, Dunning, Laufer e Nation, McCarthy e Jarvis, Guiraud, Hunston e Francis, Kilgarriff.
4. Produzir as figuras 4.1 a 4.4 e as capturas de tela da seção 4.3.
5. Revisar os rótulos da interface em inglês na versão 0.8.3.
6. Confirmar o status experimental do Lab e do Writing.
7. Aplicar o template da tese ao `.docx`, se houver.
8. Atualizar ou aposentar o rascunho em português.

## Como regenerar o `.docx`

O Pandoc do sistema não está instalado. O `brew install pandoc` falhou no macOS 12 por permissões em `/usr/local/...`; não usar `sudo` nem `chown` sem pedido. O que funcionou foi `pypandoc_binary` num venv temporário:

```bash
TMPP=$(mktemp -d)
python3 -m venv "$TMPP/venv"
"$TMPP/venv/bin/pip" install --quiet pypandoc_binary
"$TMPP/venv/bin/python" - <<'PY'
import pypandoc
pypandoc.convert_file(
    'tese/chapter4_ttwtools.md', 'docx',
    outputfile='tese/chapter4_ttwtools.docx',
    format='markdown+pipe_tables+tex_math_dollars')
PY
rm -rf "$TMPP"
```

Verificação rápida:

```bash
python3 - <<'PY'
import zipfile
with zipfile.ZipFile('tese/chapter4_ttwtools.docx') as z:
    xml = z.read('word/document.xml').decode('utf-8')
print('tables:', xml.count('<w:tbl>'))
print('notes:', 'Notes for Revision' in xml)
PY
```

Devem aparecer 11 tabelas e `notes: False`.

## Fatos e fontes para não redescobrir

- `novodesenho/novomodelo.md` §1: ponto de partida, etiquetadores da primeira versão e limitações (par de corpora, inglês, taxonomia de Biber, sem corpora prontos, sem KWIC, arquivos grandes).
- `novodesenho/novomodelo.md` §9.5: limite do SQLite, BNC/Hansard.
- `novodesenho/novomodelo.md` §16: referências, listas de frequência, comparabilidade.
- `tools/corpora/README.md`: scripts de Brown, UD English EWT, UD Portuguese Bosque, demo, LOB e MASC/OANC; o catálogo público e as licenças continuam pendentes.
- `libs/ttwtools/docs/README.md` §4: API clássica da primeira versão (BiberPlus, MFTE, KFA).
- `CHANGELOG.md`: 0.4.0-alpha.1, 0.4.0-rc.1, 0.5.0, 0.6.0.
- `AGENTS.md`: regras de commit, sem coautoria de agente, nunca `git add -A`.

## O que não fazer

- Não reintroduzir MDA/AMD.
- Não afirmar que há catálogo público ou grandes corpora de referência.
- Não voltar a “Part I/Part II”.
- Não editar os arquivos em `tese/drafts/` como se fossem a versão atual.
- Não apagar `tese/chapter4_notes.md` antes de resolver as pendências.
- Não usar travessões no texto do capítulo.
