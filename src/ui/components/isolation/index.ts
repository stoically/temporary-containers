import Vue from 'vue';

import Global from './global.vue';
import PerDomain from './perdomain.vue';
import Mac from './mac.vue';
import { App } from '~/ui/root';

export default Vue.extend({
  components: {
    Global,
    PerDomain,
    Mac,
  },
  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },
});
