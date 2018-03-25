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

    $('#tmpButton').on('click', () => {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer'
      });
      window.close();
    });

    $('#preferences').on('click', () => {
      browser.tabs.create({
        url: browser.runtime.getURL('ui/options.html')
      });
      window.close();
    });

    const historyPermission = await browser.permissions.contains({permissions: ['history']});
    if (historyPermission) {
      $('#deletesHistoryButton').on('click', () => {
        browser.runtime.sendMessage({
          method: 'createTabInTempContainer',
          payload: {
            deletesHistory: true
          }
        });
        window.close();
      });
      $('#deletesHistoryButton').addClass('item');
      $('#deletesHistoryButton').removeClass('hidden');
      $('#actionOpenInDeletesHistoryTmpDiv').removeClass('hidden');
    }

    const tabs = await browser.tabs.query({active: true});
    const activeTab = tabs[0];
    if (!activeTab.url.startsWith('http')) {
      $('#menu').addClass('hidden');
      $('#menu').removeClass('item');
      return;
    }
    const tabParsedUrl = new URL(activeTab.url);
    isolationDomainEditRule(tabParsedUrl.hostname);

    $('#actionOpenInTmp').on('click', () => {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
        payload: {
          url: activeTab.url
        }
      });
      window.close();
    });

    $('#actionOpenInDeletesHistoryTmp').on('click', () => {
      browser.runtime.sendMessage({
        method: 'createTabInTempContainer',
        payload: {
          url: activeTab.url,
          deletesHistory: true
        }
      });
      window.close();
    });

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
        window.close();
      });
      $('#actionConvertToRegularDiv').removeClass('hidden');
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
        window.close();
      });
      $('#actionConvertToPermanentDiv').removeClass('hidden');
    }

    if (activeTab.cookieStoreId !== 'firefox-default' &&
        !storage.tempContainers[activeTab.cookieStoreId]) {
      $('#actionConvertToTemporary').on('click', () => {
        browser.runtime.sendMessage({
          method: 'convertPermanentToTempContainer',
          payload: {
            cookieStoreId: activeTab.cookieStoreId,
            tabId: activeTab.id,
            url: activeTab.url
          }
        });
        window.close();
      });
      $('#actionConvertToTemporaryDiv').removeClass('hidden');
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