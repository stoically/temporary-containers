<script>
  import General from './general';
  import Isolation from './isolation';
  import Advanced from './advanced';
  import Statistics from './statistics';
  import ExportImport from './export_import';
  import Error from './error';
  import options from './app.js';

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
      $('.menu .item').tab({
        history: true,
        historyType: 'hash'
      });
      await options();
      $('#container').removeClass('hidden');
    }
  }
</script>

<style>
  body { padding: 25px !important; }
  .hidden { display: none !important; }
</style>

<template>
  <div>
    <div id="container" class="ui container hidden">
      <div class="ui menu">
        <a class="item" data-tab="general">{{t('optionsNavGeneral')}}</a>
        <a class="item" data-tab="isolation">{{t('optionsNavIsolation')}}</a>
        <a class="item" data-tab="advanced">{{t('optionsNavAdvanced')}}</a>
        <a class="item" data-tab="statistics">{{t('optionsNavStatistics')}}</a>
        <a class="item" data-tab="export_import">{{t('optionsNavExportImport')}}</a>
      </div>
      <general></general>
      <isolation></isolation>
      <advanced></advanced>
      <statistics></statistics>
      <export-import></export-import>
      <div id="message" class="ui positive message hidden"></div>

      <error></error>
    </div>
  </div>
</template>
