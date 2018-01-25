const Storage = require('./background/storage');
const Container = require('./background/container');
const Request = require('./background/request');
const { versionCompare } = require('./background/utils');
const {
  log,
  debug
} = require('./background/log');


class TemporaryContainers {
  constructor() {
    this.automaticModeState = {
      linkClicked: {},
      linkClickCreatedTabs: {},
      alreadySawThatLink: {},
      alreadySawThatLinkInNonDefault: {},
      multiAccountWasFaster: {},
      multiAccountConfirmPage: {},
      multiAccountRemovedTab: {},
      noContainerTab: {}
    };

    this.storage = new Storage;
    this.request = new Request;
    this.container = new Container;
  }


  async initialize() {
    this.request.initialize(this);
    this.container.initialize(this);
    if (!this.storage.local) {
      await this.storage.load();
    }

    browser.contextMenus.onClicked.addListener(this.contextMenusOnClicked.bind(this));
    browser.commands.onCommand.addListener(this.commandsOnCommand.bind(this));
    browser.tabs.onActivated.addListener(this.tabsOnActivated.bind(this));
    browser.windows.onFocusChanged.addListener(this.windowsOnFocusChanged.bind(this));
    browser.runtime.onMessage.addListener(this.runtimeOnMessage.bind(this));
    browser.tabs.onCreated.addListener(this.tabsOnCreated.bind(this));
    browser.tabs.onUpdated.addListener(this.tabsOnUpdated.bind(this));
    browser.tabs.onRemoved.addListener(this.tabsOnRemoved.bind(this));
    browser.browserAction.onClicked.addListener(this.container.createTabInTempContainer.bind(this.container));
    browser.webRequest.onBeforeRequest.addListener(this.request.webRequestOnBeforeRequest.bind(this.request),  {
      urls: ['<all_urls>'],
      types: ['main_frame']
    }, [
      'blocking'
    ]);
    this.addContextMenu();

    setInterval(() => {
      debug('[interval] container removal interval', this.storage.local.tempContainers);
      this.container.cleanup();
    }, 60000);
  }


  async runtimeOnMessage(message, sender) {
    if (typeof message !== 'object') {
      return;
    }

    if (message.savePreferences) {
      debug('[browser.runtime.onMessage] saving preferences', message, sender);
      this.storage.local.preferences = message.savePreferences.preferences;
      await this.storage.persist();
      return;
    }

    if (!message.linkClicked) {
      return;
    }
    debug('[browser.runtime.onMessage] message from userscript received', message, sender);

    if (sender.tab.incognito) {
      debug('[browser.runtime.onMessage] message came from an incognito tab, we dont handle that', message, sender);
      return;
    }

    if (!this.request.isClickAllowed(message, sender)) {
      return;
    }

    this.request.linkClicked(message.linkClicked.href, sender.tab);
  }


  async tabsOnCreated(tab) {
    debug('[browser.tabs.onCreated] tab created', tab);
    if (tab.incognito) {
      // delay disabling of browseraction (firefox doesnt pickup disabling right after creation)
      setTimeout(() => {
        debug('[browser.tabs.onCreated] tab is incognito, disabling browseraction', tab);
        browser.browserAction.disable(tab.id);
      }, 100);
      return;
    }

    await this.container.maybeReloadTabInTempContainer(tab);
  }


  async tabsOnUpdated(tabId, changeInfo, tab) {
    debug('[browser.tabs.onUpdated] tab updated', tab);
    if (changeInfo.status === 'complete' && (this.automaticModeState.alreadySawThatLink[tab.url] ||
       this.automaticModeState.alreadySawThatLinkInNonDefault[tab.url])) {
      debug('[browser.tabs.onUpdated] looks like a tab finished loading a url we saw before', changeInfo, tab);
      delete this.automaticModeState.alreadySawThatLink[tab.url];
      delete this.automaticModeState.alreadySawThatLinkInNonDefault[tab.url];
      return;
    }
    if (!changeInfo.url) {
      debug('[browser.tabs.onUpdated] url didnt change, not relevant', tabId, changeInfo, tab);
      return;
    }
    debug('[tabsOnUpdated] url changed', changeInfo, tab);
    await this.container.maybeReloadTabInTempContainer(tab);
  }


