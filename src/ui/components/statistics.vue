<script>
export { default } from './statistics.ts';
</script>

<template>
  <div id="statistics">
    <div
      class="ui"
      :class="{ 'two column grid': !popup, 'one column grid': popup }"
    >
      <div class="column">
        <div class="ui raised segment">
          <div class="ui green ribbon label">
            Deleted
          </div>
          <div class="ui horizontal statistics">
            <div class="ui green statistic">
              <div id="containersDeleted" class="value">
                {{ statistics.containersDeleted }}
              </div>
              <div class="label">
                {{ !popup ? 'Temporary Containers' : 'tmp' }}
              </div>
            </div>
            <div class="ui green statistic">
              <div id="cookiesDeleted" class="value">
                {{ statistics.cookiesDeleted }}
              </div>
              <div class="label">
                Cookies
              </div>
            </div>
            <div class="ui green statistic">
              <div id="cacheDeleted" class="value">
                {{ formatBytes(statistics.cacheDeleted, 0) }}
              </div>
              <div class="label">
                Cache
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!popup" class="column">
        <div
          id="deletesHistoryStatistics"
          class="ui inverted segment"
          :class="{ hidden: !preferences.deletesHistory.statistics }"
        >
          <div class="ui horizontal statistics">
            <div class="ui purple ribbon label">
              Deleted
            </div>
            <div class="ui purple inverted statistic">
              <div id="deletesHistoryContainersDeleted" class="value">
                {{ statistics.deletesHistory.containersDeleted }}
              </div>
              <div class="label">
                Temporary Containers
              </div>
            </div>
            <div class="ui purple inverted statistic">
              <div id="deletesHistoryCookiesDeleted" class="value">
                {{ statistics.deletesHistory.cookiesDeleted }}
              </div>
              <div class="label">
                Cookies
              </div>
            </div>
            <div class="ui purple inverted statistic">
              <div id="deletesHistoryUrlsDeleted" class="value">
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
    <br />
    <div class="ui form">
      <div id="statisticsField" class="field">
        <div class="ui checkbox">
          <input
            id="statisticsCheckbox"
            v-model="preferences.statistics"
            type="checkbox"
          />
          <label>
            {{
              !popup
                ? 'Collect local statistics about Temporary Containers'
                : 'Collect local statistics'
            }}
          </label>
        </div>
      </div>
      <div
        id="deletesHistoryStatisticsField"
        class="field"
        :class="{ hidden: !permissions.history }"
      >
        <div class="ui checkbox">
          <input
            id="deletesHistoryStatisticsCheckbox"
            v-model="preferences.deletesHistory.statistics"
            type="checkbox"
          />
          <label>
            {{
              !popup
                ? 'Collect local statistics about "Deletes History Temporary Containers"'
                : 'Collect local "Deletes History" statistics'
            }}
          </label>
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
