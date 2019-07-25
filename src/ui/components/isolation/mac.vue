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
      preferences: this.app.preferences,
      popup: this.app.popup,
      show: false
    };
  },
  mounted() {
    $('#isolationMac.ui.dropdown').dropdown();
  }
};
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
          Disabled
        </option>
        <option value="enabled">
          Isolate Navigations in Permanent Containers whose Target Domain isn't MAC-"Always open in"
          assigned to that container
        </option>
      </select>
    </div>
  </div>
</template>