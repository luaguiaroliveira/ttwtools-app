# Verificação manual por sistema

Roteiro único para testar um **pacote baixado do GitHub** (não o código-fonte) em macOS Apple Silicon, macOS Intel **com macOS 12**, Windows 10/11 e Linux. Testes do Mac Intel de desempenho e armazenamento: `macintel.md`. Anote resultados na tabela do fim (uma linha por sistema e item com problema); prints em `verificacao/prints/` com nome `sis-NN-descricao.png` (`arm`, `intel`, `win`, `linux`; NN = item).

**Preparação:** uma pasta `textos/` com 6–10 `.txt` em inglês nomeados `aluno_nivel_ano.txt` (ex.: `ana_B1_2024.txt`) e outra com 3–5 textos em português. Resultado de cada item: `ok` | `problema` | `parcial` | `não testado`; prioridade: `bloqueia` | `incomoda` | `detalhe`.

| # | Item | Como | Esperado |
|---|---|---|---|
| 1 | Instalar e abrir | abrir o `.dmg`/`.zip`/`.tar.gz` e o app (macOS: botão direito → Abrir) | janela abre em ~15 s, sem erro |
| 2 | Versão | ⚙ ou `TTWtools --version` | versão do app e do pacote `ttwtools` |
| 3 | Criar projeto | Arquivo → Novo | projeto aparece como aberto |
| 4 | Importar com metadados | Adicionar corpus → pasta `textos/` → campos `aluno,nivel,ano` | N documentos; metadados `nivel` e `ano` listados |
| 5 | Visão geral | clicar no corpus → Calcular | números e gráfico; "Ocultar palavras funcionais" muda a lista |
| 6 | Etiquetar | spaCy "Recomendado"; depois BiberPlus | barra de progresso; camadas listadas; repetir não reprocessa |
| 7 | Taggers indisponíveis | lista de taggers (Stanza, MFTE) | no macOS 12 Intel, se algum não roda, aparece o **motivo** e o comando, sem travar |
| 8 | Explorar | KWIC `lemma=make`; Frequência por lema; Colocados; Dispersão | resultados coerentes; Exportar CSV funciona |
| 9 | Palavras-chave | Comparar → Palavras-chave → "demais grupos" por `nivel` | tabela com LL/log ratio; clicar abre o KWIC |
| 10 | KFA e gráficos | Comparar → KFA B1 × C1 (BiberPlus) → galeria (PCA, mapa de calor, 3D) | gráficos aparecem; PNG/SVG exportam; **com andamento e sem "sem conexão"** |
| 11 | Copiar como código | numa análise → Copiar como código → colar num terminal com `ttwtools` | mesmo resultado |
| 12 | Catálogo e modelo | Módulos → Modelos → baixar `pt_core_news_sm` | download com progresso; "instalado" |
| 13 | Português | importar textos em português → Etiquetar → KWIC por lema | lemas e classes em português |
| 14 | Salvar e reabrir | Salvar como `.ttwa` (e `.ttwt` antigo); fechar; reabrir | reabre com camadas e análises; abrir arquivo grande mostra etapas |
| 15 | Ajuda e acessibilidade | Explicar esta tela; um tour em Aprender; só teclado (Tab); tema escuro | balões e tour funcionam; foco visível |

Problemas típicos: janela em branco (WebView), caminhos com acento ou espaço, permissões de pasta (macOS: Documentos/Área de Trabalho), antivírus no Windows, fontes e escala em tela HiDPI, `libwebkit2gtk` ausente no Linux, barra de progresso cheia e parada (WebKit antigo), requisição longa derrubada ("sem conexão com o servidor local").

## Resultado

| Sistema | SO | Pacote | Itens ok | Problemas |
|---|---|---|---|---|
| macOS Apple Silicon | — | `0.4.0-rc.1` | 1 | 3: criar projeto confuso; pediu botões Novo/Abrir/Salvar e uma área própria de módulos (feito na 0.5.0: Arquivo e Módulos). Demais itens do rc.1 não preenchidos; interface testada depois em uso real. |
| macOS Intel (macOS 12.7.6) | 12.7.6 | `0.6.0.dev0` | ver `macintel.md` seção 3 | KFA "sem conexão", barra cheia e parada, "não salvo" após KFA |
| Windows | | | | não testado |
| Linux | | | | não testado |
