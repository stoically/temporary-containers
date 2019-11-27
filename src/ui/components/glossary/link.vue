<script>
export { default } from './link.ts';
</script>

<template>
  <span class="glossary-link" @click="$root.$emit('show', to)">{{
    text || to
  }}</span>
</template>
