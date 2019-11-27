import Vue from 'vue';
import { Popup } from '../root';

export default Vue.extend({
  props: {
    app: {
      type: Object as () => Popup,
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
    openInTmp(): void {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
        payload: {
          url: this.activeTab.url,
        },
      });
      window.close();
    },
    openInDeletesHistoryTmp(): void {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
        payload: {
          url: this.activeTab.url,
          deletesHistory: true,
        },
      });
      window.close();
    },
    convertToRegular(): void {
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
    convertToPermanent(): void {
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
    convertToTemporary(): void {
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
