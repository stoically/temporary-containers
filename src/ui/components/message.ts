import Vue from 'vue';

export default Vue.extend({
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
});
