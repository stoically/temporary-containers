const initialize = async () => {
  $('.menu .item').tab();
  $('.ui.dropdown').dropdown();
  $('.ui.checkbox').checkbox();

  const storage = await browser.storage.local.get('preferences');
  if (!storage.preferences) {
    showError('Error while loading preferences.');
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
};

document.addEventListener('DOMContentLoaded', initialize);