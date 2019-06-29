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
      permissions: this.app.permissions,
      lastSyncExport: false,
      lastFileExport: false,
      download: false,
      addonVersion: browser.runtime.getManifest().version
    };
  },
  async mounted() {
    const {export: importPreferences} = await browser.storage.sync.get('export');
    if (importPreferences) {
      this.lastSyncExport = {
        date: importPreferences.date,
        version: importPreferences.version
      };
    }
    const {lastFileExport} = await browser.storage.local.get('lastFileExport');
    if (lastFileExport) {
      this.lastFileExport = lastFileExport;
    }

    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync' || !changes.export) {
        return;
      }
      this.lastSyncExport = {
        date: changes.export.newValue.date,
        version: changes.export.newValue.version,
      };
    });

    if (this.permissions.downloads) {
      this.addDownloadListener();
    }
  },
  methods: {
    getPreferences() {
      const preferences = JSON.parse(JSON.stringify(this.preferences));
      preferences.isolation.global.excludedContainers = [];

      const exportedPreferences = {
        version: browser.runtime.getManifest().version,
        date: Date.now(),
        preferences,
      };

      return exportedPreferences;
    },

    async exportPreferences(event) {
      if (!this.permissions.downloads) {
        this.permissions.downloads = await browser.permissions.request({
          permissions: ['downloads']
        });
        if (!this.permissions.downloads) {
          return;
        }
        this.addDownloadListener();
      }

      const preferences = this.getPreferences();
      const exportedPreferences = JSON.stringify(preferences, null, 2);

      console.log(preferences.date);
      const date = new Date(preferences.date);
      const dateString = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
      const timeString = [date.getHours(), date.getMinutes(), date.getSeconds()].join('.');
      const blob = new Blob([exportedPreferences], {type: 'application/json'});
      const url = URL.createObjectURL(blob);

      try {
        this.download = {
          id: await browser.downloads.download({
            url,
            filename: `temporary_containers_preferences_${dateString}_${timeString}.json`,
            saveAs: true
          }),
          date: preferences.date,
          version: preferences.version
        };
      } catch (error) {
        this.$root.$emit('showError', `Exporting to file failed: ${error.toString()}`, {close: true});
      }
    },

    async exportPreferencesSync() {
      try {
        const {export: importPreferences} = await browser.storage.sync.get('export');
        if (importPreferences && !window.confirm(`
          There's already an export in Firefox Sync:\n
          Date: ${new Date(importPreferences.date).toLocaleString()}\n
          Version: ${importPreferences.version}\n\n
          Overwrite Firefox Sync export?\n
        `)) {
          return;
        }
        await browser.storage.sync.set({
          export: this.getPreferences()
        });
        this.$root.$emit('showMessage', 'Successfully exported to Firefox Sync');
      } catch (error) {
        this.$root.$emit('showError', `Exporting to Firefox Sync failed: ${error.toString()}`);
      }
    },


    async importPreferencesSync() {
      try {
        const {export: importPreferences} = await browser.storage.sync.get('export');
        if (!importPreferences || !Object.keys(importPreferences).length) {
          this.$root.$emit('showError', 'No preferences found in Firefox Sync', {close: true});
          return;
        }
        if (this.confirmedImportPreferences(importPreferences)) {
          this.setImportedPreferences(importPreferences);
        }
      } catch (error) {
        this.$root.$emit('showError', `Importing from Firefox Sync failed: ${error.toString()}`);
      }
    },

    confirmedImportPreferences(importPreferences, fileName) {
      return window.confirm(`
        ${fileName  ? `Import preferences from ${fileName}?` : 'Import preferences?'}\n
        Date: ${new Date(importPreferences.date).toLocaleString()}\n
        Version: ${importPreferences.version}\n\n
        All existing preferences are overwritten.
      `);
    },

    async importPreferences(event) {
      const file = event.target.files[0];
      if (!file) {
        return;
      }

      const importPreferences = await new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = async (event) => {
          try {
            resolve(JSON.parse(event.target.result));
          } catch (error) {
          // eslint-disable-next-line no-console
            console.error('error while importing preferences', error);
            this.$root.$emit('showError', 'Error while importing preferences!');
          }
        };
      });

      if (this.confirmedImportPreferences(importPreferences, file.name)) {
        this.setImportedPreferences(importPreferences);
      }
    },

    async setImportedPreferences(importedPreferences) {
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

    async wipePreferencesSync() {
      if (!window.confirm(`
        Wipe Firefox sync export?\n
        This can't be undone.
      `)) {
        return;
      }

      try {
        await browser.storage.sync.clear();
        this.lastSyncExport = false;
        this.$root.$emit('showMessage', 'Successfully wiped Firefox Sync export');
      } catch (error) {
        this.$root.$emit('showError', `Wiping Firefox Sync failed: ${error.toString()}`);
      }
    },

    addDownloadListener() {
      browser.downloads.onChanged.addListener(async downloadDelta => {
        if (!this.download) {
          return;
        }
        if (this.download.id === downloadDelta.id && downloadDelta.state.current === 'complete') {
          URL.revokeObjectURL(downloadDelta.url);
          const lastFileExport = {
            date: this.download.date,
            version: this.download.version
          };
          await browser.storage.local.set({lastFileExport});
          this.lastFileExport = lastFileExport;
          this.download = false;
        }
      });
    }
  }
};
</script>

<template>
  <div class="ui form">
    <div class="ui two column very relaxed grid">
      <div class="column">
        <div class="field">
          <label>Export Preferences</label>
        </div>
        <div class="ui small notice message">
          Preferences that include permanent containers are stripped from the
          export since it's not possible to make sure that those containers exist
          when importing, which would lead to unexpected behavior.
          <br><br>
          <i>Installed Add-on version: <strong>{{ addonVersion }}</strong></i>
        </div>
        <div class="field">
          <button
            class="ui button primary"
            @click="exportPreferences"
          >
            Export to local file
          </button>
        </div>
        <div
          v-if="lastFileExport"
          class="field"
          style="margin-bottom: 30px"
        >
          <h5>Last local file export</h5>
          <div>
            <ul>
              <li>
                Date: {{ new Date(lastFileExport.date).toLocaleString() }}
              </li>
              <li>
                Version: {{ lastFileExport.version }}
              </li>
            </ul>
          </div>
        </div>
        <div class="field">
          <button
            class="ui button primary"
            @click="exportPreferencesSync"
          >
            Export to Firefox Sync
          </button>
        </div>
        <div class="field">
          <button
            class="ui button negative primary"
            @click="wipePreferencesSync"
          >
            Wipe Firefox Sync export
          </button>
        </div>
        <div
          v-if="lastSyncExport"
          class="field"
        >
          <h5>Last Firefox Sync export</h5>
          <div>
            <ul>
              <li>
                Date: {{ new Date(lastSyncExport.date).toLocaleString() }}
              </li>
              <li>
                Version: {{ lastSyncExport.version }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="field">
          <label>Import Preferences</label>
        </div>
        <div class="ui small notice message">
          Currently it's not possible to request permissions while importing,
          so if you have notifications, bookmarks context menu, or deletes history
          preferences in your import, those will get ignored and you have
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
              Import from local file
            </div>
          </label>
        </div>
        <div class="field">
          <button
            class="ui button primary"
            @click="importPreferencesSync"
          >
            Import from Firefox Sync
          </button>
        </div>
      </div>
    </div>
  </div>
</template>