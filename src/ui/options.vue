<script>
import General from './components/general';
import Isolation from './components/isolation';
import Advanced from './components/advanced';
import Statistics from './components/statistics';
import ExportImport from './components/export_import';
import Message from './components/message';

export default {
  components: {
    General,
    Isolation,
    Advanced,
    Statistics,
    ExportImport,
    Message
  },
  props: {
    app: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      installed: false
    };
  },
  async mounted() {
    if (window.location.search === '?installed') {
      this.installed = true;
    }

    $('.menu .item').tab({
      history: true,
      historyType: 'hash'
    });
    let stateChanged = false;
    $.address.change(() => stateChanged = true);

    setTimeout(() => {
      if (!stateChanged) {
        // looks like jquery.address fired before tabs mounted, retrigger
        const hash = document.location.hash;
        $.address.value('_');
        $.address.value(hash.replace('#/', ''));
      }
    }, 100);

    browser.runtime.onMessage.addListener(message => {
      if (typeof message !== 'object') {
        return;
      }
      if (message.info && message.info === 'preferencesUpdated' &&
        (!message.fromTabId || (message.fromTabId !== this.app.currentTab.id))) {
        this.$root.$emit('initialize');
      }
    });
  }
};
</script>

<style>
  #container { padding: 25px; }
  .hidden { display: none !important; }
</style>

<template>
  <div
    id="container"
    class="ui container"
  >
    <message />
    <div v-show="app.initialized">
      <div class="ui menu">
        <a
          class="item"
          data-tab="general"
        >
          <i
            class="icon-cog-alt"
            style="margin-right: 5px"
          />
          {{ t('optionsNavGeneral') }}</a>
        <a
          class="item"
          data-tab="isolation"
        >
          <i
            class="icon-circle-empty"
            style="margin-right: 2px"
          />
          {{ t('optionsNavIsolation') }}</a>
        <a
          class="item"
          data-tab="advanced"
        >
          <i
            class="graduation cap icon"
            style="margin-right: 5px"
          />
          {{ t('optionsNavAdvanced') }}</a>
        <a
          class="item"
          data-tab="statistics"
        >
          <i
            class="icon-chart-bar"
            style="margin-right: 5px"
          />
          {{ t('optionsNavStatistics') }}</a>
        <a
          class="item"
          data-tab="export_import"
        >
          <i
            class="save icon"
            style="margin-right: 5px"
          />
          {{ t('optionsNavExportImport') }}
        </a>
        <a
          class="item"
          href="https://stoically.github.io/temporary-containers"
          target="_blank"
        >
          <i
            class="question icon"
            style="margin-right: 5px"
          />
          Docs
        </a>
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
    </div>
  </div>
</template>
