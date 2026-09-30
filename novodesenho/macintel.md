# Mac Intel (macOS 12): o que foi testado, o que aconteceu, o que falta

Único lugar dos testes na máquina de referência mais lenta. **Convenção:** *[medido]* veio do relatório ou da tela; *[hipótese]* é interpretação ainda não confirmada. Plano e pendências: `plano_armazenamento.md`. Análise de eficiência e formato: `armazenamento.md`. Cada nova rodada entra na seção 7 (registro), sem criar outro arquivo.

## 1. Máquina e builds testados

- **Máquina:** MacBook Pro com Intel Core i5-5287U (2,9 GHz, 4 threads), 16 GB, macOS 12.7.6, Python 3.11.13 (ambiente `ttw311`), SQLite 3.50.2. Sem aceleração de SHA.
- **Projeto:** `CorIFAessays_vs_essays_bawe_somentetexto.ttwa` (esquema **0.2**, 330 MB; 1.526 documentos, 10.682 camadas, 18.982.144 tokens). Migra para 0.3 na primeira abertura.
- **Script do relatório:** `libs/ttwtools/tools/bench_storage.py` no commit `e1e01b0` (sem progresso nas etapas, antes das melhorias de hoje).
- **Pacote das fotos e do áudio (30/09, 08:06–08:14):** build `0.6.0.dev0` da branch `release-test`, **anterior** às correções de Comparar (`859ef75`, 30/09 08:41).
- **Pacote com as correções:** run `36710087577` (sucesso), artefato `pkg-macos-x86_64`. **Ainda não testado no Intel.** Baixar: `gh run download 36710087577 -n pkg-macos-x86_64 -R luaguiaroliveira/ttwtools-app`. A release em rascunho `v0.6.0-alpha.1` tem o build anterior às correções.

## 2. Números medidos

### Velocidade bruta (Intel × Apple Silicon M4)

| medida | M4 | Intel | razão |
|---|---|---|---|
| codificar camadas `TCL1` | ~890 mil tok/s | 272 mil tok/s | 3× |
| decodificar camadas | ~3.300 mil tok/s | 397 mil tok/s | 8× |
| SHA-256 (chave do cache) | 3.273 MB/s | 155 MB/s | 21× |
| zlib nível 1 | 67 MB/s | 31 MB/s | 2× |
| índice sintético 1 M tokens: criar (5 índices) | ~1,4 s | 4,8 s | 3× |
| frequência / colocados, 1 M tokens | ~0,9 s | 5,7 / 5,5 s | 6× |
| KWIC de forma, 1 M tokens | ~0,02 s | 0,07 s | 3× |

Conjunto "reduzido (5)" × "antigo (7)" no Intel: arquivo 103 MB × 130 MB, criar 4,8 s × 6,9 s, consultas iguais. A decisão do A4 se confirma.

### Projeto real (19 M de tokens)

| etapa | Intel | M4 (referência) |
|---|---|---|
| A. abrir o original (migrar 0.2→0.3) | **14,3 min** | não medido (projeto já migrado) |
| B. 6 consultas com tabelas | **89,9 s** | ~10 s |
| C. compactar, simulação / remoção + VACUUM | 10,4 / 11,3 min | 103 / 111 s |
| D. salvar **com** tabelas (compactado) | 28,6 s | 11 s (614 MB) |
| E. salvar **sem** tabelas | **6,2 min** | 55–65 s |
| F. exportar `.ttwcl` do corpus maior | 2,7 min | 35 s |
| G. abrir **com** tabelas | **12,6 s** | 4–7 s |
| H. abrir sem tabelas, sem cache (recria sempre) | **5,3 min** | 53 s |
| I. abrir sem tabelas, índice em cache, **1ª vez** | **interrompido** (sem número) | 38–44 s |
| K. idem, 2ª vez | não medido | 1 s |

Razões típicas: 5–9× em CPU de Python, ~2–3× em disco e descompressão.

## 3. O que se viu no uso real (fotos e áudio)

**Funcionou:**
- Abrir arquivo compactado com andamento real: "Descompactando o arquivo 99%, 578/585 MB", barra determinada andando.
- Leitor com etiquetas spaCy, destaque e dica da etiqueta; KWIC ("Do", 3.058 ocorrências); Dispersão ("Create", DP 0,599, alcance 462/1227).
- **`com_tabelas.ttwa` é a opção que melhor funcionou** (abre em 12,6 s).

**Falhou ou incomodou:**

