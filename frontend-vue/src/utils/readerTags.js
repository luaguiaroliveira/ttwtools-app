// Etiquetas de um token na coluna "Colorir por" do Leitor.
// BiberPlus e MFTE guardam VÁRIAS tags por token (ex.: ["PIN", "TO", "PREP"]);
// UPOS e XPOS guardam um valor só. O Leitor precisa considerar todas, senão
// uma tag secundária (como "TO") some da lista e não é marcada no texto.

export function tokenTags(tok, colorBy) {
  if (!tok) return []
  if (colorBy === 'upos') return tok.upos ? [tok.upos] : []
  if (colorBy === 'xpos') return tok.xpos ? [tok.xpos] : []
  return Array.isArray(tok.tags) ? tok.tags : []
}

export function tokenLabel(tok, colorBy) {
  return tokenTags(tok, colorBy)[0] ?? null
}

export function chosenTag(tok, colorBy, chosen) {
  return tokenTags(tok, colorBy).find((c) => chosen.has(c)) ?? null
}
