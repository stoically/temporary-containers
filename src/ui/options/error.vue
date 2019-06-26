<script>
export default {
  props: {
    app: {
      type: Object,
      required: true
    }
  },
  async mounted() {
    this.$root.$on('showPreferencesError', error => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        $('#preferenceserrordesc').html(`<br><br>
          The following error was observed, would be really helpful
          if you could file an <a href="https://github.com/stoically/temporary-containers/issues" target="_blank">issue on GitHub</a> with it:
          <br><br>
          ${error.toString()}
        `);
      }
      $('#preferenceserror')
        .modal({
          closable: false
        })
        .modal('show');
    });

    this.$root.$on('resetStorage', () => {
      this.resetStorage();
    });
  },
  methods: {
    async resetStorage(event) {
      if (event) {
        event.preventDefault();
      }

      let reset = false;
      try {
        reset = await browser.runtime.sendMessage({
          method: 'resetStorage'
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[resetStorage] failed', error);
      }

      if (!reset) {
        $('#preferenceserrorcontent').html(`
          Storage reset didn't work.
          At this point you probably have to reinstall the Add-on.
          Sorry again, but there's not much I can do about it since
          this is almost certainly a Firefox API problem right now.
        `);
      } else {
        this.$root.$emit('initialize');
        $('#preferenceserror').modal('hide');
        this.$root.$emit('showMessage', 'Storage successfully reset');
      }
    }
  }
};
</script>

<template>
  <div
    id="preferenceserror"
    class="ui tiny modal"
  >
    <h2 class="ui header">
      Error while loading preferences.
    </h2>
    <div
      id="preferenceserrorcontent"
      class="content"
    >
      If you just installed the Temporary Containers Add-on you need to
      reset its storage by pressing the following button.<br><br>
      <button
        id="resetStorage"
        class="ui button negative primary"
        data-tooltip="No confirmation"
        @click="resetStorage"
      >
        Reset storage
      </button><br><br>
      If you already had the Add-on installed you probably just need to
      restart Firefox. If the Error persists you might need to reset the
      storage.<br>
      <br>Sorry about that. You can read about why this can happen
      <a
        href="https://github.com/stoically/temporary-containers/issues/68"
        target="_blank"
      >here</a>.
      <div
        id="preferenceserrordesc"
        class="content"
      />
    </div>
  </div>
</template>
