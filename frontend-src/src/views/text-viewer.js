/**
 * views/text-viewer.js — Full-text viewer with per-token CSS highlights.
 * Pagination and print layout handled by Paged.js.
 *
 * Entry points:
 *   initTextViewer()                        — call once at startup
 *   showTextViewer(files, index, activeTag) — navigate to this view
 */

import { Previewer }  from 'pagedjs'
import { api }       from '../api.js'
import { showView }  from '../ui.js'
import { state }     from '../state.js'

// ---------------------------------------------------------------------------
// Colour palettes  (index 0 = active feature — always orange)
// ---------------------------------------------------------------------------
const PALETTE_FILL   = [
  'rgba(224,123,57,0.35)', 'rgba(91,156,246,0.35)', 'rgba(62,207,142,0.35)',
  'rgba(224,85,85,0.35)',  'rgba(155,93,229,0.35)', 'rgba(255,202,58,0.35)',
  'rgba(26,157,200,0.35)', 'rgba(82,183,136,0.35)',
]
const PALETTE_STROKE = [
  '#e07b39', '#5b9cf6', '#3ecf8e', '#e05555', '#9b5de5', '#ffca3a', '#1a97c8', '#52b788',
]
const N_SLOTS = PALETTE_FILL.length          // 8
const ANN_TYPES = [
  ['highlight', 'highlight'],
  ['underline', 'underline'],
  ['box',       'box'],
  ['circle',    'circle'],
]

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let _annotationStyles = {}  // tagName → <style> element in document.head
let _tagColorIdx      = {}  // tagName → palette index (0–7)
let _tagTypes         = {}  // tagName → annotation type (persists across files)
let _tagCustomColors  = {}  // tagName → { fill: string, stroke: string } (user override)
let _paletteNext      = 0
let _lastLines        = []  // cached merged lines
let _lastFilename     = ''  // cached filename for footer
let _legendVisible    = true
let _pagedStyles      = []  // <style> elements injected by Paged.js — removed on re-render

