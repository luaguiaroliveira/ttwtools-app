# Componentes de origem externa (Vue Bits)

Fonte: <https://vue-bits.dev> / GitHub `DavidHDev/vue-bits` (MIT + Commons Clause). Copiados e **portados para JS** em `frontend-vue/src/components/vb/`; nenhum pacote novo (gsap, motion-v, ogl e three **rejeitados**).

| Componente | Origem | Mudança | Uso | Checklist |
|---|---|---|---|---|
| `SpotlightCard` | SpotlightCard | JS, `tag`, cor dos tokens | `StatCard` (visão geral), `TaggerCard` | sem rede, sem dependência, tokens dos 3 temas; não anima com o mouse parado |
| `CountUp` | CountUp | JS; conta ao montar (sem IntersectionObserver); `format` por idioma | números do `StatCard` | parado com `prefers-reduced-motion`; rAF só durante ~1 s |
| `ShinyText` | ShinyText (usa motion-v) | **reescrito só com CSS** | sem uso no momento | parado com `prefers-reduced-motion`; cores AA |
| `TextType` | TextType (usa gsap) | **reescrito em JS**: digita uma vez ao aparecer, cursor só enquanto digita, `parts` para cores por trecho | "TTWtools" no cabeçalho (TTW laranja, tools cinza) | `aria-label` com o texto inteiro; sem animação com `prefers-reduced-motion` |
| `GradientText` | GradientText (usa motion-v) | **reescrito só com CSS** | títulos de Início, Explorar, Comparar, Recursos | idem |

Não verificado (o agente não tem essas máquinas): CPU/GPU após 1 min em Mac Intel com gráfico integrado; Safari 17.6, WebView2, WebKitGTK; contraste do texto durante o brilho do `ShinyText` (o degradê vai de `orange-text` ao texto do tema, ambos AA sobre o fundo, mas o valor intermediário não foi medido).
Rota `/lab` para teste isolado: **não criada**.
