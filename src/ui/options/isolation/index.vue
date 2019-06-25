<script>
import Global from './global';
import PerDomain from './perdomain';
import Mac from './mac';

export default {
  components: {
    Global,
    PerDomain,
    Mac
  },
  props: {
    appInitialized: Boolean,
    preferences: {
      type: Object,
      default: () => {}
    }
  }
};
</script>

<template>
  <div v-show="appInitialized">
    <div class="ui top attached tabular menu">
      <a
        class="active item"
        data-tab="isolation/global"
      >
        Global
      </a>
      <a
        class="item"
        data-tab="isolation/perdomain"
      >
        Per Domain
      </a>
      <a
        class="item"
        data-tab="isolation/mac"
      >
        Multi-Account Containers
      </a>
    </div>
    <div
      class="ui bottom attached active tab segment"
      data-tab="isolation/global"
    >
      <global
        v-if="appInitialized"
        :preferences="preferences"
      />
    </div>
    <div
      class="ui bottom attached tab segment"
      data-tab="isolation/perdomain"
    >
      <per-domain v-if="appInitialized" />
    </div>
    <div
      class="ui bottom attached tab segment"
      data-tab="isolation/mac"
    >
      <mac v-if="appInitialized" />
    </div>
  </div>
</template>
