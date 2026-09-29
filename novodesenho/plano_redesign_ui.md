# Plano: redesign visual do TTWtools (frontend-vue/)

Documento de retomada para qualquer agente. Leia **só** "Estado atual" e a etapa em curso; o resto é referência. Melhorar visual e usabilidade **sem reescrever a interface e sem tocar na lógica**. Trabalhe uma etapa por vez, mostre antes/depois (temas claro e escuro) e **pare para revisão ao fim de cada etapa**. Commits: `[ui N] ...`, em português, sem coautoria de agente (ver AGENTS.md). Nunca `git add -A`.

## Estado atual

| Etapa | Situação |
|---|---|
| 1. Tokens e temas | **em andamento** (ver "Andamento da etapa 1") |
| 2. Componentes base próprios | pendente |
| 3. Layout | pendente |
| 4. Telas de resultado + gráficos | pendente |
| 5. Vue Bits (só se passar o checklist) | pendente |
| 6. Responsivo | pendente |
| 7. Verificação final | pendente |

### Andamento da etapa 1
- [x] Contrastes dos 3 temas conferidos com `frontend-vue/scripts/contrast.py` (todos os valores das tabelas abaixo batem).
- [x] `@fontsource-variable/inter` instalado (npm). Importar só `latin-wght.css` e `latin-ext-wght.css` (menos arquivos no pacote).
- [ ] `style.css`: trocar `@plugin "daisyui" { themes: light --default, dark --prefersdark }` por `themes: false` e definir `light` (default), `dark` (prefersdark) e `contrast` com `@plugin "daisyui/theme"`; variáveis `--ttw-orange-text`, `--ttw-border-strong`, `--ttw-text-muted` por tema (inclusive `@media (prefers-color-scheme: dark)` para o modo "do sistema", que remove `data-theme`) e `@theme inline` com `--color-orange-text`, `--color-border-strong`, `--color-text-muted`.
- [ ] Atalho de compatibilidade: `.text-primary, .link-primary { color: var(--ttw-orange-text) }` (primary nunca é texto); substituir o bloco antigo `.text-primary` do tema escuro. Foco: `outline` com `--ttw-orange-text`.
- [ ] Campos com borda forte: `--input-color: var(--ttw-border-strong)` em `.input, .select, .textarea` (conferir checkbox/toggle no navegador).
- [ ] Tipografia: `--font-sans` (Inter Variable) e `--font-mono` (pilha do sistema) em `@theme`; `body` 15 px; `tabular-nums` em `.table td/th`; `text-wrap: balance` só em `h1,h2`.
- [ ] Densidade `confortável`/`compacto` por `data-density` no `<html>` (variáveis `--size-field`, `--size-selector`, `--ttw-gap`, padding de `.table`); opção na engrenagem (App.vue) guardada em `localStorage` (`ttw.density`) via `theme.js`; chaves i18n novas (`density.label`, `density.comfortable`, `density.compact`) em `libs/ttwtools/ttwtools/data/i18n/ui.{pt,en}.json` (submódulo: commit+push lá primeiro).
- [ ] `npm run build`, `npm test`, e2e (axe) nos 3 temas; capturas antes/depois; commit `[ui 1] ...`; **parar e pedir revisão**.
- Fora da etapa 1: `--chart-*`, `--pos-*`, `--layer-*` ficam para a etapa 4 (o índigo antigo dos gráficos continua até lá).

## Contexto (não mudar)
App local de linguística de corpus. Backend FastAPI + janela pywebview (WKWebView/WebView2/WebKitGTK); também `--mode web`. Frontend: Vue 3.5 (`<script setup>`, sem TS), Vite 8, Pinia, Vue Router (hash), Tailwind 4 (tokens em `@theme`), daisyUI 5. Ícones SVG próprios (NavIcon, FileIcon, MarkIcon); gráficos SVG à mão (`components/charts/`); textos por i18n (`/api/i18n/{lang}`, pt/en; **sem texto fixo**). Público não técnico; sem perfis; avançado em painéis recolhidos. Não mexer em `window.pywebview.api`, rotas, chaves de i18n existentes (só adicionar) nem no pacote Python.

## Restrições inegociáveis
1. **Compatibilidade:** Safari 17.6 (macOS 12 Intel), WebView2, WebKitGTK. Pode: container queries, `:has()`, subgrid, nesting, OKLCH, `color-mix()`, `backdrop-filter`, `@starting-style`, `dvh`. **Não:** View Transitions, scroll-driven animations, anchor positioning, `field-sizing`, `interpolate-size`. Confirmar recurso novo no caniuse; fallback com `@supports`. Não invente compatibilidade: diga o que não verificou.
2. **Offline:** nada de CDN/fonte/ícone pela rede em execução. Ferramentas de instalação com rede só em desenvolvimento.
3. **Acessibilidade WCAG 2.2 AA:** axe (Playwright, `npm run e2e`) passa nos temas claro, escuro e contraste; foco visível; tudo por teclado; `prefers-reduced-motion`; cor nunca é o único canal.
4. **Tamanho:** dependência nova precisa de justificativa escrita; prefira código copiado e enxuto.
5. **Não reescrever:** melhorar sobre Vue + Tailwind + daisyUI.

