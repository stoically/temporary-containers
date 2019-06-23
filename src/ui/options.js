const initialize = async () => {
  $('.menu .item').tab({
    history: true,
    historyType: 'hash'
  });
  $('.ui.dropdown').dropdown();
  $('.ui.checkbox').checkbox();
  $('.ui.accordion').accordion({exclusive: false});
  try {
    const setCurrentPreferences = () => {
      document.querySelector('#automaticMode').checked = preferences.automaticMode.active;
      document.querySelector('#notificationsCheckbox').checked = preferences.notifications;
      document.querySelector('#containerNamePrefix').value = preferences.container.namePrefix;
      $('#containerColor').dropdown('set selected', preferences.container.color);
      document.querySelector('#containerColorRandom').checked = preferences.container.colorRandom;
      $('#containerIcon').dropdown('set selected', preferences.container.icon);
      document.querySelector('#containerIconRandom').checked = preferences.container.iconRandom;
      $('#containerNumberMode').dropdown('set selected', preferences.container.numberMode);
      $('#containerRemoval').dropdown('set selected', preferences.container.removal);
      $('#iconColor').dropdown('set selected', preferences.iconColor);

      $('#isolationGlobal').dropdown('set selected', preferences.isolation.global.navigation.action);
      if (preferences.isolation.global.navigation.action !== 'never') {
        $('#isolationGlobalAccordion').accordion('open', 0);
      }


      $('#isolationGlobalMouseClickMiddle').dropdown('set selected', preferences.isolation.global.mouseClick.middle.action);
      $('#isolationGlobalMouseClickCtrlLeft').dropdown('set selected', preferences.isolation.global.mouseClick.ctrlleft.action);
      $('#isolationGlobalMouseClickLeft').dropdown('set selected', preferences.isolation.global.mouseClick.left.action);
      if (preferences.isolation.global.mouseClick.middle.action !== 'never' ||
          preferences.isolation.global.mouseClick.ctrlleft.action !== 'never' ||
          preferences.isolation.global.mouseClick.left.action !== 'never') {
        $('#isolationGlobalAccordion').accordion('open', 1);
      }

      if (Object.keys(preferences.isolation.global.excludedContainers).length) {
        $('#isolationGlobalAccordion').accordion('open', 2);
      }

      isolationGlobalExcludedDomains = preferences.isolation.global.excluded;
      if (Object.keys(preferences.isolation.global.excluded).length) {
        $('#isolationGlobalAccordion').accordion('open', 3);
      }

      $('#isolationMac').dropdown('set selected', preferences.isolation.mac.action);

      $('#linkClickGlobalMiddleCreatesContainer').dropdown('set selected', preferences.isolation.global.mouseClick.middle.container);
      $('#linkClickGlobalCtrlLeftCreatesContainer').dropdown('set selected', preferences.isolation.global.mouseClick.ctrlleft.container);
      $('#linkClickGlobalLeftCreatesContainer').dropdown('set selected', preferences.isolation.global.mouseClick.left.container);

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

      document.querySelector('#statisticsCheckbox').checked = preferences.statistics;
      document.querySelector('#deletesHistoryStatisticsCheckbox').checked = preferences.deletesHistory.statistics;

      updateIsolationGlobalExcludeDomains();
      updateIsolationDomains();
      updateIsolationDomainExcludeDomains();
      updateSetCookiesDomainRules();
      updateStatistics();
      showDeletesHistoryStatistics();
    };

    if (parseInt((await browser.runtime.getBrowserInfo()).version) >= 67) {
      const toolbarOption = document.createElement('option');
      toolbarOption.value = 'toolbar';
      toolbarOption.text = 'toolbar (black/gray)';
      document.querySelector('#containerColor').add(toolbarOption);

      const fenceOption = document.createElement('option');
      fenceOption.value = 'fence';
      fenceOption.text = 'fence';
      document.querySelector('#containerIcon').add(fenceOption);
    }


    const storage = await browser.storage.local.get(['preferences', 'tempContainers']);
    if (!storage.preferences || !Object.keys(storage.preferences).length) {
      showPreferencesError();
      return;
    }
    preferences = storage.preferences;

    const excludeContainers = [];
    const containers = await browser.contextualIdentities.query({});
    containers.map(container => {
      if (storage.tempContainers[container.cookieStoreId]) {
        return;
      }
      excludeContainers.push({
        name: container.name,
        value: container.cookieStoreId,
        selected: !!preferences.isolation.global.excludedContainers[container.cookieStoreId]
      });
    });
    $('#isolationGlobalExcludeContainers').dropdown({
      placeholder: 'Select permanent containers to exclude from Isolation',
      values: excludeContainers
    });

    setCurrentPreferences();

    $('#isolationDomainForm').form({
      fields: {
        isolationDomainPattern: 'empty'
      },
      onSuccess: (event) => {
        event.preventDefault();
        isolationDomainAddRule();
      }
    });

    $('#isolationGlobalExcludeDomainSave').on('click', (event) => {
      event.preventDefault();
      isolationGlobalAddExcludeDomainRule();
    });

    $('#isolationDomainExcludeDomainSave').on('click', (event) => {
      event.preventDefault();
      isolationDomainAddExcludeDomainRule();
    });

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

    const domainPatternToolTip =
      '<div style="width:750px;">' +
      'Exact match: e.g. <strong>example.com</strong> or <strong>www.example.com</strong><br>' +
      'Glob/Wildcard match: e.g. <strong>*.example.com</strong> (all example.com subdomains)<br>' +
      '<br>' +
      'Note: <strong>*.example.com</strong> would not match <strong>example.com</strong>, ' +
      'so you might need two patterns.</div>' +
      '<br>' +
      'Advanced: Parsed as RegExp when <strong>/pattern/flags</strong> is given ' +
      'and matches the full URL instead of just domain.';

    $('#setCookiesDomainPatternDiv').popup({
      html: domainPatternToolTip,
      inline: true
    });

    $('#isolationDomainPatternDiv').popup({
      html: domainPatternToolTip,
      inline: true
    });

    $('#isolationGlobalExcludeDomainPatternDiv').popup({
      html: domainPatternToolTip,
      inline: true
    });

    $('#isolationDomainExcludeDomainPatternDiv').popup({
      html: domainPatternToolTip,
      inline: true
    });


    const automaticModeToolTip =
      '<div style="width:500px;">' +
      'Automatically reopen tabs in new Temporary Containers when<ul>' +
      '<li> Opening a new tab' +
      '<li> A tab tries to load a link in the default container' +
      '<li> An external program opens a link in the browser</ul></div>';

    $('#automaticModeField').popup({
      html: automaticModeToolTip,
      inline: true
    });

    const deletesHistoryStatisticsToolTip =
      '<div style="width:500px;">' +
      'The overall statistics include all Temporary Containers already<br>' +
      'This will show and collect separate statistics about how many "Deletes History<br>' +
      'Temporary Container" plus cookies and URLs with them got deleted.</div>';

    $('#deletesHistoryStatisticsField').popup({
      html: deletesHistoryStatisticsToolTip,
      inline: true
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
      inline: true
    });

    const exportToolTip =
        '<div style="width:500px;">' +
        'Export your preferences into a JSON file</div>';

    $('#exportPreferences').popup({
      html: exportToolTip,
      inline: true
    });

    const importToolTip =
        '<div style="width:500px;">' +
        'Import your preferences from a JSON file. No confirmation</div>';

    $('#importPreferences').popup({
      html: importToolTip,
      inline: true
    });

    const historyPermission = await browser.permissions.contains({permissions: ['history']});
    if (historyPermission) {
      $('#deletesHistoryContainerWarningRead')
        .checkbox('check')
        .checkbox('set disabled');

      $('#keyboardShortcutsAltPField').removeClass('hidden');
      $('#deletesHistoryStatisticsField').removeClass('hidden');
    }

    const notificationsPermission = await browser.permissions.contains({permissions: ['notifications']});
    if (!notificationsPermission) {
      $('#notifications')
        .checkbox('uncheck');
    }

    const bookmarksPermission = await browser.permissions.contains({permissions: ['bookmarks']});
    if (!bookmarksPermission) {
      $('#contextMenuBookmarks').checkbox('uncheck');
      $('#deletesHistoryContextMenuBookmarks').checkbox('uncheck');
    }

    if (!window.location.hash) {
      $('.menu .item').tab('change tab', 'general');
    }
  } catch (error) {
    showPreferencesError(error);
  }
};

