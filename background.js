let DEBUG = false;
const debug = function() {
  if (!DEBUG) {
    return;
  }
  // eslint-disable-next-line no-console
  console.log(...arguments);
};
debug.info = function() {
  // eslint-disable-next-line no-console
  console.info(...arguments);
};

const containerColors = [
  'blue',
  'turquoise',
  'green',
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
];
const containerIcons = [
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

const preferencesDefault = {
  automaticMode: true,
  containerNamePrefix: 'tmp',
  containerColor: 'red',
  containerColorRandom: false,
  containerIcon: 'circle',
  containerIconRandom: false,
  containerNumberMode: 'keep'
};

const linkClickedState = {};
let storage;
const loadStorage = async () => {
  try {
    let storagePersistNeeded = false;
    storage = await browser.storage.local.get();
    if (!Object.keys(storage).length) {
      storage = {
        tempContainerCounter: 0,
        tempContainers: {},
        tabContainerMap: {},
        preferences: preferencesDefault
      };
      debug.info('storage empty, setting defaults', storage);
      storagePersistNeeded = true;
    } else {
      debug.info('storage loaded', storage);
    }
    // set preferences defaults if not present
    if (!storage.preferences) {
      debug.info('no preferences found, setting defaults', preferencesDefault);
      storage.preferences = preferencesDefault;
      storagePersistNeeded = true;
    } else {
      Object.keys(preferencesDefault).map(key => {
        if (storage.preferences[key] === undefined) {
          debug.info('preference not found, setting default', key, preferencesDefault[key]);
          storage.preferences[key] = preferencesDefault[key];
          storagePersistNeeded = true;
        }
      });
    }

    if (storagePersistNeeded) {
      await persistStorage();
    }
  } catch (error) {
    debug.info('error while loading local storage', error);
    // TODO: stop execution, inform user and/or retry?
  }
};


const persistStorage = async () => {
  try {
    await browser.storage.local.set(storage);
    debug.info('storage persisted');
  } catch (error) {
    debug.info('something went wrong while trying to persist the storage', error);
  }
};


const tryToRemoveContainer = async (cookieStoreId) => {
  try {
    const tempTabs = await browser.tabs.query({
      cookieStoreId
    });
    if (tempTabs.length > 0) {
      debug('not removing container because it still has tabs', cookieStoreId, tempTabs.length);
      return;
    }
    debug('no tabs in temp container anymore, deleting container', cookieStoreId);
  } catch (error) {
    debug('failed to query tabs', cookieStoreId, error);
    return;
  }
  try {
    const contextualIdentity = await browser.contextualIdentities.remove(cookieStoreId);
    if (!contextualIdentity) {
      debug('couldnt find container to remove', cookieStoreId);
    } else {
      debug('container removed', cookieStoreId);
    }
    Object.keys(storage.tabContainerMap).map((tabId) => {
      if (storage.tabContainerMap[tabId] === cookieStoreId) {
        delete storage.tabContainerMap[tabId];
      }
    });
    await persistStorage();
  } catch (error) {
    debug('error while removing container', cookieStoreId, error);
  }
  delete storage.tempContainers[cookieStoreId];
};


const tryToRemoveContainers = () => {
  Object.keys(storage.tempContainers).map((cookieStoreId) => {
    tryToRemoveContainer(cookieStoreId);
  });
};


const initialize = async () => {
  if (!storage) {
    await loadStorage();
  }
  tryToRemoveContainers();
};


browser.runtime.onInstalled.addListener(async (details) => {
  if (details.temporary) {
    DEBUG = true;
  }
});


const createTabInTempContainer = async (tab, url) => {
  let tempContainerNumber;
  if (storage.preferences.containerNumberMode === 'keep') {
    storage.tempContainerCounter++;
    tempContainerNumber = storage.tempContainerCounter;
  }
  if (storage.preferences.containerNumberMode === 'reuse') {
    const tempContainersNumbers = Object.values(storage.tempContainers).sort();
    debug('tempContainersNumbers', tempContainersNumbers);
    if (!tempContainersNumbers.length) {
      tempContainerNumber = 1;
    } else {
      const maxContainerNumber = Math.max.apply(Math, tempContainersNumbers);
      debug('maxContainerNumber', maxContainerNumber, tempContainersNumbers);
      for (let i = 1; i < maxContainerNumber; i++) {
        debug('tempContainersNumbers[i]', i, tempContainersNumbers[i]);
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
  const containerName = `${storage.preferences.containerNamePrefix}${tempContainerNumber}`;
  try {
    let containerColor = storage.preferences.containerColor;
    if (storage.preferences.containerColorRandom) {
      containerColor = containerColors[Math.floor(Math.random() * containerColors.length)];
    }
    let containerIcon = storage.preferences.containerIcon;
    if (storage.preferences.containerIconRandom) {
      containerIcon = containerIcons[Math.floor(Math.random() * containerIcons.length)];
    }
    const contextualIdentity = await browser.contextualIdentities.create({
      name: containerName,
      color: containerColor,
      icon: containerIcon
    });
    debug('contextualIdentity created', contextualIdentity);
    storage.tempContainers[contextualIdentity.cookieStoreId] = tempContainerNumber;
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
  debug('automaticMode', storage.preferences.automaticMode);
  if (!storage.preferences.automaticMode) {
    return;
  }

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
  }, 500);
});

browser.runtime.onMessage.addListener(async (message, sender) => {
  if (typeof message !== 'object') {
    return;
  }

  if (message.savePreferences) {
    debug('saving preferences', message, sender);
    storage.preferences = message.savePreferences.preferences;
    await persistStorage();
    return;
  }

  if (!message.linkClicked) {
    return;
  }
  debug('message from userscript received', message, sender);

  if (sender.tab.incognito) {
    debug('message came from an incognito tab, we dont handle that', message, sender);
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
        parsedSenderTabURL.hostname.endsWith(splittedClickedHostname.splice(-2).join('.'))) {
      sameTLD = true;
    }
  }
  if (sameTLD) {
    debug('clicked link goes to the same tld, ignore that', message, sender);
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


browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId)  {
  case 'open-link-in-new-temporary-container-tab':
    createTabInTempContainer(tab, info.linkUrl);
    break;
  }
});


browser.contextMenus.create({
  id: 'open-link-in-new-temporary-container-tab',
  title: 'Open Link in New Temporary Container Tab',
  contexts: ['link'],
  icons: {
    '16': 'icons/page-w-16.svg',
    '32': 'icons/page-w-32.svg'
  }
});


browser.browserAction.onClicked.addListener(createTabInTempContainer);

initialize();

setInterval(() => {
  debug('container removal interval', storage.tempContainers);
  tryToRemoveContainers();
}, 60000);
