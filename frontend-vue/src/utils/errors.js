// Tradução de erros da API. O servidor ainda manda mensagens em português; aqui os casos
// comuns ganham uma chave de tradução e os demais saem no formato "servidor respondeu N".
// Quando o pacote passar a mandar códigos estáveis, basta mapear `detail.code` aqui.
import { i18n } from '../i18n.js'

export function errorText(status, detail) {
  const t = i18n.global.t
  const msg = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : ''
  if (status === 0) return t('api.error.network')
  if (msg === 'pdf_unavailable') return t('writing.error.pdf_unavailable')
  if (msg.startsWith('unsupported_format')) return t('writing.error.unsupported_format')
  if (/Nenhum projeto aberto|no project open/i.test(msg)) return t('api.error.no_project')
  if (/já existe|already exists/i.test(msg)) return t('api.error.exists')
  if (/não encontrad|not found/i.test(msg)) return t('api.error.not_found')
  if (status) return t('api.error.http', { status, detail: msg })
  return msg
}
