const reload = require('require-reload')(require);
const chai = require('chai');
const sinon = require('sinon');
const clock = sinon.useFakeTimers();
const expect = chai.expect;
const sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

global.URL = require('url').URL;
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
    const background = reload('../background');
    sinon.stub(background, 'createTabInTempContainer');
    sinon.stub(background, 'contextMenusOnClicked');
    sinon.stub(background, 'runtimeOnInstalled');
    sinon.stub(background, 'runtimeOnStartup');
    sinon.stub(background, 'runtimeOnMessage');
    sinon.stub(background, 'tabsOnCreated');
    sinon.stub(background, 'tabsOnUpdated');
    sinon.stub(background, 'tabsOnRemoved');
    sinon.stub(background, 'webRequestOnBeforeRequest');
    await background.initialize();

    browser.browserAction.onClicked.addListener.yield();
    background.createTabInTempContainer.should.have.been.calledOnce;

    browser.contextMenus.onClicked.addListener.yield();
    background.contextMenusOnClicked.should.have.been.calledOnce;

    browser.runtime.onInstalled.addListener.yield();
    background.runtimeOnInstalled.should.have.been.calledOnce;

    browser.runtime.onStartup.addListener.yield();
    background.runtimeOnStartup.should.have.been.calledOnce;

    browser.runtime.onMessage.addListener.yield();
    background.runtimeOnMessage.should.have.been.calledOnce;

    browser.tabs.onCreated.addListener.yield();
    background.tabsOnCreated.should.have.been.calledOnce;

    browser.tabs.onUpdated.addListener.yield();
    background.tabsOnUpdated.should.have.been.calledOnce;

    browser.tabs.onRemoved.addListener.yield();
    background.tabsOnRemoved.should.have.been.calledOnce;

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
        href: 'https://example.com'
      }
    };
    const background = await loadBackground();
    await background.runtimeOnMessage(fakeMessage, fakeSender);
    background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;

    clock.tick(3000);
    background.automaticModeState.linkClicked.should.deep.equal({});
  });
});


