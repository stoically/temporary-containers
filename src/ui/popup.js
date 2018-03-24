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


    const historyPermission = await browser.permissions.contains({permissions: ['history']});
    if (historyPermission) {
      $('#deletesHistoryButton').on('click', () => {
        browser.runtime.sendMessage({
          method: 'createTabInTempContainer',
          payload: {
            deletesHistory: true
          }
        });
      });
      $('#deletesHistoryButton').addClass('item');
      $('#deletesHistoryButton').removeClass('hidden');
    }
    $.tab('change tab', 'general');
  } catch (error) {
    showPreferencesError(error);
  }
};

document.addEventListener('DOMContentLoaded', initialize);