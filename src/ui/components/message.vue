<script>
export { default } from './message.ts';
</script>

<template>
  <div>
    <div
      v-if="message"
      id="message"
      class="ui message"
      :class="{ positive: !error, negative: error }"
    >
      {{ message }}
    </div>
    <div v-if="initializeLoader">
      <div class="ui icon compact message">
        <i class="notched circle loading icon" />
        <div class="content">
          <div class="header">
            Loading
          </div>
          <p>
            You should never see this - and if you do, it'll probably result in
            an error, but maybe you're lucky. Let's just wait about 30 seconds
            to find out.
          </p>
        </div>
      </div>
    </div>
    <div v-if="initializeError">
      <div class="ui negative message">
        <h4>
          Temporary Containers didn't initialize correctly. Sorry about that.
        </h4>
        <div style="margin-top: 30px">
          Here are some things you could do now. Might also want to try
          restarting Firefox.
        </div>
        <div style="margin-top: 15px">
          <button class="ui small primary button" @click="reload">
            <i class="redo icon" />
            Reload Add-on and hope the best
          </button>
        </div>
        <div style="margin-top: 15px">
          <button class="ui small primary button" @click="debug">
            <i class="bug icon" />
            Open Debug-Log Instructions and GitHub Issues to help fix this error
          </button>
        </div>
        <div style="margin-top: 15px">
          <button class="ui small primary button" @click="uninstall">
            <i class="icon-trash-empty" />
            Uninstall Add-on and open it on addons.mozilla.org, where you could
            try installing again
          </button>
        </div>
        <div v-if="initializeErrorMessage" style="margin-top: 30px">
          <div class="ui divider" />
          The following error message was observed:
          <div style="margin-top: 15px">
            {{ initializeErrorMessage }}
          </div>
          <div style="margin-top: 15px">
            <a
              class="ui primary button"
              :href="
                `https://github.com/stoically/temporary-containers/issues/new?title=Initializing+failed&body=${encodeURIComponent(
                  initializeErrorMessage
                )}`
              "
              target="_blank"
            >
              Report Error Message as GitHub Issue
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
