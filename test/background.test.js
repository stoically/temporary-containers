const test = require('ava');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

const nextTick = () => new Promise(resolve => setTimeout(resolve));

const defaultStorage = {
  tempContainerCounter: 0,
  tempContainers: {},
  tabContainerMap: {},
  preferences: {
    automaticMode: true
  }
};

const browser = global.browser = {
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
    remove: sinon.stub()
  },
  storage: {
    local: {
      get: sinon.stub(),
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

//require('../background');
test.skip('Register Event Listeners', t => {
  browser.runtime.onInstalled.addListener.should.have.been.calledOnce;
  browser.runtime.onStartup.addListener.should.have.been.calledOnce;
  browser.runtime.onMessage.addListener.should.have.been.calledOnce;
  browser.tabs.onCreated.addListener.should.have.been.calledOnce;
  browser.tabs.onUpdated.addListener.should.have.been.calledOnce;
  browser.tabs.onRemoved.addListener.should.have.been.calledOnce;
  t.pass();
});

test.skip('runtime.onInstalled: loadStorage', t => {
  browser.storage.local.get = sinon.stub().resolves({});
  browser.runtime.onInstalled.addListener.yield({});
  browser.storage.local.get.should.have.been.calledOnce;
  t.pass();
});

test.skip('runtime.onStartup: loadStorage and maybe reload already open Tab in Temporary Container', async t => {
  const fakeContainer = {
    cookieStoreId: 'fake'
  };

  // one about:home open should reopen in temporary container
  const fakeAboutHomeTab = {
    incognito: false,
    cookieStoreId: 'firefox-default',
    url: 'about:home'
  };

  browser.tabs.query = sinon.stub().resolves([fakeAboutHomeTab]);
  browser.storage.local.get = sinon.stub().resolves(defaultStorage);
  browser.contextualIdentities.create = sinon.stub().resolves(fakeContainer);
  browser.tabs.create = sinon.stub().resolves({id: 1});
  browser.tabs.remove = sinon.stub();
  browser.runtime.onStartup.addListener.yield();
  await nextTick();
  browser.contextualIdentities.create.should.have.been.calledOnce;
  browser.storage.local.get.should.have.been.calledOnce;
  browser.tabs.create.should.have.been.calledOnce;
  browser.tabs.remove.should.have.been.calledOnce;

  // one about:newtab open should reopen in temporary container
  const fakeAboutNewTab = {
    incognito: false,
    cookieStoreId: 'firefox-default',
    url: 'about:newtab'
  };
  browser.tabs.query = sinon.stub().resolves([fakeAboutNewTab]);
  browser.storage.local.get = sinon.stub().resolves(defaultStorage);
  browser.contextualIdentities.create = sinon.stub().resolves(fakeContainer);
  browser.tabs.create = sinon.stub().resolves({id: 1});
  browser.tabs.remove = sinon.stub();
  browser.runtime.onStartup.addListener.yield();
  await nextTick();
  browser.contextualIdentities.create.should.have.been.calledOnce;
  browser.storage.local.get.should.have.been.calledOnce;
  browser.tabs.create.should.have.been.calledOnce;
  browser.tabs.remove.should.have.been.calledOnce;

  // one http tab open should reopen in temporary container
  const fakeHttpTab = {
    incognito: false,
    cookieStoreId: 'firefox-default',
    url: 'http://example.com'
  };
  browser.tabs.query = sinon.stub().resolves([fakeHttpTab]);
  browser.storage.local.get = sinon.stub().resolves(defaultStorage);
  browser.contextualIdentities.create = sinon.stub().resolves(fakeContainer);
  browser.tabs.create = sinon.stub().resolves({id: 1});
  browser.tabs.remove = sinon.stub();
  browser.runtime.onStartup.addListener.yield();
  await nextTick();
  browser.contextualIdentities.create.should.have.been.calledOnce;
  browser.tabs.create.should.have.been.calledOnce;
  browser.tabs.remove.should.have.been.calledOnce;

  // one https tab open should reopen in temporary container
  const fakeHttpsTab = {
    incognito: false,
    cookieStoreId: 'firefox-default',
    url: 'https://example.com'
  };
  browser.tabs.query = sinon.stub().resolves([fakeHttpsTab]);
  browser.storage.local.get = sinon.stub().resolves(defaultStorage);
  browser.contextualIdentities.create = sinon.stub().resolves(fakeContainer);
  browser.tabs.create = sinon.stub().resolves({id: 1});
  browser.tabs.remove = sinon.stub();
  browser.runtime.onStartup.addListener.yield();
  await nextTick();
  browser.contextualIdentities.create.should.have.been.calledOnce;
  browser.tabs.create.should.have.been.calledOnce;
  browser.tabs.remove.should.have.been.calledOnce;

  // one tab not in the default container should not reopen in temporary container
  const fakeNotDefaultTab = {
    incognito: false,
    cookieStoreId: 'not-default',
    url: 'about:home'
  };
  browser.tabs.query = sinon.stub().resolves([fakeNotDefaultTab]);
  browser.storage.local.get = sinon.stub().resolves(defaultStorage);
  browser.contextualIdentities.create = sinon.stub();
  browser.runtime.onStartup.addListener.yield();
  await nextTick();
  browser.contextualIdentities.create.should.not.have.been.called;

  // two tabs open should not reopen in temporary container
  browser.tabs.query = sinon.stub().resolves([1,2]);
  browser.storage.local.get = sinon.stub().resolves(defaultStorage);
  browser.contextualIdentities.create = sinon.stub();
  browser.runtime.onStartup.addListener.yield();
  await nextTick();
  browser.contextualIdentities.create.should.not.have.been.called;

  t.pass();
});
