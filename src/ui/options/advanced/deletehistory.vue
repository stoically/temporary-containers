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
      permissions: this.app.permissions
    };
  },
  async mounted() {

    $('#deletesHistoryContainer').dropdown('set selected', preferences.deletesHistory.automaticMode);
    document.querySelector('#deletesHistoryContextMenu').checked = preferences.deletesHistory.contextMenu;
    document.querySelector('#deletesHistoryContextMenuBookmarksCheckbox').checked = preferences.deletesHistory.contextMenuBookmarks;
    $('#deletesHistoryContainerRemoval').dropdown('set selected', preferences.deletesHistory.containerRemoval);
    $('#deletesHistorycontainerAlwaysPerDomain').dropdown('set selected', preferences.deletesHistory.containerAlwaysPerDomain);
    $('#deletesHistoryContainerIsolation').dropdown('set selected', preferences.deletesHistory.containerIsolation);
    $('#deletesHistoryContainerMouseClicks').dropdown('set selected', preferences.deletesHistory.containerMouseClicks);

    window.requestHistoryPermissions = async () => {
      this.permissions.history = await browser.permissions.request({
        permissions: ['history']
      });
      if (this.permissions.history) {
        $('#keyboardShortcutsAltPField').removeClass('hidden');

        await browser.runtime.sendMessage({
          method: 'historyPermissionAllowed'
        });
      }
    };
    preferences.deletesHistory.automaticMode = document.querySelector('#deletesHistoryContainer').value;
    preferences.deletesHistory.contextMenu = document.querySelector('#deletesHistoryContextMenu').checked;
    preferences.deletesHistory.contextMenuBookmarks = document.querySelector('#deletesHistoryContextMenuBookmarksCheckbox').checked;
    preferences.deletesHistory.containerRemoval = document.querySelector('#deletesHistoryContainerRemoval').value;
    preferences.deletesHistory.containerAlwaysPerDomain = document.querySelector('#deletesHistorycontainerAlwaysPerDomain').value;
    preferences.deletesHistory.containerIsolation = document.querySelector('#deletesHistoryContainerIsolation').value;
    preferences.deletesHistory.containerMouseClicks = document.querySelector('#deletesHistoryContainerMouseClicks').value;
    $('#deletesHistoryContextMenuBookmarks').on('click', window.requestBookmarksPermissions);
    const historyPermission = await browser.permissions.contains({permissions: ['history']});
    if (historyPermission) {
      $('#deletesHistoryContainerWarningRead')
        .checkbox('check')
        .checkbox('set disabled');

      $('#keyboardShortcutsAltPField').removeClass('hidden');
      $('#deletesHistoryStatisticsField').removeClass('hidden');
    }

    $('#deletesHistoryContainerWarningRead').on('click', window.requestHistoryPermissions);

    $('#saveAdvancedDeleteHistoryPreferences').on('click', window.saveAdvancedPreferences);
  }
};
</script>

<template>
  <div class="ui form">
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
              v-model="permissions.history"
              :disabled="permissions.history"
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
    <div class="field">
      <button
        id="saveAdvancedDeleteHistoryPreferences"
        class="ui button primary"
      >
        Save
      </button>
    </div>
  </div>
</template>
