// Exportar tabelas (CSV, TXT) e gráficos (SVG, PNG) pelo navegador (ou, na casca Tauri, por diálogo de salvar).
import { inShell, saveAs } from '../api/shell.js'

export function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
  if (inShell()) { saveAs(filename, blob).catch((err) => console.error('salvar:', err)); return }
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : Array.isArray(v) ? v.join('|') : String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** @param {Array<Object>} rows @param {string[]} [columns] */
export function tableToCsv(rows, columns) {
  const cols = columns ?? Object.keys(rows[0] ?? {})
  return [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n'
}

export function tableToTxt(rows, columns) {
  const cols = columns ?? Object.keys(rows[0] ?? {})
  const cells = rows.map((r) => cols.map((c) => (r[c] === null || r[c] === undefined ? '' : String(r[c]))))
  const w = cols.map((c, i) => Math.max(c.length, ...cells.map((row) => row[i].length)))
  const line = (vals) => vals.map((v, i) => v.padEnd(w[i])).join('  ').trimEnd()
  return [line(cols), line(w.map((n) => '-'.repeat(n))), ...cells.map(line)].join('\n') + '\n'
}

function svgString(svg) {
  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  // cores do tema (CSS) viram atributos, para o arquivo ficar igual à tela
  const src = svg.querySelectorAll('*')
  clone.querySelectorAll('*').forEach((el, i) => {
    const cs = getComputedStyle(src[i])
    if (cs.fill && cs.fill !== 'none') el.setAttribute('fill', cs.fill)
    if (cs.stroke && cs.stroke !== 'none') el.setAttribute('stroke', cs.stroke)
    if (el.tagName === 'text') el.setAttribute('font-size', cs.fontSize)
  })
  return new XMLSerializer().serializeToString(clone)
}

export function exportSvg(svg, filename) { download(filename, svgString(svg), 'image/svg+xml') }

export function exportPng(svg, filename, scale = 2) {
  const vb = svg.viewBox.baseVal
  const w = (vb?.width || svg.clientWidth) * scale
  const h = (vb?.height || svg.clientHeight) * scale
  const img = new Image()
  img.onload = () => {
    const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h })
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    canvas.toBlob((blob) => download(filename, blob, 'image/png'))
  }
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString(svg))
}
