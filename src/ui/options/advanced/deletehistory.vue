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
      show: false
    };
  },
  mounted() {
    this.$nextTick(() => {
      $('#advancedDeletesHistory .ui.checkbox').checkbox();
      $('#advancedDeletesHistory .ui.dropdown').dropdown();
      this.show = true;
    });
  }
};
</script>

<template>
  <div
    v-show="show"
    id="advancedDeletesHistory"
    class="ui form"
  >
    <div class="field">
      <label>"Deletes History Temporary Containers"</label>
      <div class="ui negative message">
        <strong>
          Warning: Every website URL that you visit in a
          "Deletes History Temporary Container" will get deleted from your entire history.
          This means if you visited the same Website URL in another Container, Temporary Container
          or in the Default Container before or while visiting it in a "Deletes History Temporary Container"
          then those visits will get deleted from History too. This is true until Firefox supports a special history for container tabs.
          <a
            href="https://bugzilla.mozilla.org/show_bug.cgi?id=1283320"
            target="_blank"
          >The related Firefox bug can be found here</a>.<br>
          <br>
          Be careful. You have been warned. "Deletes History Temporary Containers" tabs have a "-deletes-history" suffix
          in the container name to remind you.
          <br><br>

          <div
            id="deletesHistoryContainerWarningRead"
            class="ui checkbox"
          >
            <input
              id="deletesHistoryContainerWarningReadCheckbox"
              v-model="preferences.deletesHistory.active"
              :disabled="preferences.deletesHistory.active"
              type="checkbox"
            >
            <label>I have read the Warning and understand the implications that come with using "Deletes History Temporary Containers".
              When ticking the checkbox Firefox will ask you for "Access browsing history" permissions.</label>
          </div>
        </strong>
      </div>
      <div class="ui notice message">
        You can open "Deletes History Temporary Containers" - also with the keyboard shortcut Alt+P - after you read the Warning and ticked the checkbox.<br>
        <br>
        The deletion applies to the full Website URL, not only the domain. That means, if you e.g. open a news article on
        your favorite news site in a "Deletes History Temporary Container" it won't delete all your previous visits to other news articles
        that you made outside of "Deletes History Temporary Containers" because the full Website URLs are different.<br>
        <br>
        "Deletes History Temporary Containers" will delete history when the "Deletes History Temporary Container" itself gets deleted after the last Tab in it closes.
      </div>
    </div>
    <div
      class="field"
      data-tooltip="This affects Automatic Mode, Toolbar Icon and the right-click context menu entry"
    >
      <label>Automatically create "Deletes History Temporary Containers"</label>
      <select
        id="deletesHistoryContainer"
        v-model="preferences.deletesHistory.automaticMode"
        class="ui fluid dropdown"
      >
        <option value="never">
          Don't automatically create "Deletes History Temporary Containers" instead of normal Temporary Containers (Default)
        </option>
        <option value="automatic">
          Automatically create "Deletes History Temporary Containers" instead of normal Temporary Containers
        </option>
      </select>
    </div>
    <div class="field">
      <label>Context Menu</label>
      <div class="ui checkbox">
        <input
          id="deletesHistoryContextMenu"
          v-model="preferences.deletesHistory.contextMenu"
          type="checkbox"
        >
        <label>Show additional "Deletes History Temporary Containers" entry in the right click on links context menu</label>
      </div>
    </div>
    <div class="field">
      <div
        id="deletesHistoryContextMenuBookmarks"
        class="ui checkbox"
      >
        <input
          id="deletesHistoryContextMenuBookmarksCheckbox"
          v-model="preferences.deletesHistory.contextMenuBookmarks"
          type="checkbox"
        >
        <label>Show additional "Deletes History Temporary Containers" entry in the right click on bookmarks context menu</label>
      </div>
    </div>
    <div
      class="field"
      data-tooltip="&quot;15minutes&quot; lets you &quot;undo close tabs&quot; in that timeframe"
    >
      <label>Delete no longer needed "Deletes History Temporary Containers"</label>
      <select
        id="deletesHistoryContainerRemoval"
        v-model="preferences.deletesHistory.containerRemoval"
        class="ui fluid dropdown"
      >
        <option value="15minutes">
          15 minutes after the last tab in it closes
        </option>
        <option value="instant">
          After the last tab in it closes (default)
        </option>
      </select>
    </div>
    <div class="field">
      <label>Isolation - Always per domain</label>
      <select
        id="deletesHistorycontainerAlwaysPerDomain"
        v-model="preferences.deletesHistory.containerAlwaysPerDomain"
        class="ui fluid dropdown"
      >
        <option value="never">
          Default
        </option>
        <option value="automatic">
          Open new "Deletes History Temporary Containers" for Domains configured "Isolation Always" instead of normal
          Temporary Containers
        </option>
      </select>
    </div>
    <div class="field">
      <label>Isolation - Navigating in tabs</label>
      <select
        id="deletesHistoryContainerIsolation"
        v-model="preferences.deletesHistory.containerIsolation"
        class="ui fluid dropdown"
      >
        <option value="never">
          Default
        </option>
        <option value="automatic">
          Open new "Deletes History Temporary Containers" when "Isolation on Navigation" takes place instead of normal
          Temporary Containers
        </option>
      </select>
    </div>
    <div class="field">
      <label>Isolation - Mouse clicks in "Deletes History Temporary Containers"</label>
      <select
        id="deletesHistoryContainerMouseClicks"
        v-model="preferences.deletesHistory.containerMouseClicks"
        class="ui fluid dropdown"
      >
        <option value="never">
          Default
        </option>
        <option value="automatic">
          Open new "Deletes History Temporary Containers" with Mouse clicks on links in "Deletes History Temporary Containers" instead of normal
          Temporary Containers
        </option>
      </select>
    </div>
    <div class="field">
      <label>Isolation - Middle Mouse Click in Temporary Containers</label>
      <select
        id="linkClickGlobalMiddleCreatesContainer"
        v-model="preferences.isolation.global.mouseClick.middle.container"
        class="ui fluid dropdown"
      >
        <option value="default">
          Default
        </option>
        <option value="deleteshistory">
          Open new "Deletes History Temporary Containers" with Middle Mouse clicks instead of Temporary Containers
        </option>
      </select>
    </div>
    <div class="field">
      <label>Isolation - Ctrl/Cmd+Left Mouse Click in Temporary Containers</label>
      <select
        id="linkClickGlobalCtrlLeftCreatesContainer"
        v-model="preferences.isolation.global.mouseClick.ctrlleft.container"
        class="ui fluid dropdown"
      >
        <option value="default">
          Default
        </option>
        <option value="deleteshistory">
          Open new "Deletes History Temporary Containers" with Ctrl/Cmd+Left Mouse clicks instead of Temporary Containers
        </option>
      </select>
    </div>
    <div class="field">
      <label>Isolation - Left Mouse Click in Temporary Containers</label>
      <select
        id="linkClickGlobalLeftCreatesContainer"
        v-model="preferences.isolation.global.mouseClick.left.container"
        class="ui fluid dropdown"
      >
        <option value="default">
          Default
        </option>
        <option value="deleteshistory">
          Open new "Deletes History Temporary Containers" with Left Mouse clicks instead of Temporary Containers
        </option>
      </select>
    </div>
  </div>
</template>
