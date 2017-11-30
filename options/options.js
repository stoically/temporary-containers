
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

  await savePreferences();
};

const saveLinkClickGlobalPreferences = async (event) => {
  event.preventDefault();

  preferences.linkClickGlobal = {
    middle: {
      action: document.querySelector('#linkClickGlobalMiddle').value,
      overwriteAutomaticMode: document.querySelector('#linkClickGlobalMiddleOverwritesAutomaticMode').checked
    },
    ctrlleft: {
      action: document.querySelector('#linkClickGlobalCtrlLeft').value,
      overwriteAutomaticMode: document.querySelector('#linkClickGlobalCtrlLeftOverwritesAutomaticMode').checked
    },
    left: {
      action: document.querySelector('#linkClickGlobalLeft').value,
      overwriteAutomaticMode: document.querySelector('#linkClickGlobalLeftOverwritesAutomaticMode').checked
    }
  };

  await savePreferences();
};

const linkClickDomainAddRule = async () => {
  const domainPattern = document.querySelector('#linkClickDomainPattern').value;
  const domainRule = {
    middle: {
      action: document.querySelector('#linkClickDomainMiddle').value,
      overwriteAutomaticMode: document.querySelector('#linkClickDomainMiddleOverwritesAutomaticMode').checked
    },
    ctrlleft: {
      action: document.querySelector('#linkClickDomainCtrlLeft').value,
      overwriteAutomaticMode: document.querySelector('#linkClickDomainCtrlLeftOverwritesAutomaticMode').checked
    },
    left: {
      action: document.querySelector('#linkClickDomainLeft').value,
      overwriteAutomaticMode: document.querySelector('#linkClickDomainLeftOverwritesAutomaticMode').checked
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

    $('#linkClickGlobalMiddle').dropdown('set selected', preferences.linkClickGlobal.middle.action);
    document.querySelector('#linkClickGlobalMiddleOverwritesAutomaticMode').checked =
      preferences.linkClickGlobal.middle.overwriteAutomaticMode;
    $('#linkClickGlobalCtrlLeft').dropdown('set selected', preferences.linkClickGlobal.ctrlleft.action);
    document.querySelector('#linkClickGlobalCtrlLeftOverwritesAutomaticMode').checked =
      preferences.linkClickGlobal.ctrlleft.overwriteAutomaticMode;
    $('#linkClickGlobalLeft').dropdown('set selected', preferences.linkClickGlobal.left.action);
    document.querySelector('#linkClickGlobalLeftOverwritesAutomaticMode').checked =
      preferences.linkClickGlobal.left.overwriteAutomaticMode;

    updateLinkClickDomainRules();
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

  $('#linkClickDomainPatternDiv').popup({
    html: '<div style="width:400px;">' +
          'Exact Match: <strong>example.com</strong><br>' +
          'Glob Match: <strong>*.example.com</strong><br>' +
          'Note: *.example.com would not match example.com, ' +
          'so you might need two rules</div>',
    inline: true
  });
};

document.addEventListener('DOMContentLoaded', initialize);
$('#saveContainerPreferences').on('click', saveContainerPreferences);
$('#saveLinkClickGlobalPreferences').on('click', saveLinkClickGlobalPreferences);
