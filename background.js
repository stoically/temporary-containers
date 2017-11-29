let DEBUG = false;
const debug = function() {
  if (!DEBUG) {
    return;
  }
  // eslint-disable-next-line no-console
  console.log(...arguments);
};

class TemporaryContainers {
  constructor() {
    this.storage = null;

    this.containerColors = [
      'blue',
      'turquoise',
      'green',
      'yellow',
      'orange',
      'red',
      'pink',
      'purple',
    ];
    this.containerIcons = [
      'fingerprint',
      'briefcase',
      'dollar',
      'cart',
      'circle',
      'gift',
      'vacation',
      'food',
      'fruit',
      'pet',
      'tree',
      'chill',
    ];

    this.preferencesDefault = {
      automaticMode: true,
      containerNamePrefix: 'tmp',
      containerColor: 'red',
      containerColorRandom: false,
      containerIcon: 'circle',
      containerIconRandom: false,
      containerNumberMode: 'keep'
    };

    this.automaticModeState = {
      linkClicked: {},
      linkClickCreatedTabs: {},
      alreadySawThatLink: {},
      alreadySawThatLinkInNonDefault: {},
      multiAccountWasFaster: {},
      multiAccountConfirmPage: {}
    };

    this.createTabInTempContainer = this.createTabInTempContainer.bind(this);
    this.contextMenusOnClicked = this.contextMenusOnClicked.bind(this);
    this.runtimeOnInstalled = this.runtimeOnInstalled.bind(this);
    this.runtimeOnStartup = this.runtimeOnStartup.bind(this);
    this.runtimeOnMessage = this.runtimeOnMessage.bind(this);
    this.tabsOnCreated = this.tabsOnCreated.bind(this);
    this.tabsOnUpdated = this.tabsOnUpdated.bind(this);
    this.tabsOnRemoved = this.tabsOnRemoved.bind(this);
    this.webRequestOnBeforeRequest = this.webRequestOnBeforeRequest.bind(this);
  }


  async initialize() {
    if (!this.storage) {
      await this.loadStorage();
    }
    this.tryToRemoveContainers();
  }


  async loadStorage() {
    try {
      let storagePersistNeeded = false;
      this.storage = await browser.storage.local.get();
      if (!Object.keys(this.storage).length) {
        this.storage = {
          tempContainerCounter: 0,
          tempContainers: {},
          tabContainerMap: {},
          preferences: this.preferencesDefault
        };
        debug('storage empty, setting defaults', this.storage);
        storagePersistNeeded = true;
      } else {
        debug('storage loaded', this.storage);
      }
      // set preferences defaults if not present
      if (!this.storage.preferences) {
        debug('no preferences found, setting defaults', this.preferencesDefault);
        this.storage.preferences = this.preferencesDefault;
        storagePersistNeeded = true;
      } else {
        Object.keys(this.preferencesDefault).map(key => {
          if (this.storage.preferences[key] === undefined) {
            debug('preference not found, setting default', key, this.preferencesDefault[key]);
            this.storage.preferences[key] = this.preferencesDefault[key];
            storagePersistNeeded = true;
          }
        });
      }

      if (storagePersistNeeded) {
        await this.persistStorage();
      }
    } catch (error) {
      debug('error while loading local storage', error);
      // TODO: stop execution, inform user and/or retry?
    }
  }


  async persistStorage() {
    try {
      await browser.storage.local.set(this.storage);
      debug('storage persisted');
    } catch (error) {
      debug('something went wrong while trying to persist the storage', error);
    }
  }


