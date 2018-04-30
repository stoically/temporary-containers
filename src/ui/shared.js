window.preferences = {};
const messageBox = $('#message');
window.showMessage = (message, keepOpen = false) => {
  messageBox.html(message);
  messageBox.addClass('positive');
  messageBox.removeClass('negative');
  messageBox.removeClass('hidden');
  if (keepOpen) {
    return;
  }
  setTimeout(() => {
    messageBox.addClass('hidden');
  }, 3000);
};
window.showError = (error) => {
  messageBox.html(error);
  messageBox.addClass('negative');
  messageBox.removeClass('positive');
  messageBox.removeClass('hidden');
};
window.showPreferencesError = (error) => {

  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    $('#preferenceserrordesc').html(`<br><br>
      The following error was observed, would be really helpful
      if you could file an <a href="https://github.com/stoically/temporary-containers/issues" target="_blank">issue on GitHub</a> with it:
      <br><br>
      ${error.toString()}
    `);
  }
  $('#preferenceserror')
    .modal({
      closable: false
    })
    .modal('show');
};

const savePreferences = async () => {
  try {
    await browser.runtime.sendMessage({
      method: 'savePreferences',
      payload: {
        preferences
      }
    });

    showMessage('Preferences saved.');

  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('error while saving preferences', error);
    showError('Error while saving preferences!');
  }
};

window.saveContainerPreferences = async (event) => {
  event.preventDefault();

  preferences.automaticMode.active = document.querySelector('#automaticMode').checked;
  preferences.notifications = document.querySelector('#notificationsCheckbox').checked;
  preferences.container.namePrefix = document.querySelector('#containerNamePrefix').value;
  preferences.container.color = document.querySelector('#containerColor').value;
  preferences.container.colorRandom = document.querySelector('#containerColorRandom').checked;
  preferences.container.icon = document.querySelector('#containerIcon').value;
  preferences.container.iconRandom = document.querySelector('#containerIconRandom').checked;
  preferences.container.numberMode = document.querySelector('#containerNumberMode').value;
  preferences.container.removal = document.querySelector('#containerRemoval').value;
  preferences.iconColor = document.querySelector('#iconColor').value;

  await savePreferences();
};

window.saveIsolationGlobalPreferences = async (event) => {
  event.preventDefault();

  preferences.isolation.global.navigation.action = document.querySelector('#isolationGlobal').value;
  preferences.isolation.global.mouseClick = {
    middle: {
      action: document.querySelector('#isolationGlobalMouseClickMiddle').value,
      container: document.querySelector('#linkClickGlobalMiddleCreatesContainer').value
    },
    ctrlleft: {
      action: document.querySelector('#isolationGlobalMouseClickCtrlLeft').value,
      container: document.querySelector('#linkClickGlobalCtrlLeftCreatesContainer').value
    },
    left: {
      action: document.querySelector('#isolationGlobalMouseClickLeft').value,
      container: document.querySelector('#linkClickGlobalLeftCreatesContainer').value
    }
  };
  preferences.isolation.mac.action = document.querySelector('#isolationMac').value;

  await savePreferences();
};

const isolationDomainAddRule = async () => {
  const domainPattern = document.querySelector('#isolationDomainPattern').value;

  preferences.isolation.domain[domainPattern] = {
    always: {
      action: document.querySelector('#isolationDomainAlways').value,
      allowedInPermanent: document.querySelector('#isolationDomainAlwaysAllowedInPermanent').checked
    },
    navigation: {
      action: document.querySelector('#isolationDomainNavigation').value
    },
    mouseClick: {
      middle: {
        action: document.querySelector('#isolationDomainMouseClickMiddle').value
      },
      ctrlleft: {
        action: document.querySelector('#isolationDomainMouseClickCtrlLeft').value
      },
      left: {
        action: document.querySelector('#isolationDomainMouseClickLeft').value
      }
    }
  };

  await savePreferences();
  updateIsolationDomains();
};

