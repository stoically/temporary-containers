module.exports = {
  browser: {
    async openNewTmpTab({
      tabId = 1,
      createsTabId = 2,
      createsContainer = 'firefox-tmp1',
      resetHistory = true,
    }) {
      const fakeCreatedContainer = {
        cookieStoreId: createsContainer,
      };
      const fakeCreatedTab = {
        id: createsTabId,
        openerTabId: tabId,
      };
      browser.contextualIdentities.create.resolves(fakeCreatedContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      browser.tabs.get.resolves({
        id: tabId,
        cookieStoreId: createsContainer,
      });
      const [promise] = browser.browserAction.onClicked.addListener.yield({
        id: tabId,
      });
      await promise;
      if (resetHistory) {
        browser.contextualIdentities.create.resetHistory();
        browser.tabs.create.resetHistory();
        browser.tabs.get.resetHistory();
      }
    },

    requestId: 1,
    request({
      requestId = false,
      tabId = 1,
      tabUrl,
      url,
      originContainer = 'firefox-default',
      createsContainer = 'firefox-tmp1',
      createsTabId = 2,
      macWasFaster = false,
      resetHistory = false,
    }) {
      if (!requestId) {
        requestId = this.requestId++;
      }
      if (resetHistory) {
        browser.tabs.remove.resetHistory();
        browser.tabs.create.resetHistory();
        browser.contextualIdentities.create.resetHistory();
      }
      const fakeRequest = {
        requestId,
        tabId,
        url,
      };
      const fakeTab = {
        id: tabId,
        cookieStoreId: originContainer,
        url: tabUrl,
      };
      const fakeCreatedContainer = {
        cookieStoreId: createsContainer,
      };
      const fakeCreatedTab = {
        id: createsTabId,
        openerTabId: tabId,
      };
      if (macWasFaster) {
        browser.tabs.get.rejects({ mac: 'was faster' });
      } else {
        browser.tabs.get.resolves(fakeTab);
      }
      browser.contextualIdentities.create.resolves(fakeCreatedContainer);
      browser.tabs.create.resolves(fakeCreatedTab);

      return background.request.webRequestOnBeforeRequest(fakeRequest);
    },

    async mouseClickOnLink({
      originTabId = 1,
      clickType = 'left',
      domainCombination = false,
      senderUrl,
      targetUrl,
    }) {
      switch (domainCombination) {
        case 'notsameexact':
          senderUrl = 'https://notexample.com';
          targetUrl = 'https://example.com';
          break;
      }

      const clickEvent = {};
      switch (clickType) {
        case 'middle':
          clickEvent.button = 1;
          break;
        case 'ctrlleft':
          clickEvent.button = 0;
          clickEvent.ctrlKey = true;
          break;
        case 'left':
          clickEvent.button = 0;
          break;
      }

      const fakeSender = {
        tab: {
          id: originTabId,
          url: senderUrl,
        },
      };
      const fakeMessage = {
        method: 'linkClicked',
        payload: {
          href: targetUrl,
          event: clickEvent,
        },
      };
      return await background.runtime.onMessage(fakeMessage, fakeSender);
    },

    openMacConfirmPage({
      tabId = 1,
      originContainer = 'firefox-default',
      url = 'http://example.com',
      targetContainer = false,
      resetHistory = false,
    }) {
      if (resetHistory) {
        browser.tabs.remove.resetHistory();
        browser.tabs.create.resetHistory();
        browser.contextualIdentities.create.resetHistory();
      }

      let confirmPageUrl =
        'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent(url) +
        '&cookieStoreId=' +
        targetContainer;
      if (originContainer !== 'firefox-default') {
        confirmPageUrl += '&currentCookieStoreId=' + originContainer;
      }
      const changeInfo = {
        url: confirmPageUrl,
      };
      const tab = {
        id: tabId,
        cookieStoreId: originContainer,
        url: confirmPageUrl,
      };

      return background.tabs.onUpdated(tabId, changeInfo, tab);
    },
  },
};