  async tryToRemoveContainer(cookieStoreId) {
    try {
      const tempTabs = await browser.tabs.query({
        cookieStoreId
      });
      if (tempTabs.length > 0) {
        debug('[tryToRemoveContainer] not removing container because it still has tabs', cookieStoreId, tempTabs.length);
        return;
      }
      debug('[tryToRemoveContainer] no tabs in temp container anymore, deleting container', cookieStoreId);
    } catch (error) {
      debug('[tryToRemoveContainer] failed to query tabs', cookieStoreId, error);
      return;
    }
    try {
      const contextualIdentity = await browser.contextualIdentities.remove(cookieStoreId);
      if (!contextualIdentity) {
        debug('[tryToRemoveContainer] couldnt find container to remove', cookieStoreId);
      } else {
        debug('[tryToRemoveContainer] container removed', cookieStoreId);
      }
      Object.keys(this.storage.tabContainerMap).map((tabId) => {
        if (this.storage.tabContainerMap[tabId] === cookieStoreId) {
          delete this.storage.tabContainerMap[tabId];
        }
      });
      await this.persistStorage();
    } catch (error) {
      debug('[tryToRemoveContainer] error while removing container', cookieStoreId, error);
    }
    delete this.storage.tempContainers[cookieStoreId];
  }


  tryToRemoveContainers() {
    Object.keys(this.storage.tempContainers).map((cookieStoreId) => {
      this.tryToRemoveContainer(cookieStoreId);
    });
  }


  async runtimeOnInstalled(details) {
    if (details.temporary) {
      DEBUG = true;
    }
  }


  async createTabInTempContainer(tab, url) {
    let tempContainerNumber;
    if (this.storage.preferences.containerNumberMode === 'keep') {
      this.storage.tempContainerCounter++;
      tempContainerNumber = this.storage.tempContainerCounter;
    }
    if (this.storage.preferences.containerNumberMode === 'reuse') {
      const tempContainersNumbers = Object.values(this.storage.tempContainers).sort();
      debug('[createTabInTempContainer] tempContainersNumbers', tempContainersNumbers);
      if (!tempContainersNumbers.length) {
        tempContainerNumber = 1;
      } else {
        const maxContainerNumber = Math.max.apply(Math, tempContainersNumbers);
        debug('[createTabInTempContainer] maxContainerNumber', maxContainerNumber, tempContainersNumbers);
        for (let i = 1; i < maxContainerNumber; i++) {
          debug('[createTabInTempContainer] tempContainersNumbers[i]', i, tempContainersNumbers[i]);
          if (!tempContainersNumbers.includes(i)) {
            tempContainerNumber = i;
            break;
          }
        }
        if (!tempContainerNumber) {
          tempContainerNumber = maxContainerNumber + 1;
        }
      }
    }
    const containerName = `${this.storage.preferences.containerNamePrefix}${tempContainerNumber}`;
    try {
      let containerColor = this.storage.preferences.containerColor;
      if (this.storage.preferences.containerColorRandom) {
        containerColor = this.containerColors[Math.floor(Math.random() * this.containerColors.length)];
      }
      let containerIcon = this.storage.preferences.containerIcon;
      if (this.storage.preferences.containerIconRandom) {
        containerIcon = this.containerIcons[Math.floor(Math.random() * this.containerIcons.length)];
      }
      const contextualIdentity = await browser.contextualIdentities.create({
        name: containerName,
        color: containerColor,
        icon: containerIcon
      });
      debug('[createTabInTempContainer] contextualIdentity created', contextualIdentity);
      this.storage.tempContainers[contextualIdentity.cookieStoreId] = tempContainerNumber;
      await this.persistStorage();

      try {
        const active = url ? false : true;
        const newTabOptions = {
          url,
          active,
          cookieStoreId: contextualIdentity.cookieStoreId,
        };
        if (tab && tab.index) {
          newTabOptions.index = tab.index + 1;
        }
        debug('[createTabInTempContainer] creating tab in temporary container', newTabOptions);
        const newTab = await browser.tabs.create(newTabOptions);
        debug('[createTabInTempContainer] new tab in temp container created', newTab);
        this.storage.tabContainerMap[newTab.id] = contextualIdentity.cookieStoreId;
        await this.persistStorage();
        return newTab;
      } catch (error) {
        debug('[createTabInTempContainer] error while creating new tab', error);
      }
    } catch (error) {
      debug('[createTabInTempContainer] error while creating container', containerName, error);
    }
  }


