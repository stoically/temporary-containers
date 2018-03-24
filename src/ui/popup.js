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
    isolationDomainEditRule(tabParsedUrl.hostname);
  } catch (error) {
    showPreferencesError(error);
  }
};

document.addEventListener('DOMContentLoaded', initialize);