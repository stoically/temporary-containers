<script lang="ts">
import Vue from 'vue';

import General from './general.vue';
import Cookies from './cookies.vue';
import Scripts from './scripts.vue';
import DeleteHistory from './deletehistory.vue';
import { App } from '~/ui/root';

export default Vue.extend({
  components: {
    General,
    Cookies,
    Scripts,
    DeleteHistory,
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
      <a class="active item" data-tab="advanced/general">
        General
      </a>
      <a class="item" data-tab="advanced/cookies">
        Cookies
      </a>
      <a class="item" data-tab="advanced/scripts">
        Scripts
      </a>
      <a class="item" data-tab="advanced/deletehistory">
        Delete History
      </a>
    </div>
    <div
      class="ui bottom attached active tab segment"
      data-tab="advanced/general"
    >
      <general v-if="app.initialized" :app="app" />
    </div>
    <div class="ui bottom attached tab segment" data-tab="advanced/cookies">
      <cookies v-if="app.initialized" :app="app" />
    </div>
    <div class="ui bottom attached tab segment" data-tab="advanced/scripts">
      <scripts v-if="app.initialized" :app="app" />
    </div>
    <div
      class="ui bottom attached tab segment"
      data-tab="advanced/deletehistory"
    >
      <delete-history v-if="app.initialized" :app="app" />
    </div>
  </div>
</template>