document.addEventListener('DOMContentLoaded', initialize);
$('#saveContainerPreferences').on('click', saveContainerPreferences);
$('#saveAdvancedGeneralPreferences').on('click', saveAdvancedPreferences);
$('#saveAdvancedDeleteHistoryPreferences').on('click', saveAdvancedPreferences);
$('#saveIsolationGlobalPreferences').on('click', saveIsolationGlobalPreferences);
$('#saveIsolationMacPreferences').on('click', saveIsolationGlobalPreferences);
$('#saveStatisticsPreferences').on('click', saveStatisticsPreferences);
$('#resetStatistics').on('click', resetStatistics);
$('#deletesHistoryStatisticsField').on('click', showDeletesHistoryStatistics);
$('#deletesHistoryContainerWarningRead').on('click', requestHistoryPermissions);
$('#notifications').on('click', requestNotificationsPermissions);
$('#contextMenuBookmarks').on('click', requestBookmarksPermissions);
$('#deletesHistoryContextMenuBookmarks').on('click', requestBookmarksPermissions);
$('#exportPreferences').on('click', exportPreferencesButton);
$('#importPreferences').on('change', importPreferencesButton);

$('#resetStorage').on('click', async (event) => {
  event.preventDefault();

  let reset = false;
  try {
    reset = await browser.runtime.sendMessage({
      method: 'resetStorage'
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[resetStorage] couldnt send message', error);
  }

  if (!reset) {
    $('#preferenceserrorcontent').html(`
      Now this is embarrassing. Storage reset didn't work either.
      At this point you probably have to reinstall the Add-on.
      Sorry again, but there's not much I can do about it since
      this is almost certainly a Firefox API problem right now.
    `);
  } else {
    initialize(event);
    $('#preferenceserror').modal('hide');
    showMessage('Storage successfully reset.', true);
  }
});
