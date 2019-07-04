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
    v-if="!preferences.ui.isolation.perDomainIntroClosed"
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
        @click="preferences.ui.isolation.perDomainIntroClosed = true"
      />
      <div style="max-width: 98%">
        <div style="margin-bottom: 15px">
          Per Domain <i>Configurations</i> apply if the <i>Tab Domain</i> or <i>Loading Domain</i> match the <i>Domain Pattern</i>
        </div>
        <div>
          A <span class="glossary navigation">Navigation</span> or Mouse Click matching
          Configurations other than Never results in Isolation,
          which cancels the Navigation and opens the Target Domain
          in a new Temporary Container, hence isolating the Origin Domain. Exclude Configurations prevent
          Isolation if they match.
        </div>
        <div style="margin-top: 15px; font-size: 12px">
          Hint: Looking for "Always open website in Temporary Container"? You can do that by configuring
          <i>Navigation</i> > <i>Originating Domain</i> to <i>Different from Loading Domain</i>, since if you navigate from
          a new tab the Originating Domain is "about:newtab".
        </div>
      </div>
    </div>
  </div>
</template>
