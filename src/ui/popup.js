const initialize = async () => {
  $('.menu .item').tab();
  $('.ui.dropdown').dropdown();
  $('.ui.checkbox').checkbox();

  const storage = await browser.storage.local.get('preferences');
  if (!storage.preferences || !Object.keys(storage.preferences).length) {
    showPreferencesError();
    return;
  }
  preferences = storage.preferences;
  updateLinkClickDomainRules();

  $('#linkClickDomainForm').form({
    fields: {
      linkClickDomainPattern: 'empty'
    },
    onSuccess: (event) => {
      event.preventDefault();
      linkClickDomainAddRule();
    }
  });

  const tabs = await browser.tabs.query({active: true});
  const tabParsedUrl = new URL(tabs[0].url);
  document.querySelector('#linkClickDomainPattern').value = tabParsedUrl.hostname;

  if (preferences.linkClickDomain[tabParsedUrl.hostname]) {
    const domainRules = preferences.linkClickDomain[tabParsedUrl.hostname];
    $('#linkClickDomainMiddle').dropdown('set selected', domainRules.middle.action);
    $('#linkClickDomainCtrlLeft').dropdown('set selected', domainRules.ctrlleft.action);
    $('#linkClickDomainLeft').dropdown('set selected', domainRules.left.action);
  }
};

document.addEventListener('DOMContentLoaded', initialize);