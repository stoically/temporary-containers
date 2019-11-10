import Vue from 'vue';

import IsolationGlobal from './isolation/global.vue';
import IsolationPerDomain from './isolation/perdomain.vue';
import IsolationMac from './isolation/mac.vue';
import Actions from './actions.vue';
import Statistics from './statistics.vue';
import Message from './message.vue';
import Breadcrumb from './breadcrumb.vue';
import Glossary from './glossary/index.vue';

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
      type: Object,
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
    app(app) {
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
        $.tab('change tab', this.app.preferences.ui.popupDefaultTab);
      });
    },
  },
  methods: {
    changeTab(tab) {
      $('.ui.sidebar').sidebar('hide');
      $.tab('change tab', tab);
    },
    toggleSidebar() {
      $('.ui.sidebar').sidebar('toggle');
    },
    createTmp() {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
      });
      window.close();
    },
    createDeletesHistoryTmp() {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
        payload: {
          deletesHistory: true,
        },
      });
      window.close();
    },
    async openPreferences() {
      const tabs = await browser.tabs.query({
        url: browser.runtime.getURL('options.html'),
      });
      if (tabs.length) {
        const tab = tabs[0];
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
    toggleIsolation() {
      this.app.preferences.isolation.active = !this.app.preferences.isolation
        .active;
    },
  },
});
