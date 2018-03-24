const initialize = async () => {
  $('.ui.dropdown').dropdown();
  $('.ui.checkbox').checkbox();

  try {
    const storage = await browser.storage.local.get('preferences');
    if (!storage.preferences || !Object.keys(storage.preferences).length) {
      showPreferencesError();
      return;
    }
    preferences = storage.preferences;
    updateIsolationDomains();

    $('#isolationDomainForm').form({
      fields: {
        isolationDomainPattern: 'empty'
      },
      onSuccess: (event) => {
        event.preventDefault();
        isolationDomainAddRule();
      }
    });

    const tabs = await browser.tabs.query({active: true});
    const tabParsedUrl = new URL(tabs[0].url);
    document.querySelector('#isolationDomainPattern').value = tabParsedUrl.hostname;

    if (preferences.isolation.domain[tabParsedUrl.hostname]) {
      const domainRules = preferences.isolation.domain[tabParsedUrl.hostname];

      $('#isolationDomainAlways').dropdown('set selected', domainRules.always.action);
      document.querySelector('#isolationDomainAlwaysAllowedInPermanent').checked = domainRules.always.allowedInPermanent;
      $('#isolationDomainNavigation').dropdown('set selected', domainRules.navigation.action);
      $('#isolationDomainMouseClickMiddle').dropdown('set selected', domainRules.mouseClick.middle.action);
      $('#isolationDomainMouseClickCtrlLeft').dropdown('set selected', domainRules.mouseClick.ctrlleft.action);
      $('#isolationDomainMouseClickLeft').dropdown('set selected', domainRules.mouseClick.left.action);
    }
  } catch (error) {
    showPreferencesError(error);
  }
};

document.addEventListener('DOMContentLoaded', initialize);