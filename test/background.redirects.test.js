const helper = {
  browser: {
    async requestThatGetsReopened({
      requestId = 1,
      tabId = 1,
      url,
      originContainer = 'firefox-default',
      createsContainer = 'firefox-tmp-1',
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
        id: createsTabId
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeCreatedContainer);
      browser.tabs.create.resolves(fakeCreatedTab);

      return background.request.webRequestOnBeforeRequest(fakeRequest);
    }
  }
};

describe('addons that do redirects', () => {
  beforeEach(async () => {
    global.background = await loadBackground();
  });

  describe('https everywhere', () => {
    it('should close one tab if unexpected redirects happen despite canceling requests', async () => {
      // we get a http request, cancel it and create a new tab with id 2 (the http version)
      // but https everywhere saw it and redirects the request instantly
      //   (why is that even possible, we canceled, right? and why does it only happen sporadic?)
      // we see the new request, cancel that and create a new tab 3 (the https version)
      helper.browser.requestThatGetsReopened({
        requestId: 1,
        tabId: 1,
        createsTabId: 2,
        createsContainer: 'firefox-tmp-1',
        url: 'http://example.com'
      });

      await helper.browser.requestThatGetsReopened({
        requestId: 1,
        tabId: 1,
        createsTabId: 3,
        createsContainer: 'firefox-tmp-2',
        url: 'https://example.com'
      });
      browser.tabs.remove.should.have.been.calledTwice;
      browser.tabs.remove.should.have.been.calledWith(1);
      browser.tabs.create.should.have.been.calledOnce;
    });
  });
});
