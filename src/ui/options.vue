<script>
import General from './components/general';
import Isolation from './components/isolation';
import Advanced from './components/advanced';
import Statistics from './components/statistics';
import ExportImport from './components/export_import';
import Message from './components/message';
import Error from './components/error';

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
  props: {
    app: {
      type: Object,
      required: true
    }
  },
  async mounted() {
    $('.menu .item').tab({
      history: true,
      historyType: 'hash'
    });
    let stateChanged = false;
    $.address.change(() => stateChanged = true);

    window.setTimeout(() => {
      if (!stateChanged) {
        // looks like jquery.address fired before tabs mounted, retrigger
        const hash = document.location.hash;
        $.address.value('_');
        $.address.value(hash.replace('#/', ''));
      }
    }, 100);
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
