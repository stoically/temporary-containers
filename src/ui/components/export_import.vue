<script>
export default {
  props: {
    app: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      preferences: this.app.preferences,
      permissions: this.app.permissions
    };
  },
  methods: {
    async exportPreferences(event) {
      event.preventDefault();
      const {preferences} = await browser.storage.local.get('preferences');

      preferences.isolation.global.excludedContainers = [];

      const exportedPreferences = JSON.stringify({
        version: browser.runtime.getManifest().version,
        date: Date.now(),
        preferences,
      }, null, 2);

      const date = new Date();
      const dateString = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
      const timeString = [date.getHours(), date.getMinutes(), date.getSeconds()].join('.');
      const a = document.createElement('a');
      a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(exportedPreferences);
      a.setAttribute('download', `temporary_containers_preferences_${dateString}_${timeString}.json`);
      a.setAttribute('type', 'text/plain');
      a.dispatchEvent(new MouseEvent('click'));
    },

    async importPreferences(event) {
      event.preventDefault();
      const file = event.target.files[0];
      if (!file) {
        return;
      }

      const confirmed = window.confirm(`
        Do you want to import ${file.name}?\n
        All existing preferences are overwritten.
      `);
      if (!confirmed) {
        return;
      }

      const importedPreferences = await new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = async (event) => {
          try {
            resolve(JSON.parse(event.target.result));
          } catch (error) {
          // eslint-disable-next-line no-console
            console.log('error while importing preferences', error);
            this.$root.$emit('showError', 'Error while importing preferences!');
          }
        };
      });

      // TODO file firefox bug, we're in a input handler, so requesting permissions should work
      if (!this.permissions.notifications) {
        importedPreferences.preferences.notifications = false;
      }
      if (!this.permissions.bookmarks) {
        importedPreferences.preferences.contextMenuBookmarks = false;
        importedPreferences.preferences.deletesHistory.contextMenuBookmarks = false;
      }
      if (!this.permissions.history) {
        importedPreferences.preferences.deletesHistory.active = false;
      }

      await browser.runtime.sendMessage({
        method: 'savePreferences',
        payload: {
          preferences: importedPreferences.preferences,
          migrate: true,
          previousVersion: importedPreferences.version,
        }
      });

      this.$root.$emit('initialize');

      this.$root.$emit('showMessage', 'Preferences imported.');
    },
  }
};
</script>

<template>
  <form class="ui form">
    <div class="ui two column very relaxed grid">
      <div class="column">
        <div class="field">
          <label>Export Preferences</label>
        </div>
        <div class="ui notice message">
          Preferences that include permanent containers are stripped from the
          export since it's not possible to make sure that those containers exist
          when importing, which would lead to unexpected behavior.
        </div>
        <div class="field">
          <button
            id="exportPreferences"
            class="ui button primary"
            @click="exportPreferences"
          >
            Export into file
          </button>
        </div>
      </div>
      <div class="column">
        <div class="field">
          <label>Import Preferences</label>
        </div>
        <div class="ui notice message">
          Currently it's not possible to request permissions while importing,
          so if you have notifications, bookmarks context menu, or deletes history
          preferences in your import file, those will get ignored and you have
          to reconfigure them.
        </div>
        <div class="field">
          <label>
            <input
              id="importPreferences"
              type="file"
              class="hidden"
              @change="importPreferences"
            >
            <div class="ui button primary">
              Import from file
            </div>
          </label>
        </div>
      </div>
    </div>
  </form>
</template>