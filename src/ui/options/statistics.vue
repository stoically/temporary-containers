<script>
  export default {
    data: () => ({
      loaded: false
    }),
    props: ['preferences'],
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
    }
  }
</script>

<template>
  <div v-show="loaded" class="ui tab segment" data-tab="statistics">
    <div class="ui two column grid">
      <div class="column">
        <div class="ui raised segment">
          <div class="ui green ribbon label">Deleted</div>
          <div class="ui horizontal statistics">
            <div class="ui green statistic">
              <div class="value" id="containersDeleted">
                0
              </div>
              <div class="label">
                Temporary Containers
              </div>
            </div>
            <div class="ui green statistic">
              <div class="value" id="cookiesDeleted">
                0
              </div>
              <div class="label">
                Cookies
              </div>
            </div>
            <div class="ui green statistic">
              <div class="value" id="cacheDeleted">
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
        <div class="ui inverted segment hidden" id="deletesHistoryStatistics">
          <div class="ui horizontal statistics">
            <div class="ui purple ribbon label">Deleted</div>
            <div class="ui purple inverted statistic">
              <div class="value" id="deletesHistoryContainersDeleted">
                0
              </div>
              <div class="label">
                "Deletes History Temporary Containers"
              </div>
            </div>
            <div class="ui purple inverted statistic">
              <div class="value" id="deletesHistoryCookiesDeleted">
                0
              </div>
              <div class="label">
                Cookies
              </div>
            </div>
            <div class="ui purple inverted statistic">
              <div class="value" id="deletesHistoryUrlsDeleted">
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
      <div class="field" id="statisticsField">
        <div class="ui checkbox">
          <input type="checkbox" id="statisticsCheckbox">
          <label>Collect local statistics about Temporary Containers</label>
        </div>
      </div>
      <div class="field hidden" id="deletesHistoryStatisticsField">
        <div class="ui checkbox">
          <input type="checkbox" id="deletesHistoryStatisticsCheckbox">
          <label>Collect local statistics about "Deletes History Temporary Containers" [?]</label>
        </div>
      </div>
      <div class="field">
        <button id="saveStatisticsPreferences" class="ui button primary">Save</button>
        <button id="resetStatistics" class="ui button negative primary" data-tooltip="No confirmation">Reset Statistics</button>
      </div>
    </div>
  </div>
</template>
