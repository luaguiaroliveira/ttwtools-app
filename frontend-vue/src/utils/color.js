// Conversões de cor (hex ↔ HSL/RGB) para o seletor de cores.
export const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v)
export function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255] }
export const rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2
  let h = 0
  if (d) {
    h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
    h = (h * 60 + 360) % 360
  }
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0
  return [h, s, l]
}
export function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}
export const hexToHsl = (hex) => rgbToHsl(...hexToRgb(hex))
export const hslToHex = (h, s, l) => rgbToHex(...hslToRgb(h, s, l))
