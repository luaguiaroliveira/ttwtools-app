// Paletas do seletor de cores (Leitor e seletor de etiquetas do painel lateral da Dispersão).
// `PALETTE` é a grade padrão (uma cor por etiqueta); `PALETTES` reúne as paletas oferecidas no menu.
export const PALETTE = ['#1f77b4', '#d62728', '#2ca02c', '#9467bd', '#ff7f0e', '#17becf', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22',
  '#393b79', '#637939', '#8c6d31', '#843c39', '#7b4173', '#3182bd', '#e6550d']
export const PALETTES = [
  { id: 'default', colors: PALETTE.slice(0, 12) },
  { id: 'safe', colors: ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'] },   // Okabe-Ito
  { id: 'gray', colors: ['#111111', '#3B3936', '#5E5B57', '#8A8580', '#B5B0A9', '#D9D5CF', '#F2F0EC', '#FFFFFF'] },
]
// Texto legível (preto ou branco) sobre a cor de fundo.
export function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16)
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  return L > 0.4 ? '#111' : '#fff'
}
