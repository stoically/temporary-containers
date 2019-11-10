import Vue from 'vue';

export default Vue.extend({
  props: {
    tab: {
      type: String,
      required: true,
    },
  },
});
