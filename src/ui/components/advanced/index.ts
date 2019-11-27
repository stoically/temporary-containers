import Vue from 'vue';

import General from './general.vue';
import Cookies from './cookies.vue';
import DeleteHistory from './deletehistory.vue';
import { App } from '~/ui/root';

export default Vue.extend({
  components: {
    General,
    Cookies,
    DeleteHistory,
  },
  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },
});
