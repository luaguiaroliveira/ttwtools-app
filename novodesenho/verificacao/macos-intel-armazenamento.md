# Teste de armazenamento no Mac Intel (macOS 12): medir as opções e decidir

**Para quê:** medir, na máquina mais lenta que o TTWtools precisa atender, as três formas de guardar e abrir um projeto, e gerar **um relatório único** para decidir o que fazer na Fase B (ver `novodesenho/plano_armazenamento.md`, B3). O relatório sai em Markdown; você preenche quatro respostas no fim e devolve o arquivo.

**As três opções comparadas**

| # | Opção | Como funciona | Trade-off |
|---|---|---|---|
| 1 | **Com tabelas de busca** | As tabelas de busca ficam dentro do arquivo | abre rápido, mas o arquivo é grande (centenas de MB) e descompacta GBs |
| 2 | **Sem tabelas + índice em cache** (novo, B3) | Arquivo pequeno; o índice é construído 1 vez e guardado no computador | 1ª abertura espera (com barra de progresso); as demais levam segundos; usa espaço de cache |
| 3 | **Sem tabelas, sem cache** (o que havia antes) | Arquivo pequeno; recria as tabelas **em toda abertura** | arquivo pequeno, mas espera em todas as aberturas |

O teste também mede compactar, salvar, exportar `.ttwcl`, a velocidade bruta da máquina e o tempo das consultas (KWIC, frequência, colocados, dispersão).

---

## 1. Preparar (uma vez, ~10 min)

No Mac Intel, no Terminal:

```bash
cd <pasta do repositório ttwtools-app>
git pull
git submodule update --init --recursive      # precisa do git-lfs: `git lfs install` antes, se faltar
conda activate ttw311                          # ambiente do Mac Intel (Python 3.11, torch 2.2.2)
```

Se o ambiente não existir: `conda env create -f environment.yml -n ttw311` e depois `pip install -e libs/ttwtools`.
Confira: `python -c "import ttwtools; print(ttwtools.__version__)"` deve imprimir a versão sem erro.

**Antes de medir (para o número valer):** feche o navegador e outros aplicativos pesados, deixe o computador na tomada, desligue a proteção de tela e **não use a máquina** durante o teste. Rode **uma medição por vez**.

**Disco:** o teste com o projeto real precisa de cerca de **9× o tamanho do arquivo** livres (um projeto de 1 GB pede ~9 GB). O script confere e avisa antes de começar; tudo que ele cria é apagado ao fim. O projeto original **não é tocado** (trabalha numa cópia). O cache desta medição fica numa pasta própria e não mistura com o cache real.

## 2. Teste rápido (~2–3 min): a máquina e o índice sintético

Não precisa de projeto. Serve para confirmar que tudo roda e ter a velocidade bruta:

```bash
cd libs/ttwtools
python tools/bench_storage.py --saida ~/Desktop/rapido_intel.md
```

Abra `rapido_intel.md` e confira as seções 1 e 2. Se aparecer erro, pare e envie o arquivo: ele já traz a mensagem.

## 3. Teste completo com o projeto real (~15–60 min)

Use o projeto grande (o `.ttwa` dos dois corpora). Copie-o para o Mac Intel (nunca edite o original) e rode:

```bash
cd libs/ttwtools
python tools/bench_storage.py /caminho/para/projeto.ttwa --saida ~/Desktop/relatorio_intel.md
```

Opções úteis:

| Opção | Para quê |
|---|---|
| `--pasta /Volumes/OUTRO_DISCO/tmp` | trabalhar em outro disco se o principal estiver apertado |
| `--tokens 2000000` | tamanho do teste sintético (padrão 1 milhão) |
| `--tolerancia-min 5` | espera aceitável na 1ª abertura, em minutos; muda só a recomendação automática |
| `--sem-sintetico` | pula a seção 2 |

