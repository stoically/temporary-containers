<script>
import IsolationPerDomain from './isolation/perdomain';
import Actions from './actions';
import Statistics from './statistics';
import Error from './error';
import Message from './message';

export default {
  components: {
    IsolationPerDomain,
    Actions,
    Statistics,
    Message,
    Error
  },
  props: {
    app: {
      type: Object,
      required: true
    }
  },
  watch: {
    app(app) {
      if (app.initialized) {
        $.tab('change tab', 'isolation-per-domain');
      }
    }
  },
  mounted() {
    $('.ui.accordion').accordion({
      animateChildren: false,
      duration: 0
    });

    $('.ui.sidebar').sidebar({
      transition: 'overlay'
    });
  },
  methods: {
    changeTab(tab) {
      $('.ui.sidebar').sidebar('hide');
      $.tab('change tab', tab);
    },
    toggleSidebar() {
      $('.ui.sidebar').sidebar('toggle');
    },
    createTmp() {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer'
      });
      window.close();
    },
    createDeletesHistoryTmp() {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
        payload: {
          deletesHistory: true
        }
      });
      window.close();
    },
    preferences() {
      browser.tabs.create({
        url: browser.runtime.getURL('options.html')
      });
      window.close();
    }
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
        class="item"
        @click="changeTab('isolation-per-domain')"
      >
        <i class="icon-circle-empty" /> Isolation Per Domain
      </a>
      <a
        class="item"
        @click="changeTab('actions')"
      >
        <i class="icon-exchange" /> Actions
      </a>
      <a
        class="item"
        @click="changeTab('statistics')"
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
              class="item"
              @click="toggleSidebar"
            >
              <i class="icon-menu" />
            </a>
            <div class="right menu">
              <a
                class="item"
                title="Open Preferences/Options"
                @click="preferences"
              >
                <i class="icon-cog-alt" />
              </a>
              <a
                v-if="app.initialized && app.permissions.history"
                class="item"
                title="Open new 'Deletes History Temporary Container'"
                @click="createDeletesHistoryTmp"
              >
                <i class="icon-user-secret" />
              </a>
              <a
                class="item"
                title="Open new Temporary Container"
                @click="createTmp"
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
          <message />
          <div
            class="ui tab"
            data-tab="isolation-per-domain"
          >
            <isolation-per-domain
              v-if="app.initialized"
              :app="app"
            />
          </div>
          <div
            class="ui tab"
            data-tab="actions"
          >
            <actions
              v-if="app.initialized"
              :app="app"
            />
          </div>
          <div
            class="ui tab"
            data-tab="statistics"
          >
            <statistics
              v-if="app.initialized"
              :app="app"
            />
          </div>
          <error :app="app" />
        </div>
      </div>
    </div>
  </div>
</template>
