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
      show: false
    };
  },
  mounted() {
    $('#isolationMac.ui.dropdown').dropdown();
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
            Open new Temporary Containers if a permanent container tab tries to load
            a domain that isn't assigned to "Always open in" that container
          </option>
        </select>
      </div>
      <div class="field">
        <div class="ui message">
          This is not related to the Per Domain Isolation "Always open in" configuration, but instead applies to the
          <a
            href="https://addons.mozilla.org/firefox/addon/multi-account-containers/"
            target="_blank"
          >Multi-Account Containers</a> Add-on, which needs to be installed and configured properly for this to work.
          To add new sites to permanent containers with MAC you need to disable this configuration temporarly,
          <a
            href="https://github.com/stoically/temporary-containers/issues/170"
            target="_blank"
          >here's</a>
          some discussion about how this could be made simpler in the future.
        </div>
      </div>
    </div>
  </div>
</template>