window.isolationDomainEditRule = (domainPattern) => {
  domainPattern = decodeURIComponent(domainPattern);
  document.querySelector('#isolationDomainPattern').value = domainPattern;

  if (preferences.isolation.domain[domainPattern]) {
    const domainRules = preferences.isolation.domain[domainPattern];

    $('#isolationDomainAlways').dropdown('set selected', domainRules.always.action);
    document.querySelector('#isolationDomainAlwaysAllowedInPermanent').checked = domainRules.always.allowedInPermanent;
    $('#isolationDomainNavigation').dropdown('set selected', domainRules.navigation.action);
    $('#isolationDomainMouseClickMiddle').dropdown('set selected', domainRules.mouseClick.middle.action);
    $('#isolationDomainMouseClickCtrlLeft').dropdown('set selected', domainRules.mouseClick.ctrlleft.action);
    $('#isolationDomainMouseClickLeft').dropdown('set selected', domainRules.mouseClick.left.action);
    $('#isolationPerDomainAccordion').accordion('open', 0);
    $('#isolationPerDomainAccordion').accordion('open', 1);
    $('#isolationPerDomainAccordion').accordion('open', 2);
    $('#isolationPerDomainAccordion').accordion('open', 3);
  }
};

let isolationDomainRulesClickEvent = false;
window.updateIsolationDomains = () => {
  const isolationDomainRules = $('#isolationDomains');
  const domainRules = Object.keys(preferences.isolation.domain);
  if (domainRules.length) {
    isolationDomainRules.html('');
    domainRules.map((domainPattern) => {
      const el = $(`<div class="item" id="${encodeURIComponent(domainPattern)}">` +
        `<span id="infoDomainRule" href="#">${domainPattern} <i class="icon-info-circled"></i></span> ` +
        '<a href="#" id="editDomainRule" data-tooltip="Edit"><i class="icon-pencil"></i>️</a> ' +
        '<a href="#" id="removeDomainRule" data-tooltip="Remove (no confirmation)" ' +
        '><i class="icon-trash-empty"></i>️</a></div>');
      isolationDomainRules.append(el);

      const domainRuleTooltip =
        '<div style="width:200%;">' +
        `<strong>Always</strong>: ${preferences.isolation.domain[domainPattern].always.action} <br>` +
        `> <strong>Permanent allowed</strong>: ${preferences.isolation.domain[domainPattern].always.allowedInPermanent} <br><br>` +
        `<strong>Navigation</strong>: ${preferences.isolation.domain[domainPattern].navigation.action} <br><br>` +
        '<strong>Mouse Clicks</strong><br>' +
        `Middle: ${preferences.isolation.domain[domainPattern].mouseClick.middle.action} <br>` +
        `Ctrl+Left: ${preferences.isolation.domain[domainPattern].mouseClick.ctrlleft.action} <br>` +
        `Left: ${preferences.isolation.domain[domainPattern].mouseClick.left.action}</div> <br><br>`;
        // '<strong>Excluded Target Domains</strong>:<br>' +
        // (preferences.isolation.domain[domainPattern].excluded &&
        //  preferences.isolation.domain[domainPattern].excluded.length) ?
        //   `${preferences.isolation.domain[domainPattern].excluded.join('<br>')}` :
        //   'No Target Domains excluded';
      el.find('#infoDomainRule').popup({
        html: domainRuleTooltip,
        inline: true
      });
    });

    if (!isolationDomainRulesClickEvent) {
      isolationDomainRules.on('click', async (event) => {
        event.preventDefault();
        const targetId = $(event.target).parent().attr('id');
        const domainPattern = $(event.target).parent().parent().attr('id');
        if (targetId === 'editDomainRule') {
          isolationDomainEditRule(domainPattern);
          return;
        }
        if (targetId === 'removeDomainRule') {
          delete preferences.isolation.domain[decodeURIComponent(domainPattern)];
          // TODO show "rule deleted" instead of "preferences saved"
          await savePreferences();
          updateIsolationDomains();
        }
      });
      isolationDomainRulesClickEvent = true;
    }
  } else {
    isolationDomainRules.html('No Domains added');
  }
};


window.isolationDomainAddExcludeDomainRule = () => {
  const excludeDomainPattern = document.querySelector('#isolationDomainExcludeDomainPattern').value;
  if (!excludeDomainPattern) {
    $('#isolationDomainExcludeDomainPatternDiv').addClass('error');
    return;
  }
  $('#isolationDomainExcludeDomainPatternDiv').removeClass('error');
  isolationDomainExcludeDomains[excludeDomainPattern] = {};
  updateIsolationExcludeDomains();
};


