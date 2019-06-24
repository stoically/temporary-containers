<script>
  import General from './general';
  import Isolation from './isolation';
  import Advanced from './advanced';
  import Statistics from './statistics';
  import ExportImport from './export_import';
  import Error from './error';

  export default {
    components: {
      General,
      Isolation,
      Advanced,
      Statistics,
      ExportImport,
      Error
    },
    async mounted() {
      this.initialize();
    },
    data: () => ({
      loaded: false,
      preferences: false
    }),
    methods: {
      async initialize() {
        $('.menu .item').tab({
          history: true,
          historyType: 'hash'
        });

        $('.ui.dropdown').dropdown();
        $('.ui.checkbox').checkbox();
        $('.ui.accordion').accordion({exclusive: false});

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

        this.loaded = true;
        this.preferences = preferences;
      }
    }
  }
</script>

<style>
  #container { padding: 25px; }
  .hidden { display: none !important; }
</style>

<template>
  <div>
    <div id="container" v-show="loaded" class="ui container">
      <div class="ui menu">
        <a class="item" data-tab="general">{{t('optionsNavGeneral')}}</a>
        <a class="item" data-tab="isolation">{{t('optionsNavIsolation')}}</a>
        <a class="item" data-tab="advanced">{{t('optionsNavAdvanced')}}</a>
        <a class="item" data-tab="statistics">{{t('optionsNavStatistics')}}</a>
        <a class="item" data-tab="export_import">{{t('optionsNavExportImport')}}</a>
      </div>

      <general :preferences="preferences"></general>
      <isolation :preferences="preferences"></isolation>
      <advanced :preferences="preferences"></advanced>
      <statistics :preferences="preferences"></statistics>
      <export-import @initialize="initialize" :preferences="preferences"></export-import>
      <error @initialize="initialize"></error>

      <div id="message" class="ui positive message hidden"></div>
    </div>
  </div>
</template>
