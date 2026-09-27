// Escalas lineares e cores dos lados para os gráficos em SVG.
export const linear = ([d0, d1], [r0, r1]) => (v) => (d1 === d0 ? (r0 + r1) / 2 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0))
export const extent = (vals) => { const v = vals.filter((x) => x !== null && Number.isFinite(x)); return v.length ? [Math.min(...v), Math.max(...v)] : [0, 1] }
export const SIDE_CLASS = ['fill-primary stroke-primary', 'fill-secondary stroke-secondary', 'fill-accent stroke-accent']
export const diverging = (z) => { const a = Math.min(1, Math.abs(z) / 2.5); return z >= 0 ? `rgba(215,48,39,${a})` : `rgba(69,117,180,${a})` }
export const fmt = (v, d = 2) => (v === null || v === undefined ? '—' : Number(v).toFixed(d))
