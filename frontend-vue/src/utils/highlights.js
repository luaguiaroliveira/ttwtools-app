// Destaques nos verbetes de Aprender, como canetas: marca-texto (`marca`) e caneta de tinta (`sublinhado`).
//   [texto]{marca amarelo}   [texto]{sublinhado azul}   ==texto==   [texto]{marca #ffd400}
// Tipo e cor podem vir em qualquer ordem; nomes em português ou inglês. Sem cor: marca amarela, tinta azul.
// Mantenha igual a HIGHLIGHT_TYPES/HIGHLIGHT_COLORS em libs/ttwtools/ttwtools/help.py (`ttwtools help --check`).
export const HL_TYPES = { marca: 'highlight', highlight: 'highlight', sublinhado: 'underline', underline: 'underline' }

// cor → [marca-texto, tinta no tema claro, tinta no tema escuro]: cores tradicionais de canetas
const PENS = {
  amarelo: ['#FFE600', '#B45309', '#FACC15'], yellow: null,
  rosa: ['#FF6FB5', '#DB2777', '#F472B6'], pink: null,
  verde: ['#7CE03A', '#15803D', '#4ADE80'], green: null,
  azul: ['#4DB8FF', '#1D4ED8', '#60A5FA'], blue: null,
  laranja: ['#FFA33A', '#EA580C', '#FB923C'], orange: null,
  roxo: ['#C084FC', '#7E22CE', '#C084FC'], purple: null,
  vermelho: ['#FF5C5C', '#DC2626', '#F87171'], red: null,
  preto: ['#9CA3AF', '#111827', '#E5E7EB'], black: null,
}
const ALIAS = { yellow: 'amarelo', pink: 'rosa', green: 'verde', blue: 'azul', orange: 'laranja', purple: 'roxo', red: 'vermelho', black: 'preto' }
export const HL_COLORS = Object.fromEntries(Object.keys(PENS).map((k) => [k, true]))
// Também vale cor em hexadecimal: `{marca #e11d48}`
export const HEX = /^#[0-9a-f]{6}$/i

// "marca azul" ou "sublinhado #e11d48" → { type: 'highlight', color: 'azul' }; null se algum termo for desconhecido
export function parseSpec(spec) {
  let type = null
  let color = ''
  for (const w of spec.toLowerCase().split(/[\s,]+/).filter(Boolean)) {
    if (HL_TYPES[w]) type = HL_TYPES[w]
    else if (HL_COLORS[w] || HEX.test(w)) color = w
    else return null
  }
  return type ? { type, color } : null
}

// Cor final (hex) de um destaque; `dark` = tema escuro (a tinta clareia para continuar legível)
export function penColor(type, name, dark) {
  if (HEX.test(name)) return name
  const key = ALIAS[name] ?? name ?? ''
  const pen = PENS[key] ?? PENS[type === 'highlight' ? 'amarelo' : 'azul']
  return type === 'highlight' ? pen[0] : pen[dark ? 2 : 1]
}
