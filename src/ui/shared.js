window.preferences = {};
const messageBox = $('#message');
window.showMessage = (message) => {
  messageBox.html(message);
  messageBox.addClass('positive');
  messageBox.removeClass('negative');
  messageBox.removeClass('hidden');
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
window.showPreferencesError = () => {
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

  preferences.automaticMode = document.querySelector('#automaticMode').checked;
  preferences.notifications = document.querySelector('#notificationsCheckbox').checked;
  preferences.containerNamePrefix = document.querySelector('#containerNamePrefix').value;
  preferences.containerColor = document.querySelector('#containerColor').value;
  preferences.containerColorRandom = document.querySelector('#containerColorRandom').checked;
  preferences.containerIcon = document.querySelector('#containerIcon').value;
  preferences.containerIconRandom = document.querySelector('#containerIconRandom').checked;
  preferences.containerNumberMode = document.querySelector('#containerNumberMode').value;
  preferences.containerRemoval = document.querySelector('#containerRemoval').value;
  preferences.iconColor = document.querySelector('#iconColor').value;

  await savePreferences();
};

window.saveIsolationGlobalPreferences = async (event) => {
  event.preventDefault();

  preferences.isolationGlobal = document.querySelector('#isolationGlobal').value;

  await savePreferences();
};

window.saveLinkClickGlobalPreferences = async (event) => {
  event.preventDefault();

  preferences.linkClickGlobal = {
    middle: {
      action: document.querySelector('#linkClickGlobalMiddle').value,
      container: document.querySelector('#linkClickGlobalMiddleCreatesContainer').value
    },
    ctrlleft: {
      action: document.querySelector('#linkClickGlobalCtrlLeft').value,
      container: document.querySelector('#linkClickGlobalCtrlLeftCreatesContainer').value
    },
    left: {
      action: document.querySelector('#linkClickGlobalLeft').value,
      container: document.querySelector('#linkClickGlobalLeftCreatesContainer').value
    }
  };

  await savePreferences();
};

const linkClickDomainAddRule = async () => {
  const domainPattern = document.querySelector('#linkClickDomainPattern').value;
  const domainRule = {
    middle: {
      action: document.querySelector('#linkClickDomainMiddle').value
    },
    ctrlleft: {
      action: document.querySelector('#linkClickDomainCtrlLeft').value
    },
    left: {
      action: document.querySelector('#linkClickDomainLeft').value
    }
  };

  preferences.linkClickDomain[domainPattern] = domainRule;
  await savePreferences();
  updateLinkClickDomainRules();
};

let linkClickDomainRulesClickEvent = false;
window.updateLinkClickDomainRules = () => {
  const linkClickDomainRules = $('#linkClickDomainRules');
  const domainRules = Object.keys(preferences.linkClickDomain);
  if (domainRules.length) {
    linkClickDomainRules.html('');
    domainRules.map((domainPattern) => {
      const el = $(`<div class="item" id="${encodeURIComponent(domainPattern)}">${domainPattern} ` +
        `<span href="#" id="domainRule:${encodeURIComponent(domainPattern)}">🛈</span> ` +
        '<a href="#" id="linkClickRemoveDomainRules" data-tooltip="Remove Rule (no confirmation)" ' +
        'data-position="right center">❌</a></div>');
      linkClickDomainRules.append(el);

      const domainRuleTooltip =
        '<div style="width:100%;">' +
        `Middle: ${preferences.linkClickDomain[domainPattern].middle.action} <br>` +
        `Ctrl+Left: ${preferences.linkClickDomain[domainPattern].ctrlleft.action} <br>` +
        `Left: ${preferences.linkClickDomain[domainPattern].left.action}</div>`;
      el.popup({
        html: domainRuleTooltip,
        inline: true
      });
    });

    if (!linkClickDomainRulesClickEvent) {
      linkClickDomainRules.on('click', async (event) => {
        event.preventDefault();
        const domainPattern = $(event.target).parent().attr('id');
        if (domainPattern === 'linkClickDomainRules') {
          return;
        }
        delete preferences.linkClickDomain[decodeURIComponent(domainPattern)];
        // TODO show "rule deleted" instead of "preferences saved"
        await savePreferences();
        updateLinkClickDomainRules();
      });
      linkClickDomainRulesClickEvent = true;
    }
  } else {
    linkClickDomainRules.html('No Rules added');
  }
};

window.alwaysOpenInDomainAddRule = async () => {
  const domainPattern = document.querySelector('#alwaysOpenInDomainPattern').value;
  const allowedInPermanent = document.querySelector('#alwaysOpenInDomainAllowedInPermanent').checked;

  preferences.alwaysOpenInDomain[domainPattern] = {
    allowedInPermanent
  };
  await savePreferences();
  updateAlwaysOpenInDomainRules();
};

window.updateAlwaysOpenInDomainRules = () => {
  const alwaysOpenInDomainRules = $('#alwaysOpenInDomainRules');
  const domainRules = Object.keys(preferences.alwaysOpenInDomain);
  if (domainRules.length) {
    alwaysOpenInDomainRules.html('');
    domainRules.map((domainPattern) => {
      const alwaysOpenInDomainPreferences = preferences.alwaysOpenInDomain[domainPattern];
      const el = $(`<div class="item" id="${encodeURIComponent(domainPattern)}">${domainPattern} ` +
        `<span href="#" data-tooltip="Allow in permanent Container: ${alwaysOpenInDomainPreferences.allowedInPermanent}">🛈</span> ` +
        '<a href="#" id="alwaysOpenInRemoveDomainRules" data-tooltip="Remove Rule (no confirmation)" ' +
        'data-position="right center">❌</a></div>');
      alwaysOpenInDomainRules.append(el);
    });

    alwaysOpenInDomainRules.on('click', async (event) => {
      event.preventDefault();
      const domainPattern = $(event.target).parent().attr('id');
      if (domainPattern === 'alwaysOpenInDomainRules') {
        return;
      }
      delete preferences.alwaysOpenInDomain[decodeURIComponent(domainPattern)];
      await savePreferences();
      updateAlwaysOpenInDomainRules();
    });
  } else {
    alwaysOpenInDomainRules.html('No Rules added');
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

  if (!preferences.setCookiesDomain[domainPattern]) {
    preferences.setCookiesDomain[domainPattern] = [];
  }
  preferences.setCookiesDomain[domainPattern].push(setCookieRule);
  await savePreferences();
  updateSetCookiesDomainRules();
};

window.updateSetCookiesDomainRules = () => {
  const setCookiesDomainCookies = $('#setCookiesDomainCookies');
  const domainRules = Object.keys(preferences.setCookiesDomain);
  if (!domainRules.length) {
    setCookiesDomainCookies.html('No Cookies added');
    return;
  }
  setCookiesDomainCookies.html('');
  domainRules.map((domainPattern) => {
    const domainPatternCookies = preferences.setCookiesDomain[domainPattern];
    domainPatternCookies.map((domainPatternCookie, index) => {
      if (!domainPatternCookie) {
        return;
      }
      setCookiesDomainCookies.append(
        `<div class="item" id="${encodeURIComponent(domainPattern)}" idIndex="${index}">${domainPattern} [${index}]: ` +
        ` ${domainPatternCookie.name} ${domainPatternCookie.value} ` +
        '<a href="#" id="setCookiesRemoveDomainRules" data-tooltip="Remove Cookie (no confirmation)" ' +
        'data-position="right center">❌</a></div>');
    });
  });

  setCookiesDomainCookies.on('click', async (event) => {
    event.preventDefault();
    const domainPattern = $(event.target).parent().attr('id');
    const domainPatternIndex = $(event.target).parent().attr('idIndex');
    if (domainPattern === 'setCookiesDomainCookies' ||
        !preferences.setCookiesDomain[decodeURIComponent(domainPattern)]) {
      return;
    }

    delete preferences.setCookiesDomain[decodeURIComponent(domainPattern)][domainPatternIndex];
    const cookies = preferences.setCookiesDomain[decodeURIComponent(domainPattern)].filter(cookie => typeof cookie === 'object');
    if (!cookies.length) {
      delete preferences.setCookiesDomain[decodeURIComponent(domainPattern)];
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
  $('#statisticsStartTime').html(storage.statistics.startTime);

  $('#deletesHistoryContainersDeleted').html(storage.statistics.deletesHistory.containersDeleted);
  $('#deletesHistoryCookiesDeleted').html(storage.statistics.deletesHistory.cookiesDeleted);
  $('#deletesHistoryUrlsDeleted').html(storage.statistics.deletesHistory.urlsDeleted);
};

window.saveAdvancedPreferences = async (event) => {
  event.preventDefault();

  preferences.deletesHistoryContainer = document.querySelector('#deletesHistoryContainer').value;
  preferences.deletesHistoryContainerRemoval = document.querySelector('#deletesHistoryContainerRemoval').value;
  preferences.deletesHistoryContainerMouseClicks = document.querySelector('#deletesHistoryContainerMouseClicks').value;
  preferences.automaticModeNewTab = document.querySelector('#automaticModeNewTab').value;
  preferences.pageAction = document.querySelector('#pageAction').checked;
  preferences.contextMenu = document.querySelector('#contextMenu').checked;

  preferences.keyboardShortcuts.AltC = document.querySelector('#keyboardShortcutsAltC').checked;
  preferences.keyboardShortcuts.AltP = document.querySelector('#keyboardShortcutsAltP').checked;
  preferences.keyboardShortcuts.AltN = document.querySelector('#keyboardShortcutsAltN').checked;
  preferences.keyboardShortcuts.AltShiftC = document.querySelector('#keyboardShortcutsAltShiftC').checked;
  preferences.keyboardShortcuts.AltX = document.querySelector('#keyboardShortcutsAltX').checked;

  // TODO this might cause saving preferences that got selected on global mouseclicks but not saved
  saveLinkClickGlobalPreferences(event);
};


window.saveStatisticsPreferences = async (event) => {
  event.preventDefault();
  preferences.statistics = document.querySelector('#statisticsCheckbox').checked;
  preferences.deletesHistoryStatistics = document.querySelector('#deletesHistoryStatisticsCheckbox').checked;
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

