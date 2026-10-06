// Registro de temas: ÚNICA fonte dos tokens de cada tema (cores, fontes, formas, botões).
// Cada tema vira variáveis CSS (themeVars) aplicadas no <html> ou num cartão de pré-visualização.
// Contrastes conferidos por src/test/themes.test.js (texto ≥4,5:1; borda de campo e preenchimento ≥3:1).
//
// Campos: dark; b1/b2/b3 fundos (página, painel, divisória); tx texto; mu texto secundário;
// pr preenchimento do botão primário e pc texto sobre ele; ink cor primária usada como TEXTO/link;
// se/sc secundária e seu texto; bd borda de campos; font/display/mono fontes (ver FONTS);
// box/field/sel raios (cartão/campo/seletor); bw largura da borda; btn estilo de botão (ver BUTTON_STYLES);
// sh cor da sombra "dura" dos botões; shadow sombra dos cartões.

export const FONTS = {
  inter: '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
  manrope: '"Manrope Variable", ui-sans-serif, system-ui, sans-serif',
  jakarta: '"Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif',
  dmsans: '"DM Sans Variable", ui-sans-serif, system-ui, sans-serif',
  grotesk: '"Space Grotesk Variable", ui-sans-serif, system-ui, sans-serif',
  sora: '"Sora Variable", ui-sans-serif, system-ui, sans-serif',
  outfit: '"Outfit Variable", ui-sans-serif, system-ui, sans-serif',
  lexend: '"Lexend Variable", ui-sans-serif, system-ui, sans-serif',
  fraunces: '"Fraunces Variable", Georgia, "Times New Roman", serif',
  source: '"Source Serif 4 Variable", Georgia, "Times New Roman", serif',
  jetbrains: '"JetBrains Mono Variable", ui-monospace, Menlo, Consolas, monospace',
}

// Estilos de botão (CSS em style.css, por [data-btn]): solid, soft, outline, pill, brutal, gradient, raised, glow
export const BUTTON_STYLES = ['solid', 'soft', 'outline', 'pill', 'brutal', 'gradient', 'raised', 'glow']

const LIGHT_STATUS = {
  info: ['#2F5F8F', '#FFFFFF'], success: ['#1F7A45', '#FFFFFF'], warning: ['#8A5A00', '#FFFFFF'], error: ['#B3261E', '#FFFFFF'],
}
const DARK_STATUS = {
  info: ['#78A9DC', '#0A1622'], success: ['#4CC180', '#0B1A11'], warning: ['#E8B03A', '#1A1203'], error: ['#FF7B72', '#1F0906'],
}

const SOFT = { box: '0.75rem', field: '0.5rem', sel: '0.5rem', bw: '1px' }
const SQUARE = { box: '0rem', field: '0rem', sel: '0rem', bw: '2px' }
const ROUND = { box: '1.25rem', field: '0.875rem', sel: '999px', bw: '1px' }

