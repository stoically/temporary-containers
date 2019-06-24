<template>
  <div class="ui tab segment" data-tab="statistics">
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
    <form class="ui form">
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
    </form>
  </div>
</template>
