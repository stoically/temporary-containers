const reload = require('require-reload')(require);
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

const defaultStorage = {
  tempContainerCounter: 0,
  tempContainers: {},
  tabContainerMap: {},
  preferences: {
    automaticMode: true
  }
};

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
      query: sinon.stub()
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

const nextTick = () => new Promise(resolve => setTimeout(resolve));
const loadBackground = async () => {
  reload('../background');
  await nextTick();
};


beforeEach(() => {
  injectBrowser();
});

describe('on require', () => {
  it('should register event listeners', async () => {
    await loadBackground();
    browser.runtime.onInstalled.addListener.should.have.been.calledOnce;
    browser.runtime.onStartup.addListener.should.have.been.calledOnce;
    browser.runtime.onMessage.addListener.should.have.been.calledOnce;
    browser.tabs.onCreated.addListener.should.have.been.calledOnce;
    browser.tabs.onUpdated.addListener.should.have.been.calledOnce;
    browser.tabs.onRemoved.addListener.should.have.been.calledOnce;
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
    browser.storage.local.get.resolves(defaultStorage);
    browser.contextualIdentities.create.resolves(fakeContainer);
    browser.tabs.create.resolves({id: 1});
    await loadBackground();
    browser.runtime.onStartup.addListener.yield();
    await nextTick();
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
    browser.storage.local.get.resolves(defaultStorage);
    browser.contextualIdentities.create.resolves(fakeContainer);
    browser.tabs.create.resolves({id: 1});
    await loadBackground();
    browser.runtime.onStartup.addListener.yield();
    await nextTick();
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
    browser.storage.local.get.resolves(defaultStorage);
    await loadBackground();
    browser.runtime.onStartup.addListener.yield();
    await nextTick();
    browser.contextualIdentities.create.should.not.have.been.called;
  });

  it('two open tabs should not reopen in temporary container', async () => {
    browser.tabs.query.resolves([1,2]);
    browser.storage.local.get.resolves(defaultStorage);
    await loadBackground();
    browser.runtime.onStartup.addListener.yield();
    await nextTick();
    browser.contextualIdentities.create.should.not.have.been.called;
  });
});
