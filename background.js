let DEBUG = false;
const debug = function() {
  if (!DEBUG) {
    return;
  }
  // eslint-disable-next-line no-console
  console.log(...arguments);
};

const linkClickedState = {};
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
      const newTabOptions = {
        url,
        active,
        cookieStoreId: contextualIdentity.cookieStoreId,
      };
      if (tab) {
        newTabOptions.index = tab.index + 1;
      }
      debug('creating tab in temporary container', newTabOptions);
      const newTab = await browser.tabs.create(newTabOptions);
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
  if (!tab) {
    return;
  }
  try {
    await browser.tabs.remove(tab.id);
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

  // so this is *probably* the confirm page from multi-account-containers
  // i need to reach out to the multi-account-containers devs, maybe its possible
  // to handle this in a cleaner fashion
  const multiAccountMatch = tab.url.match(/moz-extension:\/\/[^/]*\/confirm-page.html\?url=/);
  if (multiAccountMatch) {
    const parsedURL = new URL(tab.url);
    debug('multi-account-containers is intervening', tab, parsedURL);
    const queryParams = parsedURL.search.split('&').map(param => param.split('='));
    const multiAccountTargetURL = decodeURIComponent(queryParams[0][1]);
    const multiAccountOriginContainer = queryParams[2][1];

    debug('multi-account-containers debug',
      multiAccountTargetURL, multiAccountOriginContainer, JSON.stringify(linkClickedState), tab);
    if (linkClickedState[multiAccountTargetURL].containers[multiAccountOriginContainer]) {
      debug('we can remove this tab, i guess - and yes this is a bit hacky', tab);
      await browser.tabs.remove(tab.id);
      debug('removed multi-account-containers tab', tab.id);
      return;
    }
  }

  if (tab.cookieStoreId !== 'firefox-default') {
    // we have to rely on the tab title here.. granted its a bit messy
    // and there could be a racecondition because of missing protocol, meh.
    // this is also only necessary when multi-account-containers is intervening
    Object.keys(linkClickedState).forEach(async linkClicked => {
      if (!linkClicked.endsWith(tab.title)) {
        return;
      }
      debug('tab is loading an url that was clicked before', tab);
      if (!storage.tempContainers[tab.cookieStoreId] &&
          !linkClickedState[linkClicked].containers[tab.cookieStoreId]) {
        debug('tab is loading the before clicked url in unkown container, just close it?', tab);
        try {
          await browser.tabs.remove(tab.id);
          debug('removed tab (probably multi-account-containers huh)', tab.id);
        } catch (error) {
          debug('couldnt remove tab', tab.id, error);
        }
      }
    });

    debug('tab already belongs to a container', tab, JSON.stringify(linkClickedState));
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
  debug('tab created', tab);
  await maybeReloadTabInTempContainer(tab);
});


browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  debug('tab updated', tab);
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
  debug('queuing container removal because of tab removal', cookieStoreId, tabId);
  setTimeout(() => {
    tryToRemoveContainer(cookieStoreId);
  }, 5000);
});

browser.runtime.onMessage.addListener(async (message, sender) => {
  if (typeof message !== 'object' || !message.linkClicked) {
    return;
  }
  debug('message from userscript received', message, sender);

  if (sender.tab.incognito) {
    debug('message came from an incognito tab, we dont handle that', message, sender);
    return;
  }

  if (!storage.tempContainers[sender.tab.cookieStoreId]) {
    debug('click came from a non-temporary container, ignore that', message, sender);
    return;
  }

  if (!linkClickedState[message.linkClicked.href]) {
    linkClickedState[message.linkClicked.href] = {
      tabs: {},
      containers: {},
      count: 0
    };
  }
  linkClickedState[message.linkClicked.href].tabs[sender.tab.id] = true;
  linkClickedState[message.linkClicked.href].containers[sender.tab.cookieStoreId] = true;
  linkClickedState[message.linkClicked.href].count++;
  if (linkClickedState[message.linkClicked.href].count > 1) {
    debug('we already have a listener for that, just let em handle it',
      sender.tab.id, message.linkClicked.href, linkClickedState);
    return;
  }

  const onBeforeRequest = async (request) => {
    debug('onBeforeRequest', request);
    let tab;
    try {
      tab = await browser.tabs.get(request.tabId);
      debug('requested tab information', tab);
    } catch (error) {
      debug('retrieving tab information failed', error);
    }

    if (!tab) {
      debug('multi-account-containers mightve removed the tab, continue anyway', request.tabId);
    }

    if (tab && (!linkClickedState[request.url] ||
       !linkClickedState[request.url].tabs[tab.openerTabId])) {
      debug('the tab loading the url didnt get opened from any of the message sender tabs ' +
        'we can ignore this silently because it probably just means that someone opened ' +
        'the same link quick in succession', request, tab, linkClickedState);
      return;
    }

    await reloadTabInTempContainer(tab, request.url);

    linkClickedState[request.url].count--;
    if (!linkClickedState[request.url].count) {
      browser.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
      delete linkClickedState[request.url];
    }

    return { cancel: true };
  };

  let urls = [message.linkClicked.href];
  if (message.linkClicked.href.includes('#')) {
    // seems like ff57 doesnt match hashtags in urls
    urls.push(message.linkClicked.href.split('#')[0]);
  }
  browser.webRequest.onBeforeRequest.addListener(onBeforeRequest, {
    urls,
    types: ['main_frame']
  }, [
    'blocking'
  ]);
});


browser.browserAction.onClicked.addListener(createTabInTempContainer);


setInterval(() => {
  debug('container removal interval', storage.tempContainers);
  tryToRemoveContainers();
}, 60000);