describe('raceconditions with multi-account-containers', () => {
  describe('when not previously clicked url loads thats set to "always open in $container" but not "remember my choice"', () => {
    it('should close first confirm page and leave the second open', async () => {
      // request comes in, we cancel it, close the tab and reopen in temp container
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 1,
        cookieStoreId: 'firefox-default'
      };
      const fakeCreatedTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      const background = await loadBackground();
      const result1 = await background.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.tabs.remove.should.have.been.calledWith(1);
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;

      // the tab 2 we opened now makes its request
      // should normally go through (hence we do nothing)
      const fakeRequest2 = {
        tabId: 2,
        url: 'https://example.com'
      };
      const fakeTab2 = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.contextualIdentities.create.reset();
      browser.tabs.create.reset();
      browser.tabs.get.resolves(fakeTab2);
      const result2 = await background.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;

      // the first request already triggered multi-account-containers
      // it opened another tab that updates its url to moz-extension:// eventually
      // it also already removed our tab2
      // so we're now going to remove it
      const fakeMATabId = 3;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl
      };

      browser.tabs.remove.reset();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.tabs.remove.should.have.been.calledWith(3);

      // tab 2 opening the url in another container triggered multi-account-containers again
      // but this time its ok and we should leave the confirm page open
      const fakeMATabId2 = 3;
      const fakeMAUrl2 = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo2 = {
        url: fakeMAUrl2
      };
      const fakeMATab2 = {
        id: fakeMATabId2,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl2
      };

      browser.tabs.remove.reset();
      const result4 = await background.tabsOnUpdated(fakeMATabId2, fakeMAChangeInfo2, fakeMATab2);

      expect(result4).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;
    });
  });

  describe('when previously clicked url loads thats set to "always open in $container" but not "remember my choice"', () => {
    it('should close first confirm page and leave the second open', async () => {
      // simulate click
      const fakeSender = {
        tab: {
          id: 123,
          cookieStoreId: 'firefox-tmp-container-123',
          url: 'https://notexample.com'
        }
      };
      const fakeMessage = {
        linkClicked: {
          href: 'https://example.com'
        }
      };
      const background = await loadBackground();
      await background.runtimeOnMessage(fakeMessage, fakeSender);
      background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;

      // request comes in, we cancel it, close the tab and reopen in temp container
      const fakeRequest = {
        tabId: 1,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 1,
        openerTabId: 123,
        cookieStoreId: 'firefox-tmp-container-123'
      };
      const fakeCreatedTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeCreatedTab);
      const result1 = await background.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.tabs.remove.should.have.been.calledWith(1);
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;

      // the tab 2 we opened now makes its request
      // should normally go through (hence we do nothing)
      const fakeRequest2 = {
        tabId: 2,
        url: 'https://example.com'
      };
      const fakeTab2 = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1'
      };
      browser.contextualIdentities.create.reset();
      browser.tabs.create.reset();
      browser.tabs.get.resolves(fakeTab2);
      const result2 = await background.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.contextualIdentities.create.should.not.have.been.called;
      browser.tabs.create.should.not.have.been.called;

      // the first request already triggered multi-account-containers
      // it opened another tab that updates its url to moz-extension:// eventually
      // it also already removed our tab2
      // so we're now going to remove it
      const fakeMATabId = 3;
      const fakeMAUrl = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1';
      const fakeMAChangeInfo = {
        url: fakeMAUrl
      };
      const fakeMATab = {
        id: fakeMATabId,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl
      };

      browser.tabs.remove.reset();
      const result3 = await background.tabsOnUpdated(fakeMATabId, fakeMAChangeInfo, fakeMATab);

      expect(result3).to.be.undefined;
      browser.tabs.remove.should.have.been.calledWith(3);

      // tab 2 opening the url in another container triggered multi-account-containers again
      // but this time its ok and we should leave the confirm page open
      const fakeMATabId2 = 3;
      const fakeMAUrl2 = 'moz-extension://multi-account-containers/confirm-page.html?url=' +
        encodeURIComponent('https://example.com') + '&cookieStoreId=firefox-container-1' +
        '&currentCookieStoreId=firefox-tmp-container-1';
      const fakeMAChangeInfo2 = {
        url: fakeMAUrl2
      };
      const fakeMATab2 = {
        id: fakeMATabId2,
        cookieStoreId: 'firefox-default',
        url: fakeMAUrl2
      };

      browser.tabs.remove.reset();
      const result4 = await background.tabsOnUpdated(fakeMATabId2, fakeMAChangeInfo2, fakeMATab2);

      expect(result4).to.be.undefined;
      browser.tabs.remove.should.not.have.been.called;
    });
  });

  describe('when url loads thats set to "always open in $container" and "remember my choice"', () => {
    it('should close the first tab and leave the second open', async () => {
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
          href: 'https://example.com'
        }
      };
      const background = await loadBackground();
      await background.runtimeOnMessage(fakeMessage, fakeSender);
      background.automaticModeState.linkClicked[fakeMessage.linkClicked.href].should.exist;

      // click created tab 2 which results in this request
      // this should close tab 2 and create a new tab 4
      const fakeRequest = {
        tabId: 2,
        url: 'https://example.com'
      };
      const fakeTab = {
        id: 2,
        cookieStoreId: 'firefox-tmp-container-1',
        openerTabId: 1
      };
      const fakeContainer = {
        cookieStoreId: 'firefox-tmp-container-2'
      };
      browser.tabs.get.resolves(fakeTab);
      browser.contextualIdentities.create.resolves(fakeContainer);
      browser.tabs.create.resolves(fakeTab);
      const result1 = await background.webRequestOnBeforeRequest(fakeRequest);

      result1.should.deep.equal({cancel: true});
      browser.contextualIdentities.create.should.have.been.calledOnce;
      browser.tabs.create.should.have.been.calledOnce;
      browser.tabs.remove.should.have.been.calledWith(2);

      // multi-account-containers saw the same request
      // canceled the request, closed tab 2, created its own tab 3
      // and that results in this request
      // which in turn should be detected as MA request, canceled and tab closed
      const fakeMultiAccountRequest = {
        tabId: 3,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab = {
        id: 3,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab);
      browser.tabs.remove.reset();
      await background.webRequestOnBeforeRequest(fakeMultiAccountRequest);

      browser.tabs.remove.should.have.been.calledOnce;
      browser.tabs.remove.should.have.been.calledWith(3);

      // the tab 4 now comes through with its request
      // this should go through even though its gonna be intercepted by MA again
      const fakeRequest2 = {
        tabId: 4,
        url: 'https://example.com'
      };
      const fakeTab2 = {
        id: 4,
        cookieStoreId: 'firefox-tmp-container-2'
      };
      browser.tabs.get.resolves(fakeTab2);
      browser.tabs.remove.reset();
      const result2 = await background.webRequestOnBeforeRequest(fakeRequest2);

      expect(result2).to.be.undefined;
      browser.tabs.remove.should.not.have.been.calledOnce;

      // the tab 4 request triggered MA and here's that request
      // it should go through and not be closed
      const fakeMultiAccountRequest2 = {
        tabId: 5,
        url: 'https://example.com'
      };
      const fakeMultiAccountTab2 = {
        id: 5,
        cookieStoreId: 'firefox-ma-container-1'
      };
      browser.tabs.get.resolves(fakeMultiAccountTab2);
      browser.tabs.remove.reset();
      await background.webRequestOnBeforeRequest(fakeMultiAccountRequest2);

      browser.tabs.remove.should.not.have.been.called;
    });
  });
});
