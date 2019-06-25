<script>
export default {
  props: {
    preferences: {
      type: Object,
      default: () => {}
    }
  },
  mounted() {
    $('#isolationMac.ui.dropdown').dropdown();
    $('#isolationMac').dropdown('set selected', preferences.isolation.mac.action);
    $('#saveIsolationMacPreferences').on('click', window.saveIsolationGlobalPreferences);
  }
};
</script>

<template>
  <div>
    <a
      class="ui blue ribbon label"
      href="https://github.com/stoically/temporary-containers/wiki/Multi-Account-Containers-Isolation"
      target="_blank"
    >
      <i class="icon-info-circled" /> Multi-Account Containers Isolation?
    </a><br><br>
    <div class="ui form">
      <h4>
        Open new Temporary Containers if a permanent container tab tries to load
        a domain that isn't assigned to "Always open in" that container with
        <a
          href="https://addons.mozilla.org/firefox/addon/multi-account-containers/"
          target="_blank"
        >Multi-Account Containers</a>
        (Note: This is different from the Per Domain "Always open in" configuration)
      </h4>
      <div class="field">
        <select
          id="isolationMac"
          class="ui fluid dropdown"
        >
          <option value="disabled">
            Disabled
          </option>
          <option value="enabled">
            Enabled
          </option>
        </select>
      </div>
      <div class="field">
        <button
          id="saveIsolationMacPreferences"
          class="ui button primary"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>