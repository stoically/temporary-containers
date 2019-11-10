import Vue from 'vue';

import General from './general.vue';
import Cookies from './cookies.vue';
import DeleteHistory from './deletehistory.vue';

export default Vue.extend({
  components: {
    General,
    Cookies,
    DeleteHistory,
  },
  props: {
    app: {
      type: Object,
      required: true,
    },
  },
});