// ---------------------------------------------------------------------------
// Init (once)
// ---------------------------------------------------------------------------
export function initTextViewer() {
  document.getElementById('btn-tv-back')?.addEventListener('click', () => {
    showView('feature-detail')
  })

  document.getElementById('btn-tv-prev')?.addEventListener('click', () => {
    if (state.tvIndex > 0) { state.tvIndex--; _loadFile() }
  })

  document.getElementById('btn-tv-next')?.addEventListener('click', () => {
    if (state.tvIndex < state.tvFiles.length - 1) { state.tvIndex++; _loadFile() }
  })

  document.getElementById('tv-font-slider')?.addEventListener('input', async e => {
    const v = e.target.value
    document.getElementById('tv-font-val').textContent = `${v}px`
    if (!_lastLines.length) return
    await _renderText(_lastLines, _lastFilename)
    _updateLegend()
  })

  // Print / Save PDF
  document.getElementById('btn-tv-print')?.addEventListener('click', () => {
    window.print()
  })

  // Legend shown by default; toggling via button affects a module-level flag
  // (the actual #tv-legend element is created dynamically per render)
  const legendBtn = document.getElementById('btn-tv-legend')
  legendBtn?.classList.add('active')

  legendBtn?.addEventListener('click', () => {
    _legendVisible = !_legendVisible
    legendBtn.classList.toggle('active', _legendVisible)
    const leg = document.getElementById('tv-legend')
    if (leg) leg.hidden = !_legendVisible
  })

  // Hidden color-picker input — opened programmatically when a swatch is clicked
  const colorPicker = document.createElement('input')
  colorPicker.type = 'color'
  colorPicker.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px'
  document.body.appendChild(colorPicker)

  let _pickerTag = null
  // Use capture phase on the tag-list so we intercept before the label fires the checkbox
  document.getElementById('tv-tag-list').addEventListener('click', e => {
    const swatch = e.target.closest('.tv-tag-swatch')
    if (!swatch) return
    // Prevent the parent <label> from toggling the checkbox
    e.preventDefault()
    e.stopPropagation()
    const row = swatch.closest('.tv-tag-row')
    const cb  = row?.querySelector('input.tv-tag-cb')
    if (!cb || cb.disabled) return
    _pickerTag = cb.dataset.tag
    // Position the hidden input near the mouse so the picker opens close to it
    colorPicker.style.left = (e.clientX - 160) + 'px'
    colorPicker.style.top  = e.clientY + 'px'
    colorPicker.value = _hexFromColor(_getStroke(_pickerTag))
    colorPicker.click()
  }, true)

  colorPicker.addEventListener('input', () => {
    if (!_pickerTag) return
    const hex    = colorPicker.value
    const fill   = hex + '59'
    const stroke = hex
    _tagCustomColors[_pickerTag] = { fill, stroke }
    const cb = document.querySelector(`#tv-tag-list input.tv-tag-cb[data-tag="${_attr(_pickerTag)}"]`)
    const swatchEl = cb?.closest('.tv-tag-row')?.querySelector('.tv-tag-swatch')
    if (swatchEl) swatchEl.style.background = stroke
    if (cb?.checked) { _removeTag(_pickerTag); _applyTag(_pickerTag) }
    _updateLegend()
  })

  // Token tooltip (delegated on document — paper content changes per file)
  const tooltip = document.getElementById('tv-tooltip')
  document.addEventListener('mouseover', e => {
    const span = e.target.closest('#tv-pages span[data-tags]')
    if (!span || !tooltip) return
    const tags = (span.dataset.tags || '').split(/\s+/).filter(Boolean)
    if (!tags.length) return
    const lines = tags.map(t => {
      const def = state.tagDefs[t]
      return def ? `<b>${t}</b>: ${def}` : `<b>${t}</b>`
    })
    tooltip.innerHTML = lines.join('<br>')
    tooltip.hidden = false
    _positionTooltip(tooltip, e)
  })
  document.addEventListener('mousemove', e => {
    if (!tooltip || tooltip.hidden) return
    if (!e.target.closest('#tv-pages span[data-tags]')) {
      tooltip.hidden = true
      return
    }
    _positionTooltip(tooltip, e)
  })
  document.addEventListener('mouseout', e => {
    if (!e.target.closest('#tv-pages span[data-tags]') && tooltip) {
      tooltip.hidden = true
    }
  })
}

