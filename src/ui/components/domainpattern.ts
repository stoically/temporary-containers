import Vue from 'vue';

export default Vue.extend({
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
});