  async handleMultiAccountContainersConfirmPage(tab) {
    // so this is *probably* the confirm page from multi-account-containers
    // i need to reach out to the multi-account-containers devs, maybe its possible
    // to handle this in a cleaner fashion
    const multiAccountMatch = tab.url.match(/moz-extension:\/\/[^/]*\/confirm-page.html\?url=/);
    if (multiAccountMatch) {
      debug('[handleMultiAccountContainersConfirmPage] is intervening', tab);
      const parsedURL = new URL(tab.url);
      debug('[handleMultiAccountContainersConfirmPage] parsed url', parsedURL);
      const queryParams = parsedURL.search.split('&').map(param => param.split('='));
      debug('[handleMultiAccountContainersConfirmPage] query params', queryParams);
      const multiAccountTargetURL = decodeURIComponent(queryParams[0][1]);
      debug('[handleMultiAccountContainersConfirmPage] target url', multiAccountTargetURL);
      let multiAccountOriginContainer;
      if (queryParams[2]) {
        multiAccountOriginContainer = queryParams[2][1];
        debug('[handleMultiAccountContainersConfirmPage] origin container', multiAccountOriginContainer);
      }
      this.automaticModeState.multiAccountConfirmPage[multiAccountTargetURL] = true;

      debug('[handleMultiAccountContainersConfirmPage] debug',
        multiAccountTargetURL, multiAccountOriginContainer, JSON.stringify(this.automaticModeState.linkClicked), tab);
      if ((multiAccountOriginContainer && this.automaticModeState.linkClicked[multiAccountTargetURL] &&
           this.automaticModeState.linkClicked[multiAccountTargetURL].containers[multiAccountOriginContainer])
          ||
          (!multiAccountOriginContainer && tab.cookieStoreId === 'firefox-default')) {
        debug('[handleMultiAccountContainersConfirmPage] we can remove this tab, i guess - and yes this is a bit hacky', tab);
        await browser.tabs.remove(tab.id);
        debug('[handleMultiAccountContainersConfirmPage] removed multi-account-containers tab', tab.id);
        return;
      }
    }
  }


  async reloadTabInTempContainer(tab, url) {
    const newTab = await this.createTabInTempContainer(tab, url);
    if (!tab) {
      return newTab;
    }
    try {
      await browser.tabs.remove(tab.id);
      debug('[reloadTabInTempContainer] removed old tab', tab.id);
    } catch (error) {
      debug('[reloadTabInTempContainer] error while removing old tab', tab, error);
    }
    return newTab;
  }


  async maybeReloadTabInTempContainer(tab) {
    if (!this.storage.preferences.automaticMode) {
      debug('[maybeReloadTabInTempContainer] automatic mode not active, we ignore that', tab);
      return;
    }

    if (tab.incognito) {
      debug('[maybeReloadTabInTempContainer] tab is incognito, ignore it', tab);
      return;
    }

    if (tab.cookieStoreId === 'firefox-default' &&
       (tab.url === 'about:home' ||
        tab.url === 'about:newtab')) {
      debug('[maybeReloadTabInTempContainer] about:home/new tab in firefox-default container, reload in temp container', tab);
      await this.reloadTabInTempContainer(tab);
      return;
    }

    if (tab.url.startsWith('moz-extension://')) {
      debug('[maybeReloadTabInTempContainer] moz-extension:// tab, do something special', tab);
      await this.handleMultiAccountContainersConfirmPage(tab);
      return;
    }

    debug('[maybeReloadTabInTempContainer] not a home/new/moz tab, we dont handle that', tab);
  }


  async runtimeOnStartup() {
    await this.initialize();
    // extension loads after the first tab opens most of the time
    // lets see if we can reopen the first tab
    const tempTabs = await browser.tabs.query({});
    if (tempTabs.length !== 1) {
      return;
    }
    await this.maybeReloadTabInTempContainer(tempTabs[0]);
  }


  async tabsOnCreated(tab) {
    debug('[browser.tabs.onCreated] tab created', tab);
    await this.maybeReloadTabInTempContainer(tab);
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
    await this.maybeReloadTabInTempContainer(tab);
  }


