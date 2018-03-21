class Runtime {
  initialize(background) {
    this.storage = background.storage;
    this.mouseclick = background.mouseclick;
    this.browseraction = background.browseraction;
    this.permissions = background.permissions;

    browser.runtime.onMessage.addListener(this.runtimeOnMessage.bind(this));
    browser.runtime.onMessageExternal.addListener(this.runtimeOnMessageExternal.bind(this));
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
        this.browseraction.setIcon(message.payload.preferences.iconColor);
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
}

window.Runtime = Runtime;