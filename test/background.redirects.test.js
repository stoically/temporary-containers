preferencesTestSet.map(preferences => {
  describe(`preferences: ${JSON.stringify(preferences)}`, () => {
    describe('addons that do redirects in automatic mode', () => {
      let background;
      beforeEach(async () => {
        background = await loadBackground(preferences);
      });

      describe('https everywhere', () => {
        it('should not open two tabs if redirects happen', async () => {
          if (!preferences.automaticMode.active) {
            return;
          }
          // we get a http request, cancel it and create a new tab with id 2 (the http version)
          // but https everywhere saw it and redirects the request instantly
          // we see the new request, cancel that and create a new tab 3 (the https version)
          helper.browser.request({
            requestId: 1,
            tabId: 1,
            createsTabId: 2,
            createsContainer: 'firefox-tmp1',
            url: 'http://example.com',
          });

          await helper.browser.request({
            requestId: 1,
            tabId: 1,
            createsTabId: 3,
            createsContainer: 'firefox-tmp2',
            url: 'https://example.com',
          });
          await nextTick();
          browser.tabs.remove.should.have.been.calledOnce;
          browser.tabs.remove.should.have.been.calledWith(1);
          browser.tabs.create.should.have.been.calledOnce;
        });

        describe('opening new tmptab and left clicking link with global always setting', () => {
          beforeEach(async () => {
            background.storage.local.preferences.isolation.global.mouseClick.left.action =
              'always';
            await helper.browser.openNewTmpTab({
              tabId: 1,
              createsTabId: 2,
            });
            await helper.browser.mouseClickOnLink({
              senderUrl: 'http://example.com',
              targetUrl: 'http://notexample.com',
            });
            await nextTick();
          });

          it('should not keep loading the link in the same tab if redirects happen', async () => {
            const initialClickRequestPromise = helper.browser.request({
              requestId: 1,
              tabId: 1,
              createsTabId: 2,
              createsContainer: 'firefox-tmp1',
              url: 'http://notexample.com',
            });

            const redirectRequest = await helper.browser.request({
              requestId: 1,
              tabId: 1,
              createsTabId: 3,
              createsContainer: 'firefox-tmp2',
              url: 'https://notexample.com',
              resetHistory: true,
            });
            await nextTick();
            expect(redirectRequest).to.deep.equal({ cancel: true });
            browser.contextualIdentities.create.should.have.been.calledOnce;
            browser.tabs.create.should.have.been.calledOnce;
            browser.tabs.remove.should.not.have.been.called;

            const initialClickRequest = await initialClickRequestPromise;
            expect(initialClickRequest).to.deep.equal({ cancel: true });
          });

          it('should not keep loading the link in the same tab if redirects happen even when in temporary container', async () => {
            const initialClickRequestPromise = helper.browser.request({
              requestId: 1,
              tabId: 1,
              originContainer: 'firefox-tmp123',
              createsTabId: 2,
              createsContainer: 'firefox-tmp1',
              url: 'http://notexample.com',
            });

            const redirectRequest = await helper.browser.request({
              requestId: 1,
              tabId: 1,
              originContainer: 'firefox-tmp123',
              createsTabId: 3,
              createsContainer: 'firefox-tmp2',
              url: 'https://notexample.com',
              resetHistory: true,
            });
            await nextTick();
            expect(redirectRequest).to.deep.equal({ cancel: true });
            browser.contextualIdentities.create.should.have.been.calledOnce;
            browser.tabs.create.should.have.been.calledOnce;
            browser.tabs.remove.should.not.have.been.called;

            const initialClickRequest = await initialClickRequestPromise;
            expect(initialClickRequest).to.deep.equal({ cancel: true });
          });
        });
      });

      describe('link cleaner', () => {
        describe('opening new tmptab and left clicking link with global always setting', () => {
          beforeEach(async () => {
            background.storage.local.preferences.isolation.global.mouseClick.left.action =
              'always';
            await helper.browser.openNewTmpTab({
              tabId: 1,
              createsTabId: 2,
            });
            await helper.browser.mouseClickOnLink({
              senderUrl: 'http://example.com',
              targetUrl: 'http://notexample.com',
            });
            await nextTick();
          });

          it('should not keep loading the link in the same tab if redirects happen', async () => {
            const initialClickRequestPromise = helper.browser.request({
              requestId: 1,
              tabId: 1,
              originContainer: 'firefox-tmp123',
              createsTabId: 2,
              createsContainer: 'firefox-tmp1',
              url: 'http://notexample.com',
            });

            const redirectRequest = await helper.browser.request({
              requestId: 1,
              tabId: 1,
              originContainer: 'firefox-tmp123',
              createsTabId: 3,
              createsContainer: 'firefox-tmp2',
              url: 'https://somethingcompletelydifferent.com',
              resetHistory: true,
            });
            await nextTick();
            expect(redirectRequest).to.deep.equal({ cancel: true });
            browser.contextualIdentities.create.should.have.been.calledOnce;
            browser.tabs.create.should.have.been.calledOnce;
            browser.tabs.remove.should.not.have.been.called;

            const initialClickRequest = await initialClickRequestPromise;
            expect(initialClickRequest).to.deep.equal({ cancel: true });
          });
        });
      });
    });

    describe('native firefox redirects with global left click always setting', () => {
      let background;
      beforeEach(async () => {
        background = await loadBackground(preferences);
      });

      describe('opening new tmptab and left clicking link with global always setting', () => {
        beforeEach(async () => {
          background.storage.local.preferences.isolation.global.mouseClick.left.action =
            'always';
          await helper.browser.openNewTmpTab({
            tabId: 1,
            createsTabId: 2,
          });
          await helper.browser.mouseClickOnLink({
            senderUrl: 'http://example.com',
            targetUrl: 'https://notexample.com',
          });
          await nextTick();
        });

        it('should not open two tabs even when requestId changes midflight', async () => {
          // https://bugzilla.mozilla.org/show_bug.cgi?id=1437748

          const request1 = helper.browser.request({
            requestId: 1,
            tabId: 1,
            originContainer: 'firefox-default',
            createsTabId: 2,
            createsContainer: 'firefox-tmp1',
            url: 'https://notexample.com',
            resetHistory: true,
          });

          const request2 = helper.browser.request({
            requestId: 1,
            tabId: 1,
            originContainer: 'firefox-default',
            createsTabId: 2,
            createsContainer: 'firefox-tmp1',
            url: 'https://www.notexample.com',
          });

          const request3 = helper.browser.request({
            requestId: 2,
            tabId: 1,
            originContainer: 'firefox-default',
            createsTabId: 3,
            createsContainer: 'firefox-tmp2',
            url: 'https://www.notexample.com',
          });

          await nextTick();
          browser.tabs.create.should.have.been.calledOnce;
          browser.contextualIdentities.create.should.have.been.calledOnce;
          browser.tabs.remove.should.not.have.been.called;
          expect(await request1).to.deep.equal({ cancel: true });
          expect(await request2).to.deep.equal({ cancel: true });
          expect(await request3).to.deep.equal({ cancel: true });
        });
      });
    });

    describe('native firefox redirects with global left click never setting', () => {
      let background;
      beforeEach(async () => {
        background = await loadBackground(preferences);
      });

      describe('opening new tmptab and left clicking link', () => {
        beforeEach(async () => {
          background.storage.local.preferences.isolation.global.mouseClick.left.action =
            'never';
          await helper.browser.openNewTmpTab({
            tabId: 1,
            createsTabId: 2,
          });
          await helper.browser.mouseClickOnLink({
            senderUrl: 'http://example.com',
            targetUrl: 'http://notexample.com',
          });
          await nextTick();
        });

        it('should not cancel the requests and redirects', async () => {
          const request1 = await helper.browser.request({
            requestId: 1,
            tabId: 1,
            originContainer: 'firefox-tmp123',
            url: 'http://notexample.com',
            resetHistory: true,
          });

          const request2 = await helper.browser.request({
            requestId: 1,
            tabId: 1,
            originContainer: 'firefox-tmp123',
            url: 'https://notexample.com',
          });

          const request3 = await helper.browser.request({
            requestId: 1,
            tabId: 1,
            originContainer: 'firefox-tmp123',
            url: 'https://reallynotexample.com',
          });

          expect(request1).to.be.undefined;
          expect(request2).to.be.undefined;
          expect(request3).to.be.undefined;
          browser.tabs.create.should.not.have.been.calledOnce;
          browser.contextualIdentities.create.should.not.have.been.calledOnce;
          browser.tabs.remove.should.not.have.been.called;
        });
      });
    });
  });
});
