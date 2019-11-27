import mixins from 'vue-typed-mixins';
import { mixin } from '../mixin';

import General from './general.vue';
import Isolation from './isolation/index.vue';
import Advanced from './advanced/index.vue';
import Statistics from './statistics.vue';
import ExportImport from './export-import.vue';
import Message from './message.vue';
import Glossary from './glossary/index.vue';
import { App } from '../root';

export default mixins(mixin).extend({
  components: {
    General,
    Isolation,
    Advanced,
    Statistics,
    ExportImport,
    Message,
    Glossary,
  },
  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },
  data() {
    return {
      installed: false,
    };
  },
  async mounted() {
    if (window.location.search === '?installed') {
      this.installed = true;
    }

    this.initTabs();

    browser.runtime.onMessage.addListener(message => {
      if (typeof message !== 'object') {
        return;
      }
      if (
        message.info &&
        message.info === 'preferencesUpdated' &&
        (!message.fromTabId || message.fromTabId !== this.app.currentTab.id)
      ) {
        this.$root.$emit('initialize');
      }
    });
  },
  methods: {
    initTabs(): void {
      $('.menu .item').tab({
        history: true,
        historyType: 'hash',
      });
      let stateChanged = false;
      $.address.change(() => (stateChanged = true));

      setTimeout(() => {
        if (!stateChanged) {
          // looks like jquery.address fired before tabs mounted, retrigger
          const hash = document.location.hash;
          $.address.value('_');
          $.address.value(hash.replace('#/', ''));
        }
      }, 100);
    },
  },
});
