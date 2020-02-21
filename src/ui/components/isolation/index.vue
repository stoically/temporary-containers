<script lang="ts">
import Vue from 'vue';

import Global from './global.vue';
import PerDomain from './perdomain.vue';
import Mac from './mac.vue';
import { App } from '~/ui/root';

export default Vue.extend({
  components: {
    Global,
    PerDomain,
    Mac,
  },
  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },
});
</script>

<template>
  <div v-show="app.initialized">
    <div class="ui top attached tabular menu">
      <a class="active item" data-tab="isolation/global">
        <span data-glossary="Global" />
      </a>
      <a class="item" data-tab="isolation/perdomain">
        <span data-glossary="Per Domain" />
      </a>
      <a class="item" data-tab="isolation/mac">
        <span data-glossary="Multi-Account Containers" />
      </a>
    </div>
    <div
      class="ui bottom attached active tab segment"
      data-tab="isolation/global"
    >
      <global v-if="app.initialized" :app="app" />
    </div>
    <div class="ui bottom attached tab segment" data-tab="isolation/perdomain">
      <per-domain v-if="app.initialized" :app="app" />
    </div>
    <div class="ui bottom attached tab segment" data-tab="isolation/mac">
      <mac v-if="app.initialized" :app="app" />
    </div>
  </div>
</template>