export const THEME_DEFS = [
  { id: 'aurora', name: 'Aurora', dark: false, b1: '#FFFFFF', b2: '#F5F5FB', b3: '#E4E4F1', tx: '#1B1B2F', mu: '#55557A',
    pr: '#5B4CF0', pc: '#FFFFFF', ink: '#4B3DD6', se: '#1B1B2F', sc: '#FFFFFF', bd: '#7A7AA0',
    font: 'jakarta', ...SOFT, btn: 'solid' },
  { id: 'oceano', name: 'Oceano', dark: false, b1: '#FBFEFE', b2: '#EDF7F7', b3: '#D5EAEA', tx: '#0E2A2E', mu: '#3F6468',
    pr: '#0B7A83', pc: '#FFFFFF', ink: '#0B6F77', se: '#0E2A2E', sc: '#FBFEFE', bd: '#5F8E92',
    font: 'manrope', ...SOFT, btn: 'soft' },
  { id: 'grafite', name: 'Grafite', dark: true, b1: '#16181D', b2: '#1E2128', b3: '#2C313B', tx: '#E6E9EF', mu: '#A2A9B6',
    pr: '#6EA8FF', pc: '#0A1630', ink: '#8DBBFF', se: '#2C313B', sc: '#E6E9EF', bd: '#6B7384',
    font: 'inter', ...SOFT, btn: 'solid' },
  { id: 'papel', name: 'Papel', dark: false, b1: '#FBF7F0', b2: '#F3ECDF', b3: '#E4D9C5', tx: '#2B2118', mu: '#6B5A48',
    pr: '#C2410C', pc: '#FFFFFF', ink: '#A63A0B', se: '#2B2118', sc: '#FBF7F0', bd: '#8F7C66',
    font: 'dmsans', display: 'fraunces', ...SOFT, btn: 'outline' },
  { id: 'neon', name: 'Neon', dark: true, b1: '#0B0B14', b2: '#131324', b3: '#232342', tx: '#EDEBFF', mu: '#A9A6D0',
    pr: '#FF3DCB', pc: '#1A0212', ink: '#FF6FD8', se: '#00E5FF', sc: '#00222A', bd: '#6F6CA3',
    font: 'grotesk', ...SOFT, btn: 'glow' },
  { id: 'floresta', name: 'Floresta', dark: true, b1: '#0F1A14', b2: '#16251C', b3: '#23382A', tx: '#E3F0E6', mu: '#9DB7A5',
    pr: '#56C67F', pc: '#06170C', ink: '#6FD697', se: '#2A4535', sc: '#E3F0E6', bd: '#5E8068',
    font: 'lexend', ...SOFT, btn: 'soft' },
  { id: 'brutal', name: 'Brutal', dark: false, b1: '#FFF9DB', b2: '#FFF1A8', b3: '#FFE066', tx: '#111111', mu: '#4A4630',
    pr: '#E63B6F', pc: '#111111', ink: '#B0124A', se: '#111111', sc: '#FFF9DB', bd: '#111111',
    font: 'grotesk', ...SQUARE, btn: 'brutal', sh: '#111111' },
  { id: 'lavanda', name: 'Lavanda', dark: false, b1: '#FDFBFF', b2: '#F3EEFB', b3: '#E3D9F5', tx: '#2A1F3D', mu: '#66587F',
    pr: '#7C3AED', pc: '#FFFFFF', ink: '#6D28D9', se: '#2A1F3D', sc: '#FDFBFF', bd: '#8272A0',
    font: 'outfit', ...ROUND, btn: 'pill' },
  { id: 'areia', name: 'Areia', dark: false, b1: '#FAF6EE', b2: '#F0E8D8', b3: '#DDD0B8', tx: '#2E2A22', mu: '#62594A',
    pr: '#B7791F', pc: '#1F1503', ink: '#8A5A0F', se: '#2E2A22', sc: '#FAF6EE', bd: '#85785E',
    font: 'dmsans', ...SOFT, btn: 'raised' },
  { id: 'meia-noite', name: 'Meia-noite', dark: true, b1: '#0A1024', b2: '#101A38', b3: '#1C2A52', tx: '#E8EEFF', mu: '#A3B1D6',
    pr: '#4F8CFF', pc: '#04102E', ink: '#7FAAFF', se: '#1C2A52', sc: '#E8EEFF', bd: '#6479AB',
    font: 'sora', ...SOFT, btn: 'gradient' },
  { id: 'rosa', name: 'Rosa', dark: false, b1: '#FFFBFC', b2: '#FDEFF3', b3: '#F7D9E3', tx: '#3A1624', mu: '#7A4A5E',
    pr: '#D6336C', pc: '#FFFFFF', ink: '#B8255A', se: '#3A1624', sc: '#FFFBFC', bd: '#9A6F82',
    font: 'outfit', ...ROUND, btn: 'gradient' },
  { id: 'terminal', name: 'Terminal', dark: true, b1: '#050805', b2: '#0B120B', b3: '#152015', tx: '#B8FFB8', mu: '#7FCB7F',
    pr: '#39FF14', pc: '#021002', ink: '#5CFF3D', se: '#152015', sc: '#B8FFB8', bd: '#3E8F3E',
    font: 'jetbrains', display: 'jetbrains', box: '0rem', field: '0rem', sel: '0rem', bw: '1px', btn: 'outline' },
  { id: 'nordico', name: 'Nórdico', dark: false, b1: '#F7F9FB', b2: '#EBEFF4', b3: '#D9E0E9', tx: '#1F2933', mu: '#52606D',
    pr: '#3E6FB0', pc: '#FFFFFF', ink: '#2F5F9F', se: '#1F2933', sc: '#F7F9FB', bd: '#6F7C89',
    font: 'inter', box: '0.5rem', field: '0.375rem', sel: '0.375rem', bw: '1px', btn: 'solid' },
  { id: 'vinho', name: 'Vinho', dark: true, b1: '#1A0F14', b2: '#25151C', b3: '#3A2230', tx: '#F3E6EA', mu: '#BFA0AB',
    pr: '#E0627F', pc: '#230610', ink: '#F08AA3', se: '#3A2230', sc: '#F3E6EA', bd: '#8A6574',
    font: 'dmsans', display: 'fraunces', ...SOFT, btn: 'solid' },
  { id: 'limao', name: 'Limão', dark: false, b1: '#FFFFFF', b2: '#F6F9E8', b3: '#E5EDC2', tx: '#1B2208', mu: '#4F5B2A',
    pr: '#4D7C0F', pc: '#FFFFFF', ink: '#3F6B0A', se: '#1B2208', sc: '#F6F9E8', bd: '#76874A',
    font: 'lexend', ...ROUND, btn: 'pill' },
  { id: 'ardosia', name: 'Ardósia', dark: true, b1: '#11191C', b2: '#182328', b3: '#263840', tx: '#E4EEF0', mu: '#9DB2B8',
    pr: '#2DD4BF', pc: '#03201C', ink: '#5FE0CF', se: '#263840', sc: '#E4EEF0', bd: '#5E7F88',
    font: 'manrope', ...SOFT, btn: 'raised' },
  { id: 'coral', name: 'Coral', dark: false, b1: '#FFFBF8', b2: '#FFF0E8', b3: '#FADCCB', tx: '#3A1F14', mu: '#7A5240',
    pr: '#D63A24', pc: '#FFFFFF', ink: '#B8341F', se: '#3A1F14', sc: '#FFFBF8', bd: '#9E7868',
    font: 'sora', ...SOFT, btn: 'soft' },
  { id: 'cafe', name: 'Café', dark: true, b1: '#1C1410', b2: '#271C16', b3: '#3B2B22', tx: '#F1E6DA', mu: '#BCA796',
    pr: '#D9A066', pc: '#1C1008', ink: '#E5B887', se: '#3B2B22', sc: '#F1E6DA', bd: '#86705F',
    font: 'source', display: 'fraunces', ...SOFT, btn: 'raised' },
  { id: 'synth', name: 'Synthwave', dark: true, b1: '#1B1033', b2: '#261748', b3: '#3A2566', tx: '#F6EEFF', mu: '#BDA8E0',
    pr: '#FF71CE', pc: '#20052F', ink: '#FF8FDA', se: '#01CDFE', sc: '#07182A', bd: '#8E73C2',
    font: 'grotesk', ...SQUARE, btn: 'brutal', sh: '#01CDFE' },
  { id: 'tinta', name: 'Tinta', dark: false, b1: '#FFFFFF', b2: '#F4F4F4', b3: '#E0E0E0', tx: '#111111', mu: '#555555',
    pr: '#111111', pc: '#FFFFFF', ink: '#111111', se: '#E0E0E0', sc: '#111111', bd: '#767676',
    font: 'inter', box: '0.25rem', field: '0.25rem', sel: '0.25rem', bw: '1px', btn: 'solid' },
]

