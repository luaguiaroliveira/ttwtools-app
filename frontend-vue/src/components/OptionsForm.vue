<script setup>
// Formulário gerado do descritor de opções do tagger (data/taggers/<tagger>.options.json):
// grupos, tipo de campo, "muda o resultado / só velocidade", explicação, impacto e
// valores não instalados desativados com o comando para instalar.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  descriptor: { type: Object, required: true },   // /api/taggers/{id}/options
  modelValue: { type: Object, required: true },   // valores atuais {id: valor}
})
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const GROUPS = ['modelo', 'extrair', 'desempenho', 'avancado']
const groups = computed(() => GROUPS.map((g) => ({ id: g, options: props.descriptor.options.filter((o) => o.grupo === g) }))
  .filter((g) => g.options.length))
const lang = () => props.modelValue.lang
const avail = (o, v) => (lang() && lang() !== 'en' && props.descriptor.availability?.[`${o.id}@${lang()}`]?.[v]) || props.descriptor.availability?.[o.id]?.[v]
const values = (o) => o.por_idioma?.[lang()] ?? o.valores     // ex.: pacotes do Stanza por idioma
const set = (id, value) => emit('update:modelValue', { ...props.modelValue, [id]: value })
function toggle(o, v, on) {
  const cur = new Set(props.modelValue[o.id] ?? o.padrao)
  on ? cur.add(v) : cur.delete(v)
  if (cur.size) set(o.id, o.valores.filter((x) => cur.has(x)))
}
const shown = (v) => (Array.isArray(v) ? v.join(', ') : String(v))
</script>

<template>
  <div class="flex flex-col gap-4">
    <fieldset v-for="g in groups" :key="g.id" class="flex flex-col gap-3">
      <legend class="font-bold text-sm mb-1">{{ t(`tagger.group.${g.id}`) }}</legend>
      <div v-for="o in g.options" :key="o.id" class="flex flex-col gap-1 border-l-2 pl-3"
           :class="o.afeta_resultado ? 'border-primary' : 'border-base-300'">
        <div class="flex flex-wrap items-center gap-2">
          <label :for="`opt-${o.id}`" class="font-medium text-sm">{{ o.nome }}</label>
          <span class="badge badge-xs" :class="o.afeta_resultado ? 'badge-primary' : 'badge-ghost'">
            {{ t(o.afeta_resultado ? 'tagger.affects.yes' : 'tagger.affects.no') }}
          </span>
          <span class="text-xs opacity-60">{{ t('tag.default', { value: shown(o.padrao) }) }}</span>
        </div>
        <select v-if="o.tipo === 'escolha'" :id="`opt-${o.id}`" class="select select-sm w-fit" :value="modelValue[o.id] ?? o.padrao"
                @change="set(o.id, $event.target.value)">
          <option v-for="v in values(o)" :key="v" :value="v" :disabled="avail(o, v) && !avail(o, v).installed">
            {{ v }}{{ avail(o, v) && !avail(o, v).installed ? ` (${t('tag.not_installed', { command: avail(o, v).command })})` : '' }}
          </option>
        </select>
        <input v-else-if="o.tipo === 'booleano'" :id="`opt-${o.id}`" type="checkbox" class="toggle toggle-sm"
               :checked="modelValue[o.id] ?? o.padrao" @change="set(o.id, $event.target.checked)" />
        <input v-else-if="o.tipo === 'inteiro'" :id="`opt-${o.id}`" type="number" class="input input-sm w-32" :min="o.min"
               :value="modelValue[o.id] ?? o.padrao" @change="set(o.id, parseInt($event.target.value, 10))" />
        <div v-else-if="o.tipo === 'lista'" :id="`opt-${o.id}`" class="flex flex-wrap gap-3" role="group" :aria-label="o.nome">
          <label v-for="v in o.valores" :key="v" class="flex items-center gap-1 text-sm">
            <input type="checkbox" class="checkbox checkbox-sm" :checked="(modelValue[o.id] ?? o.padrao).includes(v)"
                   @change="toggle(o, v, $event.target.checked)" />{{ v }}
          </label>
        </div>
        <input v-else :id="`opt-${o.id}`" class="input input-sm" :value="modelValue[o.id] ?? o.padrao"
               @change="set(o.id, $event.target.value)" />
        <p class="text-xs opacity-80">{{ o.explicacao }}</p>
        <p v-if="o.impacto" class="text-xs opacity-60">
          {{ t('tag.impact') }}: <span v-for="(v, k) in o.impacto" :key="k" class="mr-2">{{ t(`tagger.impact_kind.${k}`) }} {{ t(`tagger.impact.${v}`) }}</span>
        </p>
      </div>
    </fieldset>
  </div>
</template>