Durante a execução o terminal mostra cada etapa e o tempo. **Ctrl-C** interrompe com segurança: o relatório já gravado fica com o que foi medido e a pasta de trabalho é apagada. Se a máquina parecer travada, espere: a etapa "abrir sem tabelas, 1ª vez" é a mais longa (é justamente o número que queremos).

O que cada etapa do relatório (seção 3) mede:

| Etapa | O que é |
|---|---|
| A | abrir o arquivo original |
| B | consultas com as tabelas dentro do projeto (se o original as tem) |
| C | compactar projeto (remove cópias antigas; simulação e remoção) |
| D / E | salvar com / sem tabelas de busca (tempo e tamanho) |
| F | exportar o corpus maior em `.ttwcl` (leve) |
| G | abrir **com** tabelas (opção 1) |
| H | abrir **sem** tabelas, cache desligado (opção 3) |
| I | abrir sem tabelas com cache, **1ª vez** (opção 2; constrói o índice) |
| J | consultas via índice em cache |
| K | abrir sem tabelas com cache, **2ª vez** (índice pronto) |

## 4. Ler o relatório

Olhe nesta ordem:

1. **Seção 3 → "Resumo das opções":** a tabela com as três opções lado a lado (1ª abertura, demais aberturas, arquivo, banco de trabalho, cache).
2. **Consultas (tabela × cache):** o índice em cache pode ser até ~40% mais lento em consultas pesadas (medido no Apple Silicon); confira se aqui passa muito disso.
3. **Seção 4 → "Para decidir":** a recomendação automática (com a sua tolerância) e as quatro perguntas.

**Referência do Apple Silicon (M-series), projeto real de 19 milhões de tokens**, para comparar:

| | M-series | Intel (preencha) |
|---|---|---|
| Abrir com tabelas | 6 s (banco 2.979 MB) | |
| Abrir sem tabelas, sem cache | ~53 s em toda abertura | |
| Abrir sem tabelas com cache, 1ª vez | 44 s | |
| Abrir sem tabelas com cache, demais | 1 s | |
| Cache em disco | 2.124 MB | |
| Decodificar camadas | ~3.300 mil tokens/s | |

## 5. Teste na interface (5 min, opcional, mas importa)

Os números não dizem se a experiência é clara. Com o arquivo **sem tabelas** salvo pelo teste (ou salve um: Arquivo → desligar "Guardar tabelas de busca" → Salvar como):

```bash
python -m app --mode desktop
```

1. Abra o arquivo. Anote: a janela de progresso mostra as **etapas** ("Lendo as camadas…", "Criando o índice de formas…")? A barra anda de modo compreensível? O aviso "só na primeira vez" aparece?
2. Feche e abra de novo: abriu em poucos segundos?
3. Módulos → **Uso de disco**: o cache aparece com o tamanho certo? "Limpar restos" funciona?
4. Cancele uma abertura no meio (botão Cancelar): o aplicativo volta ao normal, sem mensagem estranha?

## 6. Devolver

1. Abra o `.md` gerado e preencha as quatro respostas da seção 4 (e as observações da interface).
2. Devolva o arquivo (por exemplo, coloque em `novodesenho/verificacao/` com o nome `relatorio_intel_AAAAMMDD.md` e faça commit, ou cole o conteúdo na conversa).

Com isso se decide: se o índice em cache basta nesta máquina, se vale o modo **"abre pronto"** (levar o índice já construído dentro do pacote, sem a espera da 1ª vez) e como priorizar o formato pasta-pacote (B1/B2).

## Se algo der errado

| Sintoma | O que fazer |
|---|---|
| `ModuleNotFoundError: ttwtools` | `conda activate ttw311` e `pip install -e libs/ttwtools` |
| "espaço em disco insuficiente" | use `--pasta` em outro disco, ou libere espaço |
| Erro numa etapa | o script continua e registra o erro no relatório; envie o arquivo |
| Sobrou pasta `ttw_bench_*` no temporário | `python -m ttwtools cache clear` não a cobre; apague a pasta manualmente (é só do teste) |
| Quer repetir só a parte rápida | `python tools/bench_storage.py` sem caminho |
