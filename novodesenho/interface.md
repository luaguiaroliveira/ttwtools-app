# Interface (frontend-vue): redesign, usabilidade, gráficos

Fonte única da frente de interface. Código: `frontend-vue/` (Vue 3.5 `<script setup>` sem TS, Vite 8, Pinia, Vue Router em hash, Tailwind 4 com tokens em `@theme`, daisyUI 5); valores de cor e tokens reais em `frontend-vue/src/style.css` (**fonte de verdade**; recalcular contrastes com `python3 frontend-vue/scripts/contrast.py` ao mudar qualquer cor). Backend FastAPI + janela pywebview (WKWebView, WebView2, WebKitGTK); também `--mode web`. Público não técnico, sem perfis, opções avançadas em painéis recolhidos, **todo texto por chave de tradução** (pt e en). Não mexer em `window.pywebview.api`, nas rotas, nem no pacote Python por causa de estilo.

## 1. Restrições inegociáveis

1. **Compatibilidade:** Safari 17.6 (macOS 12 Intel), WebView2, WebKitGTK. Pode: container queries, `:has()`, subgrid, nesting, OKLCH, `color-mix()`, `backdrop-filter`, `@starting-style`, `dvh`. **Não:** View Transitions, scroll-driven animations, anchor positioning, `field-sizing`, `interpolate-size`. Recurso novo: conferir no caniuse, com fallback `@supports`; dizer o que não foi verificado. **`<progress>` nativo estilizado pelo daisyUI aparece como barra cheia e parada no macOS 12**: usar `ProgressBar.vue`.
2. **Offline:** nada de CDN, fonte ou ícone pela rede em execução.
3. **Acessibilidade WCAG 2.2 AA:** axe (`npm run e2e`) passa nos temas claro, escuro e contraste; foco visível; tudo por teclado; `prefers-reduced-motion`; cor nunca é o único canal.
4. **Tamanho:** dependência nova com justificativa escrita; preferir código copiado e enxuto. **Não reescrever:** melhorar sobre Vue + Tailwind + daisyUI.
5. **Toda operação longa é tarefa com andamento** (`postJob`, `useJob`, `BusyModal :job`), nunca uma requisição parada: o WebKit derruba requisição sem resposta por ~60 s ("sem conexão com o servidor local").

## 2. Identidade: laranja, cinza e preto

`primary` (preenchimento) leva texto **escuro**, nunca branco; sobre branco o `primary` tem só 3,06:1, então **nunca texto nem borda fina**: texto ou link laranja usa `orange-text`. Um único botão `primary` por região. Bordas de campo: `border-strong` (≥3:1); `base-300` só divisória. Cinzas quentes; preto quente `#1C1B1A` (exceto no tema `contrast`). Warning e error sempre com ícone e texto. Temas `light`, `dark` (o mais usado) e `contrast` (`--border: 2px`); modo "sistema" remove `data-theme`.

| Token | light | dark | contrast |
|---|---|---|---|
| base-100 / texto | `#FFFFFF` / `#1C1B1A` | `#131211` / `#ECEAE6` | `#000000` / `#FFFFFF` |
| primary (conteúdo) | `#F26A1B` (`#1A1208`) | `#FF8533` (`#170D03`) | `#FF8A2B` (`#000000`) |
| orange-text | `#B8460A` | `#FF9A55` | `#FFA35C` |
| muted | `#5E5B57` | `#A8A39C` | `#D6D6D6` |
| border-strong | `#8A8580` | `#7A756E` | `#9A9A9A` |

**Gráficos:** paleta `--chart-1..8` por tema com 2º canal obrigatório (rótulo direto, forma ou padrão); dois lados = laranja × cinza-escuro; divergente = laranja × azul-acinzentado (opacidade ≤0,45 para o número na célula continuar legível); magnitude = rampa de laranja; `--pos-*` (classes gramaticais, texto próprio ≥4,5:1) e `--layer-*` (etiquetadores) com a mesma cor em tabela, gráfico, leitor e legenda. Tipografia: Inter variável empacotada (só latin e latin-ext), mono do sistema para consulta e KWIC, serifada no `.reader-paper`; corpo 15 px, `tabular-nums` em tabelas, `text-wrap: balance` em títulos; densidade compacta opcional (engrenagem).

## 3. Estado por etapa

| Etapa | Situação |
|---|---|
| 1 Tokens e temas (contrastes conferidos, Inter, densidade) | feita, **aguarda revisão visual** |
| 2 Componentes base próprios (`.ttw-field/.ttw-label`, botões, abas, cartões, tabelas) | feita, aguarda revisão |
| 3 Layout (barra de contexto fixa, formulário fixo, menu lateral expansível ≥1440 px, larguras) | feita, aguarda revisão |
| 4 Telas de resultado e gráficos (paleta, 2º canal, tabelas com `.ttw-scroll`) | feita, aguarda revisão |
| 5 Vue Bits (`components/vb/`) | parcial |
| 6 Responsivo | pendente |
| 7 Verificação final | pendente |

