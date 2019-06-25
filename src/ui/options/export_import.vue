<script>
export default {
  props: {
    preferences: {
      type: Object,
      default: () => {}
    }
  },
  data: () => ({
    loaded: false
  }),
  watch: {
    preferences() {
      const exportToolTip =
          '<div style="width:500px;">' +
          'Export your preferences into a JSON file</div>';

      $('#exportPreferences').popup({
        html: exportToolTip,
        inline: true,
        position: 'bottom left'
      });

      const importToolTip =
          '<div style="width:500px;">' +
          'Import your preferences from a JSON file. No confirmation</div>';

      $('#importPreferences').popup({
        html: importToolTip,
        inline: true,
        position: 'bottom left'
      });

      this.loaded = true;
    }
  },
  methods: {
    async exportPreferences() {
      const storage = await browser.storage.local.get('preferences');
      const exportedPreferences = {
        version: browser.runtime.getManifest().version,
        date: Date.now(),
        preferences: storage.preferences,
      };
      return JSON.stringify(exportedPreferences, null, 2);
    },

    async exportPreferencesButton(e) {
      e.preventDefault();
      const date = new Date();
      const dateString = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
      const timeString = [date.getHours(), date.getMinutes(), date.getSeconds()].join('.');
      const a = document.createElement('a');
      a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(await this.exportPreferences());
      a.setAttribute('download', `temporary_containers_preferences_${dateString}_${timeString}.json`);
      a.setAttribute('type', 'text/plain');
      a.dispatchEvent(new MouseEvent('click'));
    },

    async importPreferences(file) {
      const reader = new FileReader();
      reader.readAsText(file, 'UTF-8');
      reader.onload = async (e) => {
        try {
          const importedPreferences = JSON.parse(e.target.result);

          await browser.runtime.sendMessage({
            method: 'savePreferences',
            payload: {
              preferences: importedPreferences.preferences,
              migrate: true,
              previousVersion: importedPreferences.version,
            }
          });

          showMessage('Preferences imported.');

          this.$emit('initialize');
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('error while importing preferences', error);
          showError('Error while importing preferences!');
        }
      };
    },

    async importPreferencesButton(e) {
      e.preventDefault();
      await this.importPreferences(e.target.files[0]);
      $(e.target).closest('form').get(0).reset();
    }
  }
};
</script>

<template>
  <div
    v-show="loaded"
    class="ui tab segment"
    data-tab="export_import"
  >
    <div class="ui form">
      <div class="field">
        <button
          id="exportPreferences"
          class="ui button primary"
          @click="exportPreferencesButton"
        >
          Export Preferences
        </button>
      </div>
      <div class="field">
        <label>Import Preferences</label>
        <input
          id="importPreferences"
          type="file"
          name="Import Preferences"
          @change="importPreferencesButton"
        >
      </div>
    </div>
  </div>
</template>