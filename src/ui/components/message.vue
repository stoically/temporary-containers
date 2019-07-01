<script>
export default {
  data() {
    return {
      message: false,
      error: false
    };
  },
  mounted() {
    this.$root.$on('showMessage', (message, options = {}) => {
      this.error = false;
      this.message = message;

      if (!options.hide) {
        setTimeout(() => {
          this.message = false;
        }, 3000);
      }
    });
    this.$root.$on('hideMessage', () => {
      this.message = false;
    });
    this.$root.$on('showError', (message, options = {}) => {
      this.error = true;
      this.message = message;

      if (options.close) {
        setTimeout(() => {
          this.message = false;
        }, 5000);
      }
    });
  }
};
</script>

<template>
  <div
    id="message"
    class="ui message"
    :class="{hidden: !message, positive: !error, negative: error}"
  >
    {{ message }}
  </div>
</template>

