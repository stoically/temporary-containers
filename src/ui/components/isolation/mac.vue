<script lang="ts">
import { App } from '~/ui/root';
import mixins from 'vue-typed-mixins';
import { mixin } from '~/ui/mixin';

export default mixins(mixin).extend({
  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },
  data() {
    return {
      preferences: this.app.preferences,
      popup: this.app.popup,
      show: false,
    };
  },
  mounted() {
    $('#isolationMac.ui.dropdown').dropdown();
  },
});
</script>

<template>
  <div class="ui form">
    <div class="field">
      <select
        id="isolationMac"
        v-model="preferences.isolation.mac.action"
        class="ui fluid dropdown"
      >
        <option value="disabled">
          {{ t('optionsIsolationDisabled') }}
        </option>
        <option value="enabled">
          {{ t('optionsIsolationMacIsolateNonMac') }}
        </option>
      </select>
    </div>
  </div>
</template>