function rgb(hex) {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ')
}

// Variáveis CSS de um tema (nomes do DaisyUI e tokens --ttw-*)
export function themeVars(d) {
  const st = d.dark ? DARK_STATUS : LIGHT_STATUS
  const chart = d.dark ? d.pr : d.ink
  const v = {
    'color-scheme': d.dark ? 'dark' : 'light',
    '--color-base-100': d.b1, '--color-base-200': d.b2, '--color-base-300': d.b3, '--color-base-content': d.tx,
    '--color-primary': d.pr, '--color-primary-content': d.pc,
    '--color-secondary': d.se, '--color-secondary-content': d.sc,
    '--color-accent': d.se, '--color-accent-content': d.sc,
    '--color-neutral': d.tx, '--color-neutral-content': d.b1,
    '--radius-box': d.box, '--radius-field': d.field, '--radius-selector': d.sel, '--border': d.bw, '--depth': '0', '--noise': '0',
    '--ttw-orange-text': d.ink, '--ttw-border-strong': d.bd, '--ttw-text-muted': d.mu,
    '--font-sans': FONTS[d.font],
    '--ttw-font-display': FONTS[d.display ?? d.font],
    '--ttw-btn-shadow': d.sh ?? d.tx,
    '--chart-1': chart, '--chart-pos': rgb(chart),
  }
  for (const [k, [fill, content]] of Object.entries(st)) {
    v[`--color-${k}`] = fill
    v[`--color-${k}-content`] = content
  }
  if (d.mono || d.font === 'jetbrains') v['--font-mono'] = FONTS.jetbrains
  return v
}
