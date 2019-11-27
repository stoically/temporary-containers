import Vue from 'vue';
import { App } from '~/ui/root';

export default Vue.extend({
  props: {
    app: {
      type: Object as () => App,
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
