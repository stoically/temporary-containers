const reload = require('require-reload')(require);
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

let browser;
const injectBrowser = () => {
  browser = global.browser = {
    mochaTest: true,
    runtime: {
      onInstalled: {
        addListener: sinon.stub()
      },
      onStartup: {
        addListener: sinon.stub()
      },
      onMessage: {
        addListener: sinon.stub()
      }
    },
    webRequest: {
      onBeforeRequest: {
        addListener: sinon.stub()
      }
    },
    tabs: {
      onCreated: {
        addListener: sinon.stub()
      },
      onUpdated: {
        addListener: sinon.stub()
      },
      onRemoved: {
        addListener: sinon.stub()
      },
      create: sinon.stub(),
      remove: sinon.stub(),
      query: sinon.stub(),
      get: sinon.stub()
    },
    storage: {
      local: {
        get: sinon.stub().resolves({}),
        set: sinon.stub()
      }
    },
    contextualIdentities: {
      create: sinon.stub()
    },
    browserAction: {
      onClicked: {
        addListener: sinon.stub()
      }
    },
    contextMenus: {
      create: sinon.stub(),
      onClicked: {
        addListener: sinon.stub()
      }
    },
    management: {
      onEnabled: {
        addListener: sinon.stub()
      }
    }
  };
};

const loadBackground = async () => {
  const background = reload('../background');
  await background.initialize();
  return background;
};

beforeEach(() => {
  injectBrowser();
});

describe('on require', () => {
  it('should register event listeners', async () => {
    const background = await loadBackground();
    browser.browserAction.onClicked.addListener.should.have.been.calledWith(background.createTabInTempContainer);
    browser.contextMenus.onClicked.addListener.should.have.been.calledWith(background.contextMenusOnClicked);
    browser.runtime.onInstalled.addListener.should.have.been.calledWith(background.runtimeOnInstalled);
    browser.runtime.onStartup.addListener.should.have.been.calledWith(background.runtimeOnStartup);
    browser.runtime.onMessage.addListener.should.have.been.calledWith(background.runtimeOnMessage);
    browser.tabs.onCreated.addListener.should.have.been.calledWith(background.tabsOnCreated);
    browser.tabs.onUpdated.addListener.should.have.been.calledWith(background.tabsOnUpdated);
    browser.tabs.onRemoved.addListener.should.have.been.calledWith(background.tabsOnRemoved);
    browser.webRequest.onBeforeRequest.addListener.should.have.been.calledWith(background.webRequestOnBeforeRequest);
  });

  it('should loadStorage', async () => {
    await loadBackground();
    browser.storage.local.get.should.have.been.calledOnce;
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


describe('tabs loading URLs in default-container', () => {
  it('should reopen the Tab in temporary container', async () => {
    const fakeRequest = {
      tabId: 1
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
    const background = await loadBackground();
    await background.webRequestOnBeforeRequest(fakeRequest);

    browser.contextualIdentities.create.should.have.been.calledOnce;
    browser.tabs.create.should.have.been.calledOnce;
    browser.storage.local.set.should.have.been.calledThrice;
  });
});


describe('tabs loading about:home or about:newtab in the default container', () => {
  it('about:home should reopen in temporary container', async () => {
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

    browser.tabs.create.should.have.been.calledOnce;
  });
});
