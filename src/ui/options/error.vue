<script>
  export default {
    async mounted() {
      $('#resetStorage').on('click', async (event) => {
        event.preventDefault();

        let reset = false;
        try {
          reset = await browser.runtime.sendMessage({
            method: 'resetStorage'
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[resetStorage] couldnt send message', error);
        }

        if (!reset) {
          $('#preferenceserrorcontent').html(`
            Now this is embarrassing. Storage reset didn't work either.
            At this point you probably have to reinstall the Add-on.
            Sorry again, but there's not much I can do about it since
            this is almost certainly a Firefox API problem right now.
          `);
        } else {
          this.$emit('initialize');
          $('#preferenceserror').modal('hide');
          showMessage('Storage successfully reset.', true);
        }
      });
    }
  }
</script>

<template>
  <div id="preferenceserror" class="ui tiny modal">
    <h2 class="ui header">
      Error while loading preferences.
    </h2>
    <div id="preferenceserrorcontent" class="content">
      If you just installed the Temporary Containers Add-on you need to
      reset its storage by pressing the following button.<br><br>
      <button id="resetStorage" class="ui button negative primary" data-tooltip="No confirmation">Reset storage</button><br><br>
      If you already had the Add-on installed you probably just need to
      restart Firefox. If the Error persists you might need to reset the
      storage.<br>
      <br>Sorry about that. You can read about why this can happen
      <a href="https://github.com/stoically/temporary-containers/issues/68" target="_blank">here</a>.
      <div class="content" id="preferenceserrordesc">
      </div>
    </div>
  </div>
</template>
