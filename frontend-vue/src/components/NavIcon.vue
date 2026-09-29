<script setup>
// Ícones do menu lateral, desenhados em traço. Cada um tem uma pequena animação própria
// (classes .ico-* em style.css) disparada ao passar o mouse ou focar o item (.nav-item).
defineProps({ name: { type: String, required: true }, size: { type: Number, default: 24 } })
</script>
<template>
  <svg viewBox="0 0 24 24" :width="size" :height="size" fill="none" stroke="currentColor" stroke-width="1.7"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="nav-ico" :class="`ico-${name}`">
    <template v-if="name === 'file'">
      <path d="M6 3h8l4 4v14H6z" /><path class="a-flap" d="M14 3v4h4" /><path d="M9 12h6M9 16h6" />
    </template>
    <template v-else-if="name === 'tagging'">
      <g class="a-swing"><path d="M3.500 12.500V4.500a1 1 0 0 1 1-1h8l8 8a1.500 1.500 0 0 1 0 2.100l-6.300 6.300a1.500 1.500 0 0 1-2.100 0z" /><circle cx="8" cy="8" r="1.300" /></g>
    </template>
    <template v-else-if="name === 'explore'">
      <rect class="a-back2" x="7" y="2.500" width="13" height="16" rx="1.500" />
      <rect class="a-back1" x="4.500" y="5" width="13" height="16" rx="1.500" />
      <path class="a-top" d="M8 10h6M8 13.500h6M8 17h3.500" />
    </template>
    <template v-else-if="name === 'compare'">
      <rect x="2" y="5" width="8" height="14" rx="1.200" /><rect x="14" y="5" width="8" height="14" rx="1.200" />
      <path class="a-arrows" d="M10.500 10.500h3M12.200 9l1.500 1.500-1.500 1.500M13.500 14.500h-3M11.800 13l-1.500 1.500 1.500 1.500" />
    </template>
    <template v-else-if="name === 'writing'">
      <path d="M13 3H5.500a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" /><path d="M8 8h4M8 12h3M8 16h6" />
      <g class="a-pencil"><path d="M20.500 3.500a1.800 1.800 0 0 1 0 2.500L14 12.500 11 13l.5-3L18 3.500a1.800 1.800 0 0 1 2.500 0z" /></g>
    </template>
    <template v-else-if="name === 'modules'">
      <rect class="a-q1" x="3.500" y="3.500" width="7" height="7" rx="1.200" /><rect class="a-q2" x="13.500" y="3.500" width="7" height="7" rx="1.200" />
      <rect class="a-q3" x="3.500" y="13.500" width="7" height="7" rx="1.200" /><rect class="a-q4" x="13.500" y="13.500" width="7" height="7" rx="1.200" />
    </template>
    <template v-else>
      <path d="M2 9.500 12 5l10 4.500L12 14z" /><path d="M6 11.500V16c0 1.200 2.700 2.500 6 2.500s6-1.300 6-2.500v-4.500" /><path class="a-tassel" d="M22 9.500V15" />
    </template>
  </svg>
</template>
