preferencesTestSet.map(preferences => { describe(`preferences: ${JSON.stringify(preferences)}`, () => {

  describe('on require', () => {
    it('should register event listeners', async () => {
      const background = await loadBareBackground(preferences);
      sinon.stub(background.runtime, 'onInstalled');
      sinon.stub(background.runtime, 'onStartup');
      sinon.stub(background.runtime, 'onMessage');
      sinon.stub(background.commands, 'onCommand');
      sinon.stub(background.contextmenu, 'onClicked');
      sinon.stub(background.contextmenu, 'windowsOnFocusChanged');
      sinon.stub(background.tabs, 'onCreated');
      sinon.stub(background.tabs, 'onUpdated');
      sinon.stub(background.tabs, 'onRemoved');
      sinon.stub(background.tabs, 'onActivated');
      sinon.stub(background.container, 'createTabInTempContainer');
      sinon.stub(background.request, 'webRequestOnBeforeRequest');
      await background.initialize();

      browser.browserAction.onClicked.addListener.yield();
      background.container.createTabInTempContainer.should.have.been.calledOnce;

      browser.contextMenus.onClicked.addListener.yield();
      background.contextmenu.onClicked.should.have.been.calledOnce;

      browser.commands.onCommand.addListener.yield();
      background.commands.onCommand.should.have.been.calledOnce;

      browser.runtime.onInstalled.addListener.should.have.been.calledOnce;
      browser.runtime.onStartup.addListener.should.have.been.calledOnce;

      browser.runtime.onMessage.addListener.yield();
      background.runtime.onMessage.should.have.been.calledOnce;

      browser.windows.onFocusChanged.addListener.yield();
      background.contextmenu.windowsOnFocusChanged.should.have.been.calledOnce;

      browser.tabs.onCreated.addListener.yield();
      background.tabs.onCreated.should.have.been.calledOnce;

      browser.tabs.onUpdated.addListener.yield();
      background.tabs.onUpdated.should.have.been.calledOnce;

      browser.tabs.onRemoved.addListener.yield();
      background.tabs.onRemoved.should.have.been.calledOnce;

      browser.tabs.onActivated.addListener.yield();
      background.tabs.onActivated.should.have.been.calledOnce;

      browser.webRequest.onBeforeRequest.addListener.yield();
      background.request.webRequestOnBeforeRequest.should.have.been.calledOnce;
    });

    it('should have registered a container cleanup interval', async () => {
      const background = await loadBareBackground(preferences);
      sinon.stub(background.container, 'cleanup');
      await background.initialize();
      clock.tick(600000);
      background.container.cleanup.should.have.been.calledOnce;
    });

    describe('should catch early requests', () => {
      it('wait for tmp to initialize, blocking the request until initialize', async () => {
        const background = await loadBareBackground(preferences);
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
        await loadBareBackground(preferences);
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
    if (!preferences.automaticMode.active || preferences.automaticMode.newTab === 'navigation') {
      return;
    }
    const fakeContainer = {
      cookieStoreId: 'fake'
    };

    it('one open about:home should reopen in temporary container', async () => {
      await loadBareBackground(preferences);
      const fakeAboutHomeTab = {
        incognito: false,
        cookieStoreId: 'firefox-default',
        url: 'about:home'
      };

      browser.tabs.query.resolves([fakeAboutHomeTab]);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves({id: 1});
      await background.initialize();
      background.storage.local.preferences.automaticMode.newTab = 'created';
      await background.runtime.onStartup();
      await nextTick();
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;

      browser.tabs.query.resolves([{},{}]);
      clock.tick(500);
      await nextTick();
      browser.tabs.remove.should.have.been.calledOnce;
    });

    it('one open tab not in the default container should not reopen in temporary container', async () => {
      const background = await loadBareBackground(preferences);
      const fakeNotDefaultTab = {
        incognito: false,
        cookieStoreId: 'not-default',
        url: 'about:home'
      };
      browser.tabs.query.resolves([fakeNotDefaultTab]);
      await background.initialize();
      await background.runtime.onStartup();

      browser.contextualIdentities.create.should.not.have.been.called;
    });

    it('two open tabs should not reopen in temporary container', async () => {
      const background = await loadBareBackground(preferences);
      browser.tabs.query.resolves([1,2]);
      await background.initialize();
      await background.runtime.onStartup();

      browser.contextualIdentities.create.should.not.have.been.called;
    });
  });


  describe('tabs loading about:home, about:newtab or about:blank in the default container', () => {
    if (!preferences.automaticMode.active || preferences.automaticMode.newTab === 'navigation') {
      return;
    }
    it('should reopen about:home in temporary container', async () => {
      const background = await loadBareBackground(preferences, {apiFake: true});
      await background.initialize();
      await browser.tabs._create({url: 'about:home'});
      browser.tabs.create.should.have.been.calledOnce;
    });

    it('should reopen about:newtab in temporary container', async () => {
      const background = await loadBareBackground(preferences, {apiFake: true});
      await background.initialize();
      await browser.tabs._create({url: 'about:newtab'});
      browser.tabs.create.should.have.been.calledOnce;
    });

    it('should reopen about:blank in temporary container', async () => {
      const background = await loadBareBackground(preferences, {apiFake: true});
      await background.initialize();
      await browser.tabs._create({});
      browser.tabs.create.should.have.been.calledOnce;
    });
  });


  describe('tabs loading URLs in default-container', () => {
    if (!preferences.automaticMode.active) {
      return;
    }
    beforeEach(async () => {
      const background = await loadBareBackground(preferences);
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
      await background.initialize();
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
      const background = await loadBareBackground(preferences);
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        tabId: 1,
        cookieStoreId: 'firefox-not-default'
      };
      browser.tabs.get.resolves(fakeTab);
      await background.initialize();
      await background.request.webRequestOnBeforeRequest(fakeRequest);

      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;
      browser.tabs.remove.should.not.have.been.called;
    });
  });


  describe('tabs requesting a previously clicked url in a temporary container', () => {
    // TODO refactor me
    if (!preferences.automaticMode.active) {
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
      await background.runtime.onMessage(fakeMessage, fakeSender);

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
      await background.runtime.onMessage(fakeMessage, fakeSender);
      expect(background.mouseclick.linksClicked[fakeMessage.payload.href]).to.exist;

      clock.tick(1000);
      await new Promise(process.nextTick);
      expect(background.mouseclick.linksClicked).to.deep.equal({});
    });
  });

  describe('runtime.onMessage savePreferences', () => {
    it('should save the given preferences to storage.local', async () => {
      const background = await loadBackground(preferences);
      const fakeMessage = {
        method: 'savePreferences',
        payload: {
          preferences: Object.assign({}, background.storage.local.preferences, {
            automaticMode: true
          })
        }
      };
      await background.runtime.onMessage(fakeMessage);
      browser.storage.local.set.should.have.been.calledWithMatch({
        preferences: {
          automaticMode: true
        }
      });
    });
  });

  describe('runtime.onInstalled', () => {
    it('should call migration on updated', async () => {
      const background = await loadUninstalledBackground(preferences);
      const onUpdateMigrationStub = sinon.stub(background.migration, 'onUpdate');
      browser.runtime.onInstalled.addListener.yield({
        reason: 'update'
      });
      onUpdateMigrationStub.should.have.been.called;
    });
  });

  describe('commands', () => {
    describe('New Temporary Container Tab', () => {
      it('should open a new temporary container tab', async () => {
        const background = await loadBareBackground(preferences, {apiFake: true});
        await background.initialize();
        browser.commands.onCommand.addListener.yield('new_temporary_container_tab');
        await nextTick();
        browser.tabs.create.should.have.been.called;
      });
    });

    describe('New No Container Tab', () => {
      it('should open a new no container tab', async () => {
        const background = await loadBareBackground(preferences, {apiFake: true});
        await background.initialize();
        background.storage.local.preferences.keyboardShortcuts.AltN = true;
        browser.commands.onCommand.addListener.yield('new_no_container_tab');
        await nextTick();
        browser.tabs.create.should.have.been.calledWith({
          url: 'about:blank'
        });
      });
    });

    describe('New No Container Window Tab', () => {
      it('should open a new no container window', async () => {
        const background = await loadBareBackground(preferences, {apiFake: true});
        await background.initialize();
        background.storage.local.preferences.keyboardShortcuts.AltShiftC = true;
        browser.commands.onCommand.addListener.yield('new_no_container_window_tab');
        await nextTick();
        browser.windows.create.should.have.been.calledWith({
          url: 'about:blank'
        });
      });
    });

    describe('New Deletes History Container Tab', () => {
      it('should open a new deletes history container tab', async () => {
        const background = await loadBareBackground(preferences, {apiFake: true});
        await background.initialize();
        background.permissions.history = true;
        browser.commands.onCommand.addListener.yield('new_no_history_tab');
        await nextTick();
        browser.tabs.create.should.have.been.called;
        browser.contextualIdentities.create.should.have.been.calledWithMatch({
          name: sinon.match('-deletes-history')
        });
      });
    });

    describe('New Same Container Tab', () => {
      it('should open a new same container tab', async () => {
        const background = await loadBareBackground(preferences, {apiFake: true});
        await background.initialize();
        background.storage.local.preferences.keyboardShortcuts.AltX = true;
        const container = await browser.contextualIdentities.create({});
        await browser.tabs._create({
          cookieStoreId: container.cookieStoreId
        });
        browser.commands.onCommand.addListener.yield('new_same_container_tab');
        await nextTick();
        browser.tabs.create.should.have.been.calledWithMatch({
          cookieStoreId: container.cookieStoreId
        });
      });
    });
  });

  describe('Reuse container number', () => {
    if (!preferences.automaticMode.active || preferences.automaticMode.newTab === 'navigation') {
      return;
    }

    it('should work when multiple tabs are opened', async () => {
      const background = await loadBareBackground(preferences, {apiFake: true});
      await background.initialize();
      background.storage.local.preferences.container.numberMode = 'reuse';
      const tabPromises = [];
      for (let i = 0; i < 5; i++) {
        tabPromises.push(browser.tabs._create({}));
      }
      await Promise.all(tabPromises);
      const tabs = await browser.tabs.query({});
      const containerPromises = tabs.map(tab => browser.contextualIdentities.get(tab.cookieStoreId));
      const containers = await Promise.all(containerPromises);
      for (let i = 0; i < 5; i++) {
        containers[i].name.should.equal(`tmp${i+1}`);
      }

      await browser.tabs.remove(tabs[0].id);
      await background.container.cleanup(true);
      await new Promise(process.nextTick);
      await browser.tabs._create({});
      (await browser.contextualIdentities.get(
        (await browser.tabs.create.lastCall.returnValue).cookieStoreId
      )).name.should.equal('tmp1');
      await browser.tabs._create({});
      (await browser.contextualIdentities.get(
        (await browser.tabs.create.lastCall.returnValue).cookieStoreId
      )).name.should.equal('tmp6');
    });
  });
});});