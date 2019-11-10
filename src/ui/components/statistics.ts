import Vue from 'vue';
import { formatBytes } from '../../shared';

export default Vue.extend({
  props: {
    app: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      preferences: this.app.preferences,
      permissions: this.app.permissions,
      statistics: this.app.storage.statistics,
      popup: this.app.popup,
      formatBytes,
    };
  },
  async mounted() {
    $('#statistics .ui.checkbox').checkbox();

    if (!this.popup) {
      $('#deletesHistoryStatisticsField').popup({
        html: `
          <div style="width:500px;">
          The overall statistics include all Temporary Containers already<br>
          This will show and collect separate statistics about how many "Deletes History<br>
          Temporary Container" plus cookies and URLs with them got deleted.</div>
        `,
        inline: true,
        position: 'bottom left',
      });
    }
  },
  methods: {
    async resetStatistics() {
      if (
        !window.confirm(`
        Reset statistics?
      `)
      ) {
        return;
      }

      await browser.runtime.sendMessage({
        method: 'resetStatistics',
      });

      this.$root.$emit('initialize', {
        showMessage: 'Statistics have been reset.',
      });
    },
  },
});
