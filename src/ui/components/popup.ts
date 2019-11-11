import Vue from 'vue';

import IsolationGlobal from './isolation/global.vue';
import IsolationPerDomain from './isolation/perdomain.vue';
import IsolationMac from './isolation/mac.vue';
import Actions from './actions.vue';
import Statistics from './statistics.vue';
import Message from './message.vue';
import Breadcrumb from './breadcrumb.vue';
import Glossary from './glossary/index.vue';
import { App } from '../root';

export default Vue.extend({
  components: {
    IsolationGlobal,
    IsolationPerDomain,
    IsolationMac,
    Actions,
    Statistics,
    Message,
    Breadcrumb,
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
      initialized: false,
      show: false,
    };
  },
  watch: {
    app(app: App): void {
      if (!app.initialized) {
        return;
      }

      this.initialized = true;
      this.$nextTick(() => {
        $('.ui.accordion').accordion({
          animateChildren: false,
          duration: 0,
        });

        $('.ui.sidebar').sidebar({
          transition: 'overlay',
        });

        this.show = true;
        $(document).tab('change tab', this.app.preferences.ui.popupDefaultTab);
      });
    },
  },
  methods: {
    changeTab(tab: string): void {
      $('.ui.sidebar').sidebar('hide');
      $(document).tab('change tab', tab);
    },
    toggleSidebar(): void {
      $('.ui.sidebar').sidebar('toggle');
    },
    createTmp(): void {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
      });
      window.close();
    },
    createDeletesHistoryTmp(): void {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
        payload: {
          deletesHistory: true,
        },
      });
      window.close();
    },
    async openPreferences(): Promise<void> {
      const [tab] = await browser.tabs.query({
        url: browser.runtime.getURL('options.html'),
      });
      if (tab && tab.id && tab.windowId) {
        await browser.tabs.update(tab.id, { active: true });
        await browser.tabs.reload(tab.id);
        if (tab.windowId !== browser.windows.WINDOW_ID_CURRENT) {
          await browser.windows.update(tab.windowId, { focused: true });
        }
      } else {
        await browser.tabs.create({
          url: browser.runtime.getURL('options.html'),
        });
      }
      window.close();
    },
    toggleIsolation(): void {
      this.app.preferences.isolation.active = !this.app.preferences.isolation
        .active;
    },
  },
});
