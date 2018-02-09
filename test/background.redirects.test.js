describe('addons that do redirects', () => {
  beforeEach(async () => {
    global.background = await loadBackground();
  });

  describe('https everywhere', () => {
    it('should not open two tabs if unexpected redirects happen', async () => {
      // we get a http request, cancel it and create a new tab with id 2 (the http version)
      // but https everywhere saw it and redirects the request instantly
      //   (why is that even possible, we canceled, right? and why does it only happen sporadic?)
      // we see the new request, cancel that and create a new tab 3 (the https version)
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1436700
      helper.browser.request({
        requestId: 1,
        tabId: 1,
        createsTabId: 2,
        createsContainer: 'firefox-tmp1',
        url: 'http://example.com'
      });

      await helper.browser.request({
        requestId: 1,
        tabId: 1,
        createsTabId: 3,
        createsContainer: 'firefox-tmp2',
        url: 'https://example.com'
      });
      browser.tabs.remove.should.have.been.calledTwice;
      browser.tabs.remove.should.have.been.calledWith(1);
      browser.tabs.create.should.have.been.calledOnce;
    });

    describe('opening new tmptab and left clicking link with global always setting', () => {
      beforeEach(async () => {
        background.storage.local.preferences.linkClickGlobal.left.action = 'always';
        await helper.browser.openNewTmpTab({
          createsTabId: 2
        });
        await helper.browser.mouseClickOnLink({
          senderUrl: 'http://example.com',
          targetUrl: 'http://notexample.com',
        });
        await nextTick();
      });

      it('should not keep loading the link in the same tab if unexpected redirects happen', async () => {
        const initialClickRequest = await helper.browser.request({
          requestId: 1,
          tabId: 2,
          createsTabId: 3,
          createsContainer: 'firefox-tmp1',
          url: 'http://notexample.com',
          resetHistory: true
        });
        initialClickRequest.should.deep.equal({cancel: true});
        browser.tabs.remove.should.have.been.calledOnce;
        browser.tabs.create.should.have.been.calledOnce;

        const redirectRequest = await helper.browser.request({
          requestId: 1,
          tabId: 2,
          createsTabId: 4,
          createsContainer: 'firefox-tmp2',
          url: 'https://notexample.com',
          resetHistory: true
        });
        redirectRequest.should.deep.equal({cancel: true});
        browser.tabs.remove.should.not.have.been.called;
        browser.tabs.create.should.not.have.been.called;
      });
    });
  });
});