const isolationDomainExcludeDomains = {};
let isolationDomainExcludeDomainRulesClickEvent = false;
window.updateIsolationExcludeDomains = () => {
  const isolationDomainExcludeDomainRulesDiv = $('#isolationDomainExcludeDomains');
  const isolationDomainExcludeDomainRules = Object.keys(isolationDomainExcludeDomains);
  if (!isolationDomainExcludeDomainRules.length) {
    isolationDomainExcludeDomainRulesDiv.html('No Domains excluded');
    return;
  }
  isolationDomainExcludeDomainRulesDiv.html('');
  isolationDomainExcludeDomainRules.map((domainPattern) => {
    const el = $(`<div class="item" id="${encodeURIComponent(domainPattern)}">` +
      domainPattern +
      ' <a href="#" id="removeDomainRule" data-tooltip="Remove (no confirmation)" ' +
      '><i class="icon-trash-empty"></i>️</a></div>');
    isolationDomainExcludeDomainRulesDiv.append(el);
  });

  if (!isolationDomainExcludeDomainRulesClickEvent) {
    isolationDomainExcludeDomainRulesDiv.on('click', async (event) => {
      event.preventDefault();
      const targetId = $(event.target).parent().attr('id');
      const domainPattern = $(event.target).parent().parent().attr('id');
      if (targetId === 'removeDomainRule') {
        delete isolationDomainExcludeDomains[decodeURIComponent(domainPattern)];
        updateIsolationExcludeDomains();
      }
    });
    isolationDomainExcludeDomainRulesClickEvent = true;
  }
};


window.setCookiesDomainAddRule = async () => {
  const domainPattern = document.querySelector('#setCookiesDomainPattern').value;
  const setCookieRule = {
    domain: document.querySelector('#setCookiesDomainDomain').value,
    expirationDate: document.querySelector('#setCookiesDomainExpirationDate').value,
    httpOnly: document.querySelector('#setCookiesDomainHttpOnly').value,
    name: document.querySelector('#setCookiesDomainName').value,
    path: document.querySelector('#setCookiesDomainPath').value,
    secure: document.querySelector('#setCookiesDomainSecure').value,
    url: document.querySelector('#setCookiesDomainUrl').value,
    value: document.querySelector('#setCookiesDomainValue').value
  };

  if (!preferences.cookies.domain[domainPattern]) {
    preferences.cookies.domain[domainPattern] = [];
  }
  preferences.cookies.domain[domainPattern].push(setCookieRule);
  await savePreferences();
  updateSetCookiesDomainRules();
};

window.updateSetCookiesDomainRules = () => {
  const setCookiesDomainCookies = $('#setCookiesDomainCookies');
  const domainRules = Object.keys(preferences.cookies.domain);
  if (!domainRules.length) {
    setCookiesDomainCookies.html('No Cookies added');
    return;
  }
  setCookiesDomainCookies.html('');
  domainRules.map((domainPattern) => {
    const domainPatternCookies = preferences.cookies.domain[domainPattern];
    domainPatternCookies.map((domainPatternCookie, index) => {
      if (!domainPatternCookie) {
        return;
      }
      setCookiesDomainCookies.append(
        `<div class="item" id="${encodeURIComponent(domainPattern)}" idIndex="${index}">${domainPattern} [${index}]: ` +
        ` ${domainPatternCookie.name} ${domainPatternCookie.value} ` +
        '<a href="#" id="setCookiesRemoveDomainRules" data-tooltip="Remove Cookie (no confirmation)" ' +
        '><i class="icon-trash-empty"></i></a></div>');
    });
  });

  setCookiesDomainCookies.on('click', async (event) => {
    event.preventDefault();
    const domainPattern = $(event.target).parent().attr('id');
    const domainPatternIndex = $(event.target).parent().attr('idIndex');
    if (domainPattern === 'setCookiesDomainCookies' ||
        !preferences.cookies.domain[decodeURIComponent(domainPattern)]) {
      return;
    }

    delete preferences.cookies.domain[decodeURIComponent(domainPattern)][domainPatternIndex];
    const cookies = preferences.cookies.domain[decodeURIComponent(domainPattern)].filter(cookie => typeof cookie === 'object');
    if (!cookies.length) {
      delete preferences.cookies.domain[decodeURIComponent(domainPattern)];
    }
    await savePreferences();
    updateSetCookiesDomainRules();
  });
};

