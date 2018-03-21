class Tabs {
  async initialize(background) {
    this.storage = background.storage;
    this.container = background.container;
    this.pageaction = background.pageaction;

    const tabs = await browser.tabs.query({});
    tabs.map(tab => {
      if (this.storage.local.tempContainers[tab.cookieStoreId]) {
        // build tabContainerMap
        this.container.tabContainerMap[tab.id] = tab.cookieStoreId;
      }

      if (tab.incognito) {
        // disable browseraction for all incognito tabs
        // relevant if installed, updated or disabled+enabled in incognito window
        browser.browserAction.disable(tab.id);
      }

      // maybe reload or set badge
      this.container.maybeReloadTabInTempContainer(tab);
    });
    
    browser.tabs.onActivated.addListener(this.tabsOnActivated.bind(this));
    browser.tabs.onCreated.addListener(this.tabsOnCreated.bind(this));
    browser.tabs.onUpdated.addListener(this.tabsOnUpdated.bind(this));
    browser.tabs.onRemoved.addListener(this.tabsOnRemoved.bind(this));
  }

  async tabsOnCreated(tab) {
    debug('[tabsOnCreated] tab created', tab);
    if (tab.incognito) {
      debug('[tabsOnCreated] tab incognito, we ignore that', tab);
      browser.browserAction.disable(tab.id);
      return;
    }
    if (tab && tab.cookieStoreId && !this.container.tabContainerMap[tab.id] &&
        this.storage.local.tempContainers[tab.cookieStoreId]) {
      this.container.tabContainerMap[tab.id] = tab.cookieStoreId;
    }

    await this.container.maybeReloadTabInTempContainer(tab);
  }


  async tabsOnUpdated(tabId, changeInfo, tab) {
    debug('[tabsOnUpdated] tab updated', tab);
    if (tab.incognito) {
      debug('[tabsOnUpdated] tab incognito, we ignore that');
      browser.browserAction.disable(tab.id);
      return;
    }
    if (!changeInfo.url) {
      debug('[tabsOnUpdated] url didnt change, not relevant', tabId, changeInfo);
      return;
    }
    debug('[tabsOnUpdated] url changed', changeInfo);
    await this.container.maybeAddHistory(tab, changeInfo.url);
    await this.pageaction.showOrHidePageAction(tab);
    await this.container.maybeReloadTabInTempContainer(tab);
  }


  async tabsOnRemoved(tabId) {
    if (this.storage.local.noContainerTabs[tabId]) {
      delete this.storage.local.noContainerTabs[tabId];
    }
    if (this.container.tabCreatedAsMacConfirmPage[tabId]) {
      delete this.tabCreatedAsMacConfirmPage[tabId];
    }
    this.container.addToRemoveQueue(tabId);
  }


  async tabsOnActivated(activeInfo) {
    this.removeContextMenu();
    const activatedTab = await browser.tabs.get(activeInfo.tabId);
    if (!activatedTab.incognito) {
      this.addContextMenu();

      this.pageaction.showOrHidePageAction(activatedTab);
    }
  }
}

window.Tabs = Tabs;