**Componentes Vue Bits adotados** (MIT + Commons Clause; fonte vue-bits.dev; portados para JS em `components/vb/`; gsap, motion-v, ogl e three **rejeitados**): `SpotlightCard` (`StatCard`, `TaggerCard`), `CountUp` (números do `StatCard`), `TextType` ("TTWtools" do cabeçalho; reescrito em JS), `ShinyText` e `GradientText` (reescritos só com CSS; títulos de Início, Explorar, Comparar, Recursos). Todos param com `prefers-reduced-motion`. **Checklist para novo componente:** ler o código e as dependências (rejeitar WebGL, canvas contínuo, dependência grande); sem rede; só recursos permitidos; respeitar reduced-motion, `aria-label` no texto dividido em letras, decorativo `aria-hidden`; texto por props/i18n; cores dos tokens nos 3 temas; CPU/GPU baixas após 1 min em Mac Intel de gráfico integrado; testar isolado numa rota de desenvolvimento `/lab` (fora do build final) e rodar o axe.

## 4. Pendências da interface

- **Etapa 5:** rota `/lab`, BorderGlow/GlareHover/Reveal em lista, medir CPU.
- **Etapa 6:** responsivo com container queries, gavetas em <900 px, alvos de toque ≥44 px em `pointer: coarse`, `dvh` e `safe-area`; revisar em 1440, 1280, 1024, 768 e 390 px.
- **Etapa 7:** axe nos 3 temas, contraste recalculado, teclado e foco, reduced-motion, pt/en (pt é mais longo), offline (sem requisição externa), tamanho do pacote antes e depois.
- **Capturas antes/depois** (claro e escuro) de todas as etapas: nenhuma feita. Daltonismo dos gráficos não verificado; marcadores de forma só no gráfico de médias; contraste do texto sobre o divergente e durante o brilho do `ShinyText`.
- Tabelas: ordenação clicável e números sempre à direita; painel lateral com divisor redimensionável; barra de ações à direita do título.
- Componentes base ainda são CSS sobre o daisyUI: reescrever como `.vue` próprios; revisar `HelpTip` e diálogo além das cores.
- Menu **Recentes** (`<details>`) não fecha ao clicar fora: trocar pelo `MenuButton`.
- Modal de progresso ainda não cobre busca, frequência e colocados de Explorar (Comparar já é tarefa).
- Usabilidade: nomes definitivos dos menus (decisão D8); traduzir **todas** as mensagens do servidor (hoje só os casos comuns em `utils/errors.js`; o pacote ainda não manda códigos estáveis, exceto `insufficient_disk_space`); indicador de etapas no menu e no tour; agrupar os formulários de Colocados, Dispersão e Laboratório (Palavras-chave e KFA já têm opções avançadas recolhidas).
- Leitor: abrir **na ocorrência** clicada na Dispersão (hoje abre no início do texto); bug não reproduzido de aba em branco em Frequência e Colocados depois do Leitor; exportar SVG/PNG da Dispersão não testado após a mudança para linhas em HTML; Busca e Colocados com camadas só de tags sem teste automatizado.

## 5. Galeria de gráficos (Comparar → KFA)

**Feitos** (`ChartGallery`, `components/charts/`, rotas `/api/compare/viz/*`): barras divergentes, médias, bolhas, strip, mapa de calor, radar, violino, histograma, coordenadas paralelas (só traço, com legenda), PCA 2D e 3D, t-SNE, MDS, UMAP (opcional, `umap-learn`). Dados a partir das tabelas de features, sem gravar nada novo no arquivo. **Falta:** grafo de força (similaridade por cosseno com filtro dos K vizinhos); aviso de tempo para t-SNE e UMAP com mais de ~200 textos. O plano antigo `plano_visualizacoes.md` (Plotly e `frontend-src`) foi superado pela interface Vue.

## 6. Usabilidade: o que já se adotou (manter)

Glossário de 28 verbetes com `HelpTip` (`term`/`topic`, `aria-describedby`, abre no foco e no toque) em consulta, Colocados (LL/MI/T), Frequência, Palavras-chave e KFA; menus **Arquivo** (Novo, Abrir, Salvar, Salvar como, Exportar) e **Módulos** (modelos e corpora, com ficha de licença, tamanho e origem); seletor de corpus e de camada no cabeçalho (mostra nº de camadas; selo "etiquetado" no cartão do corpus); vazios de Explorar e Comparar trazem o próprio seletor (a faixa "Próximo passo" foi **removida a pedido**: explorar um corpus individual é legítimo); Frequência com "Mostrar N" e rolagem própria; Colocados com ordenação e `aria-sort`; português como idioma padrão. Capturas antigas em `verificacao/prints/`.
