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
    v-if="!preferences.ui.isolation.globalIntroClosed"
    style="padding: 5px 0 15px 0"
  >
    <div
      class="ui message"
      style="font-size: 13px"
      :style="app.popup ? 'max-width: 320px' : ''"
    >
      <i
        aria-hidden="true"
        class="close icon"
        @click="preferences.ui.isolation.globalIntroClosed = true"
      />
      <div style="max-width: 98%">
        <div>
          <div style="margin-bottom: 15px">
            Global <span data-glossary="Configurations" /> apply to all tabs.
          </div>

          <div>
            A <span data-glossary="Navigation" /> or Mouse Click matching
            Configurations results in <span data-glossary="Isolation" />.
            Exclude Configurations prevent Isolation if they match.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
