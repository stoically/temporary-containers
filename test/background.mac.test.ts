import {
  expect,
  preferencesTestSet,
  loadBackground,
  nextTick,
  Background,
} from './setup';

preferencesTestSet.map(preferences => {
  describe(`preferences: ${JSON.stringify(preferences)}`, () => {
    describe('Multi-Account Containers Confirm Page reopening', () => {
      [false, true].map(macWasFaster => {
        ['first', 'last', 'firstrace', 'lastrace'].map(confirmPage => {
          describe(`variant: macWasFaster ${macWasFaster} / confirmPage ${confirmPage}`, () => {
            let bg: Background;
            beforeEach(async () => {
              bg = await loadBackground({ preferences });
            });

            describe('opening new tmptab', () => {
              beforeEach(async () => {
                await bg.helper.openNewTmpTab({
                  tabId: 1,
                  createsTabId: 2,
                  createsContainer: 'firefox-tmp1',
                });
                await nextTick();
              });

              describe('and opening a mac assigned website with not "remember my choice"', () => {
                let originContainer = 'firefox-tmp1';
                if (preferences.automaticMode.newTab === 'navigation') {
                  originContainer = 'firefox-default';
                }
                beforeEach(async () => {
                  bg.browser.runtime.sendMessage.resolves({
                    userContextId: '1',
                    neverAsk: false,
                  });
                  const request = {
                    requestId: 1,
                    tabId: 2,
                    createsTabId: 3,
                    originContainer,
                    url: 'http://example.com',
                    macWasFaster,
                  };
                  const confirmPageOptions = {
                    tabId: 3,
                    originContainer,
                    targetContainer: 'firefox-container-1',
                    url: 'http://example.com',
                    macWasFaster,
                    resetHistory: true,
                  };
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const promises: any[] = [];
                  switch (confirmPage) {
                    case 'first':
                      await bg.helper.openMacConfirmPage(confirmPageOptions);
                      await bg.helper.request(request);
                      break;
                    case 'last':
                      await bg.helper.request(request);
                      await bg.helper.openMacConfirmPage(confirmPageOptions);
                      break;
                    case 'firstrace':
                      promises.push(
                        bg.helper.openMacConfirmPage(confirmPageOptions)
                      );
                      promises.push(bg.helper.request(request));
                      break;
                    case 'lastrace':
                      promises.push(bg.helper.request(request));
                      promises.push(
                        bg.helper.openMacConfirmPage(confirmPageOptions)
                      );
                      break;
                  }
                  await Promise.all(promises);
                  await nextTick();
                });

                it('should sometimes reopen the confirm page once', async () => {
                  // TODO in fact, reopen *should never* be triggered since the tmpcontainer is clean
                  // but if it gets reopened, then it should be reopened at most once
                  if (bg.browser.tabs.create.callCount) {
                    bg.browser.tabs.create.should.have.been.calledOnce;
                  } else {
                    bg.browser.tabs.create.should.not.have.been.called;
                  }
                  if (bg.browser.tabs.remove.callCount) {
                    bg.browser.tabs.remove.should.have.been.calledOnce;
                  } else {
                    bg.browser.tabs.remove.should.not.have.been.called;
                  }
                });

                describe('follow up requests', () => {
                  ['current', 'target'].map(macConfirmChoice => {
                    describe(`variant: macConfirmChoice ${macConfirmChoice}`, () => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      let results: any[];
                      beforeEach(async () => {
                        let tabId, originContainer;
                        switch (macConfirmChoice) {
                          case 'current':
                            tabId = 3;
                            originContainer = 'firefox-tmp1';
                            break;
                          case 'target':
                            tabId = 4;
                            originContainer = 'firefox-container-1';
                        }
                        const request1 = bg.helper.request({
                          requestId: 2,
                          tabId,
                          originContainer,
                          url: 'http://example.com',
                          resetHistory: true,
                        });

                        const request2 = bg.helper.request({
                          requestId: 2,
                          tabId,
                          originContainer,
                          url: 'https://example.com',
                        });

                        const request3 = bg.helper.request({
                          requestId: 3,
                          tabId,
                          originContainer,
                          url: 'https://example.com',
                        });

                        results = await Promise.all([
                          request1,
                          request2,
                          request3,
                        ]);
                        await nextTick();
                      });

                      it('should not be canceled', async () => {
                        expect(results[0]).to.be.undefined;
                        expect(results[1]).to.be.undefined;
                        expect(results[2]).to.be.undefined;
                      });

                      it('should not trigger reopening', async () => {
                        bg.browser.tabs.create.should.not.have.been.called;
                        bg.browser.tabs.remove.should.not.have.been.called;
                      });
                    });
                  });
                });
              });
            });

            describe('navigating in a permanent container tab', () => {
              describe('and opening a mac assigned website with not "remember my choice"', () => {
                const originContainer = 'firefox-container-1';
                beforeEach(async () => {
                  bg.browser.runtime.sendMessage.resolves({
                    userContextId: '2',
                    neverAsk: false,
                  });
                  const request = {
                    requestId: 1,
                    tabId: 2,
                    createsTabId: 3,
                    originContainer,
                    url: 'http://example.com',
                    macWasFaster,
                  };
                  const confirmPageOptions = {
                    tabId: 3,
                    originContainer,
                    targetContainer: 'firefox-container-2',
                    url: 'http://example.com',
                    macWasFaster,
                    resetHistory: true,
                  };
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const promises: any[] = [];
                  switch (confirmPage) {
                    case 'first':
                      await bg.helper.openMacConfirmPage(confirmPageOptions);
                      await bg.helper.request(request);
                      break;
                    case 'last':
                      await bg.helper.request(request);
                      await bg.helper.openMacConfirmPage(confirmPageOptions);
                      break;
                    case 'firstrace':
                      promises.push(
                        bg.helper.openMacConfirmPage(confirmPageOptions)
                      );
                      promises.push(bg.helper.request(request));
                      break;
                    case 'lastrace':
                      promises.push(bg.helper.request(request));
                      promises.push(
                        bg.helper.openMacConfirmPage(confirmPageOptions)
                      );
                      break;
                  }
                  await Promise.all(promises);
                  await nextTick();
                });

                it('should not reopen the confirm page', async () => {
                  bg.browser.tabs.create.should.not.have.been.called;
                  bg.browser.tabs.remove.should.not.have.been.called;
                });
              });
            });

            describe('opening new tmptab', () => {
              beforeEach(async () => {
                await bg.helper.openNewTmpTab({
                  tabId: 1,
                  createsTabId: 2,
                  createsContainer: 'firefox-tmp1',
                });
                await nextTick();
              });

              describe('and opening a not mac assigned website', () => {
                const newTmpTabId = 2;
                beforeEach(async () => {
                  await bg.helper.request({
                    requestId: 1,
                    tabId: newTmpTabId,
                    originContainer: 'firefox-tmp1',
                    url: 'http://example.com',
                    resetHistory: true,
                  });
                });

                const clickPreferences: Array<{
                  click: {
                    type: 'middle' | 'left' | 'ctrlleft';
                    action: 'always' | 'never';
                  };
                }> = [
                  {
                    click: {
                      type: 'middle',
                      action: 'never',
                    },
                  },
                  {
                    click: {
                      type: 'middle',
                      action: 'always',
                    },
                  },
                  {
                    click: {
                      type: 'ctrlleft',
                      action: 'never',
                    },
                  },
                  {
                    click: {
                      type: 'ctrlleft',
                      action: 'always',
                    },
                  },
                  {
                    click: {
                      type: 'left',
                      action: 'never',
                    },
                  },
                  {
                    click: {
                      type: 'left',
                      action: 'always',
                    },
                  },
                ];
                clickPreferences.map(preferences => {
                  describe(`preferences: ${JSON.stringify(
                    preferences
                  )}`, () => {
                    describe('clicks on links in the loaded website that are mac assigned with not "remember my choice"', () => {
                      beforeEach(async () => {
                        bg.tmp.storage.local.preferences.isolation.global.mouseClick[
                          preferences.click.type
                        ].action = preferences.click.action;

                        bg.browser.runtime.sendMessage.resolves({
                          userContextId: '1',
                          neverAsk: false,
                        });
                        await bg.helper.mouseClickOnLink({
                          clickType: preferences.click.type,
                          senderUrl: 'http://example.com',
                          targetUrl: 'http://notexample.com',
                        });
                        const request = {
                          requestId: 2,
                          originContainer: 'firefox-tmp1',
                          url: 'http://notexample.com',
                          macWasFaster,
                          resetHistory: true,
                        };
                        const confirmPageOptions = {
                          tabId: 3,
                          originContainer: 'firefox-tmp1',
                          targetContainer: 'firefox-container-1',
                          url: 'http://notexample.com',
                        };
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const promises: any[] = [];
                        switch (confirmPage) {
                          case 'first':
                            await bg.helper.openMacConfirmPage(
                              confirmPageOptions
                            );
                            await bg.helper.request(request);
                            break;
                          case 'last':
                            await bg.helper.request(request);
                            await bg.helper.openMacConfirmPage(
                              confirmPageOptions
                            );
                            break;
                          case 'firstrace':
                            promises.push(
                              bg.helper.openMacConfirmPage(confirmPageOptions)
                            );
                            promises.push(bg.helper.request(request));
                            break;
                          case 'lastrace':
                            promises.push(bg.helper.request(request));
                            promises.push(
                              bg.helper.openMacConfirmPage(confirmPageOptions)
                            );
                            break;
                        }
                        await Promise.all(promises);
                        await nextTick();
                      });

                      it('should do the right thing', async () => {
                        switch (preferences.click.action) {
                          case 'always':
                            bg.browser.tabs.remove.should.have.been.calledOnce;
                            bg.browser.tabs.create.should.have.been.calledOnce;
                            break;
                          case 'never':
                            bg.browser.tabs.remove.should.not.have.been.called;
                            bg.browser.tabs.create.should.not.have.been.called;
                        }
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
