class TemporaryContainers {
  constructor() {
    this.initialized = false;

    this.storage = new window.Storage;
    this.request = new window.Request;
    this.container = new window.Container;
    this.mouseclick = new window.MouseClick;
    this.mac = new window.MultiAccountContainers;
  }


  async initialize() {
    // register reset storage message listener
    browser.runtime.onMessage.addListener(this.runtimeOnMessageResetStorage.bind(this));

    // TODO cache history permission in storage when firefox bug is fixed
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1283320
    this.permissions = {
      history: await browser.permissions.contains({permissions: ['history']}),
      notifications: await browser.permissions.contains({permissions: ['notifications']})
    };

    await this.storage.load();

    this.request.initialize(this);
    this.container.initialize(this);
    this.mouseclick.initialize(this);
    this.mac.initialize(this);

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

    browser.runtime.onMessage.addListener(this.runtimeOnMessage.bind(this));
    browser.contextMenus.onClicked.addListener(this.contextMenusOnClicked.bind(this));
    browser.commands.onCommand.addListener(this.commandsOnCommand.bind(this));
    browser.tabs.onActivated.addListener(this.tabsOnActivated.bind(this));
    browser.windows.onFocusChanged.addListener(this.windowsOnFocusChanged.bind(this));
    browser.runtime.onMessageExternal.addListener(this.runtimeOnMessageExternal.bind(this));
    browser.tabs.onCreated.addListener(this.tabsOnCreated.bind(this));
    browser.tabs.onUpdated.addListener(this.tabsOnUpdated.bind(this));
    browser.tabs.onRemoved.addListener(this.tabsOnRemoved.bind(this));
    browser.browserAction.onClicked.addListener(this.browserActionOnClicked.bind(this));
    this.addContextMenu();

    if (this.storage.local.preferences.iconColor !== 'default') {
      this.setIcon(this.storage.local.preferences.iconColor);
    }

    this.initialized = true;
  }


  async runtimeOnMessage(message, sender) {
    debug('[runtimeOnMessage] message received', message, sender);
    if (typeof message !== 'object') {
      return;
    }

    switch (message.method) {
    case 'linkClicked':
      debug('[runtimeOnMessage] link clicked');
      this.mouseclick.linkClicked(message.payload, sender);
      break;

    case 'savePreferences':
      debug('[runtimeOnMessage] saving preferences');
      if (this.storage.local.preferences.iconColor !== message.payload.preferences.iconColor) {
        this.setIcon(message.payload.preferences.iconColor);
      }
      if (message.payload.preferences.notifications) {
        this.permissions.notifications = true;
      }
      this.storage.local.preferences = message.payload.preferences;
      await this.storage.persist();
      break;

    case 'resetStatistics':
      debug('[runtimeOnMessage] resetting statistics');
      this.storage.local.statistics = {
        startTime: new Date,
        containersDeleted: 0,
        cookiesDeleted: 0,
        deletesHistory: {
          containersDeleted: 0,
          cookiesDeleted: 0,
          urlsDeleted: 0
        }
      };
      await this.storage.persist();
      break;

    case 'historyPermissionAllowed':
      debug('[runtimeOnMessage] history permission');
      this.permissions.history = true;
      break;
    }
  }


  async runtimeOnMessageResetStorage(message, sender) {
    debug('[runtimeOnMessageResetStorage] reset storage message received', message, sender);
    if (typeof message !== 'object') {
      return;
    }
    switch (message.method) {
    case 'resetStorage':
      debug('[runtimeOnMessageResetStorage] resetting storage');
      return this.storage.initializeStorage();
    }
  }


  async runtimeOnMessageExternal(message, sender) {
    debug('[runtimeOnMessageExternal] got external message', message, sender);
    switch (message.method) {
    case 'createTabInTempContainer':
      return this.container.createTabInTempContainer({
        url: message.url || null,
        active: message.active,
        deletesHistory: this.storage.local.preferences.deletesHistoryContainer === 'automatic' ? true : false
      });
    case 'isTempContainer':
      return this.storage.local.tempContainers[message.cookieStoreId] ? true : false;
    default:
      throw new Error('Unknown message.method');
    }
  }


