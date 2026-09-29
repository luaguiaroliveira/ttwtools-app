// Escalas lineares e cores dos lados para os gráficos em SVG.
export const linear = ([d0, d1], [r0, r1]) => (v) => (d1 === d0 ? (r0 + r1) / 2 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0))
export const extent = (vals) => { const v = vals.filter((x) => x !== null && Number.isFinite(x)); return v.length ? [Math.min(...v), Math.max(...v)] : [0, 1] }
export const SIDE_CLASS = ['fill-chart-1 stroke-chart-1', 'fill-chart-2 stroke-chart-2', 'fill-chart-3 stroke-chart-3', 'fill-chart-4 stroke-chart-4',
  'fill-chart-5 stroke-chart-5', 'fill-chart-6 stroke-chart-6', 'fill-chart-7 stroke-chart-7', 'fill-chart-8 stroke-chart-8']
// Paleta categórica dos tokens (style.css). Para gráficos de linhas que NÃO podem ter
// preenchimento: usar a cor de traço sem reutilizar `SIDE_CLASS` (que tem `fill-*` e
// venceria o atributo `fill="none"`).
export const CHART_VARS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-6', '--chart-7', '--chart-8']
export const sideStroke = (i) => `var(${CHART_VARS[Math.max(0, i) % CHART_VARS.length]})`
// Divergente: laranja (positivo) × azul-acinzentado (negativo); opacidade até .45 para o número na célula continuar legível
export const diverging = (z) => { const a = (Math.min(1, Math.abs(z) / 2.5) * 0.45).toFixed(2); return `rgb(var(${z >= 0 ? '--chart-pos' : '--chart-neg'}) / ${a})` }
export const fmt = (v, d = 2) => (v === null || v === undefined ? '—' : Number(v).toFixed(d))
