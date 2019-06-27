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
    $('#popupField').popup({
      html: `
        <div style="width:500px;">
        The popup lets you<ul>
        <li> Configure Isolation Per Domain
        <li> Convert Temporary to Permanent Container
        <li> Convert Permanent to Temporary Container
        <li> Open current tab URL in new Temporary Container
        <li> Open current tab URL in new "Deletes History Temporary Container"
        <li> Open Preferences/Options
        <li> Open new Temporary Container
        <li> Open new "Deletes History Temporary Container"
        </ul></div>
      `,
      inline: true,
      position: 'bottom left'
    });

    $('#advancedGeneral .ui.dropdown').dropdown();
    $('#advancedGeneral .ui.checkbox').checkbox();
  },
  methods: {
    resetStorage() {
      const confirmed = window.confirm(`
        Wipe storage and reset it to default?\n
        This can't be undone.
      `);
      if (confirmed) {
        this.$root.$emit('resetStorage');
      }
    }
  }
};
</script>

<template>
  <div
    id="advancedGeneral"
    class="ui form"
  >
    <div
      id="popupField"
      class="field"
    >
      <div class="field">
        <label>
          Toolbar Icon Popup
          <span class="icon-info-circled" />
        </label>
        <div class="ui checkbox">
          <input
            id="browserActionPopup"
            v-model="preferences.browserActionPopup"
            type="checkbox"
          >
          <label>Show popup when pressing the toolbar icon instead of opening new Temporary Container</label>
        </div>
      </div>
      <div class="field">
        <div class="ui checkbox">
          <input
            id="pageAction"
            v-model="preferences.pageAction"
            type="checkbox"
          >
          <label>Show icon in the address bar that reveals the popup</label>
        </div>
      </div>
    </div>
    <div class="field">
      <label>Context Menu</label>
      <div class="field">
        <div class="ui checkbox">
          <input
            id="contextMenu"
            v-model="preferences.contextMenu"
            type="checkbox"
          >
          <label>Show Temporary Container entry in the right click on links context menu</label>
        </div>
      </div>
      <div class="field">
        <div
          id="contextMenuBookmarks"
          class="ui checkbox"
        >
          <input
            id="contextMenuBookmarksCheckbox"
            v-model="preferences.contextMenuBookmarks"
            type="checkbox"
          >
          <label>Show Temporary Container entry in the right click on bookmarks context menu</label>
        </div>
      </div>
    </div>
    <div class="field">
      <label>Keyboard shortcuts</label>
    </div>
    <div class="ui notice message">
      Starting with Firefox 66 it's possible to reassign keyboard shortcuts on the Add-ons overview page.
    </div>
    <div
      id="keyboardShortcutsAltCField"
      class="field"
    >
      <div class="ui checkbox">
        <input
          id="keyboardShortcutsAltC"
          v-model="preferences.keyboardShortcuts.AltC"
          type="checkbox"
        >
        <label>Alt+C - Open a new tab in a new Temporary Container</label>
      </div>
    </div>
    <div
      id="keyboardShortcutsAltPField"
      class="field"
      :class="{hidden: !permissions.history}"
    >
      <div class="ui checkbox">
        <input
          id="keyboardShortcutsAltP"
          v-model="preferences.keyboardShortcuts.AltP"
          type="checkbox"
        >
        <label>Alt+P - Open a new tab in a new 'Deletes History Temporary Container'</label>
      </div>
    </div>
    <div
      id="keyboardShortcutsAltNField"
      class="field"
    >
      <div class="ui checkbox">
        <input
          id="keyboardShortcutsAltN"
          v-model="preferences.keyboardShortcuts.AltN"
          type="checkbox"
        >
        <label>Alt+N - Open a new 'No Container' tab</label>
      </div>
    </div>
    <div
      id="keyboardShortcutsAltShiftCField"
      class="field"
    >
      <div class="ui checkbox">
        <input
          id="keyboardShortcutsAltShiftC"
          v-model="preferences.keyboardShortcuts.AltShiftC"
          type="checkbox"
        >
        <label>Alt+Shift+C - Open a new 'No Container' tab in a new window</label>
      </div>
    </div>
    <div
      id="keyboardShortcutsAltXField"
      class="field"
    >
      <div class="ui checkbox">
        <input
          id="keyboardShortcutsAltX"
          v-model="preferences.keyboardShortcuts.AltX"
          type="checkbox"
        >
        <label>Alt+X - Open a new tab in the same container as the currently active tab</label>
      </div>
    </div>
    <div class="field">
      <label>Creating new Temporary Containers in case of Isolation</label>
      <div class="ui checkbox">
        <input
          id="replaceTabs"
          v-model="preferences.replaceTabs"
          type="checkbox"
        >
        <label>Instead of creating a new tab replace the currently active tab</label>
      </div>
    </div>
    <div class="field">
      <label>Redirector tabs</label>
      <div class="ui checkbox">
        <input
          id="closeRedirectorTabs"
          v-model="preferences.closeRedirectorTabs.active"
          type="checkbox"
        >
        <label>Automatically close left-over redirector tabs after 2 seconds: <strong>t.co</strong> (Twitter), <strong>outgoing.prod.mozaws.net</strong> (AMO)</label>
      </div>
    </div>
    <div class="field">
      <label>Automatic Mode</label>
      <div class="ui negative message">
        <strong>Warning:</strong> New tabs (about:newtab and about:blank) can make network requests and set cookies, especially when you
        use the address bar for search engines. If you select "Don't reopen new tabs in Temporary Containers"
        here, cookies can get written into and read from the permanent default container as long as the new
        tab didn't get reopened in a Temporary Container.<br>
        <br>
        If you have a Cookie-Deletion-Add-on that automatically keeps your default/permanent containers clean
        and you use privacy-oriented search-engines like Startpage.com or DuckDuckGo then it should be no problem
        to use the "Don't reopen new tabs" preference.
      </div>
      <div data-tooltip="&quot;Deletes History Temporary Containers&quot; always reopen new tabs to avoid leaving traces in recently closed tabs">
        <select
          id="automaticModeNewTab"
          v-model="preferences.automaticMode.newTab"
          class="ui fluid dropdown"
        >
          <option value="created">
            Reopen new tabs in Temporary Containers. Flickers a bit and some Add-ons that intervene with initial tab opening might not work as expected but it prevents new tabs from writing and reading cookies in the default container and doesn't clutter recently closed tabs with "new tabs" (Default)
          </option>
          <option value="navigation">
            Don't reopen new tabs in Temporary Containers but instead on navigation. Prevents initial flickering and increases compatibility with other Add-ons that intervene with initial tab opening but new tabs can set and read cookies in the default container
          </option>
        </select>
      </div>
    </div>
    <div class="field">
      <label>Ignoring requests to</label>
      <div class="ui notice message">
        Note: Ticked checkbox means that the Domains get ignored from Temporary Containers. However, starting with
        Firefox 61.0 just unticking the checkbox isn't enough - you need to remove the domain from the <i>about:config</i>
        key <strong>extensions.webextensions.restrictedDomains</strong> list too if it's listed there.
        <br><br>
        To fully unignore requests to addons.mozilla.org you need to configure <strong>privacy.resistFingerprinting.block_mozAddonManager</strong>
        in <i>about:config</i> to Boolean <i>true</i> as well.
      </div>
      <div class="ui checkbox">
        <input
          id="ignoreRequestsToAMO"
          v-model="preferences.ignoreRequestsToAMO"
          type="checkbox"
        >
        <label>addons.mozilla.org<br><i>Firefox prevents contentscripts on and canceling requests to that domain.</i></label>
      </div>
    </div>
    <div class="field">
      <div class="ui checkbox">
        <input
          id="ignoreRequestsToPocket"
          v-model="preferences.ignoreRequestsToPocket"
          type="checkbox"
        >
        <label>getpocket.com<br><i>The Firefox Pocket integration only works in the default container</i></label>
      </div>
    </div>
    <div class="field">
      <label>Reset Storage</label>
      <button
        class="ui negative button"
        @click="resetStorage"
      >
        Wipe storage and reset it to default
      </button>
    </div>
  </div>
</template>
