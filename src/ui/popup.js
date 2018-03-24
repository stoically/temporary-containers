const initialize = async () => {
  $('.ui.dropdown').dropdown();
  $('.ui.checkbox').checkbox();

  try {
    const storage = await browser.storage.local.get();
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
    const activeTab = tabs[0];
    const tabParsedUrl = new URL(activeTab.url);
    isolationDomainEditRule(tabParsedUrl.hostname);

    let actionsAvailable = false;
    if (storage.tempContainers[activeTab.cookieStoreId] &&
        storage.tempContainers[activeTab.cookieStoreId].deletesHistory) {
      $('#actionConvertToRegular').on('click', () => {
        browser.runtime.sendMessage({
          method: 'convertTempContainerToRegular',
          payload: {
            cookieStoreId: activeTab.cookieStoreId,
            tabId: activeTab.id,
            url: activeTab.url
          }
        });
      });
      $('#actionConvertToRegularDiv').removeClass('hidden');
      actionsAvailable = true;
    }
    if (storage.tempContainers[activeTab.cookieStoreId]) {
      $('#actionConvertToPermanent').on('click', async () => {
        await browser.runtime.sendMessage({
          method: 'convertTempContainerToPermanent',
          payload: {
            cookieStoreId: activeTab.cookieStoreId,
            tabId: activeTab.id,
            name: tabParsedUrl.hostname,
            url: activeTab.url
          }
        });
      });
      $('#actionConvertToPermanentDiv').removeClass('hidden');
      actionsAvailable = true;
    }
    if (actionsAvailable) {
      $('#actionsNonAvailabe').addClass('hidden');
    }

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
    $('.ui.sidebar').sidebar({
      transition: 'overlay'
    });
    $('#menu').on('click', () => {
      $('.ui.sidebar').sidebar('toggle');
    });
    $('#menuIsolation').on('click', () => {
      $('.ui.sidebar').sidebar('hide');
      $.tab('change tab', 'isolation');
    });
    $('#menuActions').on('click', () => {
      $('.ui.sidebar').sidebar('hide');
      $.tab('change tab', 'actions');
    });
    $.tab('change tab', 'isolation');
  } catch (error) {
    showPreferencesError(error);
  }
};

document.addEventListener('DOMContentLoaded', initialize);