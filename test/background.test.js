preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {

  describe('on require', () => {
    it('should register event listeners', async () => {
      const background = await loadBareBackground();
      sinon.stub(background, 'contextMenusOnClicked');
      sinon.stub(background, 'commandsOnCommand');
      sinon.stub(background, 'runtimeOnInstalled');
      sinon.stub(background, 'runtimeOnStartup');
      sinon.stub(background, 'runtimeOnMessage');
      sinon.stub(background, 'windowsOnFocusChanged');
      sinon.stub(background, 'tabsOnCreated');
      sinon.stub(background, 'tabsOnUpdated');
      sinon.stub(background, 'tabsOnRemoved');
      sinon.stub(background, 'tabsOnActivated');
      sinon.stub(background.container, 'createTabInTempContainer');
      sinon.stub(background.request, 'webRequestOnBeforeRequest');
      await background.initialize();

      browser.browserAction.onClicked.addListener.yield();
      background.container.createTabInTempContainer.should.have.been.calledOnce;

      browser.contextMenus.onClicked.addListener.yield();
      background.contextMenusOnClicked.should.have.been.calledOnce;

      browser.commands.onCommand.addListener.yield();
      background.commandsOnCommand.should.have.been.calledOnce;

      browser.runtime.onInstalled.addListener.should.have.been.calledOnce;
      browser.runtime.onStartup.addListener.should.have.been.calledOnce;

      browser.runtime.onMessage.addListener.yield();
      background.runtimeOnMessage.should.have.been.calledOnce;

      browser.windows.onFocusChanged.addListener.yield();
      background.windowsOnFocusChanged.should.have.been.calledOnce;

      browser.tabs.onCreated.addListener.yield();
      background.tabsOnCreated.should.have.been.calledOnce;

      browser.tabs.onUpdated.addListener.yield();
      background.tabsOnUpdated.should.have.been.calledOnce;

      browser.tabs.onRemoved.addListener.yield();
      background.tabsOnRemoved.should.have.been.calledOnce;

      browser.tabs.onActivated.addListener.yield();
      background.tabsOnActivated.should.have.been.calledOnce;

      browser.webRequest.onBeforeRequest.addListener.yield();
      background.request.webRequestOnBeforeRequest.should.have.been.calledOnce;
    });

    it('should have registered a container cleanup interval', async () => {
      const background = await loadBareBackground();
      sinon.stub(background.container, 'cleanup');
      await background.initialize();
      clock.tick(600000);
      background.container.cleanup.should.have.been.calledOnce;
    });

    describe('should catch early requests', () => {
      it('wait for tmp to initialize, blocking the request until initialize', async () => {
        const background = await loadBareBackground();
        sinon.stub(background.request, 'webRequestOnBeforeRequest');

        const [promise] = browser.webRequest.onBeforeRequest.addListener.yield({requestId: 1});
        let waitingForPromise = true;
        promise.then(() => {
          waitingForPromise = false;
        });
        clock.tick(100);
        await nextTick();
        waitingForPromise.should.be.true;

        await background.initialize();
        await nextTick();
        clock.tick(100);
        await nextTick();
        waitingForPromise.should.be.false;
      });

      it('wait for tmp to initialize, blocking the request until timeout and dont block the next requests anymore', async () => {
        await loadBareBackground();
        const [promise] = browser.webRequest.onBeforeRequest.addListener.yield({requestId: 1});
        let waitingForPromise = true;
        promise.then(() => {
          waitingForPromise = false;
        });
        for (let i = 0; i < 20; i++) {
          clock.tick(100);
          await nextTick();
          waitingForPromise.should.be.true;
        }
        clock.tick(100);
        await nextTick();
        waitingForPromise.should.be.false;

        const [promise2] = browser.webRequest.onBeforeRequest.addListener.yield({requestId: 1});
        let waitingForPromise2 = true;
        promise2.then(() => {
          waitingForPromise2 = false;
        });
        await promise2;
        waitingForPromise2.should.be.false;
      });
    });
  });


  describe('runtime.onStartup should sometimes reload already open Tab in Temporary Container', () => {
    if (!preferences.automaticMode) {
      return;
    }
    const fakeContainer = {
      cookieStoreId: 'fake'
    };

    it('one open about:home should reopen in temporary container', done => {
      const fakeAboutHomeTab = {
        incognito: false,
        cookieStoreId: 'firefox-default',
        url: 'about:home'
      };

      browser.tabs.query.resolves([fakeAboutHomeTab]);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves({id: 1});
      loadBackground(preferences).then(background => {
        background.storage.local.preferences.automaticModeNewTab = 'created';
        background.runtimeOnStartup().then(() => {
          browser.contextualIdentities.create.should.have.been.calledOnce;
          browser.tabs.create.should.have.been.calledOnce;

          browser.tabs.query.resolves([{},{}]);
          clock.tick(500);
          process.nextTick(() => {
            browser.tabs.remove.should.have.been.calledOnce;
            done();
          });
        });
      });
    });

    it('one open tab not in the default container should not reopen in temporary container', async () => {
      const fakeNotDefaultTab = {
        incognito: false,
        cookieStoreId: 'not-default',
        url: 'about:home'
      };
      browser.tabs.query.resolves([fakeNotDefaultTab]);
      const background = await loadBackground(preferences);
      await background.runtimeOnStartup();

      browser.contextualIdentities.create.should.not.have.been.called;
    });

    it('two open tabs should not reopen in temporary container', async () => {
      browser.tabs.query.resolves([1,2]);
      const background = await loadBackground(preferences);
      await background.runtimeOnStartup();

      browser.contextualIdentities.create.should.not.have.been.called;
    });
  });


  describe('tabs loading about:home or about:newtab in the default container', () => {
    if (!preferences.automaticMode) {
      return;
    }
    it('should reopen about:home in temporary container', async () => {
      const fakeTab = {
        url: 'about:home',
        cookieStoreId: 'firefox-default'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-temp'
      };
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves({id: 1});
      const background = await loadBackground(preferences);
      background.storage.local.preferences.automaticModeNewTab = 'created';
      await background.container.maybeReloadTabInTempContainer(fakeTab);

      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;
    });
  });


  describe('tabs loading URLs in default-container', () => {
    if (!preferences.automaticMode) {
      return;
    }
    let background;
    beforeEach(async () => {
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        tabId: 1,
        cookieStoreId: 'firefox-default'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-temp'
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeTab);
      background = await loadBackground(preferences);
      await background.request.webRequestOnBeforeRequest(fakeRequest);
    });

    it('should reopen the Tab in temporary container', async () => {
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;
      browser.storage.local.set.should.have.been.calledThrice;
    });
  });


  describe('tabs requesting something in non-default and non-temporary containers', () => {
    it('should not be interrupted', async () => {
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        tabId: 1,
        cookieStoreId: 'firefox-not-default'
      };
      browser.tabs.get.resolves(fakeTab);
      const background = await loadBackground(preferences);
      await background.request.webRequestOnBeforeRequest(fakeRequest);

      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;
      browser.tabs.remove.should.not.have.been.called;
    });
  });


  describe('tabs requesting a previously clicked url in a temporary container', () => {
    // TODO refactor me
    if (!preferences.automaticMode) {
      return;
    }
    let background, fakeMessage;
    beforeEach(async () => {
      // simulate click
      const fakeSender = {
        tab: {
          id: 1,
          cookieStoreId: 'firefox-tmp-container-1',
          url: 'https://notexample.com'
        }
      };
      fakeMessage = {
        method: 'linkClicked',
        payload: {
          href: 'https://example.com',
          event: {
            button: 1,
            ctrlKey: false
          }
        }
      };
      background = await loadBackground(preferences);
      await background.runtimeOnMessage(fakeMessage, fakeSender);

      // now the request
      const fakeRequest = {
        tabId: 2,
        openerTabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        tabId: 2,
        openerTabId: 1,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      const fakeCreatedTab = {
        id: 3,
        cookieStoreId: 'firefox-tmp-container-2'
      };
      const fakeCreatedContainer = {
        cookieStoreId: 'firefox-tmp-container-2'
      };
      browser.tabs.get.resolves(fakeTab);
      browser.tabs.create.resolves(fakeCreatedTab);
      browser.contextualIdentities.create.resolves(fakeCreatedContainer);
      await background.request.webRequestOnBeforeRequest(fakeRequest);
    });

    it('should reopen in a new temporary container', async () => {
      expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).to.exist;
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;
      browser.tabs.remove.should.have.been.calledOnce;
    });

    describe('follow-up request', () => {
      beforeEach(async () => {
        const fakeRequest = {
          tabId: 3,
          url: 'https://example.com'
        };
        const fakeTab = {
          tabId: 3,
          cookieStoreId: 'firefox-tmp-container-2',
          openerTabId: 1
        };
        browser.tabs.get.resolves(fakeTab);
        browser.contextualIdentities.create.reset();
        browser.tabs.create.reset();
        await background.request.webRequestOnBeforeRequest(fakeRequest);
      });

      it('should not trigger reopening in temporary container', () => {
        browser.contextualIdentities.create.should.not.have.been.called;
        browser.tabs.create.should.not.have.been.called;
      });
    });
  });

  describe('state for clicked links', async () => {
    it('should be cleaned up', async () => {
      const fakeSender = {
        tab: {
          id: 1,
          cookieStoreId: 'firefox-tmp-container-1',
          url: 'https://notexample.com'
        }
      };
      const fakeMessage = {
        method: 'linkClicked',
        payload: {
          href: 'https://example.com',
          event: {
            button: 1,
            ctrlKey: false
          }
        }
      };
      const background = await loadBackground(preferences);
      await background.runtimeOnMessage(fakeMessage, fakeSender);
      expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).to.exist;

      clock.tick(1000);
      await new Promise(r => process.nextTick(r));
      expect(background.mouseclick.linksClicked).to.deep.equal({});
    });
  });
});});