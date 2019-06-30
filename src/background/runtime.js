class Runtime {
  constructor(background) {
    this.background = background;
    this.storage = background.storage;
  }


  initialize() {
    this.container = this.background.container;
    this.mouseclick = this.background.mouseclick;
    this.browseraction = this.background.browseraction;
    this.migration = this.background.migration;
    this.permissions = this.background.permissions;

    browser.runtime.onMessageExternal.addListener(this.onMessageExternal.bind(this));
  }


  async onMessage(message, sender) {
    debug('[onMessage] message received', message, sender);
    if (typeof message !== 'object') {
      return;
    }

    switch (message.method) {
    case 'linkClicked':
      debug('[onMessage] link clicked');
      this.mouseclick.linkClicked(message.payload, sender);
      break;

    case 'savePreferences':
      debug('[onMessage] saving preferences');
      if (message.payload.migrate) {
        await this.migration.migrate(message.payload.previousVersion);
      }

      if (this.storage.local.preferences.iconColor !== message.payload.preferences.iconColor) {
        this.browseraction.setIcon(message.payload.preferences.iconColor);
      }
      if (this.storage.local.preferences.browserActionPopup !== message.payload.preferences.browserActionPopup) {
        if (message.payload.preferences.browserActionPopup) {
          this.browseraction.setPopup();
        } else {
          this.browseraction.unsetPopup();
        }
      }
      if (this.storage.local.preferences.isolation.active !== message.payload.preferences.isolation.active) {
        if (message.payload.preferences.isolation.active) {
          this.browseraction.removeIsolationInactiveBadge();
        } else {
          this.browseraction.addIsolationInactiveBadge();
        }
      }
      if (message.payload.preferences.notifications) {
        this.permissions.notifications = true;
      }
      if (message.payload.preferences.deletesHistory.active) {
        this.permissions.history = true;
      }
      this.storage.local.preferences = message.payload.preferences;
      await this.storage.persist();

      if ((await browser.tabs.query({
        url: browser.runtime.getURL('options.html')
      })).length) {
        browser.runtime.sendMessage({info: 'preferencesUpdated', fromTabId: sender && sender.tab && sender.tab.id});
      }

      if (this.storage.local.preferences.contextMenu !== message.payload.preferences.contextMenu ||
        this.storage.local.preferences.contextMenuBookmarks !== message.payload.preferences.contextMenuBookmarks ||
        this.storage.local.preferences.deletesHistory.contextMenu !== message.payload.preferences.deletesHistory.contextMenu ||
        this.storage.local.preferences.deletesHistory.contextMenuBookmarks !== message.payload.preferences.deletesHistory.contextMenuBookmarks)  {
        await this.contextmenu.remove();
        this.contextmenu.add();
      }
      break;

    case 'resetStatistics':
      debug('[onMessage] resetting statistics');
      this.storage.local.statistics = JSON.parse(JSON.stringify(this.storage.storageDefault.statistics));
      this.storage.local.statistics.startTime = new Date;
      await this.storage.persist();
      break;

    case 'resetStorage':
      debug('[onMessage] resetting storage', message, sender);
      this.browseraction.unsetPopup();
      this.contextmenu.remove();
      this.browseraction.setIcon('default');
      await browser.storage.local.clear();
      return this.storage.install();

    case 'createTabInTempContainer':
      return this.container.createTabInTempContainer({
        url: message.payload ? message.payload.url : undefined,
        deletesHistory: message.payload ? message.payload.deletesHistory : undefined
      });

    case 'convertTempContainerToPermanent':
      return this.container.convertTempContainerToPermanent({
        cookieStoreId: message.payload.cookieStoreId,
        tabId: message.payload.tabId,
        name: message.payload.name,
        url: message.payload.url
      });

    case 'convertTempContainerToRegular':
      return this.container.convertTempContainerToRegular({
        cookieStoreId: message.payload.cookieStoreId,
        tabId: message.payload.tabId,
        url: message.payload.url
      });

    case 'convertPermanentToTempContainer':
      return this.container.convertPermanentToTempContainer({
        cookieStoreId: message.payload.cookieStoreId,
        tabId: message.payload.tabId,
        url: message.payload.url
      });

    case 'ping':
      return 'pong';
    }
  }


  async onMessageExternal(message, sender) {
    debug('[onMessageExternal] got external message', message, sender);
    switch (message.method) {
    case 'createTabInTempContainer':
      return this.container.createTabInTempContainer({
        url: message.url || null,
        active: message.active,
        deletesHistory: this.storage.local.preferences.deletesHistory.automaticMode === 'automatic' ? true : false
      });
    case 'isTempContainer':
      return this.storage.local.tempContainers[message.cookieStoreId] ? true : false;
    default:
      throw new Error('Unknown message.method');
    }
  }

  async onStartup() {
    // queue a container cleanup
    delay(15000).then(() => {
      this.container.cleanup(true);
    });
  }
}

window.Runtime = Runtime;