<script lang="ts">
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
</script>

<template>
  <div class="ui segment">
    <div v-if="!isHttpTab" class="ui small message">
      Actions aren't available in this tab
    </div>

    <button class="ui primary button" :disabled="!isHttpTab" @click="openInTmp">
      Open tab URL in new Temporary Container
    </button>
    <br /><br />
    <button
      class="ui negative button"
      :disabled="
        !isHttpTab || !app.storage.tempContainers[activeTab.cookieStoreId]
      "
      @click="convertToPermanent"
    >
      Convert Temporary to Permanent Container
    </button>
    <br /><br />
    <button
      class="ui negative button"
      :disabled="
        !isHttpTab ||
          activeTab.cookieStoreId === 'firefox-default' ||
          app.storage.tempContainers[activeTab.cookieStoreId]
      "
      @click="convertToTemporary"
    >
      Convert Permanent to Temporary Container
    </button>
    <br /><br />
    <button
      v-if="permissions.history"
      class="ui negative button"
      :disabled="
        !isHttpTab ||
          !app.storage.tempContainers[activeTab.cookieStoreId] ||
          !app.storage.tempContainers[activeTab.cookieStoreId].deletesHistory
      "
      @click="convertToRegular"
    >
      Convert from "Deletes History" to Regular Temporary Container
    </button>
    <br /><br />
    <button
      v-if="permissions.history"
      class="ui negative button"
      :disabled="!isHttpTab"
      @click="openInDeletesHistoryTmp"
    >
      Open tab URL in new "Deletes History Temporary Container"
    </button>
  </div>
</template>
