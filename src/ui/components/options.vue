<script>
export { default } from './options.ts';
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
