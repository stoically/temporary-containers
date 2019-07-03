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
    v-if="!preferences.ui.isolation.introHintClosed"
    style="padding: 5px 0 15px 0"
  >
    <div
      class="ui compact message"
      style="font-size: 13px"
      :style="app.popup ? 'max-width: 320px' : ''"
    >
      <i
        aria-hidden="true"
        class="close icon"
        @click="preferences.ui.isolation.introHintClosed = true"
      />
      <div style="max-width: 98%">
        <div>
          A Navigation or Mouse Click matching
          Configurations other than Never result in Isolation,
          which cancels the Navigation and opens the Target Domain
          in a new Temporary Container.
          Exclude Configurations prevent Isolation if they match.
        </div>
        <div style="margin-top: 15px">
          You can click on "Isolation Glossary" (at the bottom of the page)
          to check for short word explanations.
        </div>
      </div>
    </div>
  </div>
</template>
