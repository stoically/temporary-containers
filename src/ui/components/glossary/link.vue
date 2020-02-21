<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
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
});
</script>

<template>
  <span class="glossary-link" @click="$root.$emit('show', to)">{{
    text || to
  }}</span>
</template>
