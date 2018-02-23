preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {

  describe('Multi-Account Containers', () => {
    beforeEach(async () => {
      global.background = await loadBackground(preferences);
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
          await helper.browser.request({
            requestId: 1,
            tabId: 2,
            originContainer,
            url: 'http://example.com'
          });
        });

        it('should do the right thing', async () => {
          await helper.browser.openMacConfirmPage({
            tabId: 3,
            originContainer,
            targetContainer: 'firefox-container-1',
            url: 'http://example.com',
            resetHistory: true
          });
          await nextTick();

          if (preferences.automaticModeNewTab === 'navigation') {
            browser.tabs.remove.should.have.been.called;
            browser.tabs.create.should.have.been.called;
          } else {
            browser.tabs.remove.should.not.have.been.called;
            browser.tabs.create.should.not.have.been.called;
          }
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
              await helper.browser.request({
                requestId: 2,
                tabId,
                originContainer: 'firefox-tmp1',
                url: 'http://notexample.com',
                resetHistory: true
              });
              await nextTick();
            });

            it('should do the right thing', async () => {
              await helper.browser.openMacConfirmPage({
                tabId: 3,
                originContainer: 'firefox-tmp1',
                targetContainer: 'firefox-container-1',
                url: 'http://example.com'
              });
              await nextTick();

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
  });

});});