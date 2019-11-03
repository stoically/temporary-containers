<script>
export default {
  props: {
    id: {
      type: String,
      required: true,
    },
    tooltip: {
      type: Object,
      default: () => ({
        hidden: false,
        position: 'bottom left',
      }),
    },
    domainPattern: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    exclusion: {
      type: Boolean,
      default: false,
    },
    glossary: {
      type: Boolean,
      default: false,
    },
  },
  watch: {
    domainPattern(newDomainPattern) {
      this.$emit('update:domainPattern', newDomainPattern);
    },
  },
};
</script>

<template>
  <div :id="`${id}Div`" ref="div" class="field">
    <label>
      <span v-if="!exclusion">
        <span v-if="!glossary">Domain Pattern</span>
        <span v-else data-glossary="Domain Pattern" />
      </span>
      <span v-else>
        Exclusion Pattern
      </span>
    </label>
    <input :id="id" v-model="domainPattern" :disabled="disabled" type="text" />
  </div>
</template>
