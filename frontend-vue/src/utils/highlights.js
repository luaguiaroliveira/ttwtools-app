// Destaques nos verbetes de Aprender: `[texto]{circulo}`, `[texto]{marca azul}` ou `==texto==` (marca-texto).
// Tipo e cor podem vir em qualquer ordem; nomes em português ou inglês. Mantenha igual a
// HIGHLIGHT_TYPES/HIGHLIGHT_COLORS em libs/ttwtools/ttwtools/help.py (usado por `ttwtools help --check`).
export const HL_TYPES = {
  marca: 'highlight', highlight: 'highlight',
  sublinhado: 'underline', underline: 'underline',
  circulo: 'circle', circle: 'circle',
  caixa: 'box', box: 'box',
  riscado: 'strike-through', strike: 'strike-through',
  cruz: 'crossed-off', cross: 'crossed-off',
  colchete: 'bracket', bracket: 'bracket',
}
// cor → variável de gráfico do tema (a cor do tema, sem nome, usa a cor dominante)
export const HL_COLORS = {
  laranja: '--chart-1', orange: '--chart-1', azul: '--chart-3', blue: '--chart-3', roxo: '--chart-4', purple: '--chart-4',
  verde: '--chart-5', green: '--chart-5', amarelo: '--chart-6', yellow: '--chart-6', rosa: '--chart-7', pink: '--chart-7',
}

// "marca azul" → { type: 'highlight', color: 'azul' }; null se algum termo for desconhecido
export function parseSpec(spec) {
  let type = null
  let color = ''
  for (const w of spec.toLowerCase().split(/[\s,]+/).filter(Boolean)) {
    if (HL_TYPES[w]) type = HL_TYPES[w]
    else if (HL_COLORS[w]) color = w
    else return null
  }
  return type ? { type, color } : null
}
