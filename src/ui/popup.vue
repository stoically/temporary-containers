<script>
import IsolationGlobal from './components/isolation/global';
import IsolationPerDomain from './components/isolation/perdomain';
import IsolationMac from './components/isolation/mac';
import Actions from './components/actions';
import Statistics from './components/statistics';
import Error from './components/error';
import Message from './components/message';

export default {
  components: {
    IsolationGlobal,
    IsolationPerDomain,
    IsolationMac,
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
  data() {
    return {
      initialized: false,
      show: false
    };
  },
  watch: {
    app(app) {
      if (!app.initialized) {
        return;
      }

      this.initialized = true;
      this.$nextTick(() => {
        $('.ui.accordion').accordion({
          animateChildren: false,
          duration: 0
        });

        $('.ui.sidebar').sidebar({
          transition: 'overlay'
        });

        this.show = true;
        $.tab('change tab', 'isolation-global');
      });
    }
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
    async openPreferences() {
      const tabs = await browser.tabs.query({
        url: browser.runtime.getURL('options.html')
      });
      if (tabs.length) {
        const tab = tabs[0];
        if (tab.windowId !== browser.windows.WINDOW_ID_CURRENT) {
          await browser.windows.update(tab.windowId, {focused: true});
        }
        browser.tabs.update(tab.id, {active: true});
        browser.tabs.reload(tab.id);
      } else {
        browser.tabs.create({
          url: browser.runtime.getURL('options.html')
        });
      }
      window.close();
    },
    toggleIsolation() {
      this.app.preferences.isolation.active = !this.app.preferences.isolation.active;
    }
  }
};
</script>

<style>
#container {
  padding: 10px;
  padding-top: 5px;
  min-height: 280px;
}
.hidden { display: none; }
.popup-margin {
  margin: 0 15px 10px 0;
}
.popup-exclude-margin {
  margin: 0 15px 10px 25px;
}
</style>

<template>
  <div
    v-if="initialized"
    v-show="show"
    class="pusher"
  >
    <div class="ui sidebar vertical menu">
      <a
        class="item"
        @click="changeTab('isolation-global')"
      >
        <i class="icon-circle-empty" /> Isolation Global
      </a>
      <a
        class="item"
        @click="changeTab('isolation-per-domain')"
      >
        <i class="icon-circle-empty" /> Isolation Per Domain
      </a>
      <a
        class="item"
        @click="changeTab('isolation-mac')"
      >
        <i class="icon-circle-empty" /> Isolation MAC
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
                v-if="app.preferences.isolation.active"
                class="item"
                title="Disable Isolation"
                @click="toggleIsolation"
              >
                <i class="dont icon" />
              </a>
              <a
                v-else
                class="item"
                title="Enable Isolation"
                @click="toggleIsolation"
              >
                <i class="exclamation red icon" />
              </a>
              <a
                class="item"
                title="Open Preferences/Options"
                @click="openPreferences"
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
                    xlink:href="../icons/page-w-16.svg"
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
            data-tab="isolation-global"
          >
            <isolation-global :app="app" />
          </div>
          <div
            class="ui tab"
            data-tab="isolation-per-domain"
          >
            <isolation-per-domain :app="app" />
          </div>
          <div
            class="ui tab"
            data-tab="isolation-mac"
          >
            <isolation-mac :app="app" />
          </div>
          <div
            class="ui tab"
            data-tab="actions"
          >
            <actions :app="app" />
          </div>
          <div
            class="ui tab"
            data-tab="statistics"
          >
            <statistics :app="app" />
          </div>
          <error :app="app" />
        </div>
      </div>
    </div>
  </div>
</template>
