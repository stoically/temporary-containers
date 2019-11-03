<script>
export default {
  props: {
    to: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      default: '',
    },
  },
};
</script>

<template>
  <span class="glossary-link" @click="$root.$emit('show', to)">{{
    text || to
  }}</span>
</template>
