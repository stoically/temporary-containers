const tabContainerMap = {};
let tempContainerCounter = 0;

let DEBUG = false;
const debug = function() {
  if (!DEBUG) {
    return;
  }
  console.log(...arguments);
}

browser.runtime.onInstalled.addListener((details) => {
  if (details.temporary) {
    DEBUG = true;
  }
});


const createTabInTempContainer = async (tab, url) => {
  tempContainerCounter++;
  const containerName = `TempContainer${tempContainerCounter}`;
  try {
    const contextualIdentity = await browser.contextualIdentities.create({
      name: containerName,
      color: 'red',
      icon: 'circle'
    })
    debug('contextualIdentity created', contextualIdentity);

    try {
      const active = url ? false : true;
      const newTab = await browser.tabs.create({
        url,
        active,
        cookieStoreId: contextualIdentity.cookieStoreId,
        index: tab.index + 1
      });
      debug('new tab in temp container created', newTab);
      tabContainerMap[newTab.id] = contextualIdentity.cookieStoreId;
    } catch (error) {
      debug('error while creating new tab', error);
    }
  } catch (error) {
    debug('error while creating container', containerName, error);
  }
}


const reloadTabInTempContainer = async (tab, url) => {
  await createTabInTempContainer(tab, url);
  try {
    browser.tabs.remove(tab.id);
    debug('removed old tab', tab.id);
  } catch (error) {
    debug('error while removing old tab', tab, error);
  }
}

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
}


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


browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (!tabContainerMap[tabId]) {
    debug('tabid is not in the tabContainerMap, not relevant', tabId);
    return;
  }
  const cookieStoreId = tabContainerMap[tabId];
  delete tabContainerMap[tabId];

  const tempTabs = await browser.tabs.query({
    cookieStoreId
  });
  if (tempTabs.length > 1) {
    debug('there are still more than one tab in that temp container open', tempTabs, cookieStoreId);
    return;
  }

  setTimeout(async () => {
    debug('no tabs in temp container anymore, deleting container', cookieStoreId);
    try {
      const contextualIdentity = await browser.contextualIdentities.remove(cookieStoreId)
      if (!contextualIdentity) {
        debug('couldnt find container to remove', cookieStoreId)
      } else {
        debug('removed container', contextualIdentity);
      }
    } catch (error) {
      debug('error while removing container', cookieStoreId, error);
    }
  }, 100);
});

const linkClickedState = {};
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
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
            'the same link quick in succession',
            request, tab, linkClickedState);
      return;
    }

    linkClickedState[request.url].count--;
    if (!linkClickedState[request.url].count) {
      browser.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
      delete linkClickedState[request.url];
    }

    await reloadTabInTempContainer(tab, request.url);

    return { cancel: true };
  }

  browser.webRequest.onBeforeRequest.addListener(onBeforeRequest, {
      urls: [message.linkClicked.href],
      types: ['main_frame']
    },
    ['blocking']
  );
});
