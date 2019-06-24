<script>
  export default {
    data: () => ({
      loaded: false
    }),
    props: ['preferences'],
    watch: {
      async preferences() {
        $('#saveAdvancedGeneralPreferences').on('click', window.saveAdvancedPreferences);
        $('#saveAdvancedDeleteHistoryPreferences').on('click', window.saveAdvancedPreferences);
        $('#deletesHistoryContainerWarningRead').on('click', window.requestHistoryPermissions);
        $('#contextMenuBookmarks').on('click', window.requestBookmarksPermissions);
        $('#deletesHistoryContextMenuBookmarks').on('click', window.requestBookmarksPermissions);

        $('#setCookiesDomainForm').form({
          fields: {
            setCookiesDomainPattern: 'empty',
            setCookiesDomainUrl: 'empty'
          },
          onSuccess: (event) => {
            event.preventDefault();
            setCookiesDomainAddRule();
          }
        });

        $('#setCookiesDomainPatternDiv').popup({
          html: domainPatternToolTip,
          inline: true,
          position: 'bottom left'
        });

        const popupToolTip =
          '<div style="width:500px;">' +
          'The popup lets you<ul>' +
          '<li> Configure Isolation Per Domain' +
          '<li> Convert Temporary to Permanent Container' +
          '<li> Convert Permanent to Temporary Container' +
          '<li> Open current tab URL in new Temporary Container' +
          '<li> Open current tab URL in new "Deletes History Temporary Container"' +
          '<li> Open Preferences/Options' +
          '<li> Open new Temporary Container' +
          '<li> Open new "Deletes History Temporary Container"' +
          '</ul></div>';

        $('#popupField').popup({
          html: popupToolTip,
          inline: true,
          position: 'bottom left'
        });

        $('#deletesHistoryContainer').dropdown('set selected', preferences.deletesHistory.automaticMode);
        document.querySelector('#deletesHistoryContextMenu').checked = preferences.deletesHistory.contextMenu;
        document.querySelector('#deletesHistoryContextMenuBookmarksCheckbox').checked = preferences.deletesHistory.contextMenuBookmarks;
        $('#deletesHistoryContainerRemoval').dropdown('set selected', preferences.deletesHistory.containerRemoval);
        $('#deletesHistorycontainerAlwaysPerDomain').dropdown('set selected', preferences.deletesHistory.containerAlwaysPerDomain);
        $('#deletesHistoryContainerIsolation').dropdown('set selected', preferences.deletesHistory.containerIsolation);
        $('#deletesHistoryContainerMouseClicks').dropdown('set selected', preferences.deletesHistory.containerMouseClicks);

        document.querySelector('#browserActionPopup').checked = preferences.browserActionPopup;
        document.querySelector('#pageAction').checked = preferences.pageAction;
        document.querySelector('#contextMenu').checked = preferences.contextMenu;
        document.querySelector('#contextMenuBookmarksCheckbox').checked = preferences.contextMenuBookmarks;
        document.querySelector('#keyboardShortcutsAltC').checked = preferences.keyboardShortcuts.AltC;
        document.querySelector('#keyboardShortcutsAltP').checked = preferences.keyboardShortcuts.AltP;
        document.querySelector('#keyboardShortcutsAltN').checked = preferences.keyboardShortcuts.AltN;
        document.querySelector('#keyboardShortcutsAltShiftC').checked = preferences.keyboardShortcuts.AltShiftC;
        document.querySelector('#keyboardShortcutsAltX').checked = preferences.keyboardShortcuts.AltX;
        document.querySelector('#replaceTabs').checked = preferences.replaceTabs;
        document.querySelector('#closeRedirectorTabs').checked = preferences.closeRedirectorTabs.active;
        document.querySelector('#ignoreRequestsToAMO').checked = preferences.ignoreRequestsToAMO;
        document.querySelector('#ignoreRequestsToPocket').checked = preferences.ignoreRequestsToPocket;
        $('#automaticModeNewTab').dropdown('set selected', preferences.automaticMode.newTab);

        const historyPermission = await browser.permissions.contains({permissions: ['history']});
        if (historyPermission) {
          $('#deletesHistoryContainerWarningRead')
            .checkbox('check')
            .checkbox('set disabled');

          $('#keyboardShortcutsAltPField').removeClass('hidden');
          $('#deletesHistoryStatisticsField').removeClass('hidden');
        }

        window.updateSetCookiesDomainRules();

        const bookmarksPermission = await browser.permissions.contains({permissions: ['bookmarks']});
        if (!bookmarksPermission) {
          $('#contextMenuBookmarks').checkbox('uncheck');
          $('#deletesHistoryContextMenuBookmarks').checkbox('uncheck');
        }

        this.loaded = true;
      }
    }
  }
