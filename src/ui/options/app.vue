<script>
import General from './general';
import Isolation from './isolation';
import Advanced from './advanced';
import Statistics from './statistics';
import ExportImport from './export_import';
import Message from './message';
import Error from './error';
import { stat } from 'fs';

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
        console.log(app.preferences);
        if (!oldApp.preferences) {
          return;
        }

        if (preferences.notifications && !app.permissions.notifications) {
          app.permissions.notifications = await browser.permissions.request({
            permissions: ['notifications']
          });
          if (!app.permissions.notifications) {
            app.preferences.notifications = false;
          }
        }

        if (preferences.contextMenuBookmarks && !app.permissions.bookmarks) {
          app.permissions.bookmarks = await browser.permissions.request({
            permissions: ['bookmarks']
          });
          if (!app.permissions.bookmarks) {
            app.preferences.contextMenuBookmarks = false;
          }
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
          showError('Error while saving preferences!');
        }
      },
      deep: true
    }
  },
  mounted() {
    this.initialize();
  },
  methods: {
    async initialize() {
      $('.menu .item').tab({
        history: true,
        historyType: 'hash'
      });
      let stateChanged = false;
      $.address.change(() => stateChanged = true);

      const {permissions: allPermissions} = await browser.permissions.getAll();
      const permissions = {
        bookmarks: allPermissions.includes('bookmarks'),
        history: allPermissions.includes('history'),
        notifications: allPermissions.includes('notifications')
      };

      try {
        // eslint-disable-next-line require-atomic-updates
        window.storage = await browser.storage.local.get(['preferences', 'tempContainers']);
        if (!storage.preferences || !Object.keys(storage.preferences).length) {
          window.showPreferencesError();
          return;
        }
        window.preferences = storage.preferences;

      } catch (error) {
        window.showPreferencesError(error);
      }

      window.domainPatternToolTip =
        '<div style="width:750px;">' +
        'Exact match: e.g. <strong>example.com</strong> or <strong>www.example.com</strong><br>' +
        'Glob/Wildcard match: e.g. <strong>*.example.com</strong> (all example.com subdomains)<br>' +
        '<br>' +
        'Note: <strong>*.example.com</strong> would not match <strong>example.com</strong>, ' +
        'so you might need two patterns.</div>' +
        '<br>' +
        'Advanced: Parsed as RegExp when <strong>/pattern/flags</strong> is given ' +
        'and matches the full URL instead of just domain.';

      this.app = {
        initialized: true,
        preferences,
        permissions
      };

      if (!stateChanged) {
        // looks like jquery.address fired before tabs mounted, retrigger
        const hash = document.location.hash;
        $.address.value('_');
        $.address.value(hash.replace('#/', ''));
      }
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
        v-if="app.initialized"
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
    <!--
    <div
      class="ui tab segment"
      data-tab="statistics"
    >
      <statistics :preferences="preferences" />
    </div>
    <div
      class="ui tab segment"
      data-tab="export_import"
    >
      <export-import
        :preferences="preferences"
        @initialize="initialize"
      />
    </div> -->
    <message />
    <error @initialize="initialize" />
  </div>
</template>