## Identidade: laranja, cinza e preto
Regras: o `primary` (preenchimento) leva texto **escuro**, nunca branco; sobre branco o `primary` tem só 3,06:1 → **nunca texto nem borda fina**; texto/link laranja usa `orange-text`. Um único botão `primary` por região (o resto contorno/fantasma). Bordas de campos e controles: `border-strong` (≥3:1); `base-300` só divisória decorativa. Cinzas quentes; preto quente `#1C1B1A` (exceto no `contrast`). **Recalcule com `python3 frontend-vue/scripts/contrast.py` se mudar qualquer cor.** Warning/error sempre com ícone e texto.

**light** (o menos polido; cuidar): base-100 `#FFFFFF`; base-200 `#F5F4F2`; base-300 `#E3E1DD`; texto `#1C1B1A` (17,2); muted `#5E5B57` (6,75); primary `#F26A1B` / content `#1A1208` (6,04); orange-text `#B8460A` (5,36; 4,88 sobre base-200); secondary `#3B3936` / `#F5F4F2`; neutral `#1C1B1A` / `#F5F4F2`; border-strong `#8A8580` (3,65; 3,32 sobre base-200); success `#1F7A45`, error `#B3261E`, warning `#8A5A00`, info `#2F5F8F` (conteúdo `#FFFFFF`).

**dark** (o mais usado): base-100 `#131211`; base-200 `#1C1B19`; base-300 `#2B2926`; texto `#ECEAE6` (15,57); muted `#A8A39C` (7,47); primary `#FF8533` / `#170D03` (7,90); orange-text `#FF9A55` (8,92); secondary `#3B3936` / `#ECEAE6`; neutral `#ECEAE6` / `#131211`; border-strong `#7A756E` (4,10; 3,77 sobre base-200); success `#4CC180`/`#0B1A11`, error `#FF7B72`/`#1F0906`, warning `#E8B03A`/`#1A1203`, info `#78A9DC`/`#0A1622`.

**contrast**: base-100 `#000000`; base-200 `#0D0D0D`; texto `#FFFFFF`; muted `#D6D6D6` (14,45); primary `#FF8A2B` / `#000000` (8,92); orange-text `#FFA35C` (10,65); secondary `#FFFFFF` / `#000000`; neutral idem; border-strong `#9A9A9A` (7,46); success `#5FE39A`, error `#FF8A80`, warning `#FFD34D`, info `#8CC4FF` (conteúdo `#000000`); `--border: 2px`.

Nomes de tema mantidos (`light`, `dark`, `contrast`) para o botão de tema e `prefers-color-scheme` seguirem funcionando (`theme.js` remove `data-theme` no modo "sistema").

**Gráficos `--chart-1..8`** (etapa 4; contraste ok, **daltonismo não verificado** → validar com simulador e acrescentar 2º canal: rótulo direto, marcador ou padrão). Claro / escuro: 1 `#C2500C`/`#FF8A3D` (laranja da marca); 2 `#3B3936`/`#C9C4BC`; 3 `#2F6F9F`/`#6FA8DC`; 4 `#7A5C99`/`#B79AD6`; 5 `#2E8B57`/`#5FC28A`; 6 `#B08900`/`#E3B93C`; 7 `#A63D6B`/`#E07AA5`; 8 `#8A8580`/`#8F8A83`. Cor = marca gráfica (≥3:1); textos de gráfico usam a cor de texto do tema. Dois lados (Comparar): laranja × cinza-escuro. Magnitude: rampa sequencial de laranja; divergente: laranja × cinza-azulado. POS/etiquetadores: manter distinguíveis; laranja da marca não pode ser confundido com VERB.

## Tipografia e ritmo
Fonte variável empacotada (Inter) para a interface; mono (pilha do sistema) para consultas, código e KWIC; manter a serifada do `.reader-paper`. Escala em tokens (base 15–16 px), `tabular-nums` em colunas numéricas, `text-wrap: balance` só em títulos. Espaçamento em múltiplos de 4 px. Dois níveis de densidade (confortável/compacto) por variável CSS, opção na engrenagem. Camadas fundo/superfície/borda fina com sombras discretas; `backdrop-filter` só em modais e menu, com fallback sólido.

