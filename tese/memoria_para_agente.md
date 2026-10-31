# Memória para agente: Capítulo 4 da tese (TTWtools)

Última atualização: 2026-10-30.

## Estado atual

O Capítulo 4 está em `tese/chapter4_ttwtools.md` (cerca de 9.100 palavras), com esta estrutura:

- 4 TTWtools
  - 4.1 TTWtools: Introduction and Motivation
  - 4.2 How TTWtools Is Built and How It Works
    - 4.2.1 a 4.2.10
  - 4.3 Functions of TTWtools
    - 4.3.1 a 4.3.10
  - 4.4 Conclusion and Future Work

O `.docx` correspondente está em `tese/chapter4_ttwtools.docx` (Pandoc 3.9, 2 tabelas, sem as notas editoriais), regenerado depois da revisão da 4.1, da 4.3.7 e da criação da 4.4. As notas estão em `tese/chapter4_notes.md`.

Os arquivos antigos `part1_construction_and_operation.md` e `part2_functions.md` estão em `tese/drafts/` e não são a versão canônica. O rascunho em português `tese/parte1_construcao_e_funcionamento.pt.md` continua lá, mas está desatualizado.

## Decisões editoriais

- A narrativa de 4.1 é em primeira pessoa. Ela começa situando a TTWtools como apoio às questões de pesquisa da cadeia “corpus compilation → pedagogical application”, depois pelo problema concreto do doutorado: corpus de Ciências Agrárias, KFA, tabela de contagens, procura dos textos com **d** alto, registro dos nomes dos arquivos, localização dos textos na pasta do corpus, busca dos atributos e seleção de exemplos.
- A 4.1 foi enxugada: mantém a narrativa até as primeiras melhorias, reescreve o parágrafo de limites e trata anotação, exploração, reprodutibilidade e público em menos parágrafos. O anúncio de melhorias futuras saiu da 4.1 e virou a seção 4.4. Os três problemas (anotação, exploração/comparação e reprodutibilidade/privacidade) foram condensados em um único parágrafo que os nomeia antes das respostas. O parágrafo de público foi fundido ao roteiro do capítulo; as repetições sobre processamento local, bibliotecas e qualidade da anotação foram removidas.
- A 4.1 inclui a motivação de código livre: muitas ferramentas de Linguística de Corpus são fechadas; a TTWtools é local, gratuita e de código aberto. A afirmação sobre as ferramentas fechadas ainda precisa de exemplos/citação.
- A 4.1 não diz que a Linguística de Corpus “depende de software tools”: as análises podem ser feitas com bibliotecas, ferramentas de linha de comando ou programas gráficos. O problema é a acessibilidade, a transparência e a abertura dessas opções; bibliotecas fazem quase tudo, mas exigem programação.
- A 4.1 diz “Python and the tagging libraries available”, não “command-line tools”: o TTWtools v0.1 era pacote Python e ainda não tinha CLI própria.
- A 4.1 evita dizer que as anotações eram “opaque” ou que “could not be queried”: o v0.1 guardava blocos de texto por arquivo; o problema era não haver índice para consultas no corpus todo. Formulação atual: “per-file blocks that were not indexed for corpus-wide queries”.
- A primeira versão já oferecia BiberPlus com spaCy, MFTE com Stanza, e spaCy e Stanza como etiquetadores independentes. A lista não aparece na 4.1 para não repetir a Tabela 4.1; o texto diz “the taggers then available”.
- A 4.1 tem nota de rodapé sobre a colaboração de José Henrique Padovani Velloso em todo o desenvolvimento do software (não só na primeira versão) e sobre o paper da primeira versão, aceito para publicação nos anais do ELC 2026. A nota também deixa claro que o capítulo descreve a ferramenta na versão atual (0.8.5), não apenas a primeira versão. A autora é a primeira autora; as decisões linguísticas e a interpretação dos resultados são dela.
- A 4.3.7 tem um comentário HTML invisível no `.docx` registrando que o tour `primeiro_corpus` ainda não funciona de ponta a ponta (o passo de palavras-chave aponta para `/comparar`, que abre a KFA; o passo de etiquetagem exige corpus ativo; não há teste e2e) e que a Ajuda tem sete tópicos de métricas; só d de Cohen e KFA têm widget interativo. O texto visível da 4.3.7 agora distingue os tópicos da Ajuda, os tooltips que reutilizam resumos, o “Explain this screen” com textos próprios e os tooltips de glossário; diz também que o tour atual ainda não está plenamente funcional.
- Não usar MDA, AMD nem “análise multidimensional”. A ferramenta faz KFA, não MDA. A linha do BiberPlus diz “About 67 Biber features”.
- O catálogo de corpora de referência ainda não é público. Não afirmar que existem grandes corpora de referência. O texto diz que o mecanismo de catálogo existe, mas não há catálogo público, e que corpora na escala do BNC ou do Hansard ainda não são suportados como corpus completo. As listas de frequência são o caminho parcial.
- A Tabela 4.2 distingue lista de frequência (`.tsv`, funcional) de catálogo de corpora de referência (implementado, mas não ativo por padrão; sem catálogo público; BNC/Hansard não suportados como corpora completos). A nota após a tabela explicita isso.
- A 4.3.8 foi reescrita para explicar o catálogo em linguagem direta: a área Recursos reúne modelos e corpora; a ficha (língua, variedade, período, gêneros, tamanho, fonte e licença) aparece antes da instalação; a área instala/remove, verifica o download, lista instalados e listas de referência e indica atualizações; o endereço do catálogo fica nas opções avançadas e não há catálogo público por padrão.
- As aulas citadas na história estão no Capítulo 7, com a ressalva de que é a turma de graduação. A nota 8 de `chapter4_notes.md` pede confirmação.
- Tabelas numeradas por capítulo: 4.1 a 4.11. Figura 4.1. As referências internas foram atualizadas.
- O capítulo cita a versão 0.8.5 do aplicativo e a 0.3.1 do pacote.
- Não usar “Part I” nem “Part II”. Usar “Section 4.2”, “Section 4.3” e “Section 4.4”.
- Sem travessões (em dash ou en dash). O texto evita adjetivos em excesso.

## Pendências

1. Confirmar que as aulas citadas são as da turma de graduação do Capítulo 7.
2. Decidir se a Tabela 4.7 (etiquetadores, versão curta) continua separada da Tabela 4.2 (etiquetadores, versão técnica). A nota 8 de `chapter4_notes.md` registra a duplicação.
3. Inserir as citações bibliográficas completas: Biber e Egbert, Gries, Rayson e Garside, Hardie, Gabrielatos e Marchi, Dunning, Laufer e Nation, McCarthy e Jarvis, Guiraud, Hunston e Francis, Kilgarriff.
4. Produzir as figuras 4.1 a 4.4 e as capturas de tela da seção 4.3.
5. Revisar os rótulos da interface em inglês na versão 0.8.5.
6. Confirmar o status experimental do Lab e do Writing.
7. Aplicar o template da tese ao `.docx`, se houver.
8. Atualizar ou aposentar o rascunho em português.
9. Atualizar a citação do paper do ELC 2026 quando os anais forem publicados (páginas, DOI e URL).

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

Devem aparecer 2 tabelas e `notes: False`.

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
