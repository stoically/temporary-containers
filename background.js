let DEBUG = false;
const debug = function() {
  if (!DEBUG) {
    return;
  }
  // eslint-disable-next-line no-console
  console.log(...arguments);
};


let storage;
const loadStorage = async () => {
  try {
    storage = await browser.storage.local.get();
    if (!Object.keys(storage).length) {
      storage = {
        tempContainerCounter: 0,
        tempContainers: {},
        tabContainerMap: {}
      };
      debug('storage empty, setting defaults', storage);
    } else {
      debug('storage loaded', storage);
    }
  } catch (error) {
    debug('error while loading local storage', error);
    // TODO: stop execution, inform user and/or retry?
  }
};


const persistStorage = async () => {
  try {
    await browser.storage.local.set(storage);
    debug('storage persisted');
  } catch (error) {
    debug('something went wrong while trying to persist the storage', error);
  }
};


const tryToRemoveContainer = async (cookieStoreId) => {
  const tempTabs = await browser.tabs.query({
    cookieStoreId
  });
  if (tempTabs.length > 0) {
    debug('not removing container because it still has tabs', cookieStoreId, tempTabs.length);
    return;
  }
  debug('no tabs in temp container anymore, deleting container', cookieStoreId);
  try {
    const contextualIdentity = await browser.contextualIdentities.remove(cookieStoreId);
    if (!contextualIdentity) {
      debug('couldnt find container to remove', cookieStoreId);
    } else {
      debug('container removed', cookieStoreId);
    }
    delete storage.tempContainers[cookieStoreId];
    Object.keys(storage.tabContainerMap).map((tabId) => {
      if (storage.tabContainerMap[tabId] === cookieStoreId) {
        delete storage.tabContainerMap[tabId];
      }
    });
    await persistStorage();
  } catch (error) {
    debug('error while removing container', cookieStoreId, error);
  }
};


const tryToRemoveContainers = () => {
  Object.keys(storage.tempContainers).map((cookieStoreId) => {
    tryToRemoveContainer(cookieStoreId);
  });
};


const initialize = async () => {
  await loadStorage();
  tryToRemoveContainers();
};


browser.runtime.onInstalled.addListener(async (details) => {
  if (details.temporary) {
    DEBUG = true;
  }
  await initialize();
});


const createTabInTempContainer = async (tab, url) => {
  storage.tempContainerCounter++;
  const containerName = `TempContainer${storage.tempContainerCounter}`;
  try {
    const contextualIdentity = await browser.contextualIdentities.create({
      name: containerName,
      color: 'red',
      icon: 'circle'
    });
    debug('contextualIdentity created', contextualIdentity);
    storage.tempContainers[contextualIdentity.cookieStoreId] = true;
    await persistStorage();

    try {
      const active = url ? false : true;
      const newTab = await browser.tabs.create({
        url,
        active,
        cookieStoreId: contextualIdentity.cookieStoreId,
        index: tab.index + 1
      });
      debug('new tab in temp container created', newTab);
      storage.tabContainerMap[newTab.id] = contextualIdentity.cookieStoreId;
      await persistStorage();
    } catch (error) {
      debug('error while creating new tab', error);
    }
  } catch (error) {
    debug('error while creating container', containerName, error);
  }
};


const reloadTabInTempContainer = async (tab, url) => {
  await createTabInTempContainer(tab, url);
  try {
    browser.tabs.remove(tab.id);
    debug('removed old tab', tab.id);
  } catch (error) {
    debug('error while removing old tab', tab, error);
  }
};


const maybeReloadTabInTempContainer = async (tab) => {
  if (tab.incognito) {
    debug('tab is incognito, ignore it', tab);
    return;
  }

  if (tab.cookieStoreId !== 'firefox-default') {
    debug('tab already belongs to a container, we dont handle that', tab);
    return;
  }

  if (tab.url === 'about:home' ||
      tab.url === 'about:newtab') {
    debug('about:home/new tab in firefox-default container, reload in temp container', tab);
    await reloadTabInTempContainer(tab);
    return;
  }

  if (tab.url.startsWith('https://') ||
      tab.url.startsWith('http://')) {
    debug('https(s) tab in firefox-default container, reload in temp container', tab);
    await reloadTabInTempContainer(tab, tab.url);
    return;
  }

  debug('not a home/new/https(s) tab, we dont handle that', tab);
};


browser.runtime.onStartup.addListener(async () => {
  await initialize();
  // extension loads after the first tab opens most of the time
  // lets see if we can reopen the first tab
  const tempTabs = await browser.tabs.query({});
  if (tempTabs.length !== 1) {
    return;
  }
  await maybeReloadTabInTempContainer(tempTabs[0]);
});


browser.tabs.onCreated.addListener(async function(tab) {
  await maybeReloadTabInTempContainer(tab);
});


browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url) {
    debug('url didnt change, not relevant', tabId, changeInfo, tab);
    return;
  }
  await maybeReloadTabInTempContainer(tab);
});


browser.tabs.onRemoved.addListener(async (tabId) => {
  if (!storage.tabContainerMap[tabId]) {
    debug('removed tab that isnt in the tabContainerMap', tabId, storage.tabContainerMap);
    return;
  }
  const cookieStoreId = storage.tabContainerMap[tabId];
  setTimeout(() => {
    tryToRemoveContainer(cookieStoreId);
  }, 5000);
});


const linkClickedState = {};
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (typeof message !== 'object' || !message.linkClicked) {
    return;
  }
  debug('message from userscript received', message, sender);

  if (sender.tab.incognito) {
    debug('message came from an incognito tab, we dont handle that', message, sender);
    return;
  }

  if (!linkClickedState[message.linkClicked.href]) {
    linkClickedState[message.linkClicked.href] = {
      count: 0
    };
  }
  linkClickedState[message.linkClicked.href][sender.tab.id] = true;
  linkClickedState[message.linkClicked.href].count++;
  if (linkClickedState[message.linkClicked.href].count > 1) {
    debug('we already have a listener for that, just let em handle it',
      sender.tab.id, message.linkClicked.href, linkClickedState);
    return;
  }

  const onBeforeRequest = async (request) => {
    debug('onBeforeRequest', request);
    const tab = await browser.tabs.get(request.tabId);
    debug('requested tab information', tab);
    if (!tab) {
      debug('we have no information for that tab. ff broken?!', request.tabId);
      return { cancel: true };
    }
    if (!linkClickedState[request.url] ||
        !linkClickedState[request.url][tab.openerTabId]) {
      debug('the tab loading the url didnt get opened from any of the message sender tabs ' +
        'we can ignore this silently because it probably just means that someone opened ' +
        'the same link quick in succession', request, tab, linkClickedState);
      return;
    }

    linkClickedState[request.url].count--;
    if (!linkClickedState[request.url].count) {
      browser.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
      delete linkClickedState[request.url];
    }

    await reloadTabInTempContainer(tab, request.url);

    return { cancel: true };
  };

  browser.webRequest.onBeforeRequest.addListener(onBeforeRequest, {
    urls: [message.linkClicked.href],
    types: ['main_frame']
  }, [
    'blocking'
  ]);
});


setInterval(() => {
  debug('container removal interval', storage.tempContainers);
  tryToRemoveContainers();
}, 60000);