  async tabsOnRemoved(tabId) {
    if (this.automaticModeState.noContainerTab[tabId]) {
      delete this.automaticModeState.noContainerTab[tabId];
    }
    if (!this.storage.local.tabContainerMap[tabId]) {
      debug('[browser.tabs.onRemoved] removed tab that isnt in the tabContainerMap', tabId, this.storage.local.tabContainerMap);
      return;
    }
    const cookieStoreId = this.storage.local.tabContainerMap[tabId];
    debug('[browser.tabs.onRemoved] queuing container removal because of tab removal', cookieStoreId, tabId);
    setTimeout(() => {
      this.container.tryToRemove(cookieStoreId);
    }, 500);
  }


  async tabsOnActivated(activeInfo) {
    this.removeContextMenu();
    const activatedTab = await browser.tabs.get(activeInfo.tabId);
    if (!activatedTab.incognito) {
      this.addContextMenu();
    }
  }


  async windowsOnFocusChanged(windowId) {
    if (windowId === browser.windows.WINDOW_ID_NONE) {
      return;
    }
    this.removeContextMenu();
    try {
      const activeTab = await browser.tabs.query({
        active: true,
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
      this.container.createTabInTempContainer(tab, info.linkUrl, null, false, true);
      break;
    }
  }


  async commandsOnCommand(name) {
    switch(name) {
    case 'new_no_container_tab':
      try {
        const tab = await browser.tabs.create({
          active: true,
          url: 'about:blank'
        });
        this.automaticModeState.noContainerTab[tab.id] = true;
        debug('[commandsOnCommand] new no container tab created', this.automaticModeState.noContainerTab);
      } catch (error) {
        debug('[commandsOnCommand] couldnt create tab', error);
      }
      break;

    case 'new_no_container_window_tab':
      try {
        const window = await browser.windows.create({
          url: 'about:blank'
        });
        this.automaticModeState.noContainerTab[window.tabs[0].id] = true;
        debug('[commandsOnCommand] new no container tab created in window', window, this.automaticModeState.noContainerTab);
      } catch (error) {
        debug('[commandsOnCommand] couldnt create tab in window', error);
      }
      break;

    }
  }


  async addContextMenu() {
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


  async removeContextMenu() {
    browser.contextMenus.removeAll();
  }



  async runtimeOnInstalled(details) {
    if (details.temporary) {
      log.DEBUG = true;
      return; // prevent update logic
    }

    if (details.reason === 'update') {
      debug('updated from version', details.previousVersion);
      if (versionCompare('0.16', details.previousVersion) >= 0) {
        // updated from version <= 0.16, adapt old automaticmode behaviour if necessary
        if (!this.storage.local) {
          await this.storage.load();
        }
        if (!this.storage.local.preferences.automaticMode) {
          this.storage.local.preferences.linkClickGlobal.middle.action = 'never';
          this.storage.local.preferences.linkClickGlobal.ctrlleft.action = 'never';
          await this.storage.persist();
        }
      }
    }
  }


  async runtimeOnStartup() {
    if (!this.storage.local) {
      await this.storage.load();
    }

    // extension loads after the first tab opens most of the time
    // lets see if we can reopen the first tab
    const tempTabs = await browser.tabs.query({});
    // disable browseraction for all incognito tabs
    tempTabs.map(tab =>{
      if (tab.incognito) {
        browser.browserAction.disable(tab.id);
      }
    });
    if (tempTabs.length !== 1) {
      return;
    }
    await this.container.maybeReloadTabInTempContainer(tempTabs[0]);
  }
}


const tmp = new TemporaryContainers();
browser.runtime.onInstalled.addListener(tmp.runtimeOnInstalled.bind(tmp));
browser.runtime.onStartup.addListener(tmp.runtimeOnStartup.bind(tmp));


if (!browser.mochaTest) {
  window.log = log;
  window.tmp = tmp;
  tmp.initialize();
} else {
  /* eslint-disable no-undef */
  if (process.argv[process.argv.length-1] === '--tmp-debug') {
    log.DEBUG = true;
  }
  module.exports = tmp;
}
