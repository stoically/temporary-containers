<script>
export default {
  props: {
    preferences: {
      type: Object,
      default: () => {}
    }
  },
  data: () => ({
    loaded: false
  }),
  watch: {
    preferences() {
      $('#saveStatisticsPreferences').on('click', window.saveStatisticsPreferences);
      $('#resetStatistics').on('click', window.resetStatistics);
      $('#deletesHistoryStatisticsField').on('click', window.showDeletesHistoryStatistics);

      document.querySelector('#statisticsCheckbox').checked = preferences.statistics;
      document.querySelector('#deletesHistoryStatisticsCheckbox').checked = preferences.deletesHistory.statistics;

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

      window.updateStatistics();
      window.showDeletesHistoryStatistics();

      this.loaded = true;
    }
  },
  mounted() {
    window.saveStatisticsPreferences = async (event) => {
      event.preventDefault();
      preferences.statistics = document.querySelector('#statisticsCheckbox').checked;
      preferences.deletesHistory.statistics = document.querySelector('#deletesHistoryStatisticsCheckbox').checked;
      await savePreferences();
    };

    window.resetStatistics = async (event) => {
      event.preventDefault();
      await browser.runtime.sendMessage({
        method: 'resetStatistics'
      });

      updateStatistics();
      showMessage('Statistics have been reset.');
    };

    window.showDeletesHistoryStatistics = async () => {
      const checked = document.querySelector('#deletesHistoryStatisticsCheckbox').checked;
      if (checked) {
        $('#deletesHistoryStatistics').removeClass('hidden');
      } else {
        $('#deletesHistoryStatistics').addClass('hidden');
      }
    };
  }
};
</script>

<template>
  <div
    v-show="loaded"
    class="ui tab segment"
    data-tab="statistics"
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
                0
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
                0
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
                0
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
          class="ui inverted segment hidden"
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
                0
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
                0
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
                0
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
            type="checkbox"
          >
          <label>Collect local statistics about Temporary Containers</label>
        </div>
      </div>
      <div
        id="deletesHistoryStatisticsField"
        class="field hidden"
      >
        <div class="ui checkbox">
          <input
            id="deletesHistoryStatisticsCheckbox"
            type="checkbox"
          >
          <label>Collect local statistics about "Deletes History Temporary Containers"</label>
        </div>
      </div>
      <div class="field">
        <button
          id="saveStatisticsPreferences"
          class="ui button primary"
        >
          Save
        </button>
        <button
          id="resetStatistics"
          class="ui button negative primary"
          data-tooltip="No confirmation"
        >
          Reset Statistics
        </button>
      </div>
    </div>
  </div>
</template>
