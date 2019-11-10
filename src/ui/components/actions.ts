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
      permissions: this.app.permissions,
      activeTab: this.app.activeTab,
      isHttpTab: this.app.activeTab.url.startsWith('http'),
    };
  },
  methods: {
    openInTmp() {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
        payload: {
          url: this.activeTab.url,
        },
      });
      window.close();
    },
    openInDeletesHistoryTmp() {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
        payload: {
          url: this.activeTab.url,
          deletesHistory: true,
        },
      });
      window.close();
    },
    convertToRegular() {
      browser.runtime.sendMessage({
        method: 'convertTempContainerToRegular',
        payload: {
          cookieStoreId: this.activeTab.cookieStoreId,
          tabId: this.activeTab.id,
          url: this.activeTab.url,
        },
      });
      window.close();
    },
    convertToPermanent() {
      browser.runtime.sendMessage({
        method: 'convertTempContainerToPermanent',
        payload: {
          cookieStoreId: this.activeTab.cookieStoreId,
          tabId: this.activeTab.id,
          name: this.activeTab.parsedUrl.hostname,
          url: this.activeTab.url,
        },
      });
      window.close();
    },
    convertToTemporary() {
      browser.runtime.sendMessage({
        method: 'convertPermanentToTempContainer',
        payload: {
          cookieStoreId: this.activeTab.cookieStoreId,
          tabId: this.activeTab.id,
          url: this.activeTab.url,
        },
      });
      window.close();
    },
  },
});
