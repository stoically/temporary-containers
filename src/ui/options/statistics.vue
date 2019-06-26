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
      permissions: this.app.permissions,
      statistics: this.app.storage.statistics
    };
  },
  async mounted() {
    $('#statistics .ui.checkbox').checkbox();

    const deletesHistoryStatisticsToolTip =
      '<div style="width:500px;">' +
      'The overall statistics include all Temporary Containers already<br>' +
      'This will show and collect separate statistics about how many "Deletes History<br>' +
      'Temporary Container" plus cookies and URLs with them got deleted.</div>';

    $('#deletesHistoryStatisticsField').popup({
      html: deletesHistoryStatisticsToolTip,
      inline: true,
      position: 'bottom left'
    });
  },
  methods: {
    async resetStatistics() {
      const confirmed = window.confirm(`
        Reset statistics?
      `);
      if (!confirmed) {
        return;
      }

      await browser.runtime.sendMessage({
        method: 'resetStatistics'
      });

      this.$root.$emit('initialize');
      this.$root.$emit('showMessage', 'Statistics have been reset.');
    }
  }
};
</script>

<template>
  <div
    id="statistics"
  >
    <div class="ui two column grid">
      <div class="column">
        <div class="ui raised segment">
          <div class="ui green ribbon label">
            Deleted
          </div>
          <div class="ui horizontal statistics">
            <div class="ui green statistic">
              <div
                id="containersDeleted"
                class="value"
              >
                {{ statistics.containersDeleted }}
              </div>
              <div class="label">
                Temporary Containers
              </div>
            </div>
            <div class="ui green statistic">
              <div
                id="cookiesDeleted"
                class="value"
              >
                {{ statistics.cookiesDeleted }}
              </div>
              <div class="label">
                Cookies
              </div>
            </div>
            <div class="ui green statistic">
              <div
                id="cacheDeleted"
                class="value"
              >
                {{ formatBytes(statistics.cacheDeleted, 0) }}
              </div>
              <div class="label">
                Cache
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="column">
        <div
          id="deletesHistoryStatistics"
          class="ui inverted segment"
          :class="{hidden: !preferences.deletesHistory.statistics}"
        >
          <div class="ui horizontal statistics">
            <div class="ui purple ribbon label">
              Deleted
            </div>
            <div class="ui purple inverted statistic">
              <div
                id="deletesHistoryContainersDeleted"
                class="value"
              >
                {{ statistics.deletesHistory.containersDeleted }}
              </div>
              <div class="label">
                "Deletes History Temporary Containers"
              </div>
            </div>
            <div class="ui purple inverted statistic">
              <div
                id="deletesHistoryCookiesDeleted"
                class="value"
              >
                {{ statistics.deletesHistory.cookiesDeleted }}
              </div>
              <div class="label">
                Cookies
              </div>
            </div>
            <div class="ui purple inverted statistic">
              <div
                id="deletesHistoryUrlsDeleted"
                class="value"
              >
                {{ statistics.deletesHistory.urlsDeleted }}
              </div>
              <div class="label">
                URLs from History
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <br>
    <div class="ui form">
      <div
        id="statisticsField"
        class="field"
      >
        <div class="ui checkbox">
          <input
            id="statisticsCheckbox"
            v-model="preferences.statistics"
            type="checkbox"
          >
          <label>Collect local statistics about Temporary Containers</label>
        </div>
      </div>
      <div
        id="deletesHistoryStatisticsField"
        class="field"
        :class="{hidden: !permissions.history}"
      >
        <div class="ui checkbox">
          <input
            id="deletesHistoryStatisticsCheckbox"
            v-model="preferences.deletesHistory.statistics"
            type="checkbox"
          >
          <label>Collect local statistics about "Deletes History Temporary Containers"</label>
        </div>
      </div>
      <div class="field">
        <button
          id="resetStatistics"
          class="ui button negative primary"
          @click="resetStatistics"
        >
          Reset Statistics
        </button>
      </div>
    </div>
  </div>
</template>