window.updateStatistics = async () => {
  const storage = await browser.storage.local.get('statistics');
  if (!storage.statistics) {
    showError('Error while loading statistics.');
    return;
  }
  $('#containersDeleted').html(storage.statistics.containersDeleted);
  $('#cookiesDeleted').html(storage.statistics.cookiesDeleted);
  $('#cacheDeleted').html(formatBytes(storage.statistics.cacheDeleted, 0));

  $('#statisticsStartTime').html(storage.statistics.startTime);

  $('#deletesHistoryContainersDeleted').html(storage.statistics.deletesHistory.containersDeleted);
  $('#deletesHistoryCookiesDeleted').html(storage.statistics.deletesHistory.cookiesDeleted);
  $('#deletesHistoryUrlsDeleted').html(storage.statistics.deletesHistory.urlsDeleted);
};

window.saveAdvancedPreferences = async (event) => {
  event.preventDefault();

  preferences.browserActionPopup = document.querySelector('#browserActionPopup').checked;
  preferences.pageAction = document.querySelector('#pageAction').checked;
  preferences.contextMenu = document.querySelector('#contextMenu').checked;
  preferences.keyboardShortcuts.AltC = document.querySelector('#keyboardShortcutsAltC').checked;
  preferences.keyboardShortcuts.AltP = document.querySelector('#keyboardShortcutsAltP').checked;
  preferences.keyboardShortcuts.AltN = document.querySelector('#keyboardShortcutsAltN').checked;
  preferences.keyboardShortcuts.AltShiftC = document.querySelector('#keyboardShortcutsAltShiftC').checked;
  preferences.keyboardShortcuts.AltX = document.querySelector('#keyboardShortcutsAltX').checked;
  preferences.replaceTabs = document.querySelector('#replaceTabs').checked;
  preferences.ignoreRequestsToAMO = document.querySelector('#ignoreRequestsToAMO').checked;
  preferences.ignoreRequestsToPocket = document.querySelector('#ignoreRequestsToPocket').checked;
  preferences.automaticMode.newTab = document.querySelector('#automaticModeNewTab').value;

  preferences.deletesHistory.automaticMode = document.querySelector('#deletesHistoryContainer').value;
  preferences.deletesHistory.contextMenu = document.querySelector('#deletesHistoryContextMenu').checked;
  preferences.deletesHistory.containerRemoval = document.querySelector('#deletesHistoryContainerRemoval').value;
  preferences.deletesHistory.containerAlwaysPerDomain = document.querySelector('#deletesHistorycontainerAlwaysPerDomain').value;
  preferences.deletesHistory.containerIsolation = document.querySelector('#deletesHistoryContainerIsolation').value;
  preferences.deletesHistory.containerMouseClicks = document.querySelector('#deletesHistoryContainerMouseClicks').value;

  // TODO this might cause saving preferences that got selected on global mouseclicks but not saved
  saveIsolationGlobalPreferences(event);
};


window.saveStatisticsPreferences = async (event) => {
  event.preventDefault();
  preferences.statistics = document.querySelector('#statisticsCheckbox').checked;
  preferences.deletesHistory.statistics = document.querySelector('#deletesHistoryStatisticsCheckbox').checked;
  await savePreferences();
};

window.resetStatistics = async (event) => {
  event.preventDefault();
  await browser.runtime.sendMessage({
    method: 'resetStatistics'
  });

  updateStatistics();
  showMessage('Statistics have been reset.');
};

window.showDeletesHistoryStatistics = async () => {
  const checked = document.querySelector('#deletesHistoryStatisticsCheckbox').checked;
  if (checked) {
    $('#deletesHistoryStatistics').removeClass('hidden');
  } else {
    $('#deletesHistoryStatistics').addClass('hidden');
  }
};

window.requestHistoryPermissions = async () => {
  const allowed = await browser.permissions.request({
    permissions: ['history']
  });
  if (!allowed) {
    $('#deletesHistoryContainerWarningRead')
      .checkbox('uncheck');
  } else {
    $('#deletesHistoryContainerWarningRead')
      .checkbox('check')
      .checkbox('set disabled');

    $('#keyboardShortcutsAltPField').removeClass('hidden');

    await browser.runtime.sendMessage({
      method: 'historyPermissionAllowed'
    });
  }
};

window.requestNotificationsPermissions = async () => {
  const allowed = await browser.permissions.request({
    permissions: ['notifications']
  });
  if (!allowed) {
    $('#notifications')
      .checkbox('uncheck');
  }
};

window.formatBytes = (bytes, decimals) => {
  // https://stackoverflow.com/a/18650828
  if (bytes == 0) return '0 Bytes';
  let k = 1024,
    dm = decimals === undefined ? 2 : decimals,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
};
