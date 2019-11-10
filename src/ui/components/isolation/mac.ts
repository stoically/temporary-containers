import Vue from 'vue';

export default Vue.extend({
  props: {
    app: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      preferences: this.app.preferences,
      popup: this.app.popup,
      show: false,
    };
  },
  mounted() {
    $('#isolationMac.ui.dropdown').dropdown();
  },
});
