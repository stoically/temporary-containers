import Vue from 'vue';

import DomainPattern from '../domainpattern.vue';
import { App } from '~/ui/root';

export default Vue.extend({
  components: {
    DomainPattern,
  },
  props: {
    app: {
      type: Object as () => App,
      required: true,
    },
  },
  data() {
    return {
      preferences: this.app.preferences,
      permissions: this.app.permissions,
      excludeDomainPattern: '',
    };
  },
  async mounted() {
    $('#advancedGeneral .ui.dropdown').dropdown();
    $('#advancedGeneral .ui.checkbox').checkbox();
    $('#advancedGeneral .ui.accordion').accordion({ exclusive: false });

    $('#advancedIgnoreRequestsForm').form({
      fields: {
        advancedIgnoreRequestsPattern: 'empty',
      },
      onSuccess: event => {
        event.preventDefault();
        if (
          !this.preferences.ignoreRequests.includes(this.excludeDomainPattern)
        ) {
          this.preferences.ignoreRequests.push(this.excludeDomainPattern);
        }
        this.excludeDomainPattern = '';
      },
    });
  },
  methods: {
    async resetStorage(): Promise<void> {
      if (
        !window.confirm(`
        Wipe storage and reset it to default?\n
        This can't be undone.
      `)
      ) {
        return;
      }

      let resetError;
      let reset = false;
      try {
        reset = await browser.runtime.sendMessage({
          method: 'resetStorage',
        });
      } catch (error) {
        console.error('[resetStorage] failed', error);
        resetError = error;
      }

      if (!reset) {
        this.$root.$emit(
          'showError',
          `Storage reset failed
          ${resetError ? `: ${resetError}` : ''}
        `
        );
      } else {
        this.$root.$emit('initialize', {
          showMessage: 'Storage successfully reset',
        });
      }
    },
    removeIgnoredDomain(ignoredPattern: string): void {
      this.preferences.ignoreRequests = this.preferences.ignoreRequests.filter(
        _ignoredPattern => ignoredPattern !== _ignoredPattern
      );
    },
  },
});
