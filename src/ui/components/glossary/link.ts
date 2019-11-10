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
