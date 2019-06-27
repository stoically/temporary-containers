<script>
import General from './general';
import Isolation from './isolation';
import Advanced from './advanced';
import Statistics from './statistics';
import ExportImport from './export_import';
import Message from './message';
import Error from './error';

export default {
  components: {
    General,
    Isolation,
    Advanced,
    Statistics,
    ExportImport,
    Message,
    Error
  },
  data: () => ({
    app: {
      initialized: false
    }
  }),
  watch: {
    app: {
      handler: async (app, oldApp) => {
        if (!app.initialized || !oldApp.preferences) {
          return;
        }

        if (app.preferences.notifications && !app.permissions.notifications) {
          // eslint-disable-next-line require-atomic-updates
          app.preferences.notifications = app.permissions.notifications =
            await browser.permissions.request({
              permissions: ['notifications']
            });
        }

        if (app.preferences.contextMenuBookmarks && !app.permissions.bookmarks) {
          // eslint-disable-next-line require-atomic-updates
          app.preferences.contextMenuBookmarks = app.permissions.bookmarks =
            await browser.permissions.request({
              permissions: ['bookmarks']
            });
        }

        if (app.preferences.deletesHistory.contextMenuBookmarks && !app.permissions.bookmarks) {
          // eslint-disable-next-line require-atomic-updates
          app.preferences.deletesHistory.contextMenuBookmarks = app.permissions.bookmarks =
            await browser.permissions.request({
              permissions: ['bookmarks']
            });
        }

        if (app.preferences.deletesHistory.active && !app.permissions.history) {
          // eslint-disable-next-line require-atomic-updates
          app.preferences.deletesHistory.active = app.permissions.history =
            await browser.permissions.request({
              permissions: ['history']
            });
        }

        try {
          await browser.runtime.sendMessage({
            method: 'savePreferences',
            payload: {
              preferences: app.preferences
            }
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('error while saving preferences', error);
          this.$root.$emit('showError', 'Error while saving preferences');
        }
      },
      deep: true
    }
  },
  async mounted() {
    $('.menu .item').tab({
      history: true,
      historyType: 'hash'
    });
    let stateChanged = false;
    $.address.change(() => stateChanged = true);

    await this.initialize();

    if (!stateChanged) {
      // looks like jquery.address fired before tabs mounted, retrigger
      const hash = document.location.hash;
      $.address.value('_');
      $.address.value(hash.replace('#/', ''));
    }

    this.$root.$on('initialize', () => {
      this.app.initialized = false;
      this.$nextTick(() => {
        this.initialize();
      });
    });
  },
  methods: {
    async initialize() {
      const {permissions: allPermissions} = await browser.permissions.getAll();
      const permissions = {
        bookmarks: allPermissions.includes('bookmarks'),
        history: allPermissions.includes('history'),
        notifications: allPermissions.includes('notifications')
      };

      let storage;
      try {
        // eslint-disable-next-line require-atomic-updates
        storage = await browser.storage.local.get(['preferences', 'statistics', 'tempContainers']);
        if (!storage.preferences || !Object.keys(storage.preferences).length) {
          this.$root.$emit('showPreferencesError');
          return;
        }
      } catch (error) {
        this.$root.$emit('showPreferencesError', error);
      }

      this.app = {
        initialized: true,
        storage,
        preferences: storage.preferences,
        permissions
      };
    }
  }
};
</script>

<style>
  #container { padding: 25px; }
  .hidden { display: none !important; }
</style>

<template>
  <div
    v-show="app.initialized"
    id="container"
    class="ui container"
  >
    <div class="ui menu">
      <a
        class="item"
        data-tab="general"
      >{{ t('optionsNavGeneral') }}</a>
      <a
        class="item"
        data-tab="isolation"
      >{{ t('optionsNavIsolation') }}</a>
      <a
        class="item"
        data-tab="advanced"
      >{{ t('optionsNavAdvanced') }}</a>
      <a
        class="item"
        data-tab="statistics"
      >{{ t('optionsNavStatistics') }}</a>
      <a
        class="item"
        data-tab="export_import"
      >{{ t('optionsNavExportImport') }}</a>
    </div>
    <message />
    <div
      class="ui tab segment"
      data-tab="general"
    >
      <general
        v-if="app.initialized"
        :app="app"
      />
    </div>
    <div
      class="ui tab segment"
      data-tab="isolation"
    >
      <isolation
        :app="app"
      />
    </div>
    <div
      class="ui tab segment"
      data-tab="advanced"
    >
      <advanced
        :app="app"
      />
    </div>
    <div
      class="ui tab segment"
      data-tab="statistics"
    >
      <statistics
        v-if="app.initialized"
        :app="app"
      />
    </div>
    <div
      class="ui tab segment"
      data-tab="export_import"
    >
      <export-import
        v-if="app.initialized"
        :app="app"
      />
    </div>
    <error :app="app" />
  </div>
</template>
