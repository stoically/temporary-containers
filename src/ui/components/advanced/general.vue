<script>
import DomainPattern from '../domainpattern';

export default {
  components: {
    DomainPattern
  },
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
      excludeDomainPattern: ''
    };
  },
  async mounted() {
    $('#advancedGeneral .ui.dropdown').dropdown();
    $('#advancedGeneral .ui.checkbox').checkbox();
    $('#advancedGeneral .ui.accordion').accordion({exclusive: false});

    $('#advancedIgnoreRequetsForm').form({
      fields: {
        advancedIgnoreRequetsPattern: 'empty'
      },
      onSuccess: (event) => {
        event.preventDefault();
        if (!this.preferences.ignoreRequests.includes(this.excludeDomainPattern)) {
          this.preferences.ignoreRequests.push(this.excludeDomainPattern);
        }
        this.excludeDomainPattern = '';
      }
    });
  },
  methods: {
    resetStorage() {
      if (window.confirm(`
        Wipe storage and reset it to default?\n
        This can't be undone.
      `)) {
        this.$root.$emit('resetStorage');
      }
    },
    removeIgnoredDomain(ignoredPattern) {
      this.preferences.ignoreRequests = this.preferences.ignoreRequests.filter(_ignoredPattern =>
        ignoredPattern !== _ignoredPattern
      );
    }
  }
};
</script>

<style>
.m-b {
  margin-bottom: 20px;
}
</style>

<template>
  <div
    id="advancedGeneral"
    class="ui form"
  >
    <div class="ui accordion">
      <div class="title">
        <h4>
          <i class="dropdown icon" />
          Automatic Mode
        </h4>
      </div>
      <div class="content">
        <div
          :data-tooltip="app.permissions.history ?
            '&quot;Deletes History Temporary Containers&quot; always reopen new tabs to avoid leaving traces in recently closed tabs' : false"
        >
          <select
            id="automaticModeNewTab"
            v-model="preferences.automaticMode.newTab"
            class="ui fluid dropdown"
          >
            <option value="created">
              Reopen new tabs in Temporary Containers. Flickers a bit, you might lose typed characters in the
              address bar and some Add-ons that intervene with initial tab opening might not work as expected, but
              it prevents new tabs from writing and reading cookies in the default container and doesn't clutter
              recently closed tabs with "new tabs" (Default)
            </option>
            <option value="navigation">
              Don't reopen new tabs in Temporary Containers but instead on navigation. Prevents initial flickering,
              losing of typed charaters in the address bar and increases compatibility with other Add-ons that
              intervene with initial tab opening but new tabs can set and read cookies in the default container
            </option>
          </select>
        </div>
        <div class="ui small negative message">
          <strong>Warning:</strong> New tabs (about:newtab and about:blank) can make network requests and set cookies, especially when you
          use the address bar for search engines. If you select "Don't reopen new tabs in Temporary Containers"
          here, cookies can get written into and read from the permanent default container as long as the new
          tab didn't get reopened in a Temporary Container.<br>
          <br>
          If you have a Cookie-Deletion-Add-on that automatically keeps your default/permanent containers clean
          and you use privacy-oriented search-engines like Startpage.com or DuckDuckGo then it should be no problem
          to use the "Don't reopen new tabs" preference.
        </div>
        <div class="m-b" />
      </div>
      <div class="title">
        <h4>
          <i class="dropdown icon" />
          Popup
        </h4>
      </div>
      <div class="content">
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
        <div class="item field">
          <label>
            Default Tab
          </label>
          <select
            v-model="preferences.ui.popupDefaultTab"
            class="ui fluid dropdown"
          >
            <option value="isolation-per-domain">
              Isolation Per Domain
            </option>
            <option value="isolation-global">
              Isolation Global
            </option>
            <option value="isolation-mac">
              Isolation Multi-Account Containers
            </option>
            <option value="actions">
              Actions
            </option>
            <option value="statistics">
              Statistics
            </option>
          </select>
        </div>
        <div class="m-b" />
      </div>
      <div class="title">
        <h4>
          <i class="dropdown icon" />
          Context Menu
        </h4>
      </div>
      <div class="content">
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
        <div class="m-b" />
      </div>
      <div class="title">
        <h4>
          <i class="dropdown icon" />
          Keyboard shortcuts
        </h4>
      </div>
      <div class="content">
        <div class="ui small message">
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
        <div class="m-b" />
      </div>
      <div class="title">
        <h4>
          <i class="dropdown icon" />
          Replace tabs in case of Isolation
        </h4>
      </div>
      <div class="content">
        <div class="ui checkbox">
          <input
            id="replaceTabs"
            v-model="preferences.replaceTabs"
            type="checkbox"
          >
          <label>Instead of creating a new tab replace the currently active tab</label>
        </div>
        <div class="m-b" />
      </div>
      <div class="title">
        <h4>
          <i class="dropdown icon" />
          Redirector tabs
        </h4>
      </div>
      <div class="content">
        <div class="ui checkbox">
          <input
            id="closeRedirectorTabs"
            v-model="preferences.closeRedirectorTabs.active"
            type="checkbox"
          >
          <label>Automatically close left-over redirector tabs after 2 seconds: <strong>t.co</strong> (Twitter), <strong>outgoing.prod.mozaws.net</strong> (AMO)</label>
        </div>
        <div class="m-b" />
      </div>
      <div class="title">
        <h4>
          <i class="dropdown icon" />
          Ignoring requests to
        </h4>
      </div>
      <div class="content">
        <div class="ui small message">
          Note: To unignore Mozilla domains its needed to remove them from the <i>about:config</i>
          key <strong>extensions.webextensions.restrictedDomains</strong> list, if they're listed there.
          To fully unignore requests to addons.mozilla.org you need to configure <strong>privacy.resistFingerprinting.block_mozAddonManager</strong>
          in <i>about:config</i> to Boolean <i>true</i> as well.
        </div>
        <div style="margin-left: 20px">
          <div v-if="!preferences.ignoreRequests.length">
            No domains ignored
          </div>
          <div v-else>
            <div
              v-for="ignoredPattern in preferences.ignoreRequests"
              :key="ignoredPattern"
            >
              <div style="margin-top: 5px" />
              <span
                data-tooltip="Remove"
                style="color: red; cursor: pointer;"
                @click="removeIgnoredDomain(ignoredPattern)"
              >
                <i class="icon-trash-empty" />
              </span>
              {{ ignoredPattern }}
            </div>
          </div>
        </div>
        <form
          id="advancedIgnoreRequetsForm"
          class="ui form"
          style="margin-left: 20px; margin-top: 20px;"
        >
          <domain-pattern
            id="advancedIgnoreRequetsPattern"
            :domain-pattern.sync="excludeDomainPattern"
          />
          <div class="field">
            <button class="ui button primary">
              Ignore
            </button>
          </div>
        </form>
        <div class="m-b" />
      </div>
      <div class="title">
        <h4>
          <i class="dropdown icon" />
          Reset Storage
        </h4>
      </div>
      <div class="content">
        <button
          class="ui negative button"
          @click="resetStorage"
        >
          Wipe local storage and reset it to default
        </button>
        <div class="m-b" />
      </div>
    </div>
    <div class="m-b" />
    <div class="ui checkbox">
      <input
        v-model="preferences.ui.expandPreferences"
        type="checkbox"
      >
      <label>Expand all preferences by default</label>
    </div>
  </div>
</template>
