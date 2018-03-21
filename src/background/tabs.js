class Tabs {
  constructor(background) {
    this.background = background;
  }


  async initialize() {
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.pageaction = this.background.pageaction;

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

    browser.tabs.onActivated.addListener(this.onActivated.bind(this));
    browser.tabs.onCreated.addListener(this.onCreated.bind(this));
    browser.tabs.onUpdated.addListener(this.onUpdated.bind(this));
    browser.tabs.onRemoved.addListener(this.onRemoved.bind(this));
  }


  async onCreated(tab) {
    debug('[onCreated] tab created', tab);
    if (tab.incognito) {
      debug('[onCreated] tab incognito, we ignore that', tab);
      browser.browserAction.disable(tab.id);
      return;
    }
    if (tab && tab.cookieStoreId && !this.container.tabContainerMap[tab.id] &&
        this.storage.local.tempContainers[tab.cookieStoreId]) {
      this.container.tabContainerMap[tab.id] = tab.cookieStoreId;
    }

    await this.container.maybeReloadTabInTempContainer(tab);
  }


  async onUpdated(tabId, changeInfo, tab) {
    debug('[onUpdated] tab updated', tab);
    if (tab.incognito) {
      debug('[onUpdated] tab incognito, we ignore that');
      browser.browserAction.disable(tab.id);
      return;
    }
    if (!changeInfo.url) {
      debug('[onUpdated] url didnt change, not relevant', tabId, changeInfo);
      return;
    }
    debug('[onUpdated] url changed', changeInfo);
    await this.container.maybeAddHistory(tab, changeInfo.url);
    await this.pageaction.showOrHide(tab);
    await this.container.maybeReloadTabInTempContainer(tab);
  }


  async onRemoved(tabId) {
    if (this.storage.local.noContainerTabs[tabId]) {
      delete this.storage.local.noContainerTabs[tabId];
    }
    if (this.container.tabCreatedAsMacConfirmPage[tabId]) {
      delete this.tabCreatedAsMacConfirmPage[tabId];
    }
    this.container.addToRemoveQueue(tabId);
  }


  async onActivated(activeInfo) {
    this.removeContextMenu();
    const activatedTab = await browser.tabs.get(activeInfo.tabId);
    if (!activatedTab.incognito) {
      this.addContextMenu();

      this.pageaction.showOrHide(activatedTab);
    }
  }
}

window.Tabs = Tabs;