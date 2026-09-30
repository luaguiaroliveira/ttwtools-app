import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSession } from '../stores/session.js'

// Campos que cada unidade de contagem exige da camada (qualquer um da lista serve).
const NEEDS = { lemma: ['lemma'], pos: ['upos', 'xpos'], word_pos: ['upos', 'xpos'] }

// Camada do topo da tela nas ferramentas de Comparar que contam palavras (Palavras-chave, Faixas):
// aviso se a camada escolhida não tem o campo da unidade, e se mudou depois do último cálculo.
export function useTopLayer(unit, lastParams) {
  const { activeCorpus, layer } = storeToRefs(useSession())
  const kept = ref(null)
  const fields = computed(() => activeCorpus.value?.layers?.find((l) => l.tool === layer.value)?.fields ?? null)
  const missing = computed(() => {
    const need = NEEDS[unit.value]
    if (!layer.value || !fields.value || !need || need.some((n) => fields.value.includes(n))) return null
    return need[0]
  })
  const stale = computed(() => Boolean(lastParams.value && (lastParams.value.layer ?? null) !== (layer.value ?? null) && kept.value !== (layer.value ?? "")))
  const keep = () => { kept.value = layer.value ?? '' }
  return { layer, missing, stale, keep }
}
