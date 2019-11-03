<script>
export default {
  data() {
    return {
      message: false,
      error: false,
      initializeLoader: false,
      initializeError: false,
      initializeErrorMessage: false,
    };
  },
  mounted() {
    if (window.location.search.startsWith('?error')) {
      const searchParams = new window.URLSearchParams(
        document.location.search.substring(1)
      );
      this.initializeErrorMessage = searchParams.get('error');
    }

    this.$root.$on('showMessage', (message, options = { close: true }) => {
      this.error = false;
      this.message = message;

      if (options.close) {
        setTimeout(() => {
          this.message = false;
        }, 3000);
      }
    });
    this.$root.$on('hideMessage', () => {
      this.message = false;
    });
    this.$root.$on('showError', (message, options = { close: false }) => {
      this.error = true;
      this.message = message;

      if (options.close) {
        setTimeout(() => {
          this.message = false;
        }, 5000);
      }
    });
    this.$root.$on('showInitializeLoader', () => {
      this.initializeLoader = true;
    });
    this.$root.$on('hideInitializeLoader', () => {
      this.initializeLoader = false;
    });
    this.$root.$on('showInitializeError', async () => {
      this.initializeError = true;
    });
  },
  methods: {
    reload() {
      browser.runtime.reload();
    },
    async uninstall() {
      if (
        !window.confirm(`
        Uninstall?
      `)
      ) {
        return;
      }

      await browser.tabs.create({
        url: 'https://addons.mozilla.org/firefox/addon/temporary-containers',
      });
      browser.management.uninstallSelf();
    },
    debug() {
      browser.tabs.create({
        url: 'https://github.com/stoically/temporary-containers/issues',
      });
      browser.tabs.create({
        url: 'https://github.com/stoically/temporary-containers/wiki/Debug-Log',
      });
    },
  },
};
</script>

<template>
  <div>
    <div
      v-if="message"
      id="message"
      class="ui message"
      :class="{ positive: !error, negative: error }"
    >
      {{ message }}
    </div>
    <div v-if="initializeLoader">
      <div class="ui icon compact message">
        <i class="notched circle loading icon" />
        <div class="content">
          <div class="header">
            Loading
          </div>
          <p>
            You should never see this - and if you do, it'll probably result in
            an error, but maybe you're lucky. Let's just wait about 30 seconds
            to find out.
          </p>
        </div>
      </div>
    </div>
    <div v-if="initializeError">
      <div class="ui negative message">
        <h4>
          Temporary Containers didn't initialize correctly. Sorry about that.
        </h4>
        <div style="margin-top: 30px">
          Here are some things you could do now. Might also want to try
          restarting Firefox.
        </div>
        <div style="margin-top: 15px">
          <button class="ui small primary button" @click="reload">
            <i class="redo icon" />
            Reload Add-on and hope the best
          </button>
        </div>
        <div style="margin-top: 15px">
          <button class="ui small primary button" @click="debug">
            <i class="bug icon" />
            Open Debug-Log Instructions and GitHub Issues to help fix this error
          </button>
        </div>
        <div style="margin-top: 15px">
          <button class="ui small primary button" @click="uninstall">
            <i class="icon-trash-empty" />
            Uninstall Add-on and open it on addons.mozilla.org, where you could
            try installing again
          </button>
        </div>
        <div v-if="initializeErrorMessage" style="margin-top: 30px">
          <div class="ui divider" />
          The following error message was observed:
          <div style="margin-top: 15px">
            {{ initializeErrorMessage }}
          </div>
          <div style="margin-top: 15px">
            <a
              class="ui primary button"
              :href="
                `https://github.com/stoically/temporary-containers/issues/new?title=Initializing+failed&body=${encodeURIComponent(
                  initializeErrorMessage
                )}`
              "
              target="_blank"
            >
              Report Error Message as GitHub Issue
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
