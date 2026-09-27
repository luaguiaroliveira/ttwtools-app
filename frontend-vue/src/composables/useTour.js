// Tour guiado (estado único): cada passo leva à rota e destaca um elemento (#id).
import { reactive } from 'vue'
import { api } from '../api/index.js'

export const tour = reactive({ active: false, data: null, index: 0 })

export async function startTour(id, lang) {
  tour.data = await api.help.tour(id, lang)
  tour.index = 0
  tour.active = true
}
export function stopTour() { tour.active = false }
export function stepTour(delta) {
  const next = tour.index + delta
  if (next < 0) return
  if (next >= tour.data.steps.length) { stopTour(); return }
  tour.index = next
}