function _positionTooltip(tooltip, e) {
  const pad   = 12
  const tw    = tooltip.offsetWidth  || 220
  const th    = tooltip.offsetHeight || 40
  let   left  = e.clientX + pad
  let   top   = e.clientY + pad
  if (left + tw > window.innerWidth  - pad) left = e.clientX - tw - pad
  if (top  + th > window.innerHeight - pad) top  = e.clientY - th - pad
  tooltip.style.left = `${left}px`
  tooltip.style.top  = `${top}px`
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------
export function showTextViewer(files, index, activeTag) {
  state.tvFiles   = files
  state.tvIndex   = index
  state.tvFeature = activeTag
  showView('text-viewer')
  _loadFile()
}

// ---------------------------------------------------------------------------
// Load + render a file
// ---------------------------------------------------------------------------
async function _loadFile() {
  const file = state.tvFiles[state.tvIndex]
  if (!file) return

  _clearAnnotations()
  _tagColorIdx = {}
  _paletteNext = 0
  // _tagTypes intentionally NOT reset (user's choices persist across navigation)

  document.getElementById('tv-filename').textContent = file.filename
  const corpEl = document.getElementById('tv-corpus-label')
  corpEl.textContent = file.corpus
  corpEl.className   = `tv-corpus ${file.corpus === state.kfaC1 ? 'fd-corpus1' : 'fd-corpus2'}`

  document.getElementById('tv-file-label').textContent =
    `${state.tvIndex + 1} / ${state.tvFiles.length}`

  const btnPrev = document.getElementById('btn-tv-prev')
  const btnNext = document.getElementById('btn-tv-next')
  if (btnPrev) btnPrev.disabled = (state.tvIndex === 0)
  if (btnNext) btnNext.disabled = (state.tvIndex >= state.tvFiles.length - 1)

  document.getElementById('tv-pages').innerHTML =
    '<div style="padding:2rem;color:#aaa">Carregando…</div>'
  document.getElementById('tv-tag-list').innerHTML = ''

  try {
    const { tokens, raw_text } = await api.corpus.taggedTokens(
      file.corpus,
      file.filename,
      state.kfaTagger || undefined,
    )
    const lines = _mergeLines(raw_text, tokens)
    _lastLines    = lines
    _lastFilename = file.filename
    await _renderText(lines, file.filename)
    _renderTagSidebar(tokens)

    // Pages are painted (renderText awaited a RAF). Apply annotations now.
    if (state.tvFeature) {
      const tag = state.tvFeature
      const cb  = document.querySelector(
        `#tv-tag-list input.tv-tag-cb[data-tag="${CSS.escape(tag)}"]`
      )
      if (cb && !cb.disabled) {
        cb.checked = true
        _applyTag(tag)
        _updateLegend()
      }
    }
  } catch (err) {
    document.getElementById('tv-pages').innerHTML =
      `<div style="padding:2rem;color:#e05555">Erro: ${err.message}</div>`
  }
}

// ---------------------------------------------------------------------------
// Merge raw text line-structure with TSV token tags
//
// Strategy: for each whitespace-delimited word in the raw text, consume TSV
// tokens whose concatenation equals the word.  The Biber tagger only splits on
// punctuation/boundary chars — it never inserts or removes characters — so the
// concatenated tokens always reconstruct the original word exactly.
// ---------------------------------------------------------------------------
function _mergeLines(rawText, tokens) {
  if (_hasUsableOffsets(tokens) && rawText) {
    return _mergeLinesByOffsets(rawText, tokens)
  }

  // Queue of non-blank tokens from TSV
  const queue = tokens.filter(t => t.word && t.word.trim())
  let qi = 0

  if (!rawText) {
    // Fallback: split tokens into lines of ~15 words so pagination works
    const WORDS_PER_LINE = 15
    const result = []
    for (let i = 0; i < queue.length; i += WORDS_PER_LINE) {
      result.push(queue.slice(i, i + WORDS_PER_LINE).map(t => ({ word: t.word, tags: t.tags })))
    }
    return result.length ? result : [[]]
  }

  return rawText.split('\n').map(line => {
    const words = line.match(/\S+/g) || []
    if (!words.length) return []   // blank line → paragraph break marker

    return words.map(word => {
      const collectedTags = []
      let built = ''

      // Keep consuming tokens while their concatenation is still a prefix of word
      while (qi < queue.length && built.length < word.length) {
        const tok     = queue[qi]
        const prospect = built + tok.word

        if (word.toLowerCase().startsWith(prospect.toLowerCase())) {
          // prospect is still a prefix of word (or exact match) → consume
          built = prospect
          collectedTags.push(...tok.tags)
          qi++
        } else if (prospect.toLowerCase().startsWith(word.toLowerCase())) {
          // token overshoots word — consume anyway and stop
          // (handles edge cases like numbers with internal separators)
          collectedTags.push(...tok.tags)
          qi++
          break
        } else {
          // Hard mismatch: skip this token and try to recover
          qi++
          break
        }
      }

      return { word, tags: [...new Set(collectedTags)] }
    })
  })
}

function _hasUsableOffsets(tokens) {
  return tokens.some(t =>
    Number.isInteger(t.start_char) &&
    Number.isInteger(t.end_char) &&
    t.start_char >= 0 &&
    t.end_char > t.start_char,
  )
}

function _mergeLinesByOffsets(rawText, tokens) {
  const queue = tokens
    .filter(t =>
      t.word &&
      t.word.trim() &&
      Number.isInteger(t.start_char) &&
      Number.isInteger(t.end_char) &&
      t.start_char >= 0 &&
      t.end_char > t.start_char,
    )
    .sort((a, b) => a.start_char - b.start_char)

  const lines = []
  const rawLines = rawText.split('\n')
  let tokenIdx = 0
  let globalPos = 0

  for (const line of rawLines) {
    const words = []
    const re = /\S+/g
    let m

    while ((m = re.exec(line)) !== null) {
      const word = m[0]
      const wordStart = globalPos + m.index
      const wordEnd = wordStart + word.length
      const collectedTags = []

      while (tokenIdx < queue.length && queue[tokenIdx].end_char <= wordStart) {
        tokenIdx++
      }

      let scan = tokenIdx
      while (scan < queue.length && queue[scan].start_char < wordEnd) {
        const tok = queue[scan]
        if (tok.end_char > wordStart && Array.isArray(tok.tags)) {
          collectedTags.push(...tok.tags)
        }
        scan++
      }

      words.push({ word, tags: [...new Set(collectedTags)] })
    }

    lines.push(words)
    globalPos += line.length + 1
  }

  return lines
}

// ---------------------------------------------------------------------------
// Render — build HTML flow, run Paged.js Previewer
// ---------------------------------------------------------------------------
const PUNCT_BEFORE = new Set(['.', ',', '!', '?', ';', ':', ')', ']', '}', "'", '\u2019', '\u201d', '...', '\u2026'])

function _escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function _renderText(lines, filename) {
  const pagesEl = document.getElementById('tv-pages')
  if (!pagesEl) return

  // Remove styles injected by the previous Paged.js run
  _pagedStyles.forEach(el => el.remove())
  _pagedStyles = []

  const sliderEl = document.getElementById('tv-font-slider')
  const fontSize = sliderEl ? `${sliderEl.value}px` : '14px'

  // ── Build HTML content ───────────────────────────────────────────────────
  let html = `<div class="tv-text" style="font-size:${fontSize}">`

  lines.forEach(words => {
    if (!words.length) {
      html += '<div class="tv-blank-line"> </div>'
      return
    }
    html += '<div class="tv-line">'
    words.forEach((tok, wi) => {
      if (wi > 0 && !PUNCT_BEFORE.has(tok.word)) html += '<span class="tv-sp"> </span>'
      const esc = _escHtml(tok.word)
      if (tok.tags.length) {
        const tagsAttr = tok.tags.map(_escHtml).join(' ')
        html += `<span class="tv-token tagged" data-tags="${tagsAttr}">${esc}</span>`
      } else {
        html += `<span class="tv-token">${esc}</span>`
      }
    })
    html += '</div>'
  })

  html += '<div id="tv-legend" class="tv-legend"></div>'
  html += '</div>'

  // ── Paged.js @page CSS — filename baked in ───────────────────────────────
  const safeFilename = (filename || '').replace(/[\\"\n\r]/g, '')

  const pagedCSS = `
@page {
  size: A4;
  margin: 20mm 22mm 28mm;

  @bottom-center {
    content: counter(page) " / " counter(pages);
    font-size: 9pt;
    color: #555;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  @bottom-left {
    content: "TTWTOOLS \\2013  ${safeFilename}";
    font-size: 7.5pt;
    color: #888;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
}

body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }

.tv-text      { line-height: 1.85; color: #111; word-break: break-word; }
.tv-line      { display: block; white-space: pre-wrap; }
.tv-blank-line { height: 0.75em; display: block; }
.tv-token     { font-family: inherit; }
.tv-sp        { white-space: pre; }

.tv-legend {
  margin-top: 2em;
  padding-top: 1em;
  border-top: 0.5pt solid #ccc;
}
.tv-legend-title {
  font-size: 8pt; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: #555; margin-bottom: .5em;
}
.tv-legend-grid  { display: flex; flex-wrap: wrap; gap: .4em 1.2em; }
.tv-legend-item  { display: flex; align-items: baseline; gap: .4em; }
.tv-legend-sample { font-weight: 600; font-size: 8.5pt; }
.tv-legend-def   { color: #555; font-size: 8pt; }
`

  // Snapshot existing head <style> elements to detect what Paged.js injects
  const stylesBefore = new Set(document.head.querySelectorAll('style'))

  pagesEl.innerHTML = ''
  const previewer = new Previewer()
  await previewer.preview(html, [{ text: pagedCSS }], pagesEl)

  _pagedStyles = Array.from(document.head.querySelectorAll('style'))
    .filter(s => !stylesBefore.has(s))

  // Respect legend visibility flag after the new DOM is in place
  const leg = document.getElementById('tv-legend')
  if (leg) leg.hidden = !_legendVisible
}

// ---------------------------------------------------------------------------
// Tag sidebar — color swatch + type selector per tag
// ---------------------------------------------------------------------------
function _renderTagSidebar(tokens) {
  const list = document.getElementById('tv-tag-list')
  if (!list) return

  // Count occurrences in this file
  const counts = {}
  tokens.forEach(({ tags }) => tags.forEach(t => { counts[t] = (counts[t] || 0) + 1 }))

  // Union of KFA features + file-local tags
  const kfaTags = state.kfaData ? state.kfaData.results.map(r => r.Feature) : []
  const allTags = [...new Set([...kfaTags, ...Object.keys(counts)])]

  // Sort: non-zero descending, then zeros alpha
  allTags.sort((a, b) => {
    const ca = counts[a] || 0, cb = counts[b] || 0
    if (ca === 0 && cb === 0) return a.localeCompare(b)
    if (ca === 0) return 1; if (cb === 0) return -1
    return cb - ca
  })

  // Pre-assign palette indices in display order so swatches are stable
  _paletteNext = 0
  _tagColorIdx = {}
  allTags.forEach(tag => { if ((counts[tag] || 0) > 0) _getColorIdx(tag) })

  list.innerHTML = allTags.map(tag => {
    const count   = counts[tag] || 0
    const zero    = count === 0
    const title   = state.tagDefs[tag]
      ? ` title="${state.tagDefs[tag].replace(/"/g, "'")}"` : ''
    const swatch  = zero ? '#3a3f50' : _getStroke(tag)
    const curType = _getType(tag)
    const typeOpts = ANN_TYPES.map(([val, lbl]) =>
      `<option value="${val}"${val === curType ? ' selected' : ''}>${lbl}</option>`
    ).join('')

    return `<label class="tv-tag-row${zero ? ' inactive' : ''}"${title}>
      <input type="checkbox" class="tv-tag-cb" data-tag="${_attr(tag)}"${zero ? ' disabled' : ''}>
      <span class="tv-tag-swatch" style="background:${swatch}"></span>
      <span class="tv-tag-name">${tag}</span>
      ${!zero ? `<select class="tv-type-sel" data-tag="${_attr(tag)}">${typeOpts}</select>` : '<span class="tv-type-ph"></span>'}
      <span class="tv-tag-count${zero ? ' zero' : ''}">${count}</span>
    </label>`
  }).join('')

  // Checkbox events
  list.querySelectorAll('.tv-tag-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) _applyTag(cb.dataset.tag)
      else _removeTag(cb.dataset.tag)
      _updateLegend()
    })
  })

  // Type-selector events: re-apply annotation if currently active
  list.querySelectorAll('.tv-type-sel').forEach(sel => {
    sel.addEventListener('change', () => {
      _tagTypes[sel.dataset.tag] = sel.value
      // Update swatch color style (stroke vs fill)
      const swatch = sel.closest('.tv-tag-row')?.querySelector('.tv-tag-swatch')
      if (swatch) swatch.style.background = _getStroke(sel.dataset.tag)
      const cb = list.querySelector(`input[data-tag="${_attr(sel.dataset.tag)}"]`)
      if (cb?.checked) { _removeTag(sel.dataset.tag); _applyTag(sel.dataset.tag) }
      _updateLegend()
    })
  })
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------
function _getColorIdx(tagName) {
  if (tagName === state.tvFeature) return 0
  if (_tagColorIdx[tagName] === undefined) {
    // Slots 1..N_SLOTS-1, cycling (slot 0 reserved for tvFeature)
    _tagColorIdx[tagName] = (_paletteNext % (N_SLOTS - 1)) + 1
    _paletteNext++
  }
  return _tagColorIdx[tagName]
}

// Return fill/stroke honoring custom override
function _getFill(tagName) {
  return _tagCustomColors[tagName]?.fill   ?? PALETTE_FILL[_getColorIdx(tagName)]
}
function _getStroke(tagName) {
  return _tagCustomColors[tagName]?.stroke ?? PALETTE_STROKE[_getColorIdx(tagName)]
}

// Convert any colour string to a 6-digit hex for <input type="color">
function _hexFromColor(color) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color
  // Palette strokes are already 7-char hex — just in case
  const m = color.match(/^#([0-9a-f]{6})/i)
  return m ? '#' + m[1] : '#e07b39'
}

function _getType(tagName) {
  if (!_tagTypes[tagName]) {
    _tagTypes[tagName] = 'highlight'   // padrão sempre highlight
  }
  return _tagTypes[tagName]
}

// ---------------------------------------------------------------------------
// CSS-based annotations — injected into document.head, apply across all pages
// ---------------------------------------------------------------------------
function _annCSS(tagName) {
  const type   = _getType(tagName)
  const fill   = _getFill(tagName)
  const stroke = _getStroke(tagName)
  const sel    = `span.tv-token[data-tags~="${tagName.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`
  switch (type) {
    case 'highlight': return `${sel} { background:${fill}; border-radius:2px; padding:0 2px }`
    case 'underline': return `${sel} { border-bottom:2px solid ${stroke}; padding-bottom:1px }`
    case 'box':       return `${sel} { outline:1.5px solid ${stroke}; border-radius:2px; padding:0 2px }`
    case 'circle':    return `${sel} { outline:2px solid ${stroke}; border-radius:50%; padding:0 4px }`
    default:          return `${sel} { background:${fill}; border-radius:2px }`
  }
}

function _applyTag(tagName) {
  if (_annotationStyles[tagName]) return
  const styleEl = document.createElement('style')
  styleEl.textContent = _annCSS(tagName)
  document.head.appendChild(styleEl)
  _annotationStyles[tagName] = styleEl
}

function _removeTag(tagName) {
  _annotationStyles[tagName]?.remove()
  delete _annotationStyles[tagName]
}

function _clearAnnotations() {
  Object.values(_annotationStyles).forEach(el => el.remove())
  _annotationStyles = {}
}

// ---------------------------------------------------------------------------
// Legend (bottom of paper, updated on each checkbox/type change)
// ---------------------------------------------------------------------------
function _updateLegend() {
  const leg = document.getElementById('tv-legend')
  if (!leg) return

  // Collect currently active (checked) tags
  const active = Array.from(
    document.querySelectorAll('#tv-tag-list input.tv-tag-cb:checked')
  ).map(cb => cb.dataset.tag)

  if (!active.length) {
    leg.innerHTML = ''
    return
  }

  // Build one item per active tag
  const items = active.map(tag => {
    const type    = _getType(tag)
    const fill    = _getFill(tag)
    const stroke  = _getStroke(tag)
    const def     = state.tagDefs[tag] || ''

    // Sample span styled to echo the annotation type
    let sampleStyle = ''
    switch (type) {
      case 'highlight': sampleStyle = `background:${fill};border-radius:2px;padding:0 4px`; break
      case 'underline': sampleStyle = `border-bottom:2px solid ${stroke};padding-bottom:1px`; break
      case 'box':       sampleStyle = `outline:1.5px solid ${stroke};border-radius:2px;padding:0 3px`; break
      case 'circle':    sampleStyle = `outline:2px solid ${stroke};border-radius:50%;padding:0 4px`; break
      default:          sampleStyle = `background:${fill};padding:0 4px`
    }

    return `<div class="tv-legend-item">
      <span class="tv-legend-sample" style="${sampleStyle}">${tag}</span>
      ${def ? `<span class="tv-legend-def">${def}</span>` : ''}
    </div>`
  }).join('')

  leg.innerHTML =
    `<div class="tv-legend-title">Legenda</div>` +
    `<div class="tv-legend-grid">${items}</div>`
}

// ---------------------------------------------------------------------------
// Utility: safe HTML attribute value (Biber tags are [A-Z0-9_] in practice)
// ---------------------------------------------------------------------------
function _attr(name) {
  return name.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}
