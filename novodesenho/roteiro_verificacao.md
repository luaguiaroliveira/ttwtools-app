# Roteiro de verificação por sistema (passo 6.2)

Executar com o pacote da release `-rc` baixado do GitHub (não com o código-fonte), em cada sistema: macOS Apple Silicon, macOS Intel **com macOS 12**, Windows 10/11 e Linux. Anote o feedback de cada item no arquivo do sistema em [`verificacao/`](verificacao/) (`macos-arm64.md`, `macos12-intel.md`, `windows.md`, `linux.md`; prints em `verificacao/prints/`) e o resumo na tabela do fim.

Preparação: uma pasta `textos/` com 6 a 10 arquivos `.txt` em inglês nomeados `aluno_nivel_ano.txt` (ex.: `ana_B1_2024.txt`) e outra com 3 a 5 textos em português.

| # | Item | Como | Esperado |
|---|---|---|---|
| 1 | Instalar e abrir | abrir o `.dmg`/`.zip`/`.tar.gz`, abrir o app (no macOS: botão direito → Abrir) | janela abre em até ~15 s; nenhuma janela de erro |
| 2 | Versão | ⚙ ou `TTWtools --version` (Linux/Windows pelo terminal) | versão da `-rc` e do pacote `ttwtools` |
| 3 | Criar projeto | Corpora → caminho `~/teste.ttwa` → Criar novo | projeto aparece como aberto |
| 4 | Importar com metadados | Adicionar corpus → pasta `textos/` → campos `aluno,nivel,ano` | N documentos; metadados `nivel` e `ano` listados |
| 5 | Visão geral | clicar no corpus → Calcular | números e gráfico de palavras; "Ocultar palavras funcionais" muda a lista |
| 6 | Etiquetar | spaCy "Recomendado" → Etiquetar; depois BiberPlus | barra de progresso; camadas listadas; repetir não reprocessa ("já existe") |
| 7 | Taggers indisponíveis | abrir a lista de taggers (Stanza, MFTE) | no macOS 12 Intel: se algum não roda, aparece o **motivo** e o comando, sem travar |
| 8 | Explorar | KWIC `lemma=make`; Frequência por lema; Colocados; Dispersão | resultados coerentes; Exportar CSV abre/salva |
| 9 | Palavras-chave | Comparar → Palavras-chave → "demais grupos" por `nivel` | tabela com LL/log ratio; clicar num item abre o KWIC |
| 10 | KFA e gráficos | Comparar → KFA B1 × C1 (BiberPlus) → galeria (PCA, mapa de calor, 3D) | gráficos aparecem; PNG/SVG exportam |
| 11 | Copiar como código | numa análise, Copiar como código → colar num terminal com `ttwtools` | mesmo resultado (quando houver o pacote instalado) |
| 12 | Catálogo e modelo | Corpora → Catálogo → Modelos → Baixar `pt_core_news_sm` | download com progresso; aparece "instalado" |
| 13 | Português | importar os textos em português → Etiquetar (já sugere `pt_core_news_sm`) → KWIC por lema | lemas e classes em português |
| 14 | Salvar e reabrir | Salvar como… `.ttwt`; fechar o app; abrir o `.ttwt` (duplo clique no macOS) | projeto reabre com camadas e análises |
| 15 | Ajuda e acessibilidade | Explicar esta tela; um tour em Aprender; navegar só com Tab; tema escuro | balões e tour funcionam; foco visível |

Problemas típicos a observar: janela em branco (WebView), caminhos com acento ou espaço, permissões de pasta (macOS: Documentos/Área de Trabalho), antivírus no Windows, fontes e escala em telas HiDPI, `libwebkit2gtk` ausente no Linux.

## Resultado

| Sistema | Versão do SO | Pacote | Itens ok | Problemas (nº do item: descrição) |
|---|---|---|---|---|
| macOS Apple Silicon | | | | |
| macOS Intel (macOS 12) | 12.7.6 | | | |
| Windows | | | | |
| Linux | | | | |
