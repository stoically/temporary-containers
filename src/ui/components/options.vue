<script lang="ts">
import mixins from 'vue-typed-mixins';
import { mixin } from '../mixin';

import General from './general.vue';
import Isolation from './isolation/index.vue';
import Advanced from './advanced/index.vue';
import Statistics from './statistics.vue';
import ExportImport from './export-import.vue';
import Message from './message.vue';
import Glossary from './glossary/index.vue';
import { App } from '../root';

export default mixins(mixin).extend({
  components: {
    General,
    Isolation,
    Advanced,
    Statistics,
    ExportImport,
    Message,
    Glossary,
  },
  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },
  data() {
    return {
      installed: false,
    };
  },
  async mounted() {
    if (window.location.search === '?installed') {
      this.installed = true;
    }

    this.initTabs();

    browser.runtime.onMessage.addListener(message => {
      if (typeof message !== 'object') {
        return;
      }
      if (
        message.info &&
        message.info === 'preferencesUpdated' &&
        (!message.fromTabId || message.fromTabId !== this.app.currentTab.id)
      ) {
        this.$root.$emit('initialize');
      }
    });
  },
  methods: {
    initTabs(): void {
      $('.menu .item').tab({
        history: true,
        historyType: 'hash',
      });
      let stateChanged = false;
      $.address.change(() => (stateChanged = true));

      setTimeout(() => {
        if (!stateChanged) {
          // looks like jquery.address fired before tabs mounted, retrigger
          const hash = document.location.hash;
          $.address.value('_');
          $.address.value(hash.replace('#/', ''));
        }
      }, 100);
    },
  },
});
</script>

<style>
#container {
  padding: 25px;
}
.hidden {
  display: none !important;
}
</style>

<template>
  <div id="container" class="ui container">
    <message v-if="!app.initialized" />
    <div v-show="app.initialized">
      <div class="ui menu">
        <a class="item" data-tab="general">
          <i class="icon-cog-alt" style="margin-right: 5px" />
          {{ t('optionsNavGeneral') }}</a
        >
        <a class="item" data-tab="isolation">
          <i class="icon-circle-empty" style="margin-right: 2px" />
          {{ t('optionsNavIsolation') }}</a
        >
        <a class="item" data-tab="advanced">
          <i class="graduation cap icon" style="margin-right: 5px" />
          {{ t('optionsNavAdvanced') }}</a
        >
        <a class="item" data-tab="statistics">
          <i class="icon-chart-bar" style="margin-right: 5px" />
          {{ t('optionsNavStatistics') }}</a
        >
        <a class="item" data-tab="export-import">
          <i class="save icon" style="margin-right: 5px" />
          {{ t('optionsNavExportImport') }}
        </a>
      </div>

      <message />

      <div class="ui tab segment" data-tab="general">
        <general v-if="app.initialized" :app="app" />
      </div>
      <div class="ui tab segment" data-tab="isolation">
        <isolation :app="app" />
      </div>
      <div class="ui tab segment" data-tab="advanced">
        <advanced :app="app" />
      </div>
      <div class="ui tab segment" data-tab="statistics">
        <statistics v-if="app.initialized" :app="app" />
      </div>
      <div class="ui tab segment" data-tab="export-import">
        <export-import v-if="app.initialized" :app="app" />
      </div>
    </div>
    <glossary :app="app" />
  </div>
</template>
