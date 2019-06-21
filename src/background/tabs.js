class Tabs {
  constructor(background) {
    this.background = background;

    this.creatingInSameContainer = false;
    this.lastInactiveIndex = {};
  }


  async initialize() {
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.browseraction = this.background.browseraction;
    this.pageaction = this.background.pageaction;
    this.contextmenu = this.background.contextmenu;
    this.mac = this.background.mac;

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
      this.maybeReloadInTempContainer(tab);
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
    if (!tab.active && this.lastInactiveIndex[browser.windows.WINDOW_ID_CURRENT] &&
      this.lastInactiveIndex[browser.windows.WINDOW_ID_CURRENT] > tab.index) {
      browser.tabs.move(tab.id, {index: this.lastInactiveIndex[browser.windows.WINDOW_ID_CURRENT]++});
    }
    if (tab && tab.cookieStoreId && !this.container.tabContainerMap[tab.id] &&
        this.storage.local.tempContainers[tab.cookieStoreId]) {
      this.container.tabContainerMap[tab.id] = tab.cookieStoreId;
    }

    await this.maybeReloadInTempContainer(tab);
  }


  async onUpdated(tabId, changeInfo, tab) {
    debug('[onUpdated] tab updated', tab);
    if (tab.incognito) {
      debug('[onUpdated] tab incognito, we ignore that');
      browser.browserAction.disable(tab.id);
      return;
    }
    if (changeInfo.url) {
      debug('[onUpdated] url changed', changeInfo);
      await this.container.maybeAddHistory(tab, changeInfo.url);
    }
    if (this.storage.local.preferences.closeRedirectorTabs.active &&
      changeInfo.status && changeInfo.status === 'complete') {
      const url = new URL(tab.url);
      if (this.storage.local.preferences.closeRedirectorTabs.domains.includes(url.hostname)) {
        delay(this.storage.local.preferences.closeRedirectorTabs.delay).then(async () => {
          try {
            const tab = await browser.tabs.get(tabId);
            const url = new URL(tab.url);
            if (this.storage.local.preferences.closeRedirectorTabs.domains.includes(url.hostname)) {
              debug('[onUpdated] removing redirector tab', changeInfo, tab);
              browser.tabs.remove(tabId);
            }
          } catch (error) {
            debug('[onUpdate] error while requesting tab info', error);
          }
        });
      }
    }
    if (!changeInfo.url) {
      debug('[onUpdated] url didnt change, not relevant', tabId, changeInfo);
      return;
    }
    await this.pageaction.showOrHide(tab);
    await this.maybeReloadInTempContainer(tab, changeInfo);
  }


  async onRemoved(tabId) {
    if (this.container.noContainerTabs[tabId]) {
      delete this.container.noContainerTabs[tabId];
    }
    if (this.container.tabCreatedAsMacConfirmPage[tabId]) {
      delete this.tabCreatedAsMacConfirmPage[tabId];
    }
    this.container.addToRemoveQueue(tabId);
  }


  async onActivated(activeInfo) {
    debug('[onActivated]', activeInfo);
    this.contextmenu.remove();
    this.lastInactiveIndex[browser.windows.WINDOW_ID_CURRENT] = false;
    const activatedTab = await browser.tabs.get(activeInfo.tabId);
    if (!activatedTab.incognito) {
      this.contextmenu.add();

      this.pageaction.showOrHide(activatedTab);
    }
  }


  async maybeReloadInTempContainer(tab, changeInfo = {}) {
    if (tab.incognito) {
      debug('[maybeReloadInTempContainer] tab is incognito, ignore it and disable browseraction', tab);
      browser.browserAction.disable(tab.id);
      return;
    }

    if (this.container.creatingInSameContainer) {
      debug('[maybeReloadInTempContainer] we are in the process of creating a tab in same container, ignore');
      return;
    }

    if (this.container.noContainerTabs[tab.id]) {
      debug('[maybeReloadInTempContainer] nocontainer tab, ignore');
      return;
    }

    if (tab.url && tab.url.startsWith('moz-extension://')) {
      debug('[maybeReloadInTempContainer] moz-extension:// tab, do something special', tab);
      await this.mac.handleConfirmPage(tab);
      return;
    }

    if (!this.storage.local.preferences.automaticMode.active) {
      debug('[maybeReloadInTempContainer] automatic mode not active and not a moz page, we ignore that', tab);
      return;
    }

    const deletesHistoryContainer = this.storage.local.preferences.deletesHistory.automaticMode === 'automatic';

    if (!deletesHistoryContainer &&
        this.storage.local.preferences.automaticMode.newTab === 'navigation' &&
        tab.cookieStoreId === 'firefox-default' &&
        (tab.url === 'about:home' ||
         tab.url === 'about:newtab' ||
         (changeInfo.status === 'loading' && changeInfo.url === 'about:blank'))) {
      debug('[maybeReloadInTempContainer] automatic mode on navigation, setting icon badge', tab);
      this.browseraction.addBadge(tab.id);
      return;
    }

    if ((this.storage.local.preferences.automaticMode.newTab === 'created' || deletesHistoryContainer) &&
        tab.cookieStoreId === 'firefox-default' &&
        (tab.url === 'about:home' ||
         tab.url === 'about:newtab' ||
         (changeInfo.status === 'loading' && changeInfo.url === 'about:blank'))) {
      debug('[maybeReloadInTempContainer] about:home/new tab in firefox-default container, reload in temp container', tab);

      await this.container.reloadTabInTempContainer({
        tab,
        deletesHistory: deletesHistoryContainer
      });
      return;
    }

    if (tab.url && !tab.url.startsWith('about:') && !tab.url.startsWith('moz-extension:') &&
        this.storage.local.tempContainers[tab.cookieStoreId] &&
        this.storage.local.tempContainers[tab.cookieStoreId].clean) {
      debug('[maybeReloadInTempContainer] marking tmp container as not clean anymore', tab);
      this.storage.local.tempContainers[tab.cookieStoreId].clean = false;
    }
    debug('[maybeReloadInTempContainer] not a home/new/moz tab or disabled, we dont handle that', tab);
  }


  async onlyIncognitoOrNone() {
    // don't do a cleanup if there are none or only incognito-tabs
    try {
      const tabs = await browser.tabs.query({});
      if (!tabs.length) {
        return true;
      }
      if (!tabs.filter(tab => !tab.incognito).length) {
        return true;
      }
      return false;
    } catch (error) {
      debug('[onlyIncognitoOrNone] failed to query tabs', error);
      return false;
    }
  }


  async createInSameContainer() {
    this.creatingInSameContainer = true;
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true
      });
      const activeTab = tabs[0];
      if (!activeTab) {
        debug('[createInSameContainer] couldnt find an active tab', activeTab);
        return;
      }
      try {
        const newTab = await browser.tabs.create({
          index: activeTab.index + 1,
          cookieStoreId: activeTab.cookieStoreId
        });
        this.creatingInSameContainer = false;
        debug('[createInSameContainer] new same container tab created', activeTab, newTab);
      } catch (error) {
        debug('[createInSameContainer] couldnt create tab', error);
        this.creatingInSameContainer = false;
      }
    } catch (error) {
      debug('[createInSameContainer] couldnt query tabs', error);
      this.creatingInSameContainer = false;
    }
  }


  async remove(tab) {
    try {
      // make sure we dont close the window by removing this tab
      // TODO implement actual queue for removal, race-condition (and with that window-closing) is possible
      const tabs = await browser.tabs.query({windowId: browser.windows.WINDOW_ID_CURRENT});
      if (tabs.length > 1) {
        try {
          await browser.tabs.remove(tab.id);
          debug('[removeTab] removed old tab', tab.id);
        } catch (error) {
          debug('[removeTab] error while removing old tab', tab, error);
        }
      } else {
        debug('[removeTab] queuing removal of tab to prevent closing of window', tab, tabs);
        delay(500).then(() => {
          this.remove(tab);
        });
      }
    } catch (error) {
      debug('[removeTab] couldnt query tabs', tab, error);
    }
  }
}

window.Tabs = Tabs;