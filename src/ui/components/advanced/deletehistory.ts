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
    };
  },
  mounted() {
    $('#advancedDeletesHistory .ui.checkbox').checkbox();
    $('#advancedDeletesHistory .ui.dropdown').dropdown();
  },
});