  browserActionOnClicked() {
    return this.container.createTabInTempContainer({
      deletesHistory: this.storage.local.preferences.deletesHistoryContainer === 'automatic'
    });
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
    await this.showOrHidePageAction(tab);
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

      this.showOrHidePageAction(activatedTab);
    }
  }

  async showOrHidePageAction(activatedTab) {
    let color;
    if (activatedTab.cookieStoreId === 'firefox-default') {
      color = 'gray';
    } else if (this.storage.local.tempContainers[activatedTab.cookieStoreId] &&
               this.storage.local.tempContainers[activatedTab.cookieStoreId].color) {
      color = this.storage.local.tempContainers[activatedTab.cookieStoreId].color;
    } else {
      const container = await browser.contextualIdentities.get(activatedTab.cookieStoreId);
      color = container.color;
    }
    browser.pageAction.setIcon({
      path: {
        '19': `icons/pageaction-${color}-19.svg`,
        '38': `icons/pageaction-${color}-38.svg`
      },
      tabId: activatedTab.id
    });
    if (!this.storage.local.preferences.pageAction ||
        !activatedTab.url.startsWith('http')) {
      browser.pageAction.hide(activatedTab.id);
    } else {
      browser.pageAction.show(activatedTab.id);
    }
  }


  async windowsOnFocusChanged(windowId) {
    if (windowId === browser.windows.WINDOW_ID_NONE) {
      return;
    }
    this.removeContextMenu();
    try {
      const activeTab = await browser.tabs.query({
        windowId: windowId
      });
      if (!activeTab[0].incognito) {
        this.addContextMenu();
      }
    } catch (error) {
      debug('failed to get the active tab from window');
    }
  }


  async contextMenusOnClicked(info, tab) {
    switch (info.menuItemId)  {
    case 'open-link-in-new-temporary-container-tab':
      this.container.createTabInTempContainer({
        tab,
        url: info.linkUrl,
        active: false,
        deletesHistory: this.storage.local.preferences.deletesHistoryContainer === 'automatic'
      });
      break;
    case 'open-link-in-new-deletes-history-temporary-container-tab':
      this.container.createTabInTempContainer({
        tab,
        url: info.linkUrl,
        active: false,
        deletesHistory: true
      });
      break;
    }
  }


  async commandsOnCommand(name) {
    switch(name) {
    case 'new_temporary_container_tab':
      if (!this.storage.local.preferences.keyboardShortcuts.AltC) {
        return;
      }
      this.container.createTabInTempContainer({
        deletesHistory: this.storage.local.preferences.deletesHistoryContainer === 'automatic'
      });
      break;

    case 'new_no_container_tab':
      if (!this.storage.local.preferences.keyboardShortcuts.AltN) {
        return;
      }
      try {
        const tab = await browser.tabs.create({
          url: 'about:blank'
        });
        this.storage.local.noContainerTabs[tab.id] = true;
        debug('[commandsOnCommand] new no container tab created', this.storage.local.noContainerTabs);
      } catch (error) {
        debug('[commandsOnCommand] couldnt create tab', error);
      }
      break;

    case 'new_no_container_window_tab':
      if (!this.storage.local.preferences.keyboardShortcuts.AltShiftC) {
        return;
      }
      try {
        const window = await browser.windows.create({
          url: 'about:blank'
        });
        this.storage.local.noContainerTabs[window.tabs[0].id] = true;
        debug('[commandsOnCommand] new no container tab created in window', window, this.storage.local.noContainerTabs);
      } catch (error) {
        debug('[commandsOnCommand] couldnt create tab in window', error);
      }
      break;

    case 'new_no_history_tab':
      if (!this.storage.local.preferences.keyboardShortcuts.AltP) {
        return;
      }
      if (this.permissions.history) {
        this.container.createTabInTempContainer({deletesHistory: true});
      }
      break;

    case 'new_same_container_tab':
      if (!this.storage.local.preferences.keyboardShortcuts.AltX) {
        return;
      }
      this.container.createTabInSameContainer();
      break;
    }
  }

  async addContextMenu() {
    if (this.storage.local.preferences.contextMenu) {
      browser.contextMenus.create({
        id: 'open-link-in-new-temporary-container-tab',
        title: 'Open Link in New Temporary Container Tab',
        contexts: ['link'],
        icons: {
          '16': 'icons/page-w-16.svg',
          '32': 'icons/page-w-32.svg'
        }
      });
    }
    if (this.storage.local.preferences.deletesHistoryContextMenu) {
      browser.contextMenus.create({
        id: 'open-link-in-new-deletes-history-temporary-container-tab',
        title: 'Open Link in New "Deletes History Temporary Container" Tab',
        contexts: ['link'],
        icons: {
          '16': 'icons/page-w-16.svg',
          '32': 'icons/page-w-32.svg'
        }
      });
    }
  }


  async removeContextMenu() {
    browser.contextMenus.removeAll();
  }


  setIcon(iconColor) {
    const iconPath = '../icons';
    if (iconColor === 'default') {
      iconColor = 'd';
    }
    const icon = {
      path: {
        16: `${iconPath}/page-${iconColor}-16.svg`,
        32: `${iconPath}/page-${iconColor}-32.svg`
      }
    };
    browser.browserAction.setIcon(icon);
  }


  sameDomain(origin, target) {
    const splittedTarget = target.split('.');
    const checkHostname = '.' + (splittedTarget.splice(-2).join('.'));
    const dottedOrigin = '.' + origin;
    if (target.length > 1 &&
        (dottedOrigin.endsWith(checkHostname) ||
         checkHostname.endsWith(dottedOrigin))) {
      return true;
    }
    return false;
  }


  async runtimeOnInstalled(details) {
    if (details.temporary) {
      log.DEBUG = true;
      log.temporary = true;
    }

    switch (details.reason) {
    case 'install':
      return this.storage.initializeStorage();

    case 'update':
      return this.onUpdateMigration(details);
    }
  }

  /* istanbul ignore next */
  async onUpdateMigration(details) {
    await this.storage.load();

    const previousVersion = details.previousVersion.replace('beta', '.');
    debug('updated from version', details.previousVersion, previousVersion);
    if (versionCompare('0.16', previousVersion) >= 0) {
      debug('updated from version <= 0.16, adapt old automaticmode behaviour if necessary');
      if (!this.storage.local.preferences.automaticMode) {
        this.storage.local.preferences.linkClickGlobal.middle.action = 'never';
        this.storage.local.preferences.linkClickGlobal.ctrlleft.action = 'never';
        await this.storage.persist();
      }
    }
    if (versionCompare('0.33', previousVersion) >= 0) {
      debug('updated from version <= 0.33, make sure to set all left-clicks to "never"');
      this.storage.local.preferences.linkClickGlobal.left.action = 'never';
      const linkClickDomainPatterns = Object.keys(this.storage.local.preferences.linkClickDomain);
      if (linkClickDomainPatterns.length) {
        linkClickDomainPatterns.map(linkClickDomainPattern => {
          this.storage.local.preferences.linkClickDomain[linkClickDomainPattern].left.action = 'never';
        });
      }
      await this.storage.persist();
    }
    if (versionCompare('0.57', previousVersion) >= 0) {
      debug('updated from version <= 0.57, potentially inform user about automatic mode preference change');
      if (this.storage.local.preferences.automaticMode &&
          this.storage.local.preferences.automaticModeNewTab === 'navigation') {
        this.storage.local.preferences.automaticModeNewTab = 'created';
        await this.storage.persist();

        const url = browser.runtime.getURL('tmpcontainer/ui/notifications/update_from_0.57_and_below.html');
        browser.tabs.create({
          url
        });
      }
    }
    if (versionCompare('0.59', previousVersion) >= 0) {
      debug('updated from version <= 0.59, potentially migrate always open in preferences');
      const alwaysOpenInDomains = Object.keys(this.storage.local.preferences.alwaysOpenInDomain);
      if (alwaysOpenInDomains.length) {
        alwaysOpenInDomains.map(alwaysOpenInDomainPattern => {
          this.storage.local.preferences.alwaysOpenInDomain[alwaysOpenInDomainPattern] = {
            allowedInPermanent: false
          };
        });
        await this.storage.persist();
      }
    }
    if (versionCompare('0.73', previousVersion) >= 0) {
      debug('updated from version <= 0.73, remove tabContainerMap from storage');
      delete this.storage.local.tabContainerMap;
      await this.storage.persist();
    }
  }


  async runtimeOnStartup() {
    await this.storage.load();

    // queue a container cleanup
    delay(15000).then(() => {
      this.container.cleanup(true);
    });
  }
}

window.TemporaryContainers = TemporaryContainers;
window.tmp = new TemporaryContainers();
browser.runtime.onInstalled.addListener(tmp.runtimeOnInstalled.bind(tmp));
browser.runtime.onStartup.addListener(tmp.runtimeOnStartup.bind(tmp));

/* istanbul ignore next */
if (!browser._mochaTest) {
  tmp.initialize();
}
