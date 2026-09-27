// Markdown mínimo dos tópicos de ajuda: ## títulos, parágrafos, **negrito**, *itálico*,
// `código`, listas "- " e blocos indentados com 4 espaços. O HTML de entrada é escapado.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/`(.+?)`/g, '<code>$1</code>')

export function markdown(src) {
  const out = []
  let list = false
  let para = []
  let code = []
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = [] } }
  const flushList = () => { if (list) { out.push('</ul>'); list = false } }
  const flushCode = () => { if (code.length) { out.push(`<pre tabindex="0"><code>${esc(code.join("\n"))}</code></pre>`); code = [] } }
  for (const line of src.split('\n')) {
    if (/^ {4}\S/.test(line)) { flushPara(); flushList(); code.push(line.slice(4)); continue }
    flushCode()
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) { flushPara(); flushList(); const n = Math.min(6, h[1].length + 1); out.push(`<h${n}>${inline(h[2])}</h${n}>`); continue }
    const li = line.match(/^\s*[-*]\s+(.*)$/)
    if (li) { flushPara(); if (!list) { out.push('<ul>'); list = true } out.push(`<li>${inline(li[1])}</li>`); continue }
    if (!line.trim()) { flushPara(); flushList(); continue }
    para.push(line.trim())
  }
  flushPara(); flushList(); flushCode()
  return out.join('\n')
}
