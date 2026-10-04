<script setup>
// Ícones do menu lateral: traço + preenchimento suave (duotone), com um detalhe em laranja (.acc).
// Cada um tem uma animação própria ao passar o mouse/focar o item (.nav-item, ver style.css).
defineProps({ name: { type: String, required: true }, size: { type: Number, default: 24 } })
</script>
<template>
  <svg viewBox="0 0 24 24" :width="size" :height="size" fill="none" stroke="currentColor" stroke-width="1.6"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="nav-ico" :class="`ico-${name}`">
    <template v-if="name === 'file'">
      <path class="duo" d="M6 3h8l4 4v14H6z" /><path d="M6 3h8l4 4v14H6z" />
      <path class="acc a-flap" d="M14 3v4h4" /><path d="M9 12.500h6M9 16.500h4" />
    </template>
    <template v-else-if="name === 'tagging'">
      <g class="a-swing">
        <path class="duo" d="M3.500 12.500V4.500a1 1 0 0 1 1-1h8l8 8a1.500 1.500 0 0 1 0 2.100l-6.300 6.300a1.500 1.500 0 0 1-2.100 0z" />
        <path d="M3.500 12.500V4.500a1 1 0 0 1 1-1h8l8 8a1.500 1.500 0 0 1 0 2.100l-6.300 6.300a1.500 1.500 0 0 1-2.100 0z" />
        <circle class="acc a-dot" cx="8" cy="8" r="1.500" />
      </g>
    </template>
    <template v-else-if="name === 'explore'">
      <rect class="duo" x="3.500" y="3" width="13" height="17" rx="2" /><rect x="3.500" y="3" width="13" height="17" rx="2" />
      <path d="M7 8h6M7 11.500h3" />
      <g class="a-lens"><circle class="duo-acc" cx="15.500" cy="15.500" r="4" /><circle class="acc" cx="15.500" cy="15.500" r="4" /><path class="acc" d="m18.500 18.500 2.500 2.500" /></g>
    </template>
    <template v-else-if="name === 'compare'">
      <rect class="duo" x="2.500" y="4.500" width="8" height="15" rx="2" /><rect x="2.500" y="4.500" width="8" height="15" rx="2" />
      <rect class="duo-acc" x="13.500" y="4.500" width="8" height="15" rx="2" /><rect class="acc" x="13.500" y="4.500" width="8" height="15" rx="2" />
      <path class="a-arrows" d="M9 12h6M12.500 9.500 15 12l-2.500 2.500" />
    </template>
    <template v-else-if="name === 'writing'">
      <path class="duo" d="M13 3H5.500a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7z" />
      <path d="M13 3H5.500a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" /><path d="M8 8h4M8 12h3M8 16h6" />
      <g class="a-pencil"><path class="duo-acc" d="M20.500 3.500a1.800 1.800 0 0 1 0 2.500L14 12.500 11 13l.5-3L18 3.500a1.800 1.800 0 0 1 2.500 0z" /><path class="acc" d="M20.500 3.500a1.800 1.800 0 0 1 0 2.500L14 12.500 11 13l.5-3L18 3.500a1.800 1.800 0 0 1 2.500 0z" /></g>
    </template>
    <template v-else-if="name === 'modules'">
      <rect class="duo a-q1" x="3.500" y="3.500" width="7" height="7" rx="1.800" /><rect class="a-q1" x="3.500" y="3.500" width="7" height="7" rx="1.800" />
      <rect class="a-q2 acc" x="13.500" y="3.500" width="7" height="7" rx="1.800" /><rect class="duo-acc a-q2" x="13.500" y="3.500" width="7" height="7" rx="1.800" />
      <rect class="duo a-q3" x="3.500" y="13.500" width="7" height="7" rx="1.800" /><rect class="a-q3" x="3.500" y="13.500" width="7" height="7" rx="1.800" />
      <rect class="duo a-q4" x="13.500" y="13.500" width="7" height="7" rx="1.800" /><rect class="a-q4" x="13.500" y="13.500" width="7" height="7" rx="1.800" />
    </template>
    <template v-else-if="name === 'reader'">
      <g class="a-lens">
        <path class="duo" d="M6 3h8l4 4v14H6z" />
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v4h4" />
        <path d="M9 10.500h6" />
        <path class="acc" d="M8.400 16c1.100-1.500 2.300-2.200 3.600-2.200s2.500.700 3.600 2.200c-1.100 1.500-2.300 2.200-3.600 2.200S9.500 17.500 8.400 16z" />
        <circle class="acc" cx="12" cy="16" r=".9" />
      </g>
    </template>
    <template v-else>
      <path class="duo" d="M2 9.500 12 5l10 4.500L12 14z" /><path d="M2 9.500 12 5l10 4.500L12 14z" />
      <path d="M6 11.500V16c0 1.200 2.700 2.500 6 2.500s6-1.300 6-2.500v-4.500" /><path class="acc a-tassel" d="M22 9.500V15" />
    </template>
  </svg>
</template>
