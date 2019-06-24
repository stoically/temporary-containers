<script>
  import Isolation from './isolation';
  import Actions from './actions';
  import Statistics from './statistics';
  import Error from './error';
  import popup from './app.js';

  export default {
    components: {
      Isolation,
      Actions,
      Statistics,
      Error
    },
    mounted() {
      popup();
    }
  }
</script>

<style>
  #container {
    padding: 10px;
    padding-top: 5px;
    min-height: 250px;
  }
  .hidden { display: none; }
</style>

<template>
  <div>
    <div class="ui sidebar vertical menu">
      <a id="menuIsolation" class="item">
        <i class="icon-circle-empty"></i> Isolation Per Domain
      </a>
      <a id="menuActions" class="item">
        <i class="icon-exchange"></i> Actions
      </a>
      <a id="menuStatistics" class="item">
        <i class="icon-chart-bar"></i> Statistics
      </a>
    </div>
    <div class="pusher">
      <div class="ui pushable">
        <div id="container" class="ui">
          <div class="ui icon menu">
            <a id="menu" class="item">
              <i class="icon-menu"></i>
            </a>
            <div class="right menu">
              <a class="item" id="preferences" title="Open Preferences/Options">
                <i class="icon-cog-alt"></i>
              </a>
              <a class="hidden" id="deletesHistoryButton" title="Open new 'Deletes History Temporary Container'">
                <i class="icon-user-secret"></i>
              </a>
              <a id="tmpButton" class="item" title="Open new Temporary Container">
                <svg width="16" height="16">
                  <image xlink:href="../../core/icons/page-w-16.svg" x="0" y="0" width="100%" height="100%"></image>
                </svg>
              </a>
            </div>
          </div>
          <isolation></isolation>
          <actions></actions>
          <statistics></statistics>

          <error></error>
        </div>
      </div>
    </div>
  </div>
</template>
