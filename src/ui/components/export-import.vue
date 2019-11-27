<script>
export { default } from './export-import.ts';
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
          export since it's not possible to make sure that those containers
          exist when importing, which would lead to unexpected behavior.
          <br /><br />
          <i
            >Installed Add-on version: <strong>{{ addonVersion }}</strong></i
          >
        </div>
        <div class="field">
          <button class="ui button primary" @click="exportPreferences">
            Export to local file
          </button>
        </div>
        <div v-if="lastFileExport" class="field" style="margin-bottom: 30px">
          <h5>Last local file export</h5>
          <div>
            <ul>
              <li>
                Date: {{ new Date(lastFileExport.date).toLocaleString() }}
              </li>
              <li>Version: {{ lastFileExport.version }}</li>
            </ul>
          </div>
        </div>
        <div class="field">
          <button class="ui button primary" @click="exportPreferencesSync">
            Export to Firefox Sync
          </button>
        </div>
        <div v-if="lastSyncExport" class="field">
          <button
            class="ui button negative primary"
            @click="wipePreferencesSync"
          >
            Wipe Firefox Sync export
          </button>
        </div>
        <div v-if="lastSyncExport" class="field">
          <h5>Last Firefox Sync export</h5>
          <div>
            <ul>
              <li>
                Date: {{ new Date(lastSyncExport.date).toLocaleString() }}
              </li>
              <li>Version: {{ lastSyncExport.version }}</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="field">
          <label>Import Preferences</label>
        </div>
        <div class="ui small notice message">
          Currently it's not possible to request permissions while importing, so
          if you have notifications, bookmarks context menu, or deletes history
          preferences in your import, those will get ignored and you have to
          reconfigure them.
        </div>
        <div class="field">
          <label>
            <input
              id="importPreferences"
              type="file"
              class="hidden"
              @change="importPreferences"
            />
            <div class="ui button primary">
              Import from local file
            </div>
          </label>
        </div>
        <div class="field">
          <button class="ui button primary" @click="importPreferencesSync">
            Import from Firefox Sync
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
