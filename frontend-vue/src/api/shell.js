// Casca nativa (Tauri): diálogos de arquivo e gravação pela janela do aplicativo.
// Fora dela (navegador, pywebview) `inShell()` é falso e nada daqui é usado: valem as rotas
// /api/utils/pick-* e o download do navegador. Comandos em src-tauri/src/main.rs.

const core = () => globalThis.__TAURI__?.core

export const inShell = () => Boolean(core())

// Mesmas extensões de app/routes/utils.py (PROJECT_EXTS e FILE_KINDS)
export const PROJECT_EXTS = ['ttwa', 'ttwl', 'ttwal', 'ttwc', 'ttwcl', 'ttwt']
const FILE_KINDS = { project: PROJECT_EXTS, csv: ['csv', 'tsv', 'txt'] }

const answer = (path) => (path ? { path } : null)   // cancelar = null, como a rota devolve 204

export async function pickFolder(directory) {
  return answer(await core().invoke('pick_folder', { directory: directory || null }))
}

export async function pickFile(directory, kind = 'project') {
  const extensions = FILE_KINDS[kind] ?? PROJECT_EXTS
  return answer(await core().invoke('pick_file', { directory: directory || null, extensions }))
}

/** Escolhe onde salvar; acrescenta a extensão do nome sugerido se o usuário a tirar. */
export async function pickSave(suggested = 'projeto.ttwa', directory) {
  const ext = suggested.includes('.') ? suggested.split('.').pop() : 'ttwa'
  const others = PROJECT_EXTS.filter((e) => e !== ext)
  let path = await core().invoke('pick_save', { directory: directory || null, filename: suggested, extensions: [ext, ...others] })
  if (path && !PROJECT_EXTS.includes(path.split('.').pop().toLowerCase())) path += '.' + ext
  return answer(path)
}

/** Grava bytes (Uint8Array) num caminho: corpo binário, caminho no cabeçalho. */
export function saveFile(path, bytes) {
  return core().invoke('save_file', bytes, { headers: { path: encodeURIComponent(path) } })
}

/** Download dentro da casca: pergunta onde salvar e grava (o `<a download>` não serve no WKWebView). */
export async function saveAs(filename, blob) {
  const ext = filename.includes('.') ? filename.split('.').pop() : ''
  const path = await core().invoke('pick_save', { directory: null, filename, extensions: ext ? [ext] : [] })
  if (!path) return null
  await saveFile(path, new Uint8Array(await blob.arrayBuffer()))
  return path
}
