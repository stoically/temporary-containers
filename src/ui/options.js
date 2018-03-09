const initialize = async () => {
  $('.menu .item').tab();
  $('.ui.dropdown').dropdown();
  $('.ui.checkbox').checkbox();
  try {
    const setCurrentPreferences = () => {
      document.querySelector('#automaticMode').checked = preferences.automaticMode;
      document.querySelector('#notificationsCheckbox').checked = preferences.notifications;
      document.querySelector('#containerNamePrefix').value = preferences.containerNamePrefix;
      $('#containerColor').dropdown('set selected', preferences.containerColor);
      document.querySelector('#containerColorRandom').checked = preferences.containerColorRandom;
      $('#containerIcon').dropdown('set selected', preferences.containerIcon);
      document.querySelector('#containerIconRandom').checked = preferences.containerIconRandom;
      $('#containerNumberMode').dropdown('set selected', preferences.containerNumberMode);
      $('#containerRemoval').dropdown('set selected', preferences.containerRemoval);
      $('#iconColor').dropdown('set selected', preferences.iconColor);

      $('#isolationGlobal').dropdown('set selected', preferences.isolationGlobal);
      $('#isolationMac').dropdown('set selected', preferences.isolationMac);

      $('#linkClickGlobalMiddle').dropdown('set selected', preferences.linkClickGlobal.middle.action);
      $('#linkClickGlobalCtrlLeft').dropdown('set selected', preferences.linkClickGlobal.ctrlleft.action);
      $('#linkClickGlobalLeft').dropdown('set selected', preferences.linkClickGlobal.left.action);

      $('#linkClickGlobalMiddleCreatesContainer').dropdown('set selected', preferences.linkClickGlobal.middle.container);
      $('#linkClickGlobalCtrlLeftCreatesContainer').dropdown('set selected', preferences.linkClickGlobal.ctrlleft.container);
      $('#linkClickGlobalLeftCreatesContainer').dropdown('set selected', preferences.linkClickGlobal.left.container);

      $('#deletesHistoryContainer').dropdown('set selected', preferences.deletesHistoryContainer);
      document.querySelector('#deletesHistoryContextMenu').checked = preferences.deletesHistoryContextMenu;
      $('#deletesHistoryContainerRemoval').dropdown('set selected', preferences.deletesHistoryContainerRemoval);
      $('#deletesHistoryContainerAlwaysPerWebsite').dropdown('set selected', preferences.deletesHistoryContainerAlwaysPerWebsite);
      $('#deletesHistoryContainerMouseClicks').dropdown('set selected', preferences.deletesHistoryContainerMouseClicks);

      document.querySelector('#pageAction').checked = preferences.pageAction;
      document.querySelector('#contextMenu').checked = preferences.contextMenu;
      document.querySelector('#keyboardShortcutsAltC').checked = preferences.keyboardShortcuts.AltC;
      document.querySelector('#keyboardShortcutsAltP').checked = preferences.keyboardShortcuts.AltP;
      document.querySelector('#keyboardShortcutsAltN').checked = preferences.keyboardShortcuts.AltN;
      document.querySelector('#keyboardShortcutsAltShiftC').checked = preferences.keyboardShortcuts.AltShiftC;
      document.querySelector('#keyboardShortcutsAltX').checked = preferences.keyboardShortcuts.AltX;
      document.querySelector('#replaceTabs').checked = preferences.replaceTabs;
      $('#automaticModeNewTab').dropdown('set selected', preferences.automaticModeNewTab);

      document.querySelector('#statisticsCheckbox').checked = preferences.statistics;
      document.querySelector('#deletesHistoryStatisticsCheckbox').checked = preferences.deletesHistoryStatistics;


      updateLinkClickDomainRules();
      updateAlwaysOpenInDomainRules();
      updateIsolationDomainRules();
      updateSetCookiesDomainRules();
      updateStatistics();
      showDeletesHistoryStatistics();
    };

    const storage = await browser.storage.local.get('preferences');
    if (!storage.preferences || !Object.keys(storage.preferences).length) {
      showPreferencesError();
      return;
    }
    preferences = storage.preferences;
    setCurrentPreferences();

    $('#linkClickDomainForm').form({
      fields: {
        linkClickDomainPattern: 'empty'
      },
      onSuccess: (event) => {
        event.preventDefault();
        linkClickDomainAddRule();
      }
    });

    $('#alwaysOpenInDomainForm').form({
      fields: {
        alwaysOpenInDomainPattern: 'empty'
      },
      onSuccess: (event) => {
        event.preventDefault();
        alwaysOpenInDomainAddRule();
      }
    });

    $('#isolationDomainForm').form({
      fields: {
        isolationDomainPattern: 'empty'
      },
      onSuccess: (event) => {
        event.preventDefault();
        isolationDomainAddRule();
      }
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
      '<div style="width:600px;">' +
      'Exact matches: e.g. <strong>example.com</strong> or <strong>www.example.com</strong><br>' +
      'Glob/Wildcard match: e.g. <strong>*.example.com</strong> (all example.com subdomains)<br>' +
      'Note: <strong>*.example.com</strong> would not match <strong>example.com</strong>, ' +
      'so you might need two rules</div>';

    $('#linkClickDomainPatternDiv').popup({
      html: domainPatternToolTip,
      inline: true
    });

    $('#alwaysOpenInDomainPatternDiv').popup({
      html: domainPatternToolTip,
      inline: true
    });

    $('#setCookiesDomainPatternDiv').popup({
      html: domainPatternToolTip,
      inline: true
    });

    $('#isolationDomainPattern').popup({
      html: domainPatternToolTip,
      inline: true
    });

    const automaticModeToolTip =
      '<div style="width:500px;">' +
      'Automatically reopen Tabs in new Temporary Containers when<ul>' +
      '<li> Opening a new Tab' +
      '<li> An external Program opens a Link in the Browser</ul></div>';

    $('#automaticModeField').popup({
      html: automaticModeToolTip,
      inline: true
    });

    const notificationsToolTip =
      '<div style="width:500px;">' +
      'Will ask for Notifications Permissions when you click the first time<br>' +
      'And with the next update of the Add-on - not again after that.<br>' +
      'Asking after update again is a Firefox bug and is already reported.</div>';

    $('#notificationsField').popup({
      html: notificationsToolTip,
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

    const historyPermission = await browser.permissions.contains({permissions: ['history']});
    if (historyPermission) {
      $('#deletesHistoryContainerWarningRead')
        .checkbox('check')
        .checkbox('set disabled');

      $('#keyboardShortcutsAltPField').removeClass('hidden');
    }

    const notificationsPermission = await browser.permissions.contains({permissions: ['notifications']});
    if (!notificationsPermission) {
      $('#notifications')
        .checkbox('uncheck');
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
$('#saveIsolationMacPreferences').on('click', saveIsolationMacPreferences);
$('#saveLinkClickGlobalPreferences').on('click', saveLinkClickGlobalPreferences);
$('#saveStatisticsPreferences').on('click', saveStatisticsPreferences);
$('#resetStatistics').on('click', resetStatistics);
$('#deletesHistoryStatisticsField').on('click', showDeletesHistoryStatistics);
$('#deletesHistoryContainerWarningRead').on('click', requestHistoryPermissions);
$('#notifications').on('click', requestNotificationsPermissions);