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
      popup: this.app.popup,
      show: false,
    };
  },
  mounted() {
    $('#isolationMac.ui.dropdown').dropdown();
  },
});
