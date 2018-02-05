
let preferences;
const messageBox = $('#message');
const showMessage = (message) => {
  messageBox.html(message);
  messageBox.addClass('positive');
  messageBox.removeClass('negative');
  messageBox.removeClass('hidden');
  setTimeout(() => {
    messageBox.addClass('hidden');
  }, 3000);
};
const showError = (error) => {
  messageBox.html(error);
  messageBox.addClass('negative');
  messageBox.removeClass('positive');
  messageBox.removeClass('hidden');
};

const savePreferences = async () => {
  try {
    await browser.runtime.sendMessage({
      savePreferences: {
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

const saveContainerPreferences = async (event) => {
  event.preventDefault();

  preferences.automaticMode = document.querySelector('#automaticMode').checked;
  preferences.containerNamePrefix = document.querySelector('#containerNamePrefix').value;
  preferences.containerColor = document.querySelector('#containerColor').value;
  preferences.containerColorRandom = document.querySelector('#containerColorRandom').checked;
  preferences.containerIcon = document.querySelector('#containerIcon').value;
  preferences.containerIconRandom = document.querySelector('#containerIconRandom').checked;
  preferences.containerNumberMode = document.querySelector('#containerNumberMode').value;
  preferences.iconColor = document.querySelector('#iconColor').value;

  await savePreferences();
};

const saveLinkClickGlobalPreferences = async (event) => {
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
      action: document.querySelector('#linkClickGlobalLeft').value
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

const updateLinkClickDomainRules = () => {
  const linkClickDomainRules = $('#linkClickDomainRules');
  const domainRules = Object.keys(preferences.linkClickDomain);
  if (domainRules.length) {
    linkClickDomainRules.html('');
    domainRules.map((domainPattern) => {
      const domainRuleTooltip =
        `Middle Mouse: ${preferences.linkClickDomain[domainPattern].middle.action} / ` +
        `Ctrl+Left Mouse: ${preferences.linkClickDomain[domainPattern].ctrlleft.action}`;
      linkClickDomainRules.append(`<div class="item" id="${encodeURIComponent(domainPattern)}">${domainPattern} ` +
        `<span href="#" data-tooltip="${domainRuleTooltip}" data-position="right center">🛈</span> ` +
        '<a href="#" id="linkClickRemoveDomainRules" data-tooltip="Remove Rule (no confirmation)" ' +
        'data-position="right center">❌</a></div>');
    });

    linkClickDomainRules.on('click', async (event) => {
      event.preventDefault();
      const domainPattern = $(event.target).parent().attr('id');
      if (domainPattern === 'linkClickDomainRules') {
        return;
      }
      delete preferences.linkClickDomain[decodeURIComponent(domainPattern)];
      await savePreferences();
      updateLinkClickDomainRules();
    });
  } else {
    linkClickDomainRules.html('No Rules added');
  }
};

const alwaysOpenInDomainAddRule = async () => {
  const domainPattern = document.querySelector('#alwaysOpenInDomainPattern').value;

  preferences.alwaysOpenInDomain[domainPattern] = true;
  await savePreferences();
  updateAlwaysOpenInDomainRules();
};

const updateAlwaysOpenInDomainRules = () => {
  const alwaysOpenInDomainRules = $('#alwaysOpenInDomainRules');
  const domainRules = Object.keys(preferences.alwaysOpenInDomain);
  if (domainRules.length) {
    alwaysOpenInDomainRules.html('');
    domainRules.map((domainPattern) => {
      alwaysOpenInDomainRules.append(`<div class="item" id="${encodeURIComponent(domainPattern)}">${domainPattern} ` +
        '<a href="#" id="alwaysOpenInRemoveDomainRules" data-tooltip="Remove Rule (no confirmation)" ' +
        'data-position="right center">❌</a></div>');
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

const saveAdvancedPreferences = async (event) => {
  event.preventDefault();

  preferences.deletesHistoryContainer = document.querySelector('#deletesHistoryContainer').value;
  preferences.deletesHistoryContainerMouseClicks = document.querySelector('#deletesHistoryContainerMouseClicks').value;
  preferences.automaticModeNewTab = document.querySelector('#automaticModeNewTab').value;

  saveLinkClickGlobalPreferences(event);
};

const initialize = async () => {
  $('.menu .item').tab();
  $('.ui.dropdown').dropdown();
  $('.ui.checkbox').checkbox();
  const setCurrentPreferences = () => {
    document.querySelector('#automaticMode').checked = preferences.automaticMode;
    document.querySelector('#containerNamePrefix').value = preferences.containerNamePrefix;
    $('#containerColor').dropdown('set selected', preferences.containerColor);
    document.querySelector('#containerColorRandom').checked = preferences.containerColorRandom;
    $('#containerIcon').dropdown('set selected', preferences.containerIcon);
    document.querySelector('#containerIconRandom').checked = preferences.containerIconRandom;
    $('#containerNumberMode').dropdown('set selected', preferences.containerNumberMode);
    $('#iconColor').dropdown('set selected', preferences.iconColor);

    $('#linkClickGlobalMiddle').dropdown('set selected', preferences.linkClickGlobal.middle.action);
    $('#linkClickGlobalCtrlLeft').dropdown('set selected', preferences.linkClickGlobal.ctrlleft.action);
    $('#linkClickGlobalLeft').dropdown('set selected', preferences.linkClickGlobal.left.action);

    $('#linkClickGlobalMiddleCreatesContainer').dropdown('set selected', preferences.linkClickGlobal.middle.container);
    $('#linkClickGlobalCtrlLeftCreatesContainer').dropdown('set selected', preferences.linkClickGlobal.ctrlleft.container);

    $('#deletesHistoryContainer').dropdown('set selected', preferences.deletesHistoryContainer);
    $('#deletesHistoryContainerMouseClicks').dropdown('set selected', preferences.deletesHistoryContainerMouseClicks);
    $('#automaticModeNewTab').dropdown('set selected', preferences.automaticModeNewTab);

    updateLinkClickDomainRules();
    updateAlwaysOpenInDomainRules();
  };

  const storage = await browser.storage.local.get('preferences');
  if (!storage.preferences) {
    showError('Error while loading preferences.');
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

  const domainPatternToolTip =
    '<div style="width:400px;">' +
    'Exact Match: <strong>example.com</strong><br>' +
    'Glob Match: <strong>*.example.com</strong><br>' +
    'Note: *.example.com would not match example.com, ' +
    'so you might need two rules</div>';

  $('#linkClickDomainPatternDiv').popup({
    html: domainPatternToolTip,
    inline: true
  });

  $('#alwaysOpenInDomainPatternDiv').popup({
    html: domainPatternToolTip,
    inline: true
  });

  const automaticModeToolTip =
    '<div style="width:500px;">' +
    'Automatically open Tabs in new Temporary Containers when<ul>' +
    '<li> Clicking the "New Tab"-Icon' +
    '<li> Clicking "New Tab" or "New Window" in the Browser Menu' +
    '<li> Pressing the Ctrl+T or Ctrl+N Shortcut' +
    '<li> An external Program opens a Link in the Browser</ul>';

  $('#automaticModeField').popup({
    html: automaticModeToolTip,
    inline: true
  });

  const historyPermission = await browser.permissions.contains({permissions: ['history']});
  if (historyPermission) {
    $('#deletesHistoryContainerWarningRead')
      .checkbox('check')
      .checkbox('set disabled');
  }
};

document.addEventListener('DOMContentLoaded', initialize);
$('#saveContainerPreferences').on('click', saveContainerPreferences);
$('#saveAdvancedPreferences').on('click', saveAdvancedPreferences);
$('#saveLinkClickGlobalPreferences').on('click', saveLinkClickGlobalPreferences);


const requestHistoryPermissions = async () => {
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
  }
};
$('#deletesHistoryContainerWarningRead').on('click', requestHistoryPermissions);
