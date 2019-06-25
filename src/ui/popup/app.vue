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
};
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
  <div class="pusher">
    <div class="ui sidebar vertical menu">
      <a
        id="menuIsolation"
        class="item"
      >
        <i class="icon-circle-empty" /> Isolation Per Domain
      </a>
      <a
        id="menuActions"
        class="item"
      >
        <i class="icon-exchange" /> Actions
      </a>
      <a
        id="menuStatistics"
        class="item"
      >
        <i class="icon-chart-bar" /> Statistics
      </a>
    </div>
    <div>
      <div class="ui pushable">
        <div
          id="container"
          class="ui"
        >
          <div class="ui icon menu">
            <a
              id="menu"
              class="item"
            >
              <i class="icon-menu" />
            </a>
            <div class="right menu">
              <a
                id="preferences"
                class="item"
                title="Open Preferences/Options"
              >
                <i class="icon-cog-alt" />
              </a>
              <a
                id="deletesHistoryButton"
                class="hidden"
                title="Open new 'Deletes History Temporary Container'"
              >
                <i class="icon-user-secret" />
              </a>
              <a
                id="tmpButton"
                class="item"
                title="Open new Temporary Container"
              >
                <svg
                  width="16"
                  height="16"
                >
                  <image
                    xlink:href="../../core/icons/page-w-16.svg"
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                  />
                </svg>
              </a>
            </div>
          </div>
          <isolation />
          <actions />
          <statistics />

          <error />
        </div>
      </div>
    </div>
  </div>
</template>
