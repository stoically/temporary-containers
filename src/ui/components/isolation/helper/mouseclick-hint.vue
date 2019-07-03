<script>
export default {
  props: {
    app: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      preferences: this.app.preferences
    };
  }
};
</script>

<template>
  <div
    v-if="!preferences.ui.isolation.mouseclickHintClosed"
    class="ui small compact message"
  >
    <i
      aria-hidden="true"
      class="close icon"
      @click="preferences.ui.isolation.mouseclickHintClosed = true"
    />
    <div style="max-width: 98%">
      Navigation Configuration also includes Mouse Click, as they results in Navigation, so you might not need to additionally
      configure Mouse Click, unless you want a stricter Configuration for a particular Mouse Click.
      Navigation Configuration is also more reliable, so you should prefer that if possible.
    </div>
  </div>
</template>