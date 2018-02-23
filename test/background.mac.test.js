preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {

  describe('Multi-Account Containers', () => {
    beforeEach(async () => {
      global.background = await loadBackground(preferences);
    });

    describe('opening new tmptab and loading mac assigned url and not "remember my choice"', () => {
      beforeEach(async () => {
        browser.runtime.sendMessage.resolves({
          userContextId: '1',
          neverAsk: false
        });
        await helper.browser.openNewTmpTab({
          tabId: 1,
          createsTabId: 2,
          createsContainer: 'firefox-tmp1',
        });
        await nextTick();
      });

      it('should not interrupt since the tmptab is clean', async () => {
        helper.browser.request({
          requestId: 1,
          tabId: 2,
          originContainer: 'firefox-tmp1',
          url: 'http://example.com',
          resetHistory: true
        });
        await helper.browser.openMacConfirmPage({
          tabId: 3,
          originContainer: 'firefox-tmp1',
          targetContainer: 'firefox-container-1',
          url: 'http://example.com'
        });

        browser.tabs.remove.should.not.have.been.called;
        browser.tabs.create.should.not.have.been.called;
      });
    });
  });

});});