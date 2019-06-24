<script>
  import General from './options/general';
  import Isolation from './options/isolation';
  import Advanced from './options/advanced';
  import Statistics from './options/statistics';
  import ExportImport from './options/export_import';
  import Error from './options/error';
  import options from './options.js';

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
      $('#content').removeClass('hidden');
    }
  }
</script>

<style>
  body { padding: 25px !important; }
  .hidden { display: none !important; }
</style>

<template>
  <div>
    <div id="container" class="ui container">
      <div id="content" class="hidden">
        <div class="ui menu">
          <a class="item" data-tab="general">General</a>
          <a class="item" data-tab="isolation">Isolation</a>
          <a class="item" data-tab="advanced">Advanced</a>
          <a class="item" data-tab="statistics">Statistics</a>
          <a class="item" data-tab="export_import">Export/Import</a>
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
  </div>
</template>