| # | Sintoma | Evidência | Causa | Correção | Validada no Intel |
|---|---|---|---|---|---|
| 1 | KFA: "Sem conexão com o servidor local" | foto 08:13; áudio | *[hipótese]* requisição síncrona longa derrubada pelo WebKit (~60 s sem resposta); o servidor parece vivo (o clique seguinte mostrou "Calculando…") | Comparar como tarefa (`?async=1`) com andamento por documento, cancelar e nova tentativa de consulta | não |
| 2 | Barra cheia e parada em "Calculando…" (palavras-chave e KFA) | 3 fotos | `<progress>` nativo indeterminado vira barra cheia nesse WebKit | `ProgressBar` própria (faixa deslizante, ou largura real) | não |
| 3 | Selo "não salvo" depois do KFA | fotos do KFA | resultado gravado **dentro** do projeto suja o arquivo; salvar custa 29 s a 6 min | nenhuma ainda; proposta: derivados fora do arquivo | — |
| 4 | "Sempre recalcula tudo"; Comparar lento | áudio; B = 89,9 s | contagens refeitas a cada tela | KFA reaproveita o resultado; tabelas de features em memória | não |
| 5 | Migrar arquivo antigo demora | A = 14,3 min | laço em Python por camada | nenhuma ainda | — |
| 6 | Medidas inválidas na 1ª tentativa | terminal: 16 GB usados, 237 MB livres, swap alto, carga 12 | benchmark junto com outros aplicativos | repetir com a máquina livre | — |

**Reproduzido no M4:** o pacote x86_64 empacotado (sob Rosetta) com o `com_tabelas.ttwa` do Intel abre e o KFA responde HTTP 200 em 6 a 9 s (biberplus, mfte, spacy). O KFA não está quebrado no pacote; o problema é tempo numa máquina lenta e carregada. O `sem_tabelas.ttwa` do Intel (SQLite direto de 254 MB, WAL de 28 MB não consolidado) também abre: índice construído em 38 s no M4 e 0,4 s na 2ª vez.

## 4. O que falta medir no Intel

1. **Etapa I** (1ª abertura sem tabelas com índice em cache): o número que define se o índice em cache basta ou se precisamos do perfil "Pronto" (`armazenamento.md`). Estimativa a confirmar: 4 a 7 min para todas as ferramentas.
2. **Build com correções:** o KFA (corpus 2 = CorIFAessays, camada spacy) termina? mostra andamento por documento? a barra se move? ainda aparece "sem conexão"?
3. Palavras-chave, faixas e galeria no corpus grande (hoje sem número no Intel).
4. Memória de pico (Monitor de Atividade) em KFA e em construção de índice.
5. Abrir o `.dmg` no macOS 12 (Gatekeeper; aplicativo sem assinatura, decisão D4 do plano).

## 5. Como repetir o teste

1. **Preparar (uma vez):** `git pull && git submodule update --init --recursive` (precisa de `git lfs install`); `conda activate ttw311`; se faltar, `conda env create -f environment.yml -n ttw311 && pip install -e libs/ttwtools`. Antes de medir: feche navegador e outros aplicativos, tomada ligada, sem usar a máquina. **Uma medição por vez.**
2. **Rápido (2–3 min, sem projeto):** `cd libs/ttwtools && python tools/bench_storage.py --saida ~/Desktop/rapido.md`.
3. **Completo (15–60 min, com projeto):** `python tools/bench_storage.py /caminho/projeto.ttwa --saida ~/Desktop/intel.md`. Precisa de ~9× o tamanho do arquivo livres; o original nunca é tocado; tudo que o script cria é apagado ao fim (mesmo com Ctrl-C, que grava relatório parcial). Opções: `--pasta OUTRO_DISCO`, `--tokens 2000000`, `--tolerancia-min 5`, `--sem-sintetico`.
4. **Evite migrar a cada rodada:** gere uma vez um arquivo já migrado com `python -m ttwtools save-as original.ttwa ~/migrado.ttwa` (mais ~14 min) e use-o nos testes. O script avisa na primeira linha da seção 3 quando abrir vai migrar.
5. **Interface (5 min):** `python -m app --mode desktop`; abrir o arquivo sem tabelas e olhar as etapas ("Lendo as camadas…", "Criando o índice…") e o aviso "só na primeira vez"; reabrir (segundos); Módulos → Uso de disco; cancelar uma abertura; Comparar → KFA.
6. **Devolver:** colar os resultados e as respostas da seção 6 na seção 7 deste arquivo (uma subseção por data) e fazer o commit.

Se uma etapa parecer parada: em outro terminal, `while true; do du -sm "$TMPDIR"ttw_bench_*; sleep 5; done` mostra se a pasta de trabalho cresce; `top -o cpu -l 1 | head -15` mostra CPU e memória. Sem erro de etapa, o script segue e registra o erro no relatório.

## 6. Perguntas para decidir (preencher)

- Esperar a **1ª abertura** com barra de etapas é aceitável? Quanto, no máximo? ______ min
- **Espaço de cache** em disco aceitável? ______ GB
- Prefere arquivo que **abre pronto** (maior, sem espera) em máquina lenta? sim / não / como opção
- O **tamanho do arquivo** importa mais que o tempo de abrir? sim / não

## 7. Registro de sessões

### 2026-09-30 (manhã): primeiro contato
Fontes: relatório parcial (interrompido na etapa I), 9 fotos da tela (08:06–08:13), áudio (08:14), arquivos `com_tabelas.ttwa` (614 MB, gzip), `sem_tabelas.ttwa` e `.ttwcl` do corpus maior (104 MB). Resultados nas seções 2 e 3. Respostas da seção 6: pendentes.