  async tabsOnRemoved(tabId) {
    if (!this.storage.tabContainerMap[tabId]) {
      debug('[browser.tabs.onRemoved] removed tab that isnt in the tabContainerMap', tabId, this.storage.tabContainerMap);
      return;
    }
    const cookieStoreId = this.storage.tabContainerMap[tabId];
    debug('[browser.tabs.onRemoved] queuing container removal because of tab removal', cookieStoreId, tabId);
    setTimeout(() => {
      this.tryToRemoveContainer(cookieStoreId);
    }, 500);
  }


  async runtimeOnMessage(message, sender) {
    if (typeof message !== 'object') {
      return;
    }

    if (message.savePreferences) {
      debug('[browser.runtime.onMessage] saving preferences', message, sender);
      this.storage.preferences = message.savePreferences.preferences;
      await this.persistStorage();
      return;
    }

    if (!message.linkClicked) {
      return;
    }
    debug('[browser.runtime.onMessage] message from userscript received', message, sender);

    if (!this.storage.preferences.automaticMode) {
      debug('[browser.runtime.onMessage] automatic mode not active, skipping', message, sender);
      return;
    }

    if (sender.tab.incognito) {
      debug('[browser.runtime.onMessage] message came from an incognito tab, we dont handle that', message, sender);
      return;
    }

    let sameTLD = false;
    const parsedSenderTabURL = new URL(sender.tab.url);
    const parsedClickedURL = new URL(message.linkClicked.href);
    if (parsedSenderTabURL.hostname === parsedClickedURL.hostname) {
      sameTLD = true;
    } else {
      const splittedClickedHostname = parsedClickedURL.hostname.split('.');
      if (splittedClickedHostname.length > 1 &&
          parsedSenderTabURL.hostname.endsWith('.' + splittedClickedHostname.splice(-2).join('.'))) {
        sameTLD = true;
      }
    }
    if (sameTLD) {
      debug('[browser.runtime.onMessage] clicked link goes to the same tld, ignore that', message, sender);
      return;
    }

    if (!this.automaticModeState.linkClicked[message.linkClicked.href]) {
      this.automaticModeState.linkClicked[message.linkClicked.href] = {
        tabs: {},
        containers: {},
        count: 0
      };
    }
    this.automaticModeState.linkClicked[message.linkClicked.href].tabs[sender.tab.id] = true;
    this.automaticModeState.linkClicked[message.linkClicked.href].containers[sender.tab.cookieStoreId] = true;
    this.automaticModeState.linkClicked[message.linkClicked.href].count++;

    setTimeout(() => {
      // emergency cleanup timer
      debug('[runtimeOnMessage] cleaning up, just to be sure', message.linkClicked.href);
      delete this.automaticModeState.linkClicked[message.linkClicked.href];
      delete this.automaticModeState.linkClickCreatedTabs[message.linkClicked.href];
      delete this.automaticModeState.alreadySawThatLink[message.linkClicked.href];
      delete this.automaticModeState.alreadySawThatLinkInNonDefault[message.linkClicked.href];
    }, 3000);
  }


  async maybeRemoveClickState(request) {
    this.automaticModeState.linkClicked[request.url].count--;
    if (!this.automaticModeState.linkClicked[request.url].count) {
      delete this.automaticModeState.linkClicked[request.url];
      delete this.automaticModeState.linkClickCreatedTabs[request.url];
    }
  }


