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
  <div>
    <a
      class="ui blue ribbon label"
      href="https://github.com/stoically/temporary-containers/wiki/Multi-Account-Containers-Isolation"
      target="_blank"
      style="margin-bottom: 15px"
    >
      <i class="icon-info-circled" /> Multi-Account Containers Isolation?
    </a>

    <div class="ui form">
      <div
        v-if="!popup"
        class="field"
      >
        <div class="ui message">
          This applies to the
          <a
            href="https://addons.mozilla.org/firefox/addon/multi-account-containers/"
            target="_blank"
          >Multi-Account Containers</a> Add-on, which needs to be installed and configured properly for this to work.
          <strong>It's not related to the Per Domain Isolation "Always open in" configuration.</strong>
          To add new sites to permanent containers with MAC you need to disable this configuration temporarly,
          or use the toolbar icon popup to disable Isolation globally (circle icon), which makes assigning new sites easier.
          You can enable the popup in the general preferences.
          <a
            href="https://github.com/stoically/temporary-containers/issues/170"
            target="_blank"
          >Here's</a>
          some discussion about how this could be made simpler in the future.
        </div>
      </div>
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
            {{ !popup ?
              `Open new Temporary Containers if a permanent container tab tries to load
              a domain that isn't assigned to "Always open in" that container` :
              'Enabled'
            }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>