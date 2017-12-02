describe('on require', () => {
  it('should register event listeners', async () => {
    const background = reload('../background');
    sinon.stub(background, 'createTabInTempContainer');
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
    sinon.stub(background, 'webRequestOnBeforeRequest');
    await background.initialize();

    browser.browserAction.onClicked.addListener.yield();
    background.createTabInTempContainer.should.have.been.calledOnce;

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
    background.webRequestOnBeforeRequest.should.have.been.calledOnce;
  });

  it('should loadStorage', async () => {
    await loadBackground();
    browser.storage.local.get.should.have.been.calledOnce;
  });

  it('should have registered a container cleanup interval', async () => {
    const background = reload('../background');
    sinon.stub(background, 'tryToRemoveContainers');
    await background.initialize();
    clock.tick(60000);
    background.tryToRemoveContainers.should.have.been.calledTwice;
  });
});


describe('runtime.onStartup should sometimes reload already open Tab in Temporary Container', () => {
  const fakeContainer = {
    cookieStoreId: 'fake'
  };

  it('one open about:home should reopen in temporary container', async () => {
    const fakeAboutHomeTab = {
      incognito: false,
      cookieStoreId: 'firefox-default',
      url: 'about:home'
    };

    browser.tabs.query.resolves([fakeAboutHomeTab]);
    browser.contextualIdentities.create.resolves(fakeContainer);
    browser.tabs.create.resolves({id: 1});
    const background = await loadBackground();
    await background.runtimeOnStartup();

    browser.contextualIdentities.create.should.have.been.calledOnce;
    browser.tabs.create.should.have.been.calledOnce;
    browser.tabs.remove.should.have.been.calledOnce;
  });

  it('one open about:newtab should reopen in temporary container', async () => {
    const fakeAboutNewTab = {
      incognito: false,
      cookieStoreId: 'firefox-default',
      url: 'about:newtab'
    };
    browser.tabs.query.resolves([fakeAboutNewTab]);
    browser.contextualIdentities.create.resolves(fakeContainer);
    browser.tabs.create.resolves({id: 1});
    const background = await loadBackground();
    await background.runtimeOnStartup();

    browser.contextualIdentities.create.should.have.been.calledOnce;
    browser.tabs.create.should.have.been.calledOnce;
    browser.tabs.remove.should.have.been.calledOnce;
  });

  it('one open tab not in the default container should not reopen in temporary container', async () => {
    const fakeNotDefaultTab = {
      incognito: false,
      cookieStoreId: 'not-default',
      url: 'about:home'
    };
    browser.tabs.query.resolves([fakeNotDefaultTab]);
    const background = await loadBackground();
    await background.runtimeOnStartup();

    browser.contextualIdentities.create.should.not.have.been.called;
  });

  it('two open tabs should not reopen in temporary container', async () => {
    browser.tabs.query.resolves([1,2]);
    const background = await loadBackground();
    await background.runtimeOnStartup();

    browser.contextualIdentities.create.should.not.have.been.called;
  });
});


describe('tabs loading about:home or about:newtab in the default container', () => {
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
    const background = await loadBackground();
    await background.maybeReloadTabInTempContainer(fakeTab);

    browser.contextualIdentities.create.should.have.been.calledOnce;
    browser.tabs.create.should.have.been.calledOnce;
  });
});


describe('tabs loading URLs in default-container', () => {
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
    background = await loadBackground();
    await background.webRequestOnBeforeRequest(fakeRequest);
  });

  it('should reopen the Tab in temporary container', async () => {
    browser.contextualIdentities.create.should.have.been.calledOnce;
    browser.tabs.create.should.have.been.calledOnce;
    browser.storage.local.set.should.have.been.calledThrice;
  });

  it('should cleanup the alreadysawlink state', async () => {
    clock.tick(3000);
    background.automaticModeState.alreadySawThatLink.should.deep.equal({});
  });
});


describe('tabs requesting something in non-default and non-temporary containers', () => {
  it('should not be interrupted', async () => {
    const fakeRequest = {
      tabId: 1
    };
    const fakeTab = {
      tabId: 1,
      cookieStoreId: 'firefox-not-default'
    };
    browser.tabs.get.resolves(fakeTab);
    const background = await loadBackground();
    await background.webRequestOnBeforeRequest(fakeRequest);

    browser.contextualIdentities.create.should.not.have.been.calledOnce;
    browser.tabs.create.should.not.have.been.calledOnce;
    browser.tabs.remove.should.not.have.been.calledOnce;
  });
});


describe('tabs requesting a previously clicked url in a temporary container', () => {
  it('should reopen in a new temporary container', async () => {
    // simulate click
    const fakeSender = {
      tab: {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1',
        url: 'https://notexample.com'
      }
    };
    const fakeMessage = {
      linkClicked: {
        href: 'https://example.com',
        event: {
          button: 1,
          ctrlKey: false
        }
      }
    };
    const background = await loadBackground();
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;

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
    await background.webRequestOnBeforeRequest(fakeRequest);

    browser.contextualIdentities.create.should.have.been.calledOnce;
    browser.tabs.create.should.have.been.calledOnce;
    browser.tabs.remove.should.have.been.calledOnce;
  });
});


describe('state for clicked links', async () => {
  it('should be cleaned up in case something goes wrong', async () => {
    const fakeSender = {
      tab: {
        id: 1,
        cookieStoreId: 'firefox-tmp-container-1',
        url: 'https://notexample.com'
      }
    };
    const fakeMessage = {
      linkClicked: {
        href: 'https://example.com',
        event: {
          button: 1,
          ctrlKey: false
        }
      }
    };
    const background = await loadBackground();
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;

    clock.tick(3000);
    background.automaticModeState.linkClicked.should.deep.equal({});
  });
});