</script>

<template>
  <div v-show="loaded" class="ui tab segment" data-tab="advanced">
    <div class="ui top attached tabular menu">
      <a class="active item" data-tab="advanced/general">General</a>
      <a class="item" data-tab="advanced/setcookies">Set Cookies</a>
      <a class="item" data-tab="advanced/deletehistory">Delete History</a>
    </div>
    <div class="ui bottom attached active tab segment" data-tab="advanced/general">
      <div class="ui form">
        <div class="field" id="popupField">
          <div class="field">
            <label>Icon Popup</label>
            <div class="ui checkbox">
              <input type="checkbox" id="browserActionPopup">
              <label>Show the popup when pressing the Toolbar Icon instead of opening Temporary Container</label>
            </div>
          </div>
          <div class="field">
            <div class="ui checkbox">
              <input type="checkbox" id="pageAction">
              <label>Show additional Icon in the address bar that reveals the popup</label>
            </div>
          </div>
        </div>
        <div class="field">
          <label>Context Menu</label>
          <div class="field">
            <div class="ui checkbox">
              <input type="checkbox" id="contextMenu">
              <label>Show Temporary Container entry in the right click on links context menu</label>
            </div>
          </div>
          <div class="field">
            <div class="ui checkbox" id="contextMenuBookmarks">
              <input type="checkbox" id="contextMenuBookmarksCheckbox">
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
        <div class="field" id="keyboardShortcutsAltCField">
          <div class="ui checkbox">
            <input type="checkbox" id="keyboardShortcutsAltC">
            <label>Alt+C - Open a new Tab in a new Temporary Container</label>
          </div>
        </div>
        <div class="field hidden" id="keyboardShortcutsAltPField">
          <div class="ui checkbox">
            <input type="checkbox" id="keyboardShortcutsAltP">
            <label>Alt+P - Open a new Tab in a new 'Deletes History Temporary Container'</label>
          </div>
        </div>
        <div class="field" id="keyboardShortcutsAltNField">
          <div class="ui checkbox">
            <input type="checkbox" id="keyboardShortcutsAltN">
            <label>Alt+N - Open a new 'No Container' Tab</label>
          </div>
        </div>
        <div class="field" id="keyboardShortcutsAltShiftCField">
          <div class="ui checkbox">
            <input type="checkbox" id="keyboardShortcutsAltShiftC">
            <label>Alt+Shift+C - Open a new 'No Container' Tab in a new Window</label>
          </div>
        </div>
        <div class="field" id="keyboardShortcutsAltXField">
          <div class="ui checkbox">
            <input type="checkbox" id="keyboardShortcutsAltX">
            <label>Alt+X - Open a new Tab in the same Container as the currently active Tab</label>
          </div>
        </div>
        <div class="field">
          <label>Creating new Temporary Containers in case of Isolation</label>
          <div class="ui checkbox">
            <input type="checkbox" id="replaceTabs">
            <label>Instead of creating a new Tab replace the currently active Tab</label>
          </div>
        </div>
        <div class="field">
          <label>Redirector tabs</label>
          <div class="ui checkbox">
            <input type="checkbox" id="closeRedirectorTabs">
            <label>Automatically close left-over redirector tabs after 2 seconds: <strong>t.co</strong> (Twitter), <strong>outgoing.prod.mozaws.net</strong> (AMO)</label>
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
            <input type="checkbox" id="ignoreRequestsToAMO">
            <label>addons.mozilla.org<br><i>Firefox prevents contentscripts on and canceling requests to that domain.</i></label>
          </div>
        </div>
        <div class="field">
          <div class="ui checkbox">
            <input type="checkbox" id="ignoreRequestsToPocket">
            <label>getpocket.com<br><i>The Firefox Pocket integration only works in the default container</i></label>
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
          <div data-tooltip='"Deletes History Temporary Containers" always reopen new tabs to avoid leaving traces in recently closed tabs'>
            <select id="automaticModeNewTab" class="ui fluid dropdown">
              <option value="created">Reopen new tabs in Temporary Containers. Flickers a bit and some Add-ons that intervene with initial tab opening might not work as expected but it prevents new tabs from writing and reading cookies in the default container and doesn't clutter recently closed tabs with "new tabs" (Default)</option>
              <option value="navigation">Don't reopen new tabs in Temporary Containers but instead on navigation. Prevents initial flickering and increases compatibility with other Add-ons that intervene with initial tab opening but new tabs can set and read cookies in the default container</option>
            </select>
          </div>
        </div>
        <div class="field">
          <button id="saveAdvancedGeneralPreferences" class="ui button primary">Save</button>
        </div>
      </div>
    </div>
    <div class="ui bottom attached tab segment" data-tab="advanced/setcookies">
      <div class="ui form" id="setCookiesDomainForm">
        <h4>
          Configure cookies to be set on certain domains in Temporary Containers
        </h4>
        <div class="ui negative message">
          <strong>Warning:</strong> Setting cookies can make you easier fingerprintable. Especially
          when they contain user/session-specific data. Avoid setting cookies if you can.
        </div>
        <div class="ui notice message">
          This will call <a href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/cookies/set" target="_blank">cookies.set</a>
          and add the cookie to the header (if allowed) during <a href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders" target="_blank">webRequest.onBeforeSendHeaders</a>.
          If the request belongs to a Temporary Container and the domain matches the given pattern. Make sure that the cookie name and value are correctly
          encoded, or you might break the header being sent.
        </div>
        <div id="setCookiesDomainPatternDiv" class="field">
          <label>Domain Pattern</label>
          <input id="setCookiesDomainPattern" type="text">
        </div>
        <div id="setCookiesDomainDomainDiv" class="field">
          <label>domain</label>
          <input id="setCookiesDomainDomain" type="text">
        </div>
        <div id="setCookiesDomainExpirationDateDiv" class="field">
          <label>expirationDate</label>
          <input id="setCookiesDomainExpirationDate" type="text">
        </div>
        <div id="setCookiesFirstPartyDomainDiv" class="field">
          <label>firstPartyDomain</label>
          <input id="setCookiesFirstPartyDomain" type="text">
        </div>
        <div class="field">
          <label>httpOnly</label>
          <select id="setCookiesDomainHttpOnly" class="ui fluid dropdown">
            <option value="">httpOnly</option>
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        </div>
        <div id="setCookiesDomainNameDiv" class="field">
          <label>name</label>
          <input id="setCookiesDomainName" type="text">
        </div>
        <div id="setCookiesDomainPathDiv" class="field">
          <label>path</label>
          <input id="setCookiesDomainPath" type="text">
        </div>
        <div class="field">
          <label>sameSite</label>
          <select id="setCookiesSameSite" class="ui fluid dropdown">
            <option value="">sameSite</option>
            <option value="no_restriction">no_restriction</option>
            <option value="lax">lax</option>
            <option value="strict">strict</option>
          </select>
        </div>
        <div class="field">
          <label>secure</label>
          <select id="setCookiesDomainSecure" class="ui fluid dropdown">
            <option value="">secure</option>
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        </div>
        <div id="setCookiesDomainUrlDiv" class="field">
          <label>url</label>
          <input id="setCookiesDomainUrl" type="text">
        </div>
        <div id="setCookiesDomainValueDiv" class="field">
          <label>value</label>
          <input id="setCookiesDomainValue" type="text">
        </div>
        <div class="field">
          <button id="setCookiesDomainAddRule" class="ui button primary">Add</button>
        </div>
        <div>
          <h3>Cookies</h3>
          <div class="ui bulleted list" id="setCookiesDomainCookies">
          </div>
        </div>
      </div>
    </div>
    <div class="ui bottom attached tab segment" data-tab="advanced/deletehistory">
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
              <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1283320" target="_blank">The related Firefox bug can be found here</a>.<br>
              <br>
              Be careful. You have been warned. "Deletes History Temporary Containers" tabs have a "-deletes-history" suffix
              in the container name to remind you.
              <br><br>

              <div class="ui checkbox" id="deletesHistoryContainerWarningRead">
                <input type="checkbox" id="deletesHistoryContainerWarningReadCheckbox">
                <label>I have read the Warning and understand the implications that come with using "Deletes History Temporary Containers".
                  When ticking the checkbox Firefox will ask you for "Access browsing history" permissions.</label>
              </div>
            </strong>
          </div>
          <div class="ui notice message">
            You can open "Deletes History Temporary Containers" - also with the keyboard shortcut Alt+P - after you read the Warning and ticked the checkbox.<br>
            <br>
            The deletion applies to the full Website URL, not only the domain. That means, if you e.g. open a specific reddit post or a news article on
            your favorite news site in a "Deletes History Temporary Container" it won't delete all your previous visits to other reddit posts or news articles
            that you made outside of "Deletes History Temporary Containers" because the full Website URLs are different.<br>
            <br>
            "Deletes History Temporary Containers" will delete history when the "Deletes History Temporary Container" itself gets deleted after the last Tab in it closes.
          </div>
        </div>
        <div class="field" data-tooltip="This affects Automatic Mode, Toolbar Icon and the right-click context menu entry">
          <label>Automatically create "Deletes History Temporary Containers" [?]</label>
          <select id="deletesHistoryContainer" class="ui fluid dropdown">
            <option value="never">Don't automatically create "Deletes History Temporary Containers" instead of normal Temporary Containers (Default)</option>
            <option value="automatic">Automatically create "Deletes History Temporary Containers" instead of normal Temporary Containers</option>
          </select>
        </div>
        <div class="field">
          <label>Context Menu</label>
          <div class="ui checkbox">
            <input type="checkbox" id="deletesHistoryContextMenu">
            <label>Show additional "Deletes History Temporary Containers" entry in the right click on links context menu</label>
          </div>
        </div>
        <div class="field">
          <div class="ui checkbox" id="deletesHistoryContextMenuBookmarks">
            <input type="checkbox" id="deletesHistoryContextMenuBookmarksCheckbox">
            <label>Show additional "Deletes History Temporary Containers" entry in the right click on bookmarks context menu</label>
          </div>
        </div>
        <div class="field" data-tooltip='"15minutes" lets you "undo close tabs" in that timeframe'>
          <label>Delete no longer needed "Deletes History Temporary Containers"</label>
          <select id="deletesHistoryContainerRemoval" class="ui fluid dropdown">
            <option value="15minutes">15 minutes after the last tab in it closes</option>
            <option value="instant">After the last tab in it closes (default)</option>
          </select>
        </div>
        <div class="field">
          <label>Isolation - Always per domain</label>
          <select id="deletesHistorycontainerAlwaysPerDomain" class="ui fluid dropdown">
            <option value="never">Default</option>
            <option value="automatic">Open new "Deletes History Temporary Containers" for Domains configured "Isolation Always" instead of normal
              Temporary Containers</option>
          </select>
        </div>
        <div class="field">
          <label>Isolation - Navigating in tabs</label>
          <select id="deletesHistoryContainerIsolation" class="ui fluid dropdown">
            <option value="never">Default</option>
            <option value="automatic">Open new "Deletes History Temporary Containers" when "Isolation on Navigation" takes place instead of normal
              Temporary Containers</option>
          </select>
        </div>
        <div class="field">
          <label>Isolation - Mouse clicks in "Deletes History Temporary Containers"</label>
          <select id="deletesHistoryContainerMouseClicks" class="ui fluid dropdown">
            <option value="never">Default</option>
            <option value="automatic">Open new "Deletes History Temporary Containers" with Mouse clicks on links in "Deletes History Temporary Containers" instead of normal
              Temporary Containers</option>
          </select>
        </div>
        <div class="field">
          <label>Isolation - Middle Mouse Click in Temporary Containers</label>
          <select id="linkClickGlobalMiddleCreatesContainer" class="ui fluid dropdown">
            <option value="default">Default</option>
            <option value="deleteshistory">Open new "Deletes History Temporary Containers" with Middle Mouse clicks instead of Temporary Containers</option>
          </select>
        </div>
        <div class="field">
          <label>Isolation - Ctrl/Cmd+Left Mouse Click in Temporary Containers</label>
          <select id="linkClickGlobalCtrlLeftCreatesContainer" class="ui fluid dropdown">
            <option value="default">Default</option>
            <option value="deleteshistory">Open new "Deletes History Temporary Containers" with Ctrl/Cmd+Left Mouse clicks instead of Temporary Containers</option>
          </select>
        </div>
        <div class="field">
          <label>Isolation - Left Mouse Click in Temporary Containers</label>
          <select id="linkClickGlobalLeftCreatesContainer" class="ui fluid dropdown">
            <option value="default">Default</option>
            <option value="deleteshistory">Open new "Deletes History Temporary Containers" with Left Mouse clicks instead of Temporary Containers</option>
          </select>
        </div>
        <div class="field">
          <button id="saveAdvancedDeleteHistoryPreferences" class="ui button primary">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>
