# Verificação da -rc: Windows

Roteiro e preparação: [`../roteiro_verificacao.md`](../roteiro_verificacao.md). Preencha só o que tiver a dizer; item sem problema pode ficar só com `ok`.
Resultado: `ok` | `problema` | `parcial` | `não testado`. Prioridade: `bloqueia` | `incomoda` | `detalhe`.
Prints em `prints/`, com nome `win-NN-descricao.png` (NN = número do item).

- Sistema: Windows
- Versão do SO: 
- Pacote: TTWtools-0.4.0-rc.1-windows-x86_64.zip
- Data:
- Quem testou:

### 1. Instalar e abrir
_Como:_ abrir o `.dmg`/`.zip`/`.tar.gz`, abrir o app (no macOS: botão direito → Abrir) · _Esperado:_ janela abre em até ~15 s; nenhuma janela de erro

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 2. Versão
_Como:_ ⚙ ou `TTWtools --version` (Linux/Windows pelo terminal) · _Esperado:_ versão da `-rc` e do pacote `ttwtools`

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 3. Criar projeto
_Como:_ Corpora → caminho `~/teste.ttwa` → Criar novo · _Esperado:_ projeto aparece como aberto

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 4. Importar com metadados
_Como:_ Adicionar corpus → pasta `textos/` → campos `aluno,nivel,ano` · _Esperado:_ N documentos; metadados `nivel` e `ano` listados

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 5. Visão geral
_Como:_ clicar no corpus → Calcular · _Esperado:_ números e gráfico de palavras; "Ocultar palavras funcionais" muda a lista

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 6. Etiquetar
_Como:_ spaCy "Recomendado" → Etiquetar; depois BiberPlus · _Esperado:_ barra de progresso; camadas listadas; repetir não reprocessa ("já existe")

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 7. Taggers indisponíveis
_Como:_ abrir a lista de taggers (Stanza, MFTE) · _Esperado:_ no macOS 12 Intel: se algum não roda, aparece o **motivo** e o comando, sem travar

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 8. Explorar
_Como:_ KWIC `lemma=make`; Frequência por lema; Colocados; Dispersão · _Esperado:_ resultados coerentes; Exportar CSV abre/salva

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 9. Palavras-chave
_Como:_ Comparar → Palavras-chave → "demais grupos" por `nivel` · _Esperado:_ tabela com LL/log ratio; clicar num item abre o KWIC

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 10. KFA e gráficos
_Como:_ Comparar → KFA B1 × C1 (BiberPlus) → galeria (PCA, mapa de calor, 3D) · _Esperado:_ gráficos aparecem; PNG/SVG exportam

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 11. Copiar como código
_Como:_ numa análise, Copiar como código → colar num terminal com `ttwtools` · _Esperado:_ mesmo resultado (quando houver o pacote instalado)

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 12. Catálogo e modelo
_Como:_ Corpora → Catálogo → Modelos → Baixar `pt_core_news_sm` · _Esperado:_ download com progresso; aparece "instalado"

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 13. Português
_Como:_ importar os textos em português → Etiquetar (já sugere `pt_core_news_sm`) → KWIC por lema · _Esperado:_ lemas e classes em português

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 14. Salvar e reabrir
_Como:_ Salvar como… `.ttwt`; fechar o app; abrir o `.ttwt` (duplo clique no macOS) · _Esperado:_ projeto reabre com camadas e análises

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

### 15. Ajuda e acessibilidade
_Como:_ Explicar esta tela; um tour em Aprender; navegar só com Tab; tema escuro · _Esperado:_ balões e tour funcionam; foco visível

- Resultado:
- O que aconteceu:
- Sugestão de melhoria:
- Prioridade:
- Print:

## Melhorias gerais

_(o que não cabe num item: textos confusos, fluxo, visual, desempenho, ideias; uma linha por assunto, com prioridade)_

- 

## Ajustes de interface pendentes

_(os pequenos ajustes anotados antes da -rc)_

- 
