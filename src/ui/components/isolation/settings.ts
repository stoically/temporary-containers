import Vue from 'vue';

export default Vue.extend({
  props: {
    action: {
      type: String,
      required: true,
    },
    glossary: {
      type: String,
      default: '',
    },
    glossaryLabel: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    perdomain: {
      type: Boolean,
      default: false,
    },
  },
  watch: {
    action(newAction): void {
      this.$emit('update:action', newAction);
    },
  },
});
