export default (App) => {
  Vue.mixin({
    methods: {
      t: browser.i18n.getMessage,
      formatBytes(bytes, decimals) {
        // https://stackoverflow.com/a/18650828
        if (bytes == 0) return '0 Bytes';
        let k = 1024,
          dm = decimals === undefined ? 2 : decimals,
          sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
          i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
      }
    }
  });

  return {
    el: '#app',
    render: h => h(App),
    mounted() {
      this.$on('savePreferences', async preferences => {
        try {
          await browser.runtime.sendMessage({
            method: 'savePreferences',
            payload: {
              preferences
            }
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('error while saving preferences', error);
          showError('Error while saving preferences!');
        }
      });
    }
  };
};