## Espaço e responsividade (desktop primeiro)
- **Desktop:** aproveitar a largura (hoje sobra faixa à direita em Arquivo, Explorar, Comparar); título de página menor + barra fina fixa de contexto (corpus, camada, "não salvo", ações); formulário de consulta sticky; barra de ações do resultado à direita do título; painel lateral opcional (tabela + detalhe/gráfico, divisor redimensionável); tabelas com cabeçalho fixo, linhas compactas, ordenação visível, 1ª coluna fixa na rolagem horizontal, números à direita, zebra leve, tamanho de página escolhível; menu lateral 56 px com opção de expandir com rótulos em ≥1440 px (lembrar escolha).
- **Tablet:** container queries (`@container`) nos componentes de resultado; abaixo de ~900 px painéis viram gavetas e grades caem para 1 coluna.
- **Celular (previsto):** barra inferior existente; alvos ≥44 px em `pointer: coarse`; tabelas largas com rolagem horizontal e 1ª coluna fixa; sem rolagem horizontal da página; `dvh`, `env(safe-area-inset-*)`. Não quebrar o desktop.
- **Correções concretas:** *Dispersão* (rótulos idênticos e cortados `CorIFA-UFMG-B1.Int.Ne.AEss.2015-`: truncar no meio/mostrar só o que difere, `title` com nome completo, scroll interno, barras menores); *Comparar/gráfico de médias* (rótulo "N…" cortado; margem interna, `text-anchor` adaptativo, ocupar a largura); *barra de arquivo `.pbtn`* (Novo/Abrir em cor sólida competem com o título: um único primário por região); *formulários* (restos de `form-control` do daisyUI 4 em Comparar e KFA → `.ttw-form/.ttw-field/.ttw-label`); *cartões de corpora, painéis recolhíveis e badges de estado* (`etiquetado`, `não salvo`, `experimental`) num só sistema de superfícies e badges.

## Vue Bits (etapa 5; só com critério)
Componentes copiados para o repositório (vue-bits.dev, GitHub `DavidHDev/vue-bits`; confirme nomes no site). Onde faz sentido: contador animado em números de destaque; realce sutil em cartões (SpotlightCard ou similar); um título/texto animado em estado vazio, tela inicial e créditos; entrada de itens em listas curtas. **Evitar** fundos animados, partículas, aurora, shaders, 3D.
Checklist por componente: (1) ler o código e as dependências, **rejeitar** WebGL (`ogl`, `three`), canvas contínuo e dependência grande (GSAP só se indispensável); (2) sem rede em execução; (3) só recursos permitidos acima; (4) respeita `prefers-reduced-motion`, texto dividido em letras com `aria-label` e conteúdo decorativo `aria-hidden` (testar acentos pt/en); (5) texto vem de props/i18n; (6) cores dos tokens, nos 3 temas; (7) CPU/GPU baixas após 1 min em Mac Intel com gráfico integrado; (8) testar isolado numa rota de desenvolvimento `/lab` (fora do build final) e rodar o axe. Registrar cada componente adotado em `docs/ui-componentes.md` (origem, dependências, uso, resultado do checklist e das 3 plataformas).

## Etapas
1. **Tokens e temas:** 3 temas, tipografia empacotada, escala de espaçamento, densidade. Sem mudar telas. Axe.
2. **Componentes base próprios:** botões, campos, selects, abas, badges, cartões, tabelas, painéis recolhíveis, diálogo, HelpTip; corrigir restos de `form-control`.
3. **Layout:** barra de contexto fixa, formulário fixo, larguras e painéis laterais, menu expansível; depois Dispersão e gráfico de Comparar.
4. **Telas de resultado:** hierarquia de tabelas e gráficos (Colocados, Frequência, KWIC, keyness, KFA); paleta de gráficos e 2º canal.
5. **Vue Bits:** só onde o checklist passar.
6. **Responsivo:** container queries, gavetas, alvos de toque; revisar em 1440, 1280, 1024, 768 e 390 px.
7. **Verificação final:** axe nos 3 temas, contraste recalculado, teclado/foco, reduced-motion, pt/en, offline (sem requisição externa), tamanho do pacote antes/depois.

## Critérios de aceite
Sem erro novo no axe (claro/escuro/contraste) e contrastes registrados; nenhuma requisição além da API local; Safari 17.6/macOS 12, Windows e Linux funcionando **ou** documentado o que falta testar (o agente não tem essas máquinas: listar o que exige teste manual e entregar `/lab`); textos sempre do i18n, pt e en sem quebra de layout (pt é mais longo); aumento de tamanho justificado por escrito; cada etapa com capturas antes/depois em claro e escuro.

## Como se comunicar / economizar contexto
Antes de cada etapa: ler `frontend-vue/src/style.css` e a estrutura de `components/` e resumir em poucas linhas o que muda. Em dúvida, escolha o menor risco de compatibilidade e registre a decisão aqui. Não abrir `node_modules/`, `dist/`, `frontend/`. Rodar só os testes do que mexeu; e2e (`npm run e2e`) ao fim da etapa. Atualize a tabela "Estado atual" e o "Andamento" a cada passo concluído.
