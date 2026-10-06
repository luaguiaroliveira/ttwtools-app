// Markdown mínimo dos tópicos de ajuda: ## títulos, parágrafos, **negrito**, *itálico*,
// `código`, listas "- " e "1. ", citações "> ", tabelas "| a | b |", linha "---", blocos recolhíveis
// (":::details Título" ... ":::"), fórmulas KaTeX ($tex$ no texto; $$tex$$ sozinho na linha),
// imagens "![alt](url)", destaques `[texto]{circulo azul}` e `==texto==` (utils/highlights.js) e
// blocos indentados com 4 espaços. O HTML de entrada é escapado.
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { parseSpec } from './highlights.js'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const attr = (s) => esc(s).replace(/"/g, '&quot;')
const tex = (src, display) => katex.renderToString(src, { displayMode: display, throwOnError: false, strict: 'ignore' })
// Trechos `código` e fórmulas $tex$ saem antes do escape e do negrito/itálico e voltam no fim.
// Destaque: o <span> leva tipo e cor; quem desenha (rough-notation) é a tela. Especificação inválida fica como texto.
const span = (all, text, spec) => (spec ? `<span class="hl" data-hl="${spec.type}" data-hl-color="${spec.color}">${text}</span>` : all)
const inline = (s) => {
  const keep = []
  const hold = (html) => `\u0000${keep.push(html) - 1}\u0000`
  const out = s
    .replace(/`(.+?)`/g, (_, c) => hold(`<code>${esc(c)}</code>`))
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => hold(`<img src="${attr(src)}" alt="${attr(alt)}" loading="lazy">`))
    .replace(/\$([^\s$](?:[^$\n]*?[^\s$])?)\$(?!\d)/g, (_, m) => hold(tex(m, false)))
  return esc(out)
    .replace(/\[([^\[\]]+?)\]\{([^{}]*)\}/g, (all, text, spec) => span(all, text, parseSpec(spec)))
    .replace(/==([^=\s](?:[^=]*?[^=\s])?)==/g, (all, text) => span(all, text, parseSpec('marca')))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\u0000(\d+)\u0000/g, (_, i) => keep[i])
}

export function markdown(src) {
  const out = []
  let list = false
  let ordered = false
  let quote = []
  let table = []
  let det = null
  let para = []
  let code = []
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = [] } }
  const flushList = () => { if (list) { out.push(ordered ? '</ol>' : '</ul>'); list = false } }
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote>${markdown(quote.join('\n'))}</blockquote>`); quote = [] } }
  // Sem lookbehind (o WebKit do macOS 12 não aceita `(?<!...)`): o pipe escapado vira um
  // marcador antes de dividir e volta a `|` em cada célula.
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').replace(/\\\|/g, '\u0000').split('|').map((c) => c.trim().replace(/\u0000/g, '|'))
  const flushTable = () => {
    if (!table.length) return
    const [head, , ...rows] = table
    out.push('<table><thead><tr>' + cells(head).map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>'
      + rows.map((r) => '<tr>' + cells(r).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>')
    table = []
  }
  const flushCode = () => { if (code.length) { out.push(`<pre tabindex="0"><code>${esc(code.join("\n"))}</code></pre>`); code = [] } }
  for (const line of src.split('\n')) {
    if (det) {
      if (line.trim() === ':::') { out.push(`<details><summary><strong>${inline(det.title)}</strong></summary>${markdown(det.lines.join('\n'))}</details>`); det = null } else det.lines.push(line)
      continue
    }
    const d = line.match(/^:::details\s+(.*)$/)
    if (d) { flushPara(); flushList(); flushQuote(); flushTable(); det = { title: d[1], lines: [] }; continue }
    if (/^\|/.test(line)) { flushPara(); flushList(); flushQuote(); table.push(line); continue }
    flushTable()
    const bq = line.match(/^>\s?(.*)$/)
    if (bq) { flushPara(); flushList(); quote.push(bq[1]); continue }
    flushQuote()
    const dm = line.match(/^\$\$(.+)\$\$\s*$/)
    if (dm) { flushPara(); flushList(); out.push(`<div class="math-block">${tex(dm[1], true)}</div>`); continue }
    if (/^---+\s*$/.test(line)) { flushPara(); flushList(); out.push('<hr>'); continue }
    if (/^ {4}\S/.test(line)) { flushPara(); flushList(); code.push(line.slice(4)); continue }
    flushCode()
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) { flushPara(); flushList(); const n = Math.min(6, h[1].length + 1); out.push(`<h${n}>${inline(h[2])}</h${n}>`); continue }
    const li = line.match(/^\s*([-*]|\d+[.)])\s+(.*)$/)
    if (li) {
      flushPara()
      const ol = /\d/.test(li[1])
      if (list && ol !== ordered) flushList()
      if (!list) { out.push(ol ? '<ol>' : '<ul>'); list = true; ordered = ol }
      out.push(`<li>${inline(li[2])}</li>`); continue
    }
    if (!line.trim()) { flushPara(); flushList(); continue }
    para.push(line.trim())
  }
  flushPara(); flushList(); flushQuote(); flushTable(); flushCode()
  return out.join('\n')
}
