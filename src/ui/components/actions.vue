<script>
export { default } from './actions.ts';
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
