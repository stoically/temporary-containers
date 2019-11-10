import Vue from 'vue';
import Root from './root.vue';

export default (App: Vue.Component, { popup = false }) => {
  Vue.mixin({
    methods: {
      t: browser.i18n.getMessage,
      clone: input => JSON.parse(JSON.stringify(input)),
    },
  });

  new Vue({
    el: '#app',
    render(h) {
      return h(Root, {
        props: {
          App,
          popup,
        },
      });
    },
  });
};
