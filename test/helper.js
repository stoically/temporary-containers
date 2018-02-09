module.exports = {
  browser: {
    async openNewTmpTab({
      tabId = 1,
      url = 'about:newtab',
      createsTabId = 2,
      createsContainer = 'firefox-tmp1'
    }) {
      const fakeCreatedContainer = {
        cookieStoreId: createsContainer
      };
      const fakeCreatedTab = {
        id: createsTabId,
        openerTabId: tabId
      };
      browser.contextualIdentities.create.resolves(fakeCreatedContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      browser.tabs.onUpdated.addListener.yield(tabId, { url }, {
        id: tabId,
        url,
        cookieStoreId: 'firefox-default'
      });
      await nextTick();
    },

    request({
      requestId = 1,
      tabId = 1,
      url,
      originContainer = 'firefox-default',
      createsContainer = 'firefox-tmp1',
      createsTabId = 2,
      resetHistory = false
    }) {
      if (resetHistory) {
        browser.tabs.remove.resetHistory();
        browser.tabs.create.resetHistory();
        browser.contextualIdentities.create.resetHistory();
      }
      const fakeRequest = {
        requestId,
        tabId,
        url
      };
      const fakeTab = {
        id: tabId,
        cookieStoreId: originContainer
      };
      const fakeCreatedContainer = {
        cookieStoreId: createsContainer
      };
      const fakeCreatedTab = {
        id: createsTabId,
        openerTabId: tabId
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeCreatedContainer);
      browser.tabs.create.resolves(fakeCreatedTab);

      return background.request.webRequestOnBeforeRequest(fakeRequest);
    },

    async mouseClickOnLink({
      originTabId = 1,
      clickType = 'left',
      domainCombination = false,
      senderUrl,
      targetUrl
    }) {
      switch (domainCombination) {
      case 'notsameexact':
        senderUrl = 'https://notexample.com';
        targetUrl = 'https://example.com';
        break;
      }

      let clickEvent = {};
      switch (clickType) {
      case 'left':
        clickEvent.button = 0;
        break;
      }

      const fakeSender = {
        tab: {
          id: originTabId,
          url: senderUrl
        }
      };
      const fakeMessage = {
        method: 'linkClicked',
        payload: {
          href: targetUrl,
          event: {
            button: clickEvent.button
          }
        }
      };
      return await background.runtimeOnMessage(fakeMessage, fakeSender);
    }
  }
};
