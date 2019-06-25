<script>
import General from './general';
import Cookies from './cookies';
import DeleteHistory from './deletehistory';

export default {
  components: {
    General,
    Cookies,
    DeleteHistory
  },
  props: {
    app: {
      type: Object,
      required: true
    }
  }
};
</script>

<template>
  <div v-show="app.initialized">
    <div class="ui top attached tabular menu">
      <a
        class="active item"
        data-tab="advanced/general"
      >
        General
      </a>
      <a
        class="item"
        data-tab="advanced/setcookies"
      >
        Set Cookies
      </a>
      <a
        class="item"
        data-tab="advanced/deletehistory"
      >
        Delete History
      </a>
    </div>
    <div
      class="ui bottom attached active tab segment"
      data-tab="advanced/general"
    >
      <general
        v-if="app.initialized"
        :app="app"
      />
    </div>
    <div
      class="ui bottom attached tab segment"
      data-tab="advanced/setcookies"
    >
      <cookies
        v-if="app.initialized"
        :app="app"
      />
    </div>
    <div
      class="ui bottom attached tab segment"
      data-tab="advanced/deletehistory"
    >
      <delete-history
        v-if="app.initialized"
        :app="app"
      />
    </div>
  </div>
</template>