  async handleClickedLink(request, tab) {
    debug('[handClickedLink] onBeforeRequest', request);

    if (!tab) {
      debug('[handClickedLink] multi-account-containers mightve removed the tab, continue', request.tabId);
    }

    if (!tab.openerTabId && !this.storage.tabContainerMap[tab.id]) {
      debug('[handClickedLink] no openerTabId and not in the tabContainerMap means probably ' +
        'multi-account reloaded the url ' +
        'in another tab, so were going either to close the tabs weve opened for that ' +
        'link so far or inform our future self', JSON.stringify(this.automaticModeState.linkClickCreatedTabs));

      if (!this.automaticModeState.linkClickCreatedTabs[request.url]) {
        debug('[handClickedLink] informing future self');
        this.automaticModeState.multiAccountWasFaster[request.url] = tab.id;
      } else {
        const clickCreatedTabId = this.automaticModeState.linkClickCreatedTabs[request.url];
        debug('[handClickedLink] removing tab', clickCreatedTabId);
        try {
          await browser.tabs.remove(clickCreatedTabId);
          debug('[handClickedLink] removed tab', clickCreatedTabId);
          delete this.automaticModeState.linkClickCreatedTabs[request.url];
        } catch (error) {
          debug('[handClickedLink] something went wrong while removing tab', clickCreatedTabId, error);
        }
      }
      this.maybeRemoveClickState(request);
      return;
    }

    const newTab = await this.reloadTabInTempContainer(tab, request.url);
    debug('[handClickedLink] created new tab', newTab);
    if (this.automaticModeState.multiAccountWasFaster[request.url]) {
      const multiAccountTabId = this.automaticModeState.multiAccountWasFaster[request.url];
      debug('[handClickedLink] multi-account was faster and created a tab, remove the tab again', multiAccountTabId);
      try {
        await browser.tabs.remove(multiAccountTabId);
        debug('[handClickedLink] removed tab', multiAccountTabId);
      } catch (error) {
        debug('[handClickedLink] something went wrong while removing tab', multiAccountTabId, error);
      }
      delete this.automaticModeState.multiAccountWasFaster[request.url];
    } else {
      this.automaticModeState.linkClickCreatedTabs[request.url] = newTab.id;
      debug('[handClickedLink] linkClickCreatedTabs', JSON.stringify(this.automaticModeState.linkClickCreatedTabs));
    }

    this.maybeRemoveClickState(request);

    debug('[handClickedLink] canceling request', request);
    return { cancel: true };
  }


  async handleNotClickedLink(request, tab) {
    if (tab.cookieStoreId !== 'firefox-default') {
      debug('[handleNotClickedLink] onBeforeRequest tab belongs to a non-default container', tab, request,
        JSON.stringify(this.automaticModeState.multiAccountConfirmPage), JSON.stringify(this.automaticModeState.alreadySawThatLink));
      if (this.automaticModeState.multiAccountConfirmPage[request.url]) {
        debug('[handleNotClickedLink] we saw a multi account confirm page for that url', request.url);
        delete this.automaticModeState.multiAccountConfirmPage[request.url];
        return;
      } else {
        if (this.automaticModeState.alreadySawThatLinkInNonDefault[request.url]) {
          if (!this.storage.tempContainers[tab.cookieStoreId]) {
            debug('[handleNotClickedLink] we saw that external link before, probably multi-account stuff, close tab', request.url);
            try {
              await browser.tabs.remove(request.tabId);
            } catch (error) {
              debug('[handleNotClickedLink] removing tab failed', request.tabId, error);
            }
            delete this.automaticModeState.alreadySawThatLinkInNonDefault[request.url];
            return { cancel: true };
          } else {
            delete this.automaticModeState.alreadySawThatLinkInNonDefault[request.url];
          }
        }
      }
      this.automaticModeState.alreadySawThatLinkInNonDefault[request.url] = true;
      return;
    }

    debug('[handleNotClickedLink] onBeforeRequest reload in temp tab', tab, request);
    await this.reloadTabInTempContainer(tab, request.url);

    return { cancel: true };
  }


