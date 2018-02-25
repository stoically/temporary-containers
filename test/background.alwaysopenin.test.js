preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {

  describe('Always Open In', () => {
    beforeEach(async () => {
      global.background = await loadBackground(preferences);
      background.storage.local.preferences.alwaysOpenInDomain = {
        'example.com': {
          allowedInPermanent: false
        }
      };
    });

    it('should open in a new temporary container', async () => {
      await helper.browser.request({
        tabId: 2,
        tabUrl: 'about:newtab',
        url: 'https://example.com',
        originContainer: 'firefox-default'
      });
      browser.tabs.create.should.have.been.calledOnce;
    });


    it('should not open in a new temporary container if its a clean tmp tab', async () => {
      await helper.browser.openNewTmpTab({
        createsTabId: 2,
        createsContainer: 'firefox-tmp1'
      });
      await helper.browser.request({
        tabId: 2,
        tabUrl: 'about:newtab',
        url: 'https://example.com',
        originContainer: 'firefox-tmp1'
      });

      browser.tabs.create.should.not.have.been.called;
    });

    it('should not open in a new temporary container if its allowed in permanent container', async () => {
      background.storage.local.preferences.alwaysOpenInDomain = {
        'example.com': {
          allowedInPermanent: true
        }
      };
      await helper.browser.request({
        tabId: 2,
        tabUrl: 'about:newtab',
        url: 'https://example.com',
        originContainer: 'firefox-container-1'
      });

      browser.tabs.create.should.not.have.been.called;
    });


    it('should not open in a new temporary container if the tab url belonging to the request matches the pattern', async () => {
      await helper.browser.openNewTmpTab({
        createsTabId: 2,
        createsContainer: 'firefox-tmp1'
      });
      await helper.browser.request({
        tabId: 2,
        tabUrl: 'about:newtab',
        url: 'https://example.com',
        originContainer: 'firefox-tmp1',
        resetHistory: true
      });

      await helper.browser.request({
        tabId: 2,
        url: 'https://example.com',
        originContainer: 'firefox-tmp1'
      });
      browser.tabs.create.should.not.have.been.called;
    });


    it('should open in a new temporary container if the tab url belonging to the request doesnt match the pattern', async () => {
      await helper.browser.openNewTmpTab({
        createsTabId: 2,
        createsContainer: 'firefox-tmp1'
      });
      await helper.browser.request({
        tabId: 2,
        url: 'https://notexample.com',
        originContainer: 'firefox-tmp1',
        resetHistory: true
      });

      await helper.browser.request({
        tabId: 2,
        tabUrl: 'https://notexample.com',
        url: 'https://example.com',
        originContainer: 'firefox-tmp1'
      });
      browser.tabs.create.should.have.been.calledOnce;
    });
  });

});});