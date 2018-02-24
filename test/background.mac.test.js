preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {

  describe('Multi-Account Containers', () => {
    beforeEach(async () => {
      global.background = await loadBackground(preferences);
    });

    [
      'first',
      'last',
      'firstrace',
      'lastrace'
    ].map(confirmPage => { describe(`confirmPage: ${confirmPage}`, () => {
      describe('opening new tmptab', () => {
        beforeEach(async () => {
          await helper.browser.openNewTmpTab({
            tabId: 1,
            createsTabId: 2,
            createsContainer: 'firefox-tmp1',
          });
          await nextTick();
        });

        describe('and opening a mac assigned website with not "remember my choice"', () => {
          let originContainer = 'firefox-tmp1';
          if (preferences.automaticModeNewTab === 'navigation') {
            originContainer = 'firefox-default';
          }
          beforeEach(async () => {
            browser.runtime.sendMessage.resolves({
              userContextId: '1',
              neverAsk: false
            });
            const request = {
              requestId: 1,
              tabId: 2,
              createsTabId: 3,
              originContainer,
              url: 'http://example.com'
            };
            const confirmPageOptions = {
              tabId: 3,
              originContainer,
              targetContainer: 'firefox-container-1',
              url: 'http://example.com',
              resetHistory: true
            };
            switch (confirmPage) {
            case 'first':
              await helper.browser.openMacConfirmPage(confirmPageOptions);
              await helper.browser.request(request);
              break;
            case 'last':
              await helper.browser.request(request);
              await helper.browser.openMacConfirmPage(confirmPageOptions);
              break;
            case 'firstrace':
              helper.browser.openMacConfirmPage(confirmPageOptions);
              helper.browser.request(request);
              break;
            case 'lastrace':
              helper.browser.request(request);
              helper.browser.openMacConfirmPage(confirmPageOptions);
              break;
            }
            await nextTick();
          });

          it('should sometimes reopen the confirm page', async () => {
            switch (preferences.automaticModeNewTab) {
            case 'navigation':
              if (confirmPage !== 'last' && confirmPage !== 'first') {
                browser.tabs.remove.should.not.have.been.called;
                browser.tabs.create.should.not.have.been.called;
              } else {
                // TODO dont reopen clean/created containers
                browser.tabs.remove.should.have.been.called;
                browser.tabs.create.should.have.been.called;
              }
              break;

            case 'created':
              browser.tabs.remove.should.not.have.been.called;
              browser.tabs.create.should.not.have.been.called;
              break;
            }
          });

          describe('follow up requests', () => {
            let results;
            beforeEach(async () => {
              const request1 = helper.browser.request({
                requestId: 2,
                tabId: 3,
                originContainer: 'firefox-tmp1',
                url: 'http://example.com',
                resetHistory: true
              });

              const request2 = helper.browser.request({
                requestId: 2,
                tabId: 3,
                originContainer: 'firefox-tmp1',
                url: 'https://example.com'
              });

              const request3 = helper.browser.request({
                requestId: 3,
                tabId: 3,
                originContainer: 'firefox-tmp1',
                url: 'https://example.com'
              });

              results = await Promise.all([request1, request2, request3]);
              await nextTick();
            });

            it('should not be canceled', async () => {
              expect(results[0]).to.be.undefined;
              expect(results[1]).to.be.undefined;
              expect(results[2]).to.be.undefined;
            });

            it('should not trigger reopening', async () => {
              browser.tabs.create.should.not.have.been.called;
              browser.tabs.remove.should.not.have.been.called;
            });
          });
        });
      });

      describe('opening new tmptab', () => {
        beforeEach(async () => {
          await helper.browser.openNewTmpTab({
            tabId: 1,
            createsTabId: 2,
            createsContainer: 'firefox-tmp1',
          });
          await nextTick();
        });

        describe('and opening a not mac assigned website', () => {
          let newTmpTabId = 2;
          beforeEach(async () => {
            await helper.browser.request({
              requestId: 1,
              tabId: newTmpTabId,
              originContainer: 'firefox-tmp1',
              url: 'http://example.com',
              resetHistory: true
            });
          });

          [
            {
              click: {
                type: 'middle',
                action: 'never'
              }
            },
            {
              click: {
                type: 'middle',
                action: 'always'
              }
            },
            {
              click: {
                type: 'ctrlleft',
                action: 'never'
              }
            },
            {
              click: {
                type: 'ctrlleft',
                action: 'always'
              }
            },
            {
              click: {
                type: 'left',
                action: 'never'
              }
            },
            {
              click: {
                type: 'left',
                action: 'always'
              }
            },
          ].map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {

            describe('clicks on links in the loaded website that are mac assigned with not "remember my choice"', () => {
              beforeEach(async () => {
                background.storage.local.preferences.linkClickGlobal[preferences.click.type].action = preferences.click.action;
                let tabId;
                switch (preferences.click.action) {
                case 'middle':
                case 'ctrlleft':
                  tabId = newTmpTabId+1;
                  break;
                case 'left':
                  tabId = newTmpTabId;
                  break;
                }
                browser.runtime.sendMessage.resolves({
                  userContextId: '1',
                  neverAsk: false
                });
                await helper.browser.mouseClickOnLink({
                  clickType: preferences.click.type,
                  senderUrl: 'http://example.com',
                  targetUrl: 'http://notexample.com',
                });
                const request = {
                  requestId: 2,
                  tabId,
                  originContainer: 'firefox-tmp1',
                  url: 'http://notexample.com',
                  resetHistory: true
                };
                const confirmPageOptions = {
                  tabId: 3,
                  originContainer: 'firefox-tmp1',
                  targetContainer: 'firefox-container-1',
                  url: 'http://example.com'
                };
                switch (confirmPage) {
                case 'first':
                  await helper.browser.openMacConfirmPage(confirmPageOptions);
                  await helper.browser.request(request);
                  break;
                case 'last':
                  await helper.browser.request(request);
                  await helper.browser.openMacConfirmPage(confirmPageOptions);
                  break;
                case 'firstrace':
                  helper.browser.openMacConfirmPage(confirmPageOptions);
                  helper.browser.request(request);
                  break;
                case 'lastrace':
                  helper.browser.request(request);
                  helper.browser.openMacConfirmPage(confirmPageOptions);
                  break;
                }
                await nextTick();
              });

              it('should do the right thing', async () => {
                switch (preferences.click.action) {
                case 'always':
                  browser.tabs.remove.should.have.been.called;
                  browser.tabs.create.should.have.been.called;
                  break;
                case 'never':
                  browser.tabs.remove.should.not.have.been.called;
                  browser.tabs.create.should.not.have.been.called;
                }
              });
            });
          });});
        });
      });
    });});
  });
});});