  async webRequestOnBeforeRequest(request) {
    debug('[browser.webRequest.onBeforeRequest] incoming request', request);
    if (!this.storage.preferences.automaticMode) {
      debug('[browser.webRequest.onBeforeRequest] got request but automatic mode is off, ignoring', request);
      return;
    }

    if (request.tabId === -1) {
      debug('[browser.webRequest.onBeforeRequest] onBeforeRequest request doesnt belong to a tab, why are you main_frame?', request);
      return;
    }

    let tab;
    try {
      tab = await browser.tabs.get(request.tabId);
      debug('[browser.webRequest.onBeforeRequest] onbeforeRequest requested tab information', tab);
    } catch (error) {
      debug('[browser.webRequest.onBeforeRequest] onbeforeRequest retrieving tab information failed', error);
      // this should only happen if multi-account-containers was fast and removed the tab already
      tab = {
        id: request.tabId,
        openerTabId: 1,
        cookieStoreId: 'firefox-default'
      };
    }

    if (tab.incognito) {
      debug('[browser.webRequest.onBeforeRequest] tab is incognito, ignore it', tab);
      return;
    }

    if (tab.cookieStoreId !== 'firefox-default' && this.automaticModeState.alreadySawThatLink[request.url]) {
      debug('[browser.webRequest.onBeforeRequest] tab is loading an url that we saw before in non-default container',
        tab, JSON.stringify(this.automaticModeState));
      if (!this.storage.tempContainers[tab.cookieStoreId] &&
          (!this.automaticModeState.linkClicked[request.url] ||
          !this.automaticModeState.linkClicked[request.url].containers[tab.cookieStoreId]) &&
          !this.automaticModeState.alreadySawThatLinkInNonDefault[request.url]) {
        debug('[browser.webRequest.onBeforeRequest] tab is loading the before clicked url in unknown container, just close it?', tab);
        try {
          await browser.tabs.remove(tab.id);
          debug('[browser.webRequest.onBeforeRequest] removed tab (probably multi-account-containers huh)', tab.id);
        } catch (error) {
          debug('[browser.webRequest.onBeforeRequest] couldnt remove tab', tab.id, error);
        }
      }
      delete this.automaticModeState.alreadySawThatLink[request.url];
      return;
    }
    this.automaticModeState.alreadySawThatLink[request.url] = true;

    setTimeout(() => {
      // we need to cleanup in case multi-account is not intervening
      debug('[webRequestOnBeforeRequest] cleaning up', request.url);
      delete this.automaticModeState.alreadySawThatLink[request.url];
      delete this.automaticModeState.alreadySawThatLinkInNonDefault[request.url];
    }, 3000);

    if (this.automaticModeState.linkClicked[request.url]) {
      return await this.handleClickedLink(request, tab);
    } else {
      return await this.handleNotClickedLink(request, tab);
    }
  }


  async contextMenusOnClicked(info, tab) {
    switch (info.menuItemId)  {
    case 'open-link-in-new-temporary-container-tab':
      this.createTabInTempContainer(tab, info.linkUrl);
      break;
    }
  }
}

browser.contextMenus.create({
  id: 'open-link-in-new-temporary-container-tab',
  title: 'Open Link in New Temporary Container Tab',
  contexts: ['link'],
  icons: {
    '16': 'icons/page-w-16.svg',
    '32': 'icons/page-w-32.svg'
  }
});
const tmp = new TemporaryContainers();
browser.browserAction.onClicked.addListener(tmp.createTabInTempContainer);
browser.contextMenus.onClicked.addListener(tmp.contextMenusOnClicked);
browser.runtime.onInstalled.addListener(tmp.runtimeOnInstalled);
browser.runtime.onStartup.addListener(tmp.runtimeOnStartup);
browser.runtime.onMessage.addListener(tmp.runtimeOnMessage);
browser.tabs.onCreated.addListener(tmp.tabsOnCreated);
browser.tabs.onUpdated.addListener(tmp.tabsOnUpdated);
browser.tabs.onRemoved.addListener(tmp.tabsOnRemoved);
browser.webRequest.onBeforeRequest.addListener(tmp.webRequestOnBeforeRequest,  {
  urls: ['<all_urls>'],
  types: ['main_frame']
}, [
  'blocking'
]);

if (!browser.mochaTest) {
  tmp.initialize();

  setInterval(() => {
    debug('[interval] contstartsWithainer removal interval', tmp.storage.tempContainers);
    tmp.tryToRemoveContainers();
  }, 60000);
}

if (browser.mochaTest) {
  DEBUG = false;
  // eslint-disable-next-line no-undef
  module.exports = tmp;
}
