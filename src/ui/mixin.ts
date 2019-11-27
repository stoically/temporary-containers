import Vue from 'vue';

export const mixin = Vue.extend({
  methods: {
    t: browser.i18n.getMessage,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clone: (input: any): any => JSON.parse(JSON.stringify(input)),
  